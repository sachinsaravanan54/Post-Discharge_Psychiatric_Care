from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.domain import FollowUpAction, AuditEvent

def evaluate_and_escalate_actions(db: Session) -> int:
    now = datetime.now(timezone.utc)
    actions = db.query(FollowUpAction).filter(
        FollowUpAction.status != "Completed"
    ).all()

    escalated_count = 0

    for action in actions:
        action_due = action.due_date
        if action_due.tzinfo is None:
            action_due = action_due.replace(tzinfo=timezone.utc)

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
                    escalated_count += 1

                    audit = AuditEvent(
                        actor_role="SYSTEM_ESCALATION_ENGINE",
                        actor_id="ESCALATION_WORKER",
                        event_type="ESCALATE_ACTION",
                        entity_type="ACTION",
                        entity_id=action.id,
                        metadata_minimal=f"Escalated high-priority action ID {action.id} to level 1."
                    )
                    db.add(audit)
                
                days_overdue = (now - action_due).days
                if days_overdue >= 7 and action.escalation_level < 2:
                    action.escalation_level = 2
                    action.escalation_reason += f" Extended overdue ({days_overdue} days). Escalated to Supervisor."
                elif days_overdue >= 14 and action.escalation_level < 3:
                    action.escalation_level = 3
                    action.escalation_reason += f" Critical overdue ({days_overdue} days). Management Alert Triggered."

    db.commit()
    return escalated_count
