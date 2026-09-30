from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.domain import (
    Goal, ProgressEntry, Barrier, Adjustment, Evidence, FollowUpAction, Client, User, AuditEvent
)
from app.schemas.dto import (
    GoalCreate, GoalUpdate, GoalOut,
    ProgressCreate, ProgressOut,
    BarrierCreate, BarrierUpdate, BarrierOut,
    AdjustmentCreate, AdjustmentAgreeRequest, AdjustmentOut,
    EvidenceCreate, EvidenceOut,
    ProgressDiscussionRequest, ProgressDiscussionSummaryOut
)
from app.security.auth import get_current_user, require_role
from app.services.outcome_engine import calculate_goal_progress, evaluate_goal_trend_and_review

router = APIRouter(prefix="/api/goals", tags=["goals"])

def enrich_goal_out(goal: Goal) -> GoalOut:
    latest_val = None
    latest_pct = None
    if goal.progress_entries:
        sorted_entries = sorted(goal.progress_entries, key=lambda x: x.reported_at, reverse=True)
        latest_val = sorted_entries[0].progress_value
        latest_pct = sorted_entries[0].progress_percentage

    trend, needs_review = evaluate_goal_trend_and_review(goal)
    status_str = goal.status
    if needs_review and status_str != "Completed":
        status_str = "Needs Review"
        trend = "Needs Review"

    has_active_barrier = any(b.status == "Active" for b in goal.barriers)
    unresolved_actions = sum(1 for a in goal.follow_up_actions if a.status != "Completed")

    return GoalOut(
        id=goal.id,
        client_id=goal.client_id,
        goal_text=goal.goal_text,
        goal_category=goal.goal_category,
        baseline_value=goal.baseline_value,
        target_value=goal.target_value,
        unit=goal.unit,
        measurement_method=goal.measurement_method,
        importance_rating=goal.importance_rating,
        created_at=goal.created_at,
        status=status_str,
        target_date=goal.target_date,
        is_increasing=goal.is_increasing,
        latest_progress_value=latest_val,
        latest_progress_percentage=latest_pct,
        latest_trend=trend,
        has_active_barrier=has_active_barrier,
        unresolved_actions_count=unresolved_actions
    )

@router.get("", response_model=List[GoalOut])
def list_goals(
    client_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Goal)
    if client_id:
        query = query.filter(Goal.client_id == client_id)
    goals = query.all()
    return [enrich_goal_out(g) for g in goals]

@router.post("", response_model=GoalOut, status_code=status.HTTP_201_CREATED)
def create_goal(
    payload: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["CLINICIAN", "SUPERVISOR", "CLIENT"]))
):
    client_obj = db.query(Client).filter(Client.id == payload.client_id).first()
    if not client_obj:
        raise HTTPException(status_code=404, detail="Client not found")

    initial_status = "Active"
    if payload.baseline_value is None or payload.target_value is None:
        initial_status = "Needs measurement definition"

    goal = Goal(
        client_id=payload.client_id,
        goal_text=payload.goal_text,
        goal_category=payload.goal_category,
        baseline_value=payload.baseline_value,
        target_value=payload.target_value,
        unit=payload.unit,
        measurement_method=payload.measurement_method,
        importance_rating=payload.importance_rating,
        target_date=payload.target_date,
        is_increasing=payload.is_increasing,
        status=initial_status
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return enrich_goal_out(goal)

@router.get("/{goal_id}", response_model=GoalOut)
def get_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return enrich_goal_out(goal)

@router.patch("/{goal_id}", response_model=GoalOut)
def update_goal(
    goal_id: int,
    payload: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["CLINICIAN", "SUPERVISOR", "CLIENT"]))
):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    if payload.goal_text is not None:
        goal.goal_text = payload.goal_text
    if payload.baseline_value is not None:
        goal.baseline_value = payload.baseline_value
    if payload.target_value is not None:
        goal.target_value = payload.target_value
    if payload.unit is not None:
        goal.unit = payload.unit
    if payload.status is not None:
        goal.status = payload.status
    if payload.target_date is not None:
        goal.target_date = payload.target_date

    if goal.baseline_value is not None and goal.target_value is not None and goal.status == "Needs measurement definition":
        goal.status = "Active"

    db.commit()
    db.refresh(goal)
    return enrich_goal_out(goal)

