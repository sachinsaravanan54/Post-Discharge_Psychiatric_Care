from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.domain import FollowUpAction, Goal, User, AuditEvent
from app.schemas.dto import ActionCreate, ActionUpdate, ActionOut, ActionEscalateRequest
from app.security.auth import get_current_user, require_role

router = APIRouter(prefix="/api/actions", tags=["actions"])

@router.get("", response_model=List[ActionOut])
def list_actions(
    status_filter: Optional[str] = None,
    priority_filter: Optional[str] = None,
    escalated_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(FollowUpAction)
    if status_filter:
        query = query.filter(FollowUpAction.status == status_filter)
    if priority_filter:
        query = query.filter(FollowUpAction.priority == priority_filter)
    if escalated_only:
        query = query.filter(FollowUpAction.escalated == True)
    
    return query.order_by(FollowUpAction.due_date.asc()).all()

@router.post("", response_model=ActionOut, status_code=status.HTTP_201_CREATED)
def create_action(
    payload: ActionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.query(Goal).filter(Goal.id == payload.goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    if not payload.owner_id or not payload.owner_id.strip():
        raise HTTPException(status_code=400, detail="Follow-up action must have a valid non-empty owner_id (Failure Case 4).")

    action = FollowUpAction(
        goal_id=payload.goal_id,
        description=payload.description,
        owner_role=payload.owner_role,
        owner_id=payload.owner_id.strip(),
        priority=payload.priority,
        due_date=payload.due_date,
        status="Open"
    )
    db.add(action)
    db.commit()
    db.refresh(action)
    return action

@router.patch("/{action_id}", response_model=ActionOut)
def update_action(
    action_id: int,
    payload: ActionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    action = db.query(FollowUpAction).filter(FollowUpAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    if payload.description is not None:
        action.description = payload.description
    if payload.owner_role is not None:
        action.owner_role = payload.owner_role
    if payload.owner_id is not None:
        if not payload.owner_id.strip():
            raise HTTPException(status_code=400, detail="Owner ID cannot be empty.")
        action.owner_id = payload.owner_id.strip()
    if payload.priority is not None:
        action.priority = payload.priority
    if payload.due_date is not None:
        action.due_date = payload.due_date
    if payload.status is not None:
        action.status = payload.status
        if payload.status == "Completed":
            action.completed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(action)
    return action

@router.post("/{action_id}/escalate", response_model=ActionOut)
def escalate_action(
    action_id: int,
    payload: ActionEscalateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["CLINICIAN", "SUPERVISOR"]))
):
    action = db.query(FollowUpAction).filter(FollowUpAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    action.escalated = True
    action.escalation_level = max(1, action.escalation_level + 1)
    action.escalation_reason = payload.escalation_reason

    audit = AuditEvent(
        actor_role=current_user.role,
        actor_id=current_user.username,
        event_type="MANUAL_ESCALATION",
        entity_type="ACTION",
        entity_id=action.id,
        metadata_minimal=f"Manually escalated to level {action.escalation_level}: {payload.escalation_reason}"
    )
    db.add(audit)
    db.commit()
    db.refresh(action)
    return action
