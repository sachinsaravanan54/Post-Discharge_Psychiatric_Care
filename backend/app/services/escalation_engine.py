from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.domain import (
    FollowUpAction, AuditEvent, EscalationEvent, Session as SessionModel, Goal, Barrier, ProgressEntry
)
from app.config import (
    MISSED_CHECKIN_THRESHOLD,
    MISSED_CHECKIN_RESOLUTION_HOURS,
    OVERDUE_ACTION_RESOLUTION_HOURS,
    HIGH_PRIORITY_APPROACHING_HOURS,
    REPEATED_BARRIERS_THRESHOLD,
    BARRIER_RESOLUTION_HOURS,
    DETERIORATION_DROP_THRESHOLD,
    DETERIORATION_RESOLUTION_HOURS,
    RATING_DISCREPANCY_THRESHOLD,
    RATING_DISCREPANCY_RESOLUTION_HOURS,
)

def ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)

def run_escalation_engine(db: Session, config_overrides: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Automated Escalation Engine for post-discharge psychiatric care workflows.
    Evaluates 5 critical safety rules:
    1. Missed scheduled check-ins
    2. Overdue follow-up actions (preserving ownership and escalation history, skipping completed)
    3. High-priority actions approaching or exceeding deadlines
    4. Repeated unresolved barriers
    5. Significant deterioration in client-reported goal measurements (triggers human review, not automated diagnosis; never infers from missing data)
    Plus conflicting rating reconciliation.
    """
    now = datetime.now(timezone.utc)
    cfg = {
        "missed_checkin_threshold": MISSED_CHECKIN_THRESHOLD,
        "missed_checkin_resolution_hours": MISSED_CHECKIN_RESOLUTION_HOURS,
        "overdue_action_resolution_hours": OVERDUE_ACTION_RESOLUTION_HOURS,
        "high_priority_approaching_hours": HIGH_PRIORITY_APPROACHING_HOURS,
        "repeated_barriers_threshold": REPEATED_BARRIERS_THRESHOLD,
        "barrier_resolution_hours": BARRIER_RESOLUTION_HOURS,
        "deterioration_drop_threshold": DETERIORATION_DROP_THRESHOLD,
        "deterioration_resolution_hours": DETERIORATION_RESOLUTION_HOURS,
        "rating_discrepancy_threshold": RATING_DISCREPANCY_THRESHOLD,
        "rating_discrepancy_resolution_hours": RATING_DISCREPANCY_RESOLUTION_HOURS,
    }
    if config_overrides:
        cfg.update(config_overrides)

    stats = {
        "missed_checkins_escalated": 0,
        "overdue_actions_escalated": 0,
        "approaching_deadlines_escalated": 0,
        "repeated_barriers_escalated": 0,
        "deteriorations_escalated": 0,
        "rating_discrepancies_escalated": 0,
        "total_new_escalations": 0,
    }

    # Helper to check if an escalation event already exists by dedup_key
    def escalation_exists(dedup_key: str) -> bool:
        return db.query(EscalationEvent).filter(
            EscalationEvent.dedup_key == dedup_key,
            EscalationEvent.status != "Resolved"
        ).first() is not None

    # =========================================================================
    # Rule 1: Missed scheduled check-ins
    # =========================================================================
    sessions = db.query(SessionModel).all()
    for s in sessions:
        s_date = ensure_utc(s.session_date)
        is_missed = s.attendance_status in ["Missed", "No Show"] or (
            s_date and s_date < now and s.attendance_status == "Scheduled"
        )
        if is_missed:
            dedup = f"MISSED_CHECKIN_session_{s.id}"
            if not escalation_exists(dedup):
                deadline = now + timedelta(hours=cfg["missed_checkin_resolution_hours"])
                s_date_str = s_date.strftime('%Y-%m-%d') if s_date else "scheduled date"
                esc = EscalationEvent(
                    rule_type="MISSED_CHECKIN",
                    client_id=s.client_id,
                    trigger_reason=f"Client missed scheduled check-in on {s_date_str} (Session #{s.id}: '{s.purpose}'). Proactive engagement required.",
                    assigned_owner="Care Coordinator",
                    created_at=now,
                    target_resolution_deadline=deadline,
                    status="Open",
                    dedup_key=dedup,
                    audit_notes=f"Automated escalation created for missed session #{s.id}."
                )
                db.add(esc)
                db.add(AuditEvent(
                    actor_role="SYSTEM_ESCALATION_ENGINE",
                    actor_id="ESCALATION_WORKER",
                    event_type="ESCALATE_MISSED_CHECKIN",
                    entity_type="SESSION",
                    entity_id=s.id,
                    metadata_minimal=f"Escalated missed check-in for client {s.client_id}."
                ))
                stats["missed_checkins_escalated"] += 1
                stats["total_new_escalations"] += 1

    # =========================================================================
    # Rule 2 & 3: Overdue actions & High-priority approaching deadlines
    # =========================================================================
    actions = db.query(FollowUpAction).filter(
        FollowUpAction.status != "Completed"  # Do not escalate completed actions
    ).all()

    for action in actions:
        action_due = ensure_utc(action.due_date)
        if not action_due:
            continue

        # Overdue Action Rule
        if action_due < now:
            action.status = "Overdue"

            if action.priority == "High":
                if not action.escalated:
                    action.escalated = True
                    action.escalation_level = 1
                    action.escalation_reason = (
                        f"High-priority action overdue since {action.due_date.strftime('%Y-%m-%d')}. "
                        f"Assigned owner: {action.owner_role} ({action.owner_id})."
                    )
                    db.add(AuditEvent(
                        actor_role="SYSTEM_ESCALATION_ENGINE",
                        actor_id="ESCALATION_WORKER",
                        event_type="ESCALATE_ACTION",
                        entity_type="ACTION",
                        entity_id=action.id,
                        metadata_minimal=f"Escalated high-priority action ID {action.id} to level 1."
                    ))

                # Multi-level escalation progression preserving history
                days_overdue = (now - action_due).days
                if days_overdue >= 7 and action.escalation_level < 2:
                    action.escalation_level = 2
                    action.escalation_reason += f" Extended overdue ({days_overdue} days). Escalated to Supervisor."
                elif days_overdue >= 14 and action.escalation_level < 3:
                    action.escalation_level = 3
                    action.escalation_reason += f" Critical overdue ({days_overdue} days). Management Alert Triggered."

                # Create or update EscalationEvent with deduplication
                dedup = f"OVERDUE_ACTION_{action.id}"
                if not escalation_exists(dedup):
                    deadline = now + timedelta(hours=cfg["overdue_action_resolution_hours"])
                    esc = EscalationEvent(
                        rule_type="OVERDUE_ACTION",
                        action_id=action.id,
                        goal_id=action.goal_id,
                        trigger_reason=(
                            f"High-priority follow-up action #{action.id} ('{action.description}') "
                            f"overdue since {action.due_date.strftime('%Y-%m-%d')}. "
                            f"Assigned owner: {action.owner_role} ({action.owner_id})."
                        ),
                        assigned_owner=f"{action.owner_role} ({action.owner_id})",
                        created_at=now,
                        target_resolution_deadline=deadline,
                        status="Open",
                        dedup_key=dedup,
                        audit_notes=f"Overdue high-priority action #{action.id} escalated to Level {action.escalation_level}."
                    )
                    db.add(esc)
                    stats["overdue_actions_escalated"] += 1
                    stats["total_new_escalations"] += 1

        # High-priority action approaching deadline
        elif action.priority == "High" and action.status != "Completed":
            hours_until_due = (action_due - now).total_seconds() / 3600.0
            if 0 < hours_until_due <= cfg["high_priority_approaching_hours"]:
                dedup = f"APPROACHING_DEADLINE_{action.id}"
                if not escalation_exists(dedup):
                    esc = EscalationEvent(
                        rule_type="APPROACHING_DEADLINE",
                        action_id=action.id,
                        goal_id=action.goal_id,
                        trigger_reason=(
                            f"High-priority action #{action.id} ('{action.description}') "
                            f"approaching deadline with {int(hours_until_due)}h remaining "
                            f"(due {action.due_date.strftime('%Y-%m-%d %H:%M')})."
                        ),
                        assigned_owner=f"{action.owner_role} ({action.owner_id})",
                        created_at=now,
                        target_resolution_deadline=action_due,
                        status="Open",
                        dedup_key=dedup,
                        audit_notes=f"Approaching deadline alert generated for action #{action.id}."
                    )
                    db.add(esc)
                    db.add(AuditEvent(
                        actor_role="SYSTEM_ESCALATION_ENGINE",
                        actor_id="ESCALATION_WORKER",
                        event_type="APPROACHING_DEADLINE_ALERT",
                        entity_type="ACTION",
                        entity_id=action.id,
                        metadata_minimal=f"Action #{action.id} due within {int(hours_until_due)} hours."
                    ))
                    stats["approaching_deadlines_escalated"] += 1
                    stats["total_new_escalations"] += 1

    # =========================================================================
    # Rule 4: Repeated unresolved barriers
    # =========================================================================
    goals = db.query(Goal).all()
    for goal in goals:
        active_barriers = [b for b in goal.barriers if b.status == "Active"]
        if len(active_barriers) >= cfg["repeated_barriers_threshold"]:
            if goal.status != "Completed":
                goal.status = "Needs Review"
            dedup = f"REPEATED_BARRIERS_goal_{goal.id}"
            if not escalation_exists(dedup):
                barrier_summary = "; ".join([b.description for b in active_barriers])
                deadline = now + timedelta(hours=cfg["barrier_resolution_hours"])
                esc = EscalationEvent(
                    rule_type="REPEATED_BARRIERS",
                    goal_id=goal.id,
                    client_id=goal.client_id,
                    trigger_reason=(
                        f"Goal '{goal.goal_text}' has {len(active_barriers)} repeated unresolved barriers "
                        f"requiring collaborative review: {barrier_summary}"
                    ),
                    assigned_owner="Care Team Lead",
                    created_at=now,
                    target_resolution_deadline=deadline,
                    status="Open",
                    dedup_key=dedup,
                    audit_notes=f"Goal #{goal.id} has {len(active_barriers)} unresolved barriers."
                )
                db.add(esc)
                db.add(AuditEvent(
                    actor_role="SYSTEM_ESCALATION_ENGINE",
                    actor_id="ESCALATION_WORKER",
                    event_type="ESCALATE_REPEATED_BARRIERS",
                    entity_type="GOAL",
                    entity_id=goal.id,
                    metadata_minimal=f"Repeated unresolved barriers ({len(active_barriers)}) on goal {goal.id}."
                ))
                stats["repeated_barriers_escalated"] += 1
                stats["total_new_escalations"] += 1

    # =========================================================================
    # Rule 5: Significant deterioration in client-reported goal measurements
    # (Never infer clinical deterioration solely from missing data)
    # =========================================================================
    for goal in goals:
        entries = sorted(goal.progress_entries, key=lambda x: ensure_utc(x.reported_at) or now, reverse=True)
        # Must have at least 2 valid measurements to compute deterioration
        if len(entries) >= 2:
            latest = entries[0]
            prev = entries[1]
            if (
                latest.progress_percentage is not None
                and prev.progress_percentage is not None
                and latest.progress_value is not None
                and prev.progress_value is not None
            ):
                drop = prev.progress_percentage - latest.progress_percentage
                if drop >= cfg["deterioration_drop_threshold"]:
                    if goal.status != "Completed":
                        goal.status = "Needs Review"
                    dedup = f"GOAL_DETERIORATION_goal_{goal.id}_entry_{latest.id}"
                    if not escalation_exists(dedup):
                        deadline = now + timedelta(hours=cfg["deterioration_resolution_hours"])
                        esc = EscalationEvent(
                            rule_type="GOAL_DETERIORATION",
                            goal_id=goal.id,
                            client_id=goal.client_id,
                            trigger_reason=(
                                f"Rapid deterioration detected in client-reported measurements for goal '{goal.goal_text}': "
                                f"attainment dropped by {drop:.1f}% (from {prev.progress_value} to {latest.progress_value} {goal.unit or ''}). "
                                f"Requires human clinical review (Non-clinical monitoring indicator — does not constitute an automated diagnosis)."
                            ),
                            assigned_owner="Primary Clinician",
                            created_at=now,
                            target_resolution_deadline=deadline,
                            status="Open",
                            dedup_key=dedup,
                            audit_notes=f"Client-reported attainment drop of {drop:.1f}% flagged for human review."
                        )
                        db.add(esc)
                        db.add(AuditEvent(
                            actor_role="SYSTEM_ESCALATION_ENGINE",
                            actor_id="ESCALATION_WORKER",
                            event_type="ESCALATE_GOAL_DETERIORATION",
                            entity_type="GOAL",
                            entity_id=goal.id,
                            metadata_minimal=f"Measurement deterioration ({drop:.1f}%) on goal {goal.id}. Human review flagged."
                        ))
                        stats["deteriorations_escalated"] += 1
                        stats["total_new_escalations"] += 1

    # =========================================================================
    # Rule 6: Conflicting clinician and client progress ratings
    # =========================================================================
    for goal in goals:
        clinician_entries = [e for e in goal.progress_entries if e.reported_by == "CLINICIAN"]
        client_entries = [e for e in goal.progress_entries if e.reported_by == "CLIENT"]
        if clinician_entries and client_entries:
            latest_clinician = sorted(clinician_entries, key=lambda x: ensure_utc(x.reported_at) or now, reverse=True)[0]
            latest_client = sorted(client_entries, key=lambda x: ensure_utc(x.reported_at) or now, reverse=True)[0]
            discrepancy = abs(latest_clinician.progress_percentage - latest_client.progress_percentage)
            if discrepancy >= cfg["rating_discrepancy_threshold"]:
                goal.has_rating_discrepancy = True
                goal.rating_discrepancy_note = (
                    f"Rating discrepancy of {discrepancy:.1f}% between client self-report "
                    f"({latest_client.progress_percentage}%) and clinician rating ({latest_clinician.progress_percentage}%). "
                    f"Collaborative review required."
                )
                if goal.status != "Completed":
                    goal.status = "Needs Review"
                dedup = f"RATING_DISAGREEMENT_goal_{goal.id}_{latest_clinician.id}_{latest_client.id}"
                if not escalation_exists(dedup):
                    deadline = now + timedelta(hours=cfg["rating_discrepancy_resolution_hours"])
                    esc = EscalationEvent(
                        rule_type="RATING_DISAGREEMENT",
                        goal_id=goal.id,
                        client_id=goal.client_id,
                        trigger_reason=(
                            f"Rating disagreement on goal '{goal.goal_text}': Clinician assessed {latest_clinician.progress_percentage}%, "
                            f"Client self-reported {latest_client.progress_percentage}% (discrepancy: {discrepancy:.1f}%). "
                            f"Both ratings stored separately; collaborative review required."
                        ),
                        assigned_owner="Primary Clinician & Client",
                        created_at=now,
                        target_resolution_deadline=deadline,
                        status="Open",
                        dedup_key=dedup,
                        audit_notes=f"Rating disagreement on goal {goal.id}. Collaborative review flagged."
                    )
                    db.add(esc)
                    db.add(AuditEvent(
                        actor_role="SYSTEM_ESCALATION_ENGINE",
                        actor_id="ESCALATION_WORKER",
                        event_type="ESCALATE_RATING_DISAGREEMENT",
                        entity_type="GOAL",
                        entity_id=goal.id,
                        metadata_minimal=f"Rating disagreement ({discrepancy:.1f}%) on goal {goal.id}."
                    ))
                    stats["rating_discrepancies_escalated"] += 1
                    stats["total_new_escalations"] += 1

    db.commit()
    return stats

def evaluate_and_escalate_actions(db: Session) -> int:
    """
    Backwards-compatible wrapper that executes the full escalation engine sweep
    and returns count of overdue actions escalated.
    """
    stats = run_escalation_engine(db)
    return stats["overdue_actions_escalated"]

