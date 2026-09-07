# Presentation Deck — Collaborative Outcome Tracker for Post-Discharge Psychiatric Care

## Slide 1: Title & Project Overview
- **Title**: Collaborative Outcome Tracker for Post-Discharge Psychiatric Care
- **Subtitle**: Shifting post-discharge evaluation from attendance metrics to collaborative, client-defined recovery goals.
- **Presenter**: Full-Stack Healthcare Engineering Team

---

## Slide 2: Problem Statement
- Current post-discharge tracking focuses primarily on **attendance, session counts, and service utilization**.
- High attendance rates often mask stalled functional progress.
- Clients lack direct ownership in defining what meaningful recovery looks like to them.

---

## Slide 3: Current Attendance-Focused Baseline
- **Attendance Rate Formula**: `attended_sessions / scheduled_sessions`
- **Flaws**:
  - Treats room presence as equivalent to recovery.
  - Generates false positives (High attendance / zero functional gain).
  - Generates false negatives (Low attendance due to successful return to work/community).

---

## Slide 4: Proposed Collaborative Outcome Model
- **Core Principle**: Define meaningful goals together with the client.
- Track baseline, target, behavioral evidence, self-confidence ratings, barriers, and dual-agreed adjustments.
- Assign clear follow-up action ownership with due dates and governance escalation.

---

## Slide 5: Field Workflow Map
- 8-Step Collaborative Workflow:
  1. Client identifies goal
  2. Agree baseline & target
  3. Select measurement method
  4. Record progress & evidence
  5. Identify barriers
  6. Agree dual adjustment
  7. Assign follow-up owner & due date
  8. Automated escalation if overdue

---

## Slide 6: System Architecture
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Recharts.
- **Backend**: Python FastAPI, Pydantic V2, SQLAlchemy ORM.
- **Database**: SQLite / PostgreSQL compatible.
- **Governance**: Automated Escalation Engine & Minimal Audit Logging.

---

## Slide 7: Main Application Interface Demonstration
- Key Pages:
  - Top Dashboard (Comparative Attendance vs Goal Progress metrics)
  - Goal Details View (Progress bars, trend charts, confidence ratings)
  - Structured Progress Discussion Wizard
  - Escalation Dashboard & Governance Queue

---

## Slide 8: Synthetic Data Experiment
- Generated 100 synthetic clients (`CL-0001` to `CL-0100`), 200+ goals, 500+ progress entries, 300+ sessions, 200+ actions.
- Reproducible random seed (`seed=42`).
- Simulated Scenarios A through F.

---

## Slide 9: Baseline vs Prototype Experimental Results
- **Scenario A**: Attendance = 90%, Goal Progress = 25% (Baseline false positive).
- **Scenario B**: Attendance = 35%, Goal Progress = 85% (Baseline false negative).
- Empirical proof that goal tracking provides superior outcome coverage.

---

## Slide 10: Failure Mode Analysis & Escalation
- 6 Explicit Failure Modes tested:
  1. Overdue high-priority action escalation
  2. Unmeasurable goal detection
  3. Out-of-bounds progress rejection
  4. Missing action owner enforcement
  5. Client disagreement flag handling
  6. Stagnant progress review trigger

---

## Slide 11: Privacy-by-Design Architecture
- Pseudonymized client IDs (`CL-0001`).
- Non-diagnostic goal categories.
- Minimal operational audit logs.
- Role-Based Access Control (RBAC).

---

## Slide 12: Simulated Stakeholder Validation
- Synthetic feedback from 5 personas: Client, Care Coordinator, Clinician, Supervisor, Privacy Officer.
- Validated utility of automated summary generator and escalation transparency.

---

## Slide 13: System Limitations
- Synthetic data only (prototype stage).
- Non-clinical decision-making system label.
- Requires active client participation for optimal self-reporting.

---

## Slide 14: Future Improvements
- Integration with FHIR / HL7 standards.
- Mobile push notifications for client follow-up reminders.
- PostgreSQL production cluster deployment.

---

## Slide 15: Conclusion
- Real recovery is measured by what matters to the client.
- The Collaborative Outcome Tracker provides accountable, evidence-backed outcome measurement while protecting patient privacy by design.
