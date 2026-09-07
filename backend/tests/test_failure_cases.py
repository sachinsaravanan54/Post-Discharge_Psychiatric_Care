from datetime import datetime, timedelta
import pytest
from app.models.domain import FollowUpAction

def test_failure_case_1_overdue_action_escalation(client, clinician_headers, db_session):
    """
    FAILURE CASE 1: High-priority action becomes overdue.
    Expected: Mark action as overdue, escalate, retain owner & due date, never remove.
    """
    # Create goal
    g_res = client.post(
        "/api/goals",
        headers=clinician_headers,
        json={
            "client_id": 1,
            "goal_text": "Goal for overdue action test",
            "goal_category": "Independent Travel",
            "baseline_value": 0.0,
            "target_value": 5.0
        }
    )
    goal_id = g_res.json()["id"]

    # Create high priority action due yesterday
    past_due = (datetime.utcnow() - timedelta(days=2)).isoformat()
    a_res = client.post(
        "/api/actions",
        headers=clinician_headers,
        json={
            "goal_id": goal_id,
            "description": "Arrange peer support travel escort",
            "owner_role": "Care Coordinator",
            "owner_id": "CLIN-101",
            "priority": "High",
            "due_date": past_due
        }
    )
    assert a_res.status_code == 201
    action_id = a_res.json()["id"]

    # Access dashboard to trigger escalation engine scan
    client.get("/api/dashboard", headers=clinician_headers)

    # Verify escalation status
    act = db_session.query(FollowUpAction).filter(FollowUpAction.id == action_id).first()
    assert act.status == "Overdue"
    assert act.escalated == True
    assert act.escalation_level >= 1
    assert act.owner_id == "CLIN-101" # Owner retained
    assert act.due_date is not None # Due date retained

def test_failure_case_2_unmeasurable_goal(client, clinician_headers):
    """
    FAILURE CASE 2: Goal has no measurable baseline or target.
    Expected: System prevents outcome calculation, asks user to complete missing info, marks goal as 'Needs measurement definition'.
    """
    # Create goal with missing baseline & target
    g_res = client.post(
        "/api/goals",
        headers=clinician_headers,
        json={
            "client_id": 1,
            "goal_text": "Unmeasurable goal text",
            "goal_category": "Social Reconnection",
            "baseline_value": None,
            "target_value": None
        }
    )
    assert g_res.status_code == 201
    goal = g_res.json()
    assert goal["status"] == "Needs measurement definition"

    # Attempt progress recording -> Rejection with HTTP 400
    p_res = client.post(
        f"/api/goals/{goal['id']}/progress",
        headers=clinician_headers,
        json={
            "goal_id": goal["id"],
            "reported_by": "CLIENT",
            "progress_value": 5.0
        }
    )
    assert p_res.status_code == 400
    assert "no measurable baseline or target" in p_res.json()["detail"].lower()

def test_failure_case_3_invalid_progress_range(client, clinician_headers):
    """
    FAILURE CASE 3: Progress value outside valid physical bounds.
    Expected: Validation error, do not store invalid progress, return clear error message.
    """
    g_res = client.post(
        "/api/goals",
        headers=clinician_headers,
        json={
            "client_id": 1,
            "goal_text": "Goal for range test",
            "goal_category": "Daily Routine",
            "baseline_value": 0.0,
            "target_value": 10.0
        }
    )
    goal_id = g_res.json()["id"]

    # Send unreasonable progress_value = 5000
    p_res = client.post(
        f"/api/goals/{goal_id}/progress",
        headers=clinician_headers,
        json={
            "goal_id": goal_id,
            "reported_by": "CLIENT",
            "progress_value": 5000.0
        }
    )
    assert p_res.status_code in [400, 422] # Pydantic or API validation error

def test_failure_case_4_action_no_owner(client, clinician_headers):
    """
    FAILURE CASE 4: Follow-up action has no owner.
    Expected: System flags missing ownership and rejects action creation or completion.
    """
    g_res = client.post(
        "/api/goals",
        headers=clinician_headers,
        json={
            "client_id": 1,
            "goal_text": "Goal for missing owner test",
            "goal_category": "Exercise",
            "baseline_value": 0.0,
            "target_value": 5.0
        }
    )
    goal_id = g_res.json()["id"]

    # Try creating action with empty owner_id
    a_res = client.post(
        "/api/actions",
        headers=clinician_headers,
        json={
            "goal_id": goal_id,
            "description": "Unassigned action",
            "owner_role": "Care Coordinator",
            "owner_id": "   ", # Empty
            "priority": "High",
            "due_date": (datetime.utcnow() + timedelta(days=5)).isoformat()
        }
    )
    assert a_res.status_code in [400, 422]

def test_failure_case_5_client_disagrees_adjustment(client, clinician_headers, client_headers):
    """
    FAILURE CASE 5: Client disagrees with proposed adjustment.
    Expected: Adjustment remains 'Disagreed' or 'Pending agreement', cannot be converted to agreed by clinician.
    """
    g_res = client.post(
        "/api/goals",
        headers=clinician_headers,
        json={
            "client_id": 1,
            "goal_text": "Goal for adjustment test",
            "goal_category": "Independent Travel",
            "baseline_value": 0.0,
            "target_value": 4.0
        }
    )
    goal_id = g_res.json()["id"]

    # Create proposed adjustment
    adj_res = client.post(
        f"/api/goals/{goal_id}/adjustments",
        headers=clinician_headers,
        json={
            "goal_id": goal_id,
            "description": "Increase session frequency to 3x per week",
            "agreed_by_clinician": True,
            "agreed_by_client": False
        }
    )
    adj_id = adj_res.json()["id"]
    assert adj_res.json()["status"] == "Pending agreement"

    # Client explicitly disagrees
    agree_res = client.post(
        f"/api/goals/adjustments/{adj_id}/agree",
        headers=client_headers,
        json={"agreed_by_client": False}
    )
    assert agree_res.json()["status"] == "Disagreed"
    assert agree_res.json()["agreed_by_client"] == False

def test_failure_case_6_stagnant_progress_needs_review(client, clinician_headers):
    """
    FAILURE CASE 6: Goal progress unchanged for multiple reporting periods.
    Expected: Status changes to 'Needs Review', suggests progress discussion, no clinical diagnosis.
    """
    g_res = client.post(
        "/api/goals",
        headers=clinician_headers,
        json={
            "client_id": 1,
            "goal_text": "Goal for stagnant progress test",
            "goal_category": "Volunteering",
            "baseline_value": 0.0,
            "target_value": 10.0
        }
    )
    goal_id = g_res.json()["id"]

    # Record 3 progress entries with identical stagnant value (2.0)
    for _ in range(3):
        client.post(
            f"/api/goals/{goal_id}/progress",
            headers=clinician_headers,
            json={
                "goal_id": goal_id,
                "reported_by": "CLIENT",
                "progress_value": 2.0
            }
        )

    # Check goal status updated to 'Needs Review'
    get_res = client.get(f"/api/goals/{goal_id}", headers=clinician_headers)
    assert get_res.json()["status"] == "Needs Review"
    assert get_res.json()["latest_trend"] == "Needs Review"
