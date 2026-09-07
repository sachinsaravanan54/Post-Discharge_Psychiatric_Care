from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
import enum
from app.database import Base

class RoleEnum(str, enum.Enum):
    CLIENT = "CLIENT"
    CLINICIAN = "CLINICIAN"
    SUPERVISOR = "SUPERVISOR"

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="CLINICIAN", nullable=False)
    synthetic_client_id = Column(String, nullable=True)
    display_name = Column(String, nullable=False)
    created_at = Column(DateTime, default=utc_now)

class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    synthetic_client_id = Column(String, unique=True, index=True, nullable=False)
    display_name_or_alias = Column(String, nullable=False)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

    goals = relationship("Goal", back_populates="client", cascade="all, delete-orphan")
    sessions = relationship("Session", back_populates="client", cascade="all, delete-orphan")

class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    goal_text = Column(String, nullable=False)
    goal_category = Column(String, nullable=False)
    baseline_value = Column(Float, nullable=True)
    target_value = Column(Float, nullable=True)
    unit = Column(String, nullable=True)
    measurement_method = Column(String, nullable=False)
    importance_rating = Column(Integer, default=5)
    created_at = Column(DateTime, default=utc_now)
    status = Column(String, default="Active")
    target_date = Column(DateTime, nullable=True)
    is_increasing = Column(Boolean, default=True)

    client = relationship("Client", back_populates="goals")
    progress_entries = relationship("ProgressEntry", back_populates="goal", cascade="all, delete-orphan")
    barriers = relationship("Barrier", back_populates="goal", cascade="all, delete-orphan")
    adjustments = relationship("Adjustment", back_populates="goal", cascade="all, delete-orphan")
    follow_up_actions = relationship("FollowUpAction", back_populates="goal", cascade="all, delete-orphan")

class ProgressEntry(Base):
    __tablename__ = "progress_entries"

    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("goals.id"), nullable=False)
    reported_by = Column(String, nullable=False)
    progress_value = Column(Float, nullable=False)
    progress_percentage = Column(Float, nullable=False)
    evidence_note = Column(Text, nullable=True)
    reported_at = Column(DateTime, default=utc_now)
    confidence = Column(Integer, default=7)
    barrier_present = Column(Boolean, default=False)

    goal = relationship("Goal", back_populates="progress_entries")
    evidences = relationship("Evidence", back_populates="progress_entry", cascade="all, delete-orphan")

class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    session_date = Column(DateTime, default=utc_now)
    session_type = Column(String, default="Review")
    attendance_status = Column(String, default="Attended")
    purpose = Column(String, nullable=False)
    summary = Column(Text, nullable=True)
    next_review_date = Column(DateTime, nullable=True)

    client = relationship("Client", back_populates="sessions")

class Barrier(Base):
    __tablename__ = "barriers"

    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("goals.id"), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String, default="Medium")
    identified_at = Column(DateTime, default=utc_now)
    status = Column(String, default="Active")
    resolution = Column(Text, nullable=True)

    goal = relationship("Goal", back_populates="barriers")

class Adjustment(Base):
    __tablename__ = "adjustments"

    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("goals.id"), nullable=False)
    description = Column(Text, nullable=False)
    agreed_by_client = Column(Boolean, default=False)
    agreed_by_clinician = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)
    review_date = Column(DateTime, nullable=True)
    status = Column(String, default="Pending agreement")

    goal = relationship("Goal", back_populates="adjustments")

class FollowUpAction(Base):
    __tablename__ = "follow_up_actions"

    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("goals.id"), nullable=False)
    description = Column(Text, nullable=False)
    owner_role = Column(String, nullable=False)
    owner_id = Column(String, nullable=False)
    priority = Column(String, default="Medium")
    due_date = Column(DateTime, nullable=False)
    status = Column(String, default="Open")
    created_at = Column(DateTime, default=utc_now)
    completed_at = Column(DateTime, nullable=True)
    escalated = Column(Boolean, default=False)
    escalation_reason = Column(Text, nullable=True)
    escalation_level = Column(Integer, default=0)

    goal = relationship("Goal", back_populates="follow_up_actions")

class Evidence(Base):
    __tablename__ = "evidences"

    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("goals.id"), nullable=False)
    progress_entry_id = Column(Integer, ForeignKey("progress_entries.id"), nullable=True)
    evidence_type = Column(String, default="Self-report")
    description = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utc_now)

    progress_entry = relationship("ProgressEntry", back_populates="evidences")

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    actor_role = Column(String, nullable=False)
    actor_id = Column(String, nullable=False)
    event_type = Column(String, nullable=False)
    entity_type = Column(String, nullable=False)
    entity_id = Column(Integer, nullable=False)
    timestamp = Column(DateTime, default=utc_now)
    metadata_minimal = Column(Text, nullable=True)
