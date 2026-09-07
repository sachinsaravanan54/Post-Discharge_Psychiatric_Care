from typing import Dict, Any, Tuple, Optional
from datetime import datetime, timedelta
from app.models.domain import Goal, ProgressEntry, Session

def calculate_goal_progress(
    baseline: Optional[float],
    target: Optional[float],
    current: float,
    is_increasing: bool = True
) -> Tuple[float, str]:
    if baseline is None or target is None:
        return 0.0, "Needs measurement definition"
    
    if baseline == target:
        return 100.0 if current >= target else 0.0, "Achieved" if current >= target else "Active"

    if is_increasing:
        raw_progress = (current - baseline) / (target - baseline)
        achieved = current >= target
    else:
        raw_progress = (baseline - current) / (baseline - target)
        achieved = current <= target

    clamped_progress = max(0.0, min(1.0, raw_progress)) * 100.0
    status = "Completed" if achieved else "Active"
    return round(clamped_progress, 1), status

def evaluate_goal_trend_and_review(goal: Goal) -> Tuple[str, bool]:
    entries = sorted(goal.progress_entries, key=lambda x: x.reported_at, reverse=True)
    if not entries:
        return "Stable", False
    
    if len(entries) >= 3:
        p1, p2, p3 = entries[0].progress_value, entries[1].progress_value, entries[2].progress_value
        if p1 == p2 == p3 and goal.status != "Completed":
            return "Needs Review", True

    if len(entries) >= 2:
        latest = entries[0].progress_value
        previous = entries[1].progress_value
        if goal.is_increasing:
            if latest > previous:
                return "Improving", False
            elif latest < previous:
                return "Declining", False
        else:
            if latest < previous:
                return "Improving", False
            elif latest > previous:
                return "Declining", False

    return "Stable", False

def calculate_attendance_rate(sessions: list) -> float:
    if not sessions:
        return 0.0
    total = len(sessions)
    attended = sum(1 for s in sessions if s.attendance_status == "Attended")
    return round((attended / total) * 100.0, 1)
