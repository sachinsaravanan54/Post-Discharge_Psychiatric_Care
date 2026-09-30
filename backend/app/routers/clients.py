from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.domain import Client, User
from app.schemas.dto import ClientCreate, ClientOut
from app.security.auth import get_current_user, require_role

router = APIRouter(prefix="/api/clients", tags=["clients"])

@router.get("", response_model=List[ClientOut])
def list_clients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "CLIENT":
        # Clients only see their own profile
        if current_user.synthetic_client_id:
            clients = db.query(Client).filter(Client.synthetic_client_id == current_user.synthetic_client_id).all()
        else:
            clients = db.query(Client).filter(Client.id == 1).all()
        return clients
    
    return db.query(Client).all()

@router.post("", response_model=ClientOut, status_code=status.HTTP_201_CREATED)
def create_client(
    payload: ClientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["CLINICIAN", "SUPERVISOR"]))
):
    existing = db.query(Client).filter(Client.synthetic_client_id == payload.synthetic_client_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Client with this synthetic ID already exists.")
    
    client_obj = Client(
        synthetic_client_id=payload.synthetic_client_id,
        display_name_or_alias=payload.display_name_or_alias,
        active=payload.active
    )
    db.add(client_obj)
    db.commit()
    db.refresh(client_obj)
    return client_obj

@router.get("/{client_id}", response_model=ClientOut)
def get_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    client_obj = db.query(Client).filter(Client.id == client_id).first()
    if not client_obj:
        raise HTTPException(status_code=404, detail="Client not found")
    return client_obj
