from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator, ConfigDict

# Token & Auth
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str
    synthetic_client_id: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "CLINICIAN"
    display_name: str
    synthetic_client_id: Optional[str] = None

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    role: str
    display_name: str
    synthetic_client_id: Optional[str] = None

# Client Schemas
class ClientCreate(BaseModel):
    synthetic_client_id: str
    display_name_or_alias: str
    active: bool = True

class ClientOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    synthetic_client_id: str
    display_name_or_alias: str
    active: bool
    created_at: datetime

# Goal Schemas
class GoalCreate(BaseModel):
    client_id: int
    goal_text: str
    goal_category: str
    baseline_value: Optional[float] = None
    target_value: Optional[float] = None
    unit: Optional[str] = "rating"
    measurement_method: str = "frequency"
    importance_rating: int = Field(default=5, ge=1, le=10)
    target_date: Optional[datetime] = None
    is_increasing: bool = True

class GoalUpdate(BaseModel):
    goal_text: Optional[str] = None
    baseline_value: Optional[float] = None
    target_value: Optional[float] = None
    unit: Optional[str] = None
    status: Optional[str] = None
    target_date: Optional[datetime] = None

class GoalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    client_id: int
    goal_text: str
    goal_category: str
    baseline_value: Optional[float]
    target_value: Optional[float]
    unit: Optional[str]
    measurement_method: str
    importance_rating: int
    created_at: datetime
    status: str
    target_date: Optional[datetime]
    is_increasing: bool
    latest_progress_value: Optional[float] = None
    latest_progress_percentage: Optional[float] = None
    latest_trend: Optional[str] = "Stable"
    has_active_barrier: bool = False
    unresolved_actions_count: int = 0

# ProgressEntry Schemas
class ProgressCreate(BaseModel):
    goal_id: int
    reported_by: str = "CLIENT"
    progress_value: float
    evidence_note: Optional[str] = None
    confidence: int = Field(default=7, ge=1, le=10)
    barrier_present: bool = False

    @field_validator('progress_value')
    @classmethod
    def check_sensible_value(cls, v: float) -> float:
        if v < 0 or v > 1000:
            raise ValueError("Progress value is outside standard physical bounds (0 - 1000).")
        return v

class ProgressOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    goal_id: int
    reported_by: str
    progress_value: float
    progress_percentage: float
    evidence_note: Optional[str]
    reported_at: datetime
    confidence: int
    barrier_present: bool

# Session Schemas
class SessionCreate(BaseModel):
    client_id: int
    session_date: Optional[datetime] = None
    session_type: str = "Progress Review"
    attendance_status: str = "Attended"
    purpose: str
    summary: Optional[str] = None
    next_review_date: Optional[datetime] = None

class SessionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    client_id: int
    session_date: datetime
    session_type: str
    attendance_status: str
    purpose: str
    summary: Optional[str]
    next_review_date: Optional[datetime]

# Barrier Schemas
class BarrierCreate(BaseModel):
    goal_id: int
    description: str
    severity: str = "Medium"

class BarrierUpdate(BaseModel):
    status: Optional[str] = "Resolved"
    resolution: Optional[str] = None

class BarrierOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    goal_id: int
    description: str
    severity: str
    identified_at: datetime
    status: str
    resolution: Optional[str]

# Adjustment Schemas
class AdjustmentCreate(BaseModel):
    goal_id: int
    description: str
    agreed_by_clinician: bool = True
    agreed_by_client: bool = False
    review_date: Optional[datetime] = None

class AdjustmentAgreeRequest(BaseModel):
    agreed_by_client: bool
    agreed_by_clinician: Optional[bool] = None

class AdjustmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    goal_id: int
    description: str
    agreed_by_client: bool
    agreed_by_clinician: bool
    created_at: datetime
    review_date: Optional[datetime]
    status: str

# FollowUpAction Schemas
class ActionCreate(BaseModel):
    goal_id: int
    description: str
    owner_role: str
    owner_id: str
    priority: str = "Medium"
    due_date: datetime

    @field_validator('owner_id')
    @classmethod
    def validate_owner(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Follow-up action must have a valid non-empty owner_id (Failure Case 4).")
        return v.strip()

class ActionUpdate(BaseModel):
    description: Optional[str] = None
    owner_role: Optional[str] = None
    owner_id: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = None

class ActionEscalateRequest(BaseModel):
    escalation_reason: str

class ActionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    goal_id: int
    description: str
    owner_role: str
    owner_id: str
    priority: str
    due_date: datetime
    status: str
    created_at: datetime
    completed_at: Optional[datetime]
    escalated: bool
    escalation_reason: Optional[str]
    escalation_level: int

# Evidence Schemas
class EvidenceCreate(BaseModel):
    goal_id: int
    progress_entry_id: Optional[int] = None
    evidence_type: str = "Self-report"
    description: str

class EvidenceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    goal_id: int
    progress_entry_id: Optional[int]
    evidence_type: str
    description: str
    created_at: datetime

# Dashboard Metrics
class DashboardMetricsOut(BaseModel):
    total_active_clients: int
    total_active_goals: int
    goals_improving_count: int
    goals_stable_count: int
    goals_needing_review_count: int
    unresolved_high_priority_actions_count: int
    overdue_actions_count: int
    escalated_actions_count: int
    upcoming_reviews_count: int
    attendance_rate: float
    goal_progress_rate: float
    action_resolution_rate: float

# Progress Discussion Workflow DTOs
class ProgressDiscussionRequest(BaseModel):
    goal_id: int
    measured_result: float
    evidence_note: str
    client_confidence: int = Field(default=7, ge=1, le=10)
    barrier_description: Optional[str] = None
    proposed_adjustment: Optional[str] = None
    action_description: str
    action_owner_role: str
    action_owner_id: str
    action_priority: str = "High"
    action_due_date: datetime

class ProgressDiscussionSummaryOut(BaseModel):
    summary_text: str
    progress_percentage: float
    escalation_warning: Optional[str] = None
