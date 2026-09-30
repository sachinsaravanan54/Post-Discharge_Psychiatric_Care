from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.domain import Session as SessionModel, Client, User
from app.schemas.dto import SessionCreate, SessionOut
from app.security.auth import get_current_user

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

@router.get("", response_model=List[SessionOut])
def list_sessions(
    client_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(SessionModel)
    if client_id:
        query = query.filter(SessionModel.client_id == client_id)
    return query.order_by(SessionModel.session_date.desc()).all()

@router.post("", response_model=SessionOut, status_code=status.HTTP_201_CREATED)
def create_session(
    payload: SessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    client_obj = db.query(Client).filter(Client.id == payload.client_id).first()
    if not client_obj:
        raise HTTPException(status_code=404, detail="Client not found")

    session_obj = SessionModel(
        client_id=payload.client_id,
        session_date=payload.session_date or datetime.now(timezone.utc),
        session_type=payload.session_type,
        attendance_status=payload.attendance_status,
        purpose=payload.purpose,
        summary=payload.summary,
        next_review_date=payload.next_review_date
    )
    db.add(session_obj)
    db.commit()
    db.refresh(session_obj)
    return session_obj
