export type ThemeMode = 'dark' | 'light' | 'system';

export type TaskCategory = 'lecture' | 'dpp' | 'pyq' | 'study';

export type MistakeCategory =
  | 'Conceptual mistake'
  | 'Calculation mistake'
  | 'Silly mistake'
  | 'Question misunderstood'
  | 'Time management issue';

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export interface AppSettings {
  id: number;
  prep_start_date: string; // YYYY-MM-DD
  target_exam_date: string; // YYYY-MM-DD
  daily_study_hours_target: number; // default 8.0
  daily_lecture_target: number; // default 5
  daily_dpp_target: number; // default 2
  daily_pyq_target: number; // default 20
  daily_revision_minutes_target: number; // default 60
  daily_aptitude_target: number; // default 10
  rest_day_preference: string; // 'Sunday' or 'None'
  weak_subject_1: string;
  weak_subject_2: string;
  critical_accuracy_threshold: number; // default 50 (%)
  improvement_accuracy_threshold: number; // default 70 (%)
  theme_preference: ThemeMode;
  notifications_enabled: number; // 0 or 1
  morning_reminder_time: string; // '07:00'
  night_reminder_time: string; // '21:00'
  is_onboarded: number; // 0 or 1
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string; // e.g. 'cs_cp', 'cs_toc'
  code: string; // e.g. 'CS-CP', 'CS-TOC'
  name: string;
  icon: string;
  color: string;
  gradient_start: string;
  gradient_end: string;
  queue_order: number; // 1 = Active / Top priority
  total_lectures: number;
  completed_lectures: number;
  is_lecture_count_estimated: number; // 0 = confirmed, 1 = estimated
  total_dpps: number;
  completed_dpps: number;
  pyqs_attempted: number;
  pyqs_correct: number;
  pyqs_target: number;
  is_active: number; // 1 = Currently active
  status: 'in_queue' | 'active' | 'completed' | 'doing' | 'done';
  created_at: string;
}

export interface DailyGoal {
  id: string;
  date: string; // YYYY-MM-DD
  target_study_minutes: number;
  target_lectures: number;
  target_dpps: number;
  target_pyqs: number;
  target_revision_minutes: number;
  focus_subject_id?: string | null;
  is_morning_set: number; // 1 = user completed morning kickoff
  morning_set_at?: string | null;
  created_at: string;
}

export interface DailyProgress {
  id: string;
  date: string; // YYYY-MM-DD
  total_study_seconds: number;
  lectures_completed: number;
  dpps_completed: number;
  pyqs_attempted: number;
  pyqs_correct: number;
  night_review_done: number; // 1 = 9 PM check-in done
  night_review_at?: string | null;
  reflection_notes?: string | null;
  target_achieved_pct: number;
  created_at: string;
}

export interface PyqAttempt {
  id: string;
  gate_year: number;
  subject_id: string;
  question_number: number;
  marks: number;
  difficulty: DifficultyLevel;
  is_correct: number;
  time_taken_seconds: number;
  mistake_category?: MistakeCategory | null;
  notes?: string | null;
  attempted_at: string;
  created_at: string;
}

export interface MistakeLog {
  id: string;
  pyq_attempt_id?: string | null;
  subject_id: string;
  mistake_category: MistakeCategory;
  explanation: string;
  is_resolved: number;
  resolved_at?: string | null;
  created_at: string;
}

export interface StudySession {
  id: string;
  date: string;
  subject_id: string;
  duration_seconds: number;
  started_at: string;
  ended_at: string;
  created_at: string;
}

export interface DayActivity {
  date: string;
  dayLabel: string;
  studyHours: number;
  targetHours: number;
  lectures: number;
  dpps: number;
  pyqs: number;
  achievedPct: number;
}

export interface DatabaseBackup {
  version: number;
  exported_at: string;
  app_settings: AppSettings;
  subjects: Subject[];
  daily_goals: DailyGoal[];
  daily_progress: DailyProgress[];
  pyq_attempts: PyqAttempt[];
}
