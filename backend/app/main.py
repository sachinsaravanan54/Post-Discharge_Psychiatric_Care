from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import PROJECT_NAME, API_V1_STR
from app.database import engine, Base
from app.routers import auth, clients, goals, actions, sessions, dashboard, analytics

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=PROJECT_NAME,
    openapi_url=f"{API_V1_STR}/openapi.json",
    docs_url=f"{API_V1_STR}/docs",
    redoc_url=f"{API_V1_STR}/redoc"
)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for prototype flexibility
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(clients.router)
app.include_router(goals.router)
app.include_router(actions.router)
app.include_router(sessions.router)
app.include_router(dashboard.router)
app.include_router(analytics.router)

@app.get("/")
def root():
    return {
        "message": "Welcome to Collaborative Outcome Tracker API",
        "docs": "/api/docs",
        "status": "active"
    }
