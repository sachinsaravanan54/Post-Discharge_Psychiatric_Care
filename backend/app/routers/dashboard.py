from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.domain import Client, Goal, FollowUpAction, Session as SessionModel, User
from app.schemas.dto import DashboardMetricsOut
from app.security.auth import get_current_user
from app.services.escalation_engine import evaluate_and_escalate_actions
from app.services.outcome_engine import calculate_attendance_rate, evaluate_goal_trend_and_review, calculate_goal_progress

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("", response_model=DashboardMetricsOut)
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Trigger background escalation engine scan
    evaluate_and_escalate_actions(db)

    # 2. Total active clients
    total_clients = db.query(Client).filter(Client.active == True).count()

    # 3. Active goals & status counts
    goals = db.query(Goal).all()
    total_goals = len(goals)
    
    improving_count = 0
    stable_count = 0
    needing_review_count = 0
    total_progress_pct_sum = 0.0
    valid_goals_count = 0

    for g in goals:
        trend, needs_review = evaluate_goal_trend_and_review(g)
        if g.status == "Needs Review" or needs_review:
            needing_review_count += 1
        elif trend == "Improving":
            improving_count += 1
        else:
            stable_count += 1

        if g.progress_entries:
            latest_pe = sorted(g.progress_entries, key=lambda x: x.reported_at, reverse=True)[0]
            total_progress_pct_sum += latest_pe.progress_percentage
            valid_goals_count += 1

    avg_goal_progress = round(total_progress_pct_sum / valid_goals_count, 1) if valid_goals_count > 0 else 0.0

    # 4. Action counts
    actions = db.query(FollowUpAction).all()
    unresolved_high = sum(1 for a in actions if a.priority == "High" and a.status != "Completed")
    overdue_count = sum(1 for a in actions if a.status == "Overdue")
    escalated_count = sum(1 for a in actions if a.escalated)
    completed_actions = sum(1 for a in actions if a.status == "Completed")
    action_resolution_rate = round((completed_actions / len(actions)) * 100.0, 1) if actions else 100.0

    # 5. Session Attendance Rate
    all_sessions = db.query(SessionModel).all()
    att_rate = calculate_attendance_rate(all_sessions)

    # 6. Upcoming reviews (e.g. goals target_date within next 30 days or needs review)
    upcoming_reviews = needing_review_count + sum(1 for a in actions if a.status == "Overdue")

    return DashboardMetricsOut(
        total_active_clients=total_clients,
        total_active_goals=total_goals,
        goals_improving_count=improving_count,
        goals_stable_count=stable_count,
        goals_needing_review_count=needing_review_count,
        unresolved_high_priority_actions_count=unresolved_high,
        overdue_actions_count=overdue_count,
        escalated_actions_count=escalated_count,
        upcoming_reviews_count=upcoming_reviews,
        attendance_rate=att_rate,
        goal_progress_rate=avg_goal_progress,
        action_resolution_rate=action_resolution_rate
    )
