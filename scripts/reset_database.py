import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

# pyrefly: ignore [missing-import]
from app.database import engine, Base

def reset_db():
    print("Dropping all database tables...")
    Base.metadata.drop_all(bind=engine)
    print("Re-creating clean database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database reset complete.")

if __name__ == "__main__":
    reset_db()
