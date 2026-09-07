import os
import sys
import json
from datetime import datetime

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

# pyrefly: ignore [missing-import]
from app.database import engine, Base, SessionLocal
# pyrefly: ignore [missing-import]
from app.models.domain import (
    User, Client, Goal, ProgressEntry, Session as SessionModel, Barrier,
    Adjustment, FollowUpAction, Evidence, AuditEvent
)
# pyrefly: ignore [missing-import]
from app.security.auth import get_password_hash
# pyrefly: ignore [missing-import]
from app.services.escalation_engine import evaluate_and_escalate_actions

def seed_db():
    print("Re-creating database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    # 1. Seed Demo Users
    users = [
        User(
            username="client1",
            hashed_password=get_password_hash("password123"),
            role="CLIENT",
            synthetic_client_id="CL-0001",
            display_name="Synthetic Client 1"
        ),
        User(
            username="clinician1",
            hashed_password=get_password_hash("password123"),
            role="CLINICIAN",
            display_name="Care Coordinator Smith"
        ),
        User(
            username="supervisor1",
            hashed_password=get_password_hash("password123"),
            role="SUPERVISOR",
            display_name="Clinical Supervisor Jones"
        )
    ]
    for u in users:
        db.add(u)
    db.commit()
    print("Seeded default users (client1, clinician1, supervisor1 with password 'password123').")

    # 2. Load synthetic dataset
    json_path = os.path.join(os.path.dirname(__file__), "..", "data", "synthetic", "synthetic_dataset.json")
    if not os.path.exists(json_path):
        print(f"Dataset file not found at {json_path}. Running generator first...")
        from generate_synthetic_data import generate_data
        generate_data()

    with open(json_path, "r") as f:
        data = json.load(f)

    # Seed Clients
    for c in data["clients"]:
        client_obj = Client(
            id=c["id"],
            synthetic_client_id=c["synthetic_client_id"],
            display_name_or_alias=c["display_name_or_alias"],
            active=c["active"],
            created_at=datetime.strptime(c["created_at"], "%Y-%m-%d %H:%M:%S")
        )
        db.add(client_obj)
    db.commit()

    # Seed Goals
    for g in data["goals"]:
        goal_obj = Goal(
            id=g["id"],
            client_id=g["client_id"],
            goal_text=g["goal_text"],
            goal_category=g["goal_category"],
            baseline_value=g["baseline_value"],
            target_value=g["target_value"],
            unit=g["unit"],
            measurement_method=g["measurement_method"],
            importance_rating=g["importance_rating"],
            created_at=datetime.strptime(g["created_at"], "%Y-%m-%d %H:%M:%S"),
            status=g["status"],
            target_date=datetime.strptime(g["target_date"], "%Y-%m-%d %H:%M:%S") if g["target_date"] else None,
            is_increasing=g["is_increasing"]
        )
        db.add(goal_obj)
    db.commit()

    # Seed Progress Entries
    for p in data["progress_entries"]:
        pe_obj = ProgressEntry(
            id=p["id"],
            goal_id=p["goal_id"],
            reported_by=p["reported_by"],
            progress_value=p["progress_value"],
            progress_percentage=p["progress_percentage"],
            evidence_note=p["evidence_note"],
            reported_at=datetime.strptime(p["reported_at"], "%Y-%m-%d %H:%M:%S"),
            confidence=p["confidence"],
            barrier_present=p["barrier_present"]
        )
        db.add(pe_obj)
    db.commit()

    # Seed Sessions
    for s in data["sessions"]:
        s_obj = SessionModel(
            id=s["id"],
            client_id=s["client_id"],
            session_date=datetime.strptime(s["session_date"], "%Y-%m-%d %H:%M:%S"),
            session_type=s["session_type"],
            attendance_status=s["attendance_status"],
            purpose=s["purpose"],
            summary=s["summary"],
            next_review_date=datetime.strptime(s["next_review_date"], "%Y-%m-%d %H:%M:%S") if s["next_review_date"] else None
        )
        db.add(s_obj)
    db.commit()

    # Seed Barriers
    for b in data["barriers"]:
        b_obj = Barrier(
            id=b["id"],
            goal_id=b["goal_id"],
            description=b["description"],
            severity=b["severity"],
            identified_at=datetime.strptime(b["identified_at"], "%Y-%m-%d %H:%M:%S"),
            status=b["status"],
            resolution=b["resolution"]
        )
        db.add(b_obj)
    db.commit()

    # Seed Adjustments
    for a in data["adjustments"]:
        adj_obj = Adjustment(
            id=a["id"],
            goal_id=a["goal_id"],
            description=a["description"],
            agreed_by_client=a["agreed_by_client"],
            agreed_by_clinician=a["agreed_by_clinician"],
            created_at=datetime.strptime(a["created_at"], "%Y-%m-%d %H:%M:%S"),
            review_date=datetime.strptime(a["review_date"], "%Y-%m-%d %H:%M:%S") if a["review_date"] else None,
            status=a["status"]
        )
        db.add(adj_obj)
    db.commit()

    # Seed Actions
    for act in data["actions"]:
        act_obj = FollowUpAction(
            id=act["id"],
            goal_id=act["goal_id"],
            description=act["description"],
            owner_role=act["owner_role"],
            owner_id=act["owner_id"],
            priority=act["priority"],
            due_date=datetime.strptime(act["due_date"], "%Y-%m-%d %H:%M:%S"),
            status=act["status"],
            created_at=datetime.strptime(act["created_at"], "%Y-%m-%d %H:%M:%S"),
            escalated=act["escalated"],
            escalation_level=act["escalation_level"]
        )
        db.add(act_obj)
    db.commit()

    # Evaluate escalations
    evaluate_and_escalate_actions(db)

    print("Database successfully seeded with synthetic records.")
    db.close()

if __name__ == "__main__":
    seed_db()
