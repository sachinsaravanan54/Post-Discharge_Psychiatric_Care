# Failure Mode and Effects Analysis (FMEA)

This document presents the FMEA matrix for the Collaborative Outcome Tracker platform.

| Failure Mode | Root Cause | Impact | Detection Mechanism | Severity (1-5) | Likelihood (1-5) | Mitigation Strategy | Owner | Escalation Policy |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- | :--- | :--- |
| **FM-1: High-priority action overdue** | Staff workload / missed due date | Follow-up task stalled | Escalation Engine scan | 4 | 3 | Auto-mark 'Overdue', flag level 1-3 escalation | Care Coordinator | Auto-escalate to Supervisor after 7 days |
| **FM-2: Goal missing baseline/target** | Incomplete goal creation form | Cannot calculate outcome % | API validator check | 3 | 2 | Set status 'Needs measurement definition' | Clinician | Prompt user to complete metrics |
| **FM-3: Out-of-bounds progress input** | Data entry typo / invalid value | Corrupted trend charts | Pydantic range check | 3 | 2 | Reject entry with HTTP 400 validation error | System API | Display clear UI warning |
| **FM-4: Action created without owner** | Omission of owner ID | Unassigned task | Pydantic non-empty check | 4 | 2 | Block creation until owner_id provided | Clinician | UI form validation block |
| **FM-5: Client disagrees with adjustment** | Unacceptable proposed change | Intervention forced without consent | Agreement status check | 4 | 2 | Set status 'Disagreed', block auto-agreement | Client / Clinician | Requires progress rediscussion |
| **FM-6: Progress stagnant for 3 periods** | Unresolved barrier / wrong target | Recovery stalled unnoticed | Trend evaluation engine | 3 | 3 | Set status 'Needs Review' | Care Coordinator | Flag on dashboard for review |
| **FM-7: Client inactive for extended period** | Post-discharge loss of contact | Stale outcome data | Inactivity scan worker | 3 | 3 | Flag client for outreach review | Care Coordinator | Supervisor alert |
| **FM-8: Unauthorized access attempt** | Role permission mismatch | Data leakage risk | JWT RBAC middleware | 5 | 1 | Reject request with HTTP 403 Forbidden | Security Module | Log security audit event |
