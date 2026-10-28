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

import os
from fastapi import Request
from fastapi.responses import FileResponse

@app.get("/")
def root(request: Request):
    accept = request.headers.get("accept", "")
    index_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "index.html")
    if "text/html" in accept and os.path.exists(index_path):
        return FileResponse(index_path)
    return {
        "message": "Welcome to Collaborative Outcome Tracker API",
        "docs": f"{API_V1_STR}/docs",
        "landing_page": "/landing",
        "status": "active"
    }

@app.get("/landing")
def get_landing_page():
    index_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Landing page index.html not found"}

