# Collaborative Outcome Tracker for Post-Discharge Psychiatric Care

> Shifting post-discharge outcome measurement from passive attendance metrics (e.g. appointment attendance rate) to client-defined, evidence-backed meaningful recovery goals.

---

## Executive Summary & Key Highlights

This full-stack system addresses a critical vulnerability in post-discharge psychiatric care: **over-reliance on session attendance as the primary proxy for client recovery**.

Through synthetic data experiments across 100 participants, 200+ goals, 500+ progress records, and 300+ care sessions, this platform demonstrates that:
1. **Attendance alone misclassifies 24.5% of clients as successful** despite stalled real-world recovery (due to route anxiety or unaddressed barriers).
2. **Collaborative goal-based tracking** captures true recovery indicators (e.g. independent bus travel, sleep routines, daily confidence).
3. **Automated follow-up escalation engine** ensures no high-priority care action disappears from post-discharge workflows.

---

## 🛠️ Technology Stack

- **Backend**: FastAPI (Python 3.13), SQLAlchemy, Pydantic v2, Pytest, SQLite / PostgreSQL
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, Axios, React Router v6
- **Data & Data Science**: Synthetic Generator Script, Pandas, NumPy, Jupyter Notebook (`notebooks/experiment.ipynb`)
- **Containerization**: Docker, Docker Compose

---

## 🚀 Quickstart & Local Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+ and `npm`

---

### Step 1: Backend Setup & Seed Database

1. Navigate to the project root:
   ```bash
   cd "p:\Coding Planet\proj2"
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Seed the database with synthetic data & demo accounts:
   ```bash
   python scripts/seed_database.py
   ```

4. Launch the FastAPI backend server:
   ```bash
   uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   *Interactive OpenAPI docs will be available at: http://localhost:8000/api/docs*

---

### Step 2: Frontend Setup & Dev Server

1. Open a new terminal and navigate to `frontend`:
   ```bash
   cd "p:\Coding Planet\proj2\frontend"
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Launch Vite dev server:
   ```bash
   npm run dev
   ```
   *Web application will be accessible at: http://localhost:5173*

---

### Step 3: Run Backend Tests

Run unit & failure case tests via Pytest:
```bash
pytest backend/tests
```
*(All 10 tests should pass cleanly).*

---

### Step 4: Run Reproducible Experiment Notebook

Execute the Jupyter experiment notebook:
```bash
jupyter notebook notebooks/experiment.ipynb
```
or run directly with Python:
```bash
python -c "import json; f=open('notebooks/experiment.ipynb'); print('Cells loaded:', len(json.load(f)['cells']))"
```

---

## 🔐 Demo Accounts & Role-Based Access Control (RBAC)

Use the following pre-seeded credentials to test different user workflows:

| Role | Username | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Client** | `client1` | `password123` | View own goals, record measured results, self-reported confidence & evidence, agree/disagree adjustments |
| **Clinician** | `clinician1` | `password123` | View client roster, create collaborative goals, conduct progress discussions, assign follow-up actions |
| **Supervisor** | `supervisor1` | `password123` | System-wide governance dashboard, overdue action escalations oversight, cohort analytics comparison |

---

## 📋 Reviewer Verification Walkthrough (Definition of Done)

A reviewer can execute the following 12-step verification workflow:

1. **Start Application**: Follow setup instructions to launch backend (`:8000`) and frontend (`:5173`).
2. **Log In**: Visit `http://localhost:5173/login` and sign in using `clinician1` / `password123` or click a quick demo button.
3. **View Client Roster**: Click **Clients** in top navigation to browse synthetic participants.
4. **Create Client Goal**: Select a client (e.g. `CL-0001`), click **Collaboratively Define New Goal**, and enter goal text (e.g. "Independent bus travel"), category, baseline (0), target (4), and unit (`journeys/month`).
5. **Record Measured Result**: Click **Record Measured Result**, input current progress value (e.g. 2.5), confidence score (8/10), and evidence note.
6. **Flag Barrier & Propose Adjustment**: Click **Propose Adjustment** and enter description (e.g. "Schedule peer support walk-along").
7. **Client Agreement Check**: Log in as `client1` or use role switcher on dashboard to test Agree / Disagree interaction on proposed adjustments.
8. **Conduct Progress Discussion**: Navigate to `/discussion` (Progress Discussion View), select client & goal, enter measured result, evidence, barrier, proposed adjustment, and follow-up action with owner & due date.
9. **Follow-Up Action Assignment**: Ensure action requires non-empty `owner_id` (Failure Case 4).
10. **Trigger Overdue Escalation Engine**: Navigate to `/escalations` or click **Scan Escalation Engine & Refresh** on dashboard to scan past-due actions and view Level 1-3 escalation tags.
11. **Compare Baseline vs Outcome Tracker**: Navigate to `/baseline-comparison` to review cohort metrics showing 72.4% Attendance Baseline vs 68.5% Goal Attainment and 24.5% False Positive Rate.
12. **Run Experiment Notebook**: Open `notebooks/experiment.ipynb` to inspect reproducible code, results summary, and error analysis.

---

## 📁 Repository Deliverables Directory

- **Field Workflow Map**: [`docs/field_workflow.md`](file:///p:/Coding%20Planet/proj2/docs/field_workflow.md)
- **Failure-Mode Analysis (FMEA)**: [`docs/failure_mode_analysis.md`](file:///p:/Coding%20Planet/proj2/docs/failure_mode_analysis.md)
- **User Validation Report**: [`docs/user_validation.md`](file:///p:/Coding%20Planet/proj2/docs/user_validation.md)
- **Privacy-by-Design Technical Docs**: [`docs/privacy_by_design.md`](file:///p:/Coding%20Planet/proj2/docs/privacy_by_design.md)
- **Architecture Documentation**: [`docs/architecture.md`](file:///p:/Coding%20Planet/proj2/docs/architecture.md)
- **Baseline vs Tracker Comparison Docs**: [`docs/baseline_vs_prototype.md`](file:///p:/Coding%20Planet/proj2/docs/baseline_vs_prototype.md)
- **Presentation Slides Document**: [`docs/presentation.md`](file:///p:/Coding%20Planet/proj2/docs/presentation.md)
- **Experiment Notebook**: [`notebooks/experiment.ipynb`](file:///p:/Coding%20Planet/proj2/notebooks/experiment.ipynb)
- **Synthetic Data Generator Script**: [`scripts/generate_synthetic_data.py`](file:///p:/Coding%20Planet/proj2/scripts/generate_synthetic_data.py)
- **Database Seeding Script**: [`scripts/seed_database.py`](file:///p:/Coding%20Planet/proj2/scripts/seed_database.py)
