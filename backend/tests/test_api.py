import pytest

def test_login_success(client):
    res = client.post("/api/auth/login", json={"username": "test_clinician", "password": "password123"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["role"] == "CLINICIAN"

def test_create_and_get_goal(client, clinician_headers):
    # Create Goal
    res = client.post(
        "/api/goals",
        headers=clinician_headers,
        json={
            "client_id": 1,
            "goal_text": "Travel independently on local bus",
            "goal_category": "Independent Travel",
            "baseline_value": 0.0,
            "target_value": 4.0,
            "unit": "journeys/month",
            "measurement_method": "count",
            "importance_rating": 8,
            "is_increasing": True
        }
    )
    assert res.status_code == 201
    goal = res.json()
    assert goal["goal_text"] == "Travel independently on local bus"
    assert goal["status"] == "Active"

    # Get Goal
    res_get = client.get(f"/api/goals/{goal['id']}", headers=clinician_headers)
    assert res_get.status_code == 200
    assert res_get.json()["id"] == goal["id"]

def test_record_progress_and_calculate_outcome(client, clinician_headers):
    # Create goal first
    g_res = client.post(
        "/api/goals",
        headers=clinician_headers,
        json={
            "client_id": 1,
            "goal_text": "Maintain sleep routine",
            "goal_category": "Sleep Routine",
            "baseline_value": 2.0,
            "target_value": 7.0,
            "unit": "days/week",
            "measurement_method": "frequency",
            "importance_rating": 9
        }
    )
    goal_id = g_res.json()["id"]

    # Record progress = 4.5 days/week -> (4.5 - 2)/(7 - 2) = 2.5 / 5.0 = 50.0%
    p_res = client.post(
        f"/api/goals/{goal_id}/progress",
        headers=clinician_headers,
        json={
            "goal_id": goal_id,
            "reported_by": "CLIENT",
            "progress_value": 4.5,
            "evidence_note": "Completed 4 days of 8-hour sleep with calm evening routine.",
            "confidence": 8,
            "barrier_present": False
        }
    )
    assert p_res.status_code == 201
    p_data = p_res.json()
    assert p_data["progress_percentage"] == 50.0

def test_dashboard_metrics(client, clinician_headers):
    res = client.get("/api/dashboard", headers=clinician_headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_active_clients" in data
    assert "goal_progress_rate" in data
    assert "attendance_rate" in data
