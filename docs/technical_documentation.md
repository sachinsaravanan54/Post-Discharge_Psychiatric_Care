# Technical Documentation — Collaborative Outcome Tracker

## 1. Project Purpose & Problem Statement
Traditional post-discharge outcome measurement in psychiatric care relies heavily on service utilization metrics—specifically session attendance rates. However, session attendance alone fails to capture whether a client is achieving real-world functional recovery (e.g., independent travel, sleep routines, social engagement, or daily tasks). A client may attend 100% of appointments while their recovery remains stagnant (a *false positive*), or miss sessions due to starting employment while successfully meeting recovery targets (a *false negative*).

The **Collaborative Outcome Tracker** is a full-stack, privacy-by-design web application designed to shift post-discharge care evaluation from passive attendance logging to collaborative, evidence-backed, client-defined outcome measurement.

---

## 2. Architecture & Technology Stack

### System Architecture
The application consists of a decoupled frontend and backend:
- **Frontend**: React 18, TypeScript, Vite, Vanilla CSS + Tailwind utilities, Recharts for visual analytics, and Axios for API integration.
- **Backend API**: Python FastAPI framework with Pydantic V2 schemas and SQLAlchemy ORM.
- **Database Layer**: SQLite database (`outcome_tracker.db`) for zero-dependency local execution, designed for seamless PostgreSQL migration.
- **Security & Auth**: OAuth2 with JWT access tokens and salted SHA-256 password hashing. Server-side Role-Based Access Control (RBAC) supporting `CLIENT`, `CLINICIAN`, and `SUPERVISOR` roles.
- **Escalation Engine**: Automated background evaluation engine that flags high-priority overdue actions and manages a 3-level escalation policy.

---

## 3. Installation & Setup

### Environment Variables
Create a `.env` file in the project root or backend folder (optional; defaults are populated safely for prototype execution):
```env
SECRET_KEY=super_secret_collaborative_tracker_jwt_key_2026
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
DATABASE_URL=sqlite:///./outcome_tracker.db
```

### Installation Steps
1. **Clone & Setup Python Environment**:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Linux/macOS:
   source venv/bin/activate

   pip install -r requirements.txt
   ```

2. **Frontend Dependencies**:
   ```bash
   cd frontend
   npm install
   cd ..
   ```

---

## 4. Running Backend & Frontend

### Running the Backend
From the repository root:
```bash
uvicorn app.main:app --reload --app-dir backend --port 8000
```
- API Base URL: `http://localhost:8000`
- Interactive Swagger Docs: `http://localhost:8000/api/docs`

### Running the Frontend
From the `frontend` folder:
```bash
npm run dev
```
- Web Application URL: `http://localhost:5173`

---

## 5. Synthetic Data Generation & Database Seeding

To generate a fresh synthetic dataset (100 clients, >200 goals, >500 progress entries, >300 sessions, >100 actions):
```bash
python scripts/generate_synthetic_data.py
```
This generates `data/synthetic/synthetic_dataset.json`.

To seed or reset the database:
```bash
python scripts/seed_database.py
```

### Demo Login Credentials
| Username | Password | Role | Description |
|---|---|---|---|
| `clinician1` | `password123` | `CLINICIAN` | Primary care coordinator (full goal/action management) |
| `client1` | `password123` | `CLIENT` | Client user (views own goals & inputs progress/evidence) |
| `supervisor1` | `password123` | `SUPERVISOR` | Clinical supervisor (escalation governance & metrics) |

---

## 6. Running Tests & Experiment Notebook

### Running Automated Test Suite
To run all backend unit, API, and failure-mode tests:
```bash
pytest
```
Or run specifically inside backend:
```bash
cd backend && pytest
```

### Running the Experiment Notebook
Launch Jupyter or execute the reproducible outcome experiment notebook:
```bash
jupyter notebook experiments/outcome_tracker_experiment.ipynb
```
Or run with `nbconvert`:
```bash
jupyter nbconvert --to notebook --execute experiments/outcome_tracker_experiment.ipynb
```

---

## 7. Main Client Outcome Workflow

1. **Login**: Login as `clinician1` or `client1`.
2. **Dashboard**: Review cohort progress rate, attendance rate, active goals, and escalation alerts.
3. **Select Client**: Navigate to Roster (`/clients`) and select a participant (e.g. `CL-0001`).
4. **Define Goal & Baseline**: Click **Collaboratively Define New Goal**, specify goal description, baseline value (e.g. `0`), target value (e.g. `4`), and unit (e.g. `journeys/month`).
5. **Record Progress & Evidence**: Log measured result (e.g. `3`), self-confidence rating, and behavioral evidence notes.
6. **Flag Barrier & Propose Adjustment**: If progress stumbles, flag barriers and submit dual-agreed adjustments.
7. **Progress Discussion Workflow**: Use `/discussion` to record a structured review, generate an automated narrative summary, and assign high-priority follow-up actions with owner ID and due date.
8. **Automated Escalation**: Overdue high-priority actions automatically trigger 3-level escalation visible on `/escalations`.

---

## 8. Privacy-by-Design Implementation

1. **Pseudonymization**: Uses synthetic IDs (`CL-0001`) and aliases (`Participant-001`). No real names or PII.
2. **Non-Diagnostic Categories**: Focuses purely on functional living domains (e.g., travel, sleep, social). No psychiatric diagnoses or DSM codes.
3. **Role-Based Access Control**: Server-side JWT role enforcement for `CLIENT`, `CLINICIAN`, and `SUPERVISOR`.
4. **Data Minimization**: Audit logs store minimal operational parameters, excluding free-text notes.
5. **Secret Management**: Environment-variable based secret key handling.

---

## 9. Known Limitations

- **Simulated Stakeholder Data**: All dataset records are synthetically generated for evaluation and research demonstrator purposes.
- **Local SQLite Storage**: Production deployments should swap `DATABASE_URL` to a managed PostgreSQL database.
