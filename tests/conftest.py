import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app.security.auth import get_password_hash, create_access_token
from app.models.domain import User, Client

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_outcome_tracker.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    
    # Create test users
    client_user = User(
        username="test_client",
        hashed_password=get_password_hash("password123"),
        role="CLIENT",
        synthetic_client_id="CL-TEST-01",
        display_name="Test Client"
    )
    clinician_user = User(
        username="test_clinician",
        hashed_password=get_password_hash("password123"),
        role="CLINICIAN",
        display_name="Test Clinician"
    )
    supervisor_user = User(
        username="test_supervisor",
        hashed_password=get_password_hash("password123"),
        role="SUPERVISOR",
        display_name="Test Supervisor"
    )
    session.add_all([client_user, clinician_user, supervisor_user])
    
    # Create test client record
    test_client = Client(
        id=1,
        synthetic_client_id="CL-TEST-01",
        display_name_or_alias="Participant-Test",
        active=True
    )
    session.add(test_client)
    session.commit()

    yield session
    session.close()

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture
def clinician_headers():
    token = create_access_token({"sub": "test_clinician", "role": "CLINICIAN"})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def client_headers():
    token = create_access_token({"sub": "test_client", "role": "CLIENT"})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def supervisor_headers():
    token = create_access_token({"sub": "test_supervisor", "role": "SUPERVISOR"})
    return {"Authorization": f"Bearer {token}"}
