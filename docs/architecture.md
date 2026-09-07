# Architecture & Technical Documentation — Collaborative Outcome Tracker

## 1. Overview
The **Collaborative Outcome Tracker for Post-Discharge Psychiatric Care** is a full-stack, privacy-by-design web application. It shifts post-discharge care evaluation from passive appointment attendance logging to collaborative, evidence-backed, client-defined goal tracking.

---

## 2. System Architecture

```mermaid
graph TD
    ClientUser[Client Role] -->|JWT Auth| Frontend[React + TypeScript + Vite Frontend]
    ClinicianUser[Clinician Role] -->|JWT Auth| Frontend
    SupervisorUser[Supervisor Role] -->|JWT Auth| Frontend

    Frontend -->|REST API JSON| Backend[FastAPI Backend Engine]

    subgraph Backend Core Services
        Backend --> AuthModule[JWT Security & RBAC]
        Backend --> OutcomeEngine[Outcome & Trend Engine]
        Backend --> EscalationEngine[Automated Escalation Engine]
        Backend --> AuditModule[Minimal Operational Audit Engine]
    end

    OutcomeEngine --> DB[(SQLAlchemy ORM / SQLite DB)]
    EscalationEngine --> DB
    AuditModule --> DB

    subgraph Analytics & Synthetic Pipeline
        DataGen[generate_synthetic_data.py] --> Dataset[(synthetic_dataset.json)]
        Dataset --> DB
        Dataset --> Jupyter[outcome_tracker_experiment.ipynb]
    end
```

---

## 3. Tech Stack Breakdown
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Recharts, Axios, Lucide Icons.
- **Backend Framework**: Python 3.10+, FastAPI, Pydantic V2, SQLAlchemy ORM.
- **Database**: SQLite (`outcome_tracker.db`) for zero-dependency local execution, structured with SQLAlchemy ORM to allow seamless migration to PostgreSQL.
- **Testing**: pytest suite covering backend models, API endpoints, RBAC permissions, and 6 explicit failure modes.
- **Synthetic Data**: Reproducible data generator script (`seed=42`).
