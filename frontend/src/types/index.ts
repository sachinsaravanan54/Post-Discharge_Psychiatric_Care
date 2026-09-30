export type Role = 'CLIENT' | 'CLINICIAN' | 'SUPERVISOR';

export interface User {
  id?: number;
  username: string;
  role: Role;
  display_name: string;
  synthetic_client_id?: string;
}

export interface Client {
  id: number;
  synthetic_client_id: string;
  display_name_or_alias: string;
  active: boolean;
  created_at: string;
}

export interface Goal {
  id: number;
  client_id: number;
  goal_text: string;
  goal_category: string;
  baseline_value: number | null;
  target_value: number | null;
  unit?: string;
  measurement_method: string;
  importance_rating: number;
  created_at: string;
  status: string;
  target_date?: string;
  is_increasing: boolean;
  latest_progress_value?: number;
  latest_progress_percentage?: number;
  latest_trend?: string;
  has_active_barrier?: boolean;
  unresolved_actions_count?: number;
}

export interface ProgressEntry {
  id: number;
  goal_id: number;
  reported_by: string;
  progress_value: number;
  progress_percentage: number;
  evidence_note?: string;
  reported_at: string;
  confidence: number;
  barrier_present: boolean;
}

export interface Barrier {
  id: number;
  goal_id: number;
  description: string;
  severity: string;
  identified_at: string;
  status: string;
  resolution?: string;
}

export interface Adjustment {
  id: number;
  goal_id: number;
  description: string;
  agreed_by_client: boolean;
  agreed_by_clinician: boolean;
  created_at: string;
  review_date?: string;
  status: string;
}

export interface FollowUpAction {
  id: number;
  goal_id: number;
  description: string;
  owner_role: string;
  owner_id: string;
  priority: string;
  due_date: string;
  status: string;
  created_at: string;
  completed_at?: string;
  escalated: boolean;
  escalation_reason?: string;
  escalation_level: number;
}

export interface DashboardMetrics {
  total_active_clients: number;
  total_active_goals: number;
  goals_improving_count: number;
  goals_stable_count: number;
  goals_needing_review_count: number;
  unresolved_high_priority_actions_count: number;
  overdue_actions_count: number;
  escalated_actions_count: number;
  upcoming_reviews_count: number;
  attendance_rate: number;
  goal_progress_rate: number;
  action_resolution_rate: number;
}

export interface ClientComparisonItem {
  client_id: number;
  synthetic_client_id: string;
  display_name_or_alias: string;
  attendance_rate: number;
  goal_progress_rate: number;
  discrepancy: number;
  scenario: string;
  goal_count: number;
}

export interface BaselineComparisonResponse {
  cohort_summary: {
    total_clients: number;
    average_attendance_rate: number;
    average_goal_progress_rate: number;
    discrepancy_metric: number;
    attendance_false_positive_rate: number;
    high_att_low_prog_clients: number;
    low_att_high_prog_clients: number;
    aligned_success_clients: number;
    aligned_failure_clients: number;
  };
  clients: ClientComparisonItem[];
}
