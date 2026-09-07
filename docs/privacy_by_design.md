# Privacy-by-Design Technical Documentation

## 1. Executive Summary
Privacy is a core architectural requirement of the **Collaborative Outcome Tracker**. The system minimizes sensitive patient data exposure by design while maintaining high operational utility for post-discharge outcome tracking.

---

## 2. Technical Privacy Controls

### 2.1 Pseudonymized Synthetic Identifiers
- Real names, addresses, phone numbers, and government identification numbers are strictly prohibited.
- Synthetic patient IDs (e.g. `CL-0001`, `CL-0002`) and non-identifying aliases (e.g. `Participant-001`) are used exclusively across backend schemas and frontend displays.

### 2.2 Non-Diagnostic Goal Categories
- Goals focus strictly on functional daily living activities (e.g. "Independent Travel", "Sleep Routine", "Daily Task Confidence").
- Detailed psychiatric diagnoses, DSM-5 codes, and medication lists are **not stored** in the application database.

### 2.3 Data Minimization in Audit Logging
- Audit events capture minimal operational metadata:
  ```json
  {
    "actor_role": "CLINICIAN",
    "actor_id": "clinician1",
    "event_type": "UPDATE_PROGRESS",
    "entity_type": "PROGRESS",
    "entity_id": 42,
    "timestamp": "2026-09-07T14:30:00Z"
  }
  ```
- Detailed free-text notes are omitted from audit tables.

### 2.4 Server-Side Role-Based Access Control (RBAC)
- **CLIENT Role**: Access restricted strictly to own goal progress records matching `synthetic_client_id`.
- **CLINICIAN Role**: Access granted to assigned client roster and goal creation workflows.
- **SUPERVISOR Role**: Access focused on aggregate outcome metrics and overdue escalation governance.

### 2.5 Data Retention & Environment Security
- Zero hardcoded secrets; configuration loaded via `.env` variables.
- Passwords stored using SHA-256 salted hashes.
- Frontend logs filter out sensitive parameters.
