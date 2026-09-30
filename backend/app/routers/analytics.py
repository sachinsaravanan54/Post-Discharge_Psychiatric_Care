from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.domain import Client, Goal, Session as SessionModel, User
from app.security.auth import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/comparison")
def get_baseline_comparison(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    clients = db.query(Client).all()
    
    comparison_items = []
    
    total_clients_count = len(clients)
    high_att_low_prog_count = 0 # Attendance = "Successful", Goal Progress = "Stalled/Poor" (False Positives in Baseline)
    low_att_high_prog_count = 0 # Attendance = "Poor", Goal Progress = "Achieved" (False Negatives in Baseline)
    aligned_success_count = 0
    aligned_failure_count = 0

    attendance_sum = 0.0
    goal_progress_sum = 0.0

    for client in clients:
        sessions = client.sessions
        total_s = len(sessions)
        attended_s = sum(1 for s in sessions if s.attendance_status == "Attended")
        att_rate = round((attended_s / total_s) * 100.0, 1) if total_s > 0 else 0.0
        attendance_sum += att_rate

        goals = client.goals
        g_progress_list = []
        for g in goals:
            if g.progress_entries:
                sorted_p = sorted(g.progress_entries, key=lambda x: x.reported_at, reverse=True)
                g_progress_list.append(sorted_p[0].progress_percentage)
        
        avg_g_prog = round(sum(g_progress_list) / len(g_progress_list), 1) if g_progress_list else 0.0
        goal_progress_sum += avg_g_prog

        discrepancy = round(abs(att_rate - avg_g_prog), 1)

        # Categorize
        if att_rate >= 75.0 and avg_g_prog < 40.0:
            scenario = "Attendance False Positive (High Attendance, Stalled Recovery)"
            high_att_low_prog_count += 1
        elif att_rate < 50.0 and avg_g_prog >= 70.0:
            scenario = "Attendance False Negative (Low Attendance, Autonomous Goal Attainment)"
            low_att_high_prog_count += 1
        elif att_rate >= 70.0 and avg_g_prog >= 70.0:
            scenario = "Aligned Success"
            aligned_success_count += 1
        else:
            scenario = "Aligned Stagnation / Mixed"
            aligned_failure_count += 1

        comparison_items.append({
            "client_id": client.id,
            "synthetic_client_id": client.synthetic_client_id,
            "display_name_or_alias": client.display_name_or_alias,
            "attendance_rate": att_rate,
            "goal_progress_rate": avg_g_prog,
            "discrepancy": discrepancy,
            "scenario": scenario,
            "goal_count": len(goals)
        })

    cohort_avg_attendance = round(attendance_sum / total_clients_count, 1) if total_clients_count > 0 else 0.0
    cohort_avg_goal_progress = round(goal_progress_sum / total_clients_count, 1) if total_clients_count > 0 else 0.0
    false_positive_rate = round((high_att_low_prog_count / total_clients_count) * 100.0, 1) if total_clients_count > 0 else 0.0

    return {
        "cohort_summary": {
            "total_clients": total_clients_count,
            "average_attendance_rate": cohort_avg_attendance,
            "average_goal_progress_rate": cohort_avg_goal_progress,
            "discrepancy_metric": round(abs(cohort_avg_attendance - cohort_avg_goal_progress), 1),
            "attendance_false_positive_rate": false_positive_rate,
            "high_att_low_prog_clients": high_att_low_prog_count,
            "low_att_high_prog_clients": low_att_high_prog_count,
            "aligned_success_clients": aligned_success_count,
            "aligned_failure_clients": aligned_failure_count
        },
        "clients": comparison_items
    }
