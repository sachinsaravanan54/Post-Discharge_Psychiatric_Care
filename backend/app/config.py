import os

SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key-for-collaborative-outcome-tracker-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

PROJECT_NAME = "Collaborative Outcome Tracker for Post-Discharge Psychiatric Care"
API_V1_STR = "/api"