@router.post("/{goal_id}/progress", response_model=ProgressOut, status_code=status.HTTP_201_CREATED)
def record_progress(
    goal_id: int,
    payload: ProgressCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    if goal.baseline_value is None or goal.target_value is None:
        raise HTTPException(
            status_code=400,
            detail="Cannot record progress: Goal has no measurable baseline or target."
        )

    pct, new_status = calculate_goal_progress(
        baseline=goal.baseline_value,
        target=goal.target_value,
        current=payload.progress_value,
        is_increasing=goal.is_increasing
    )

    entry = ProgressEntry(
        goal_id=goal_id,
        reported_by=payload.reported_by,
        progress_value=payload.progress_value,
        progress_percentage=pct,
        evidence_note=payload.evidence_note,
        confidence=payload.confidence,
        barrier_present=payload.barrier_present
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    # Check for evidence note and auto-create Evidence record if provided
    if payload.evidence_note:
        ev = Evidence(
            goal_id=goal_id,
            progress_entry_id=entry.id,
            evidence_type="Self-report",
            description=payload.evidence_note
        )
        db.add(ev)

    # Re-evaluate goal status and trends
    db.refresh(goal)
    trend, needs_review = evaluate_goal_trend_and_review(goal)
    if new_status == "Completed":
        goal.status = "Completed"
    elif needs_review:
        goal.status = "Needs Review"

    db.commit()
    return entry

@router.get("/{goal_id}/progress", response_model=List[ProgressOut])
def get_progress_history(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    entries = db.query(ProgressEntry).filter(ProgressEntry.goal_id == goal_id).order_by(ProgressEntry.reported_at.desc()).all()
    return entries

@router.post("/{goal_id}/barriers", response_model=BarrierOut, status_code=status.HTTP_201_CREATED)
def add_barrier(
    goal_id: int,
    payload: BarrierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    barrier = Barrier(
        goal_id=goal_id,
        description=payload.description,
        severity=payload.severity,
        status="Active"
    )
    db.add(barrier)
    db.commit()
    db.refresh(barrier)
    return barrier

@router.patch("/barriers/{barrier_id}", response_model=BarrierOut)
def update_barrier(
    barrier_id: int,
    payload: BarrierUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    b = db.query(Barrier).filter(Barrier.id == barrier_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Barrier not found")
    if payload.status:
        b.status = payload.status
    if payload.resolution:
        b.resolution = payload.resolution
    db.commit()
    db.refresh(b)
    return b

@router.post("/{goal_id}/adjustments", response_model=AdjustmentOut, status_code=status.HTTP_201_CREATED)
def create_adjustment(
    goal_id: int,
    payload: AdjustmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    adj = Adjustment(
        goal_id=goal_id,
        description=payload.description,
        agreed_by_clinician=payload.agreed_by_clinician,
        agreed_by_client=payload.agreed_by_client,
        review_date=payload.review_date,
        status="Agreed" if (payload.agreed_by_clinician and payload.agreed_by_client) else "Pending agreement"
    )
    db.add(adj)
    db.commit()
    db.refresh(adj)
    return adj

@router.post("/adjustments/{adjustment_id}/agree", response_model=AdjustmentOut)
def agree_adjustment(
    adjustment_id: int,
    payload: AdjustmentAgreeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    adj = db.query(Adjustment).filter(Adjustment.id == adjustment_id).first()
    if not adj:
        raise HTTPException(status_code=404, detail="Adjustment not found")

    if current_user.role == "CLIENT":
        adj.agreed_by_client = payload.agreed_by_client
    else:
        if payload.agreed_by_clinician is not None:
            adj.agreed_by_clinician = payload.agreed_by_clinician
        adj.agreed_by_client = payload.agreed_by_client

    if adj.agreed_by_client is False:
        adj.status = "Disagreed"
    elif adj.agreed_by_client and adj.agreed_by_clinician:
        adj.status = "Agreed"
    else:
        adj.status = "Pending agreement"

    db.commit()
    db.refresh(adj)
    return adj

@router.post("/{goal_id}/evidence", response_model=EvidenceOut, status_code=status.HTTP_201_CREATED)
def add_evidence(
    goal_id: int,
    payload: EvidenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ev = Evidence(
        goal_id=goal_id,
        progress_entry_id=payload.progress_entry_id,
        evidence_type=payload.evidence_type,
        description=payload.description
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev

@router.post("/progress-discussion", response_model=ProgressDiscussionSummaryOut)
def record_progress_discussion(
    payload: ProgressDiscussionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.query(Goal).filter(Goal.id == payload.goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    if goal.baseline_value is None or goal.target_value is None:
        raise HTTPException(status_code=400, detail="Cannot record discussion: Goal has no baseline or target.")

    # 1. Record Progress
    pct, _ = calculate_goal_progress(goal.baseline_value, goal.target_value, payload.measured_result, goal.is_increasing)
    entry = ProgressEntry(
        goal_id=goal.id,
        reported_by=current_user.role,
        progress_value=payload.measured_result,
        progress_percentage=pct,
        evidence_note=payload.evidence_note,
        confidence=payload.client_confidence,
        barrier_present=bool(payload.barrier_description)
    )
    db.add(entry)
    db.commit()

    # 2. Record Evidence
    if payload.evidence_note:
        ev = Evidence(goal_id=goal.id, progress_entry_id=entry.id, description=payload.evidence_note)
        db.add(ev)

    # 3. Record Barrier if present
    if payload.barrier_description:
        barr = Barrier(goal_id=goal.id, description=payload.barrier_description, severity="Medium", status="Active")
        db.add(barr)

    # 4. Record Proposed Adjustment if present
    if payload.proposed_adjustment:
        adj = Adjustment(
            goal_id=goal.id,
            description=payload.proposed_adjustment,
            agreed_by_clinician=True,
            agreed_by_client=False,
            status="Pending agreement"
        )
        db.add(adj)

    # 5. Record Follow-Up Action
    act = FollowUpAction(
        goal_id=goal.id,
        description=payload.action_description,
        owner_role=payload.action_owner_role,
        owner_id=payload.action_owner_id,
        priority=payload.action_priority,
        due_date=payload.action_due_date,
        status="Open"
    )
    db.add(act)
    db.commit()

    escalation_msg = None
    if payload.action_priority == "High" and payload.action_due_date < datetime.now(timezone.utc):
        escalation_msg = "Action created with past due date. Triggering escalation engine."

    summary = (
        f"Recorded progress discussion for Goal '{goal.goal_text}'. Measured result: {payload.measured_result} {goal.unit or ''} "
        f"({pct}% achieved). Follow-up action assigned to {payload.action_owner_role} ({payload.action_owner_id}) due {payload.action_due_date.strftime('%Y-%m-%d')}."
    )

    return ProgressDiscussionSummaryOut(
        summary_text=summary,
        progress_percentage=pct,
        escalation_warning=escalation_msg
    )
