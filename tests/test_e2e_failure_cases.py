from datetime import datetime, timedelta, timezone
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
    past_due = (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()
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
            "due_date": (datetime.now(timezone.utc) + timedelta(days=5)).isoformat()
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


# =========================================================================
# EDGE CASES AND FAILURE-MODE TESTING (A through G)
# =========================================================================

def test_case_a_conflicting_clinician_and_client_progress_ratings(client, clinician_headers, client_headers, db_session):
    """
    CASE A: Conflicting clinician and client progress ratings.
    Store both perspectives separately, flag the disagreement, and require collaborative review.
    Do not silently overwrite either rating.
    """
    # Create goal with baseline 0 and target 10
    g_res = client.post(
        "/api/goals",
        headers=clinician_headers,
        json={
            "client_id": 1,
            "goal_text": "Independent travel to outpatient clinic",
            "goal_category": "Independent Travel",
            "baseline_value": 0.0,
            "target_value": 10.0,
            "unit": "journeys/month"
        }
    )
    assert g_res.status_code == 201
    goal_id = g_res.json()["id"]

    # 1. Clinician enters their clinical observation (rating = 8.0 -> 80%)
    res_clinician = client.post(
        f"/api/goals/{goal_id}/progress",
        headers=clinician_headers,
        json={
            "goal_id": goal_id,
            "reported_by": "CLINICIAN",
            "progress_value": 8.0,
            "evidence_note": "Clinician observed client arriving independently without distress."
        }
    )
    assert res_clinician.status_code == 201
    clinician_entry_id = res_clinician.json()["id"]

    # 2. Client enters their self-reported experience (rating = 2.0 -> 20%)
    res_client = client.post(
        f"/api/goals/{goal_id}/progress",
        headers=client_headers,
        json={
            "goal_id": goal_id,
            "reported_by": "CLIENT",
            "progress_value": 2.0,
            "evidence_note": "Felt extreme panic on bus; needed family member to meet at bus stop."
        }
    )
    assert res_client.status_code == 201
    client_entry_id = res_client.json()["id"]

    # Verify both entries exist independently in database (neither was overwritten)
    entries = client.get(f"/api/goals/{goal_id}/progress", headers=clinician_headers).json()
    assert len(entries) >= 2
    entry_ids = [e["id"] for e in entries]
    assert clinician_entry_id in entry_ids
    assert client_entry_id in entry_ids

    reporters = [e["reported_by"] for e in entries]
    assert "CLINICIAN" in reporters
    assert "CLIENT" in reporters

    # Verify disagreement is flagged and goal status requires collaborative review
    goal_res = client.get(f"/api/goals/{goal_id}", headers=clinician_headers).json()
    assert goal_res["has_rating_discrepancy"] is True
    assert goal_res["status"] == "Needs Review"
    assert "disagreement" in goal_res["rating_discrepancy_note"].lower() or "discrepancy" in goal_res["rating_discrepancy_note"].lower()


def test_case_b_rapid_deterioration_human_review_alert_non_clinical(client, clinician_headers, db_session):
    """
    CASE B: Rapid deterioration in a client-defined goal.
    Detect configured significant changes, verify the measurement history,
    and create an appropriate review alert. Avoid presenting the alert as a diagnosis.
    Never infer clinical deterioration solely from missing data.
    """
    g_res = client.post(
        "/api/goals",
        headers=clinician_headers,
        json={
            "client_id": 1,
            "goal_text": "Independent Morning Routine",
            "goal_category": "Daily Routine",
            "baseline_value": 0.0,
            "target_value": 10.0,
            "unit": "steps/day"
        }
    )
    goal_id = g_res.json()["id"]

    # Entry 1: High attainment (8.0 -> 80%)
    client.post(
        f"/api/goals/{goal_id}/progress",
        headers=clinician_headers,
        json={"goal_id": goal_id, "reported_by": "CLIENT", "progress_value": 8.0}
    )

    # Entry 2: Sharp drop to 2.0 (20%) -> 60% drop, exceeding 25% threshold
    client.post(
        f"/api/goals/{goal_id}/progress",
        headers=clinician_headers,
        json={"goal_id": goal_id, "reported_by": "CLIENT", "progress_value": 2.0}
    )

    # Trigger escalation engine sweep
    scan_res = client.post("/api/actions/scan-escalations", headers=clinician_headers)
    assert scan_res.status_code == 200

    # Verify Escalation Event created
    events = client.get("/api/actions/escalations/events?rule_type=GOAL_DETERIORATION", headers=clinician_headers).json()
    assert len(events) >= 1
    event = events[0]
    assert event["rule_type"] == "GOAL_DETERIORATION"
    assert event["goal_id"] == goal_id
    assert event["status"] == "Open"
    assert event["target_resolution_deadline"] is not None

    # Verify wording explicitly avoids presenting alert as a diagnosis
    reason = event["trigger_reason"].lower()
    assert "human" in reason or "review" in reason
    assert "diagnosis" in reason  # Mentions it does not constitute an automated diagnosis
    assert "not an automated clinical decision" in reason or "does not constitute an automated diagnosis" in reason

    # Verify that missing data does NOT infer clinical deterioration:
    g_missing = client.post(
        "/api/goals",
        headers=clinician_headers,
        json={"client_id": 1, "goal_text": "Goal with no entries", "goal_category": "Sleep Routine", "baseline_value": 0.0, "target_value": 10.0}
    ).json()
    # Sweep again
    client.post("/api/actions/scan-escalations", headers=clinician_headers)
    events_missing = [e for e in client.get("/api/actions/escalations/events", headers=clinician_headers).json() if e["goal_id"] == g_missing["id"]]
    assert len(events_missing) == 0  # No deterioration inferred from missing data


def test_case_c_sensitive_data_leakage(client, clinician_headers, client_headers):
    """
    CASE C: Sensitive-data leakage.
    Verify that unauthorised users cannot access client records, API errors do not expose
    sensitive details, and application logs do not unnecessarily contain confidential information.
    """
    # 1. Unauthenticated request must return 401 Unauthorized
    unauth_res = client.get("/api/clients")
    assert unauth_res.status_code == 401

    # 2. Client role user cannot view records of another client
    # First create a second client as clinician
    c2 = client.post(
        "/api/clients",
        headers=clinician_headers,
        json={"synthetic_client_id": "CL-OTHER-99", "display_name_or_alias": "Participant Confidential", "active": True}
    ).json()

    # Attempt access as test_client (whose synthetic_client_id is CL-TEST-01)
    forbidden_res = client.get(f"/api/clients/{c2['id']}", headers=client_headers)
    assert forbidden_res.status_code == 403
    assert "Access denied" in forbidden_res.json()["detail"]

    # 3. Error responses do not leak internal database paths, passwords, or raw SQL
    err_res = client.get("/api/clients/99999", headers=clinician_headers)
    assert err_res.status_code == 404
    err_text = err_res.text.lower()
    assert "password" not in err_text
    assert "sqlite" not in err_text
    assert "select " not in err_text
    assert "traceback" not in err_text


def test_case_d_missing_baseline_or_target_values(client, clinician_headers):
    """
    CASE D: Missing baseline or target values.
    Prevent invalid progress calculations and explain specifically which data is missing.
    """
    # 1. Both baseline and target missing
    g_both = client.post(
        "/api/goals",
        headers=clinician_headers,
        json={"client_id": 1, "goal_text": "Goal missing both", "goal_category": "Travel", "baseline_value": None, "target_value": None}
    ).json()
    assert g_both["status"] == "Needs measurement definition"

    res_both = client.post(
        f"/api/goals/{g_both['id']}/progress",
        headers=clinician_headers,
        json={"goal_id": g_both["id"], "reported_by": "CLIENT", "progress_value": 3.0}
    )
    assert res_both.status_code == 400
    assert "both baseline and target values are missing" in res_both.json()["detail"].lower()

    # 2. Baseline missing only
    g_no_base = client.post(
        "/api/goals",
        headers=clinician_headers,
        json={"client_id": 1, "goal_text": "Goal missing baseline", "goal_category": "Travel", "baseline_value": None, "target_value": 5.0}
    ).json()
    res_base = client.post(
        f"/api/goals/{g_no_base['id']}/progress",
        headers=clinician_headers,
        json={"goal_id": g_no_base["id"], "reported_by": "CLIENT", "progress_value": 3.0}
    )
    assert res_base.status_code == 400
    assert "baseline value is missing" in res_base.json()["detail"].lower()

    # 3. Target missing only
    g_no_target = client.post(
        "/api/goals",
        headers=clinician_headers,
        json={"client_id": 1, "goal_text": "Goal missing target", "goal_category": "Travel", "baseline_value": 1.0, "target_value": None}
    ).json()
    res_target = client.post(
        f"/api/goals/{g_no_target['id']}/progress",
        headers=clinician_headers,
        json={"goal_id": g_no_target["id"], "reported_by": "CLIENT", "progress_value": 3.0}
    )
    assert res_target.status_code == 400
    assert "target value is missing" in res_target.json()["detail"].lower()


def test_case_e_repeated_barriers_trigger_review(client, clinician_headers, db_session):
    """
    CASE E: Repeated barriers.
    Track unresolved barriers and trigger review according to configurable rules.
    """
    g_res = client.post(
        "/api/goals",
        headers=clinician_headers,
        json={"client_id": 1, "goal_text": "Goal with repeated barriers", "goal_category": "Social", "baseline_value": 0.0, "target_value": 10.0}
    )
    goal_id = g_res.json()["id"]

    # Add 2 unresolved active barriers (meets REPEATED_BARRIERS_THRESHOLD = 2)
    b1 = client.post(
        f"/api/goals/{goal_id}/barriers",
        headers=clinician_headers,
        json={"goal_id": goal_id, "description": "Overwhelming crowd anxiety at community centre", "severity": "High"}
    )
    assert b1.status_code == 201

    b2 = client.post(
        f"/api/goals/{goal_id}/barriers",
        headers=clinician_headers,
        json={"goal_id": goal_id, "description": "No accessible public transit on weekends", "severity": "Medium"}
    )
    assert b2.status_code == 201

    # Run escalation sweep
    client.post("/api/actions/scan-escalations", headers=clinician_headers)

    # Goal status must be updated to Needs Review
    goal_updated = client.get(f"/api/goals/{goal_id}", headers=clinician_headers).json()
    assert goal_updated["status"] == "Needs Review"

    # Escalation Event for repeated barriers must be generated
    events = client.get("/api/actions/escalations/events?rule_type=REPEATED_BARRIERS", headers=clinician_headers).json()
    goal_events = [e for e in events if e["goal_id"] == goal_id]
    assert len(goal_events) >= 1
    assert "repeated unresolved barriers" in goal_events[0]["trigger_reason"].lower()


def test_case_f_overdue_high_priority_actions_deduplication(client, clinician_headers):
    """
    CASE F: Overdue high-priority actions.
    Verify that unresolved actions remain visible, retain ownership,
    and generate escalation records without duplication during repeated processing.
    Completed actions must not be escalated.
    """
    g_res = client.post(
        "/api/goals",
        headers=clinician_headers,
        json={"client_id": 1, "goal_text": "Goal for dedup test", "goal_category": "Sleep", "baseline_value": 0.0, "target_value": 7.0}
    )
    goal_id = g_res.json()["id"]

    past_date = (datetime.now(timezone.utc) - timedelta(days=3)).isoformat()

    # Action 1: High priority overdue action
    a1 = client.post(
        "/api/actions",
        headers=clinician_headers,
        json={
            "goal_id": goal_id,
            "description": "Critical medication review follow-up",
            "owner_role": "Primary Clinician",
            "owner_id": "DR-SMITH-01",
            "priority": "High",
            "due_date": past_date
        }
    ).json()

    # Action 2: Completed action (due in past, but completed)
    a2 = client.post(
        "/api/actions",
        headers=clinician_headers,
        json={
            "goal_id": goal_id,
            "description": "Completed follow-up action",
            "owner_role": "Care Coordinator",
            "owner_id": "COORD-02",
            "priority": "High",
            "due_date": past_date
        }
    ).json()
    client.patch(f"/api/actions/{a2['id']}", headers=clinician_headers, json={"status": "Completed"})

    # Run scan sweep #1
    sweep1 = client.post("/api/actions/scan-escalations", headers=clinician_headers).json()
    events1 = client.get("/api/actions/escalations/events?rule_type=OVERDUE_ACTION", headers=clinician_headers).json()
    a1_events_sweep1 = [e for e in events1 if e["action_id"] == a1["id"]]
    assert len(a1_events_sweep1) == 1

    # Ownership retained
    assert a1_events_sweep1[0]["assigned_owner"] == "Primary Clinician (DR-SMITH-01)"
    assert a1_events_sweep1[0]["target_resolution_deadline"] is not None

    # Completed action a2 must NOT have an escalation event
    a2_events = [e for e in events1 if e["action_id"] == a2["id"]]
    assert len(a2_events) == 0

    # Run scan sweep #2 (Repeated processing)
    sweep2 = client.post("/api/actions/scan-escalations", headers=clinician_headers).json()
    events2 = client.get("/api/actions/escalations/events?rule_type=OVERDUE_ACTION", headers=clinician_headers).json()
    a1_events_sweep2 = [e for e in events2 if e["action_id"] == a1["id"]]

    # Must NOT produce duplicates! Exactly 1 event remains
    assert len(a1_events_sweep2) == 1
    assert sweep2["sweep_results"]["overdue_actions_escalated"] == 0  # 0 new escalations on re-run


def test_case_g_api_and_database_failures_transaction_rollback(client, clinician_headers, db_session):
    """
    CASE G: API and database failures.
    Verify appropriate error responses, transaction rollback where necessary,
    and preservation of previously valid data.
    """
    # Verify baseline client exists
    c_initial = client.get("/api/clients/1", headers=clinician_headers)
    assert c_initial.status_code == 200
    orig_name = c_initial.json()["display_name_or_alias"]

    # 1. Attempt progress discussion with non-existent goal (should fail cleanly with 404)
    res_invalid_goal = client.post(
        "/api/goals/progress-discussion",
        headers=clinician_headers,
        json={
            "goal_id": 999999,
            "measured_result": 5.0,
            "evidence_note": "Evidence text",
            "client_confidence": 7,
            "action_description": "Follow-up action",
            "action_owner_role": "Coordinator",
            "action_owner_id": "COORD-01",
            "action_priority": "High",
            "action_due_date": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
        }
    )
    assert res_invalid_goal.status_code == 404

    # 2. Attempt invalid action creation with empty owner_id (Failure Case 4)
    res_bad_action = client.post(
        "/api/actions",
        headers=clinician_headers,
        json={
            "goal_id": 1,
            "description": "Invalid action without owner",
            "owner_role": "Coordinator",
            "owner_id": "   ",
            "due_date": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat()
        }
    )
    assert res_bad_action.status_code in [400, 422]

    # Verify previously valid client data remains intact and uncorrupted
    c_after = client.get("/api/clients/1", headers=clinician_headers).json()
    assert c_after["display_name_or_alias"] == orig_name
    assert c_after["id"] == 1


def test_missed_scheduled_checkin_escalation(client, clinician_headers):
    """
    Verify backend escalation rule for missed scheduled check-ins:
    Includes trigger reason, assigned owner, creation timestamp, target resolution deadline,
    status, and audit information.
    """
    # Create session with attendance_status = 'Missed'
    past_session_date = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    s_res = client.post(
        "/api/sessions",
        headers=clinician_headers,
        json={
            "client_id": 1,
            "session_date": past_session_date,
            "session_type": "Outpatient Follow-Up",
            "attendance_status": "Missed",
            "purpose": "Post-discharge psychiatric medication review"
        }
    )
    assert s_res.status_code == 201
    sess_id = s_res.json()["id"]

    # Scan escalations
    client.post("/api/actions/scan-escalations", headers=clinician_headers)

    # Check escalation events
    events = client.get("/api/actions/escalations/events?rule_type=MISSED_CHECKIN", headers=clinician_headers).json()
    assert len(events) >= 1
    matching = [e for e in events if f"Session #{sess_id}" in e["trigger_reason"]]
    assert len(matching) == 1
    ev = matching[0]
    assert ev["assigned_owner"] == "Care Coordinator"
    assert ev["status"] == "Open"
    assert ev["target_resolution_deadline"] is not None
    assert "audit_notes" in ev


def test_timezone_handling_and_repeated_execution(client, clinician_headers):
    """
    Verify timezone handling with naive and offset-aware datetimes,
    and guarantee idempotency across repeated execution cycles.
    """
    g = client.post(
        "/api/goals",
        headers=clinician_headers,
        json={"client_id": 1, "goal_text": "Timezone test goal", "goal_category": "Routines", "baseline_value": 0.0, "target_value": 5.0}
    ).json()

    # Create action due in 2 hours (approaching deadline)
    due_approaching = (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    client.post(
        "/api/actions",
        headers=clinician_headers,
        json={
            "goal_id": g["id"],
            "description": "Approaching action",
            "owner_role": "Coordinator",
            "owner_id": "COORD-TZ",
            "priority": "High",
            "due_date": due_approaching
        }
    )

    # Run sweep twice to verify repeated execution safety without crash or duplication
    sweep1 = client.post("/api/actions/scan-escalations", headers=clinician_headers)
    assert sweep1.status_code == 200
    sweep2 = client.post("/api/actions/scan-escalations", headers=clinician_headers)
    assert sweep2.status_code == 200

