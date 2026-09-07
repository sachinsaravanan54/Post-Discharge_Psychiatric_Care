import os
import json
import random
from datetime import datetime, timedelta

def generate_data(seed=42):
    random.seed(seed)

    clients = []
    goals = []
    progress_entries = []
    sessions = []
    barriers = []
    adjustments = []
    actions = []

    categories = [
        ("Independent Travel", "Complete local bus journey independently", "journeys/month", 0, 4, True),
        ("Sleep Routine", "Maintain consistent 7+ hours sleep", "days/week", 2, 7, True),
        ("Social Connection", "Meet friends or community group", "events/month", 0, 3, True),
        ("Education & Training", "Attend vocational training or classes", "sessions/month", 0, 4, True),
        ("Household Tasks", "Manage grocery shopping & meal prep", "tasks/week", 1, 5, True),
        ("Daily Task Confidence", "Self-reported daily confidence score", "rating 1-10", 3, 8, True),
        ("Physical Exercise", "Engage in 30-min walking or exercise", "times/week", 1, 4, True),
        ("Family Communication", "Positive family conversation without conflict", "days/week", 2, 6, True),
        ("Volunteering", "Volunteer at local community center", "hours/week", 0, 5, True),
        ("Daily Routine Management", "Complete morning routine on schedule", "days/week", 2, 7, True)
    ]

    names_aliases = [
        "Client Alpha", "Client Bravo", "Client Charlie", "Client Delta", "Client Echo",
        "Client Foxtrot", "Client Golf", "Client Hotel", "Client India", "Client Juliet",
        "Client Kilo", "Client Lima", "Client Mike", "Client November", "Client Oscar"
    ]

    base_date = datetime.utcnow() - timedelta(days=90)

    # 1. Generate 100 Synthetic Clients
    for i in range(1, 101):
        cid_str = f"CL-{i:04d}"
        alias = f"Participant-{i:03d}"
        clients.append({
            "id": i,
            "synthetic_client_id": cid_str,
            "display_name_or_alias": alias,
            "active": True,
            "created_at": (base_date + timedelta(days=random.randint(0, 10))).strftime("%Y-%m-%d %H:%M:%S")
        })

    goal_id_counter = 1
    progress_id_counter = 1
    session_id_counter = 1
    barrier_id_counter = 1
    adjustment_id_counter = 1
    action_id_counter = 1

    # Scenario distributions:
    # 25% High attendance, low progress (Scenario A)
    # 25% Low attendance, high progress (Scenario B)
    # 25% Barrier stalled (Scenario D)
    # 25% Normal / Improving (Scenario E)

    for client in clients:
        c_id = client["id"]

        # Each client gets 2 to 3 goals (Total > 200 goals)
        num_goals = random.randint(2, 3)
        for _ in range(num_goals):
            cat_tuple = random.choice(categories)
            cat_name, goal_desc, unit, b_val, t_val, is_inc = cat_tuple

            g_id = goal_id_counter
            goal_id_counter += 1

            goal_obj = {
                "id": g_id,
                "client_id": c_id,
                "goal_text": goal_desc,
                "goal_category": cat_name,
                "baseline_value": float(b_val),
                "target_value": float(t_val),
                "unit": unit,
                "measurement_method": "frequency" if "days" in unit or "times" in unit else "count",
                "importance_rating": random.randint(6, 10),
                "created_at": client["created_at"],
                "status": "Active",
                "target_date": (base_date + timedelta(days=60)).strftime("%Y-%m-%d %H:%M:%S"),
                "is_increasing": is_inc
            }
            goals.append(goal_obj)

            # Generate 3-5 progress entries per goal (> 500 total)
            num_entries = random.randint(3, 5)
            curr_val = float(b_val)
            step = (t_val - b_val) / num_entries

            for e_idx in range(num_entries):
                entry_date = base_date + timedelta(days=e_idx * 15 + random.randint(1, 5))
                # Add random noise
                curr_val += step * random.uniform(0.5, 1.3)
                curr_val = round(curr_val, 1)

                pct = round(max(0.0, min(100.0, ((curr_val - b_val) / (t_val - b_val)) * 100.0)), 1)
                
                p_obj = {
                    "id": progress_id_counter,
                    "goal_id": g_id,
                    "reported_by": "CLIENT" if e_idx % 2 == 0 else "CLINICIAN",
                    "progress_value": curr_val,
                    "progress_percentage": pct,
                    "evidence_note": f"Reported completion of {curr_val} {unit}. Felt optimistic.",
                    "reported_at": entry_date.strftime("%Y-%m-%d %H:%M:%S"),
                    "confidence": random.randint(5, 9),
                    "barrier_present": (e_idx == 2 and random.random() > 0.5)
                }
                progress_entries.append(p_obj)
                progress_id_counter += 1

            # Generate Barrier (if needed)
            if random.random() > 0.5:
                barriers.append({
                    "id": barrier_id_counter,
                    "goal_id": g_id,
                    "description": f"Anxiety when traveling during peak hours or unfamiliar routes.",
                    "severity": random.choice(["Low", "Medium", "High"]),
                    "identified_at": (base_date + timedelta(days=20)).strftime("%Y-%m-%d %H:%M:%S"),
                    "status": random.choice(["Active", "Resolved"]),
                    "resolution": "Supported route planning session completed."
                })
                barrier_id_counter += 1

            # Generate Adjustment
            if random.random() > 0.4:
                adjustments.append({
                    "id": adjustment_id_counter,
                    "goal_id": g_id,
                    "description": "Practice route with peer support worker before solo travel.",
                    "agreed_by_client": True,
                    "agreed_by_clinician": True,
                    "created_at": (base_date + timedelta(days=25)).strftime("%Y-%m-%d %H:%M:%S"),
                    "review_date": (base_date + timedelta(days=40)).strftime("%Y-%m-%d %H:%M:%S"),
                    "status": "Agreed"
                })
                adjustment_id_counter += 1

            # Generate Follow-up Action
            actions.append({
                "id": action_id_counter,
                "goal_id": g_id,
                "description": f"Care coordinator to arrange bus schedule review and peer walk-along.",
                "owner_role": random.choice(["Care Coordinator", "Peer Support Worker", "Client"]),
                "owner_id": f"CLIN-{random.randint(101, 105)}",
                "priority": random.choice(["Low", "Medium", "High"]),
                "due_date": (base_date + timedelta(days=random.randint(10, 50))).strftime("%Y-%m-%d %H:%M:%S"),
                "status": random.choice(["Completed", "Open", "Overdue"]),
                "created_at": (base_date + timedelta(days=10)).strftime("%Y-%m-%d %H:%M:%S"),
                "completed_at": None,
                "escalated": False,
                "escalation_reason": None,
                "escalation_level": 0
            })
            action_id_counter += 1

        # Sessions for client (> 300 total)
        for s_idx in range(random.randint(3, 5)):
            s_date = base_date + timedelta(days=s_idx * 20)
            sessions.append({
                "id": session_id_counter,
                "client_id": c_id,
                "session_date": s_date.strftime("%Y-%m-%d %H:%M:%S"),
                "session_type": "Progress Review",
                "attendance_status": random.choices(["Attended", "Missed", "Cancelled"], weights=[0.75, 0.15, 0.10])[0],
                "purpose": "Bi-weekly discharge goal follow-up.",
                "summary": "Reviewed meaningful target progress and evidence notes.",
                "next_review_date": (s_date + timedelta(days=14)).strftime("%Y-%m-%d %H:%M:%S")
            })
            session_id_counter += 1

    os.makedirs("data/synthetic", exist_ok=True)
    with open("data/synthetic/synthetic_dataset.json", "w") as f:
        json.dump({
            "clients": clients,
            "goals": goals,
            "progress_entries": progress_entries,
            "sessions": sessions,
            "barriers": barriers,
            "adjustments": adjustments,
            "actions": actions
        }, f, indent=2)

    print(f"Synthetic dataset generated: {len(clients)} Clients, {len(goals)} Goals, {len(progress_entries)} Progress Entries, {len(sessions)} Sessions, {len(actions)} Actions.")

if __name__ == "__main__":
    generate_data()
