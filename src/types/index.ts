export type ThemeMode = 'dark' | 'light' | 'system';

export type TaskCategory = 'lecture' | 'dpp' | 'pyq_practice' | 'revision' | 'aptitude';

export type MistakeCategory =
  | 'Conceptual mistake'
  | 'Calculation mistake'
  | 'Silly mistake'
  | 'Question misunderstood'
  | 'Time management issue';

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';

export type RevisionStage = 'R1' | 'R2' | 'R3' | 'R4' | 'R5';

export type RevisionStatus = 'pending' | 'completed' | 'skipped' | 'rescheduled';

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
  revision_reminder_time: string; // '14:00'
  target_reminder_time: string; // '18:00'
  evening_reminder_time: string; // '22:00'
  is_onboarded: number; // 0 or 1
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string; // e.g. 'c_prog', 'toc', 'dm', 'ga'
  code: string; // e.g. 'CS-C', 'CS-TOC'
  name: string;
  icon: string;
  color: string;
  default_order: number;
  target_week: number;
  total_lectures: number;
  is_lecture_count_estimated: number; // 0 = confirmed, 1 = estimated
  total_dpps: number | null; // null if unknown
  is_custom: number; // 0 or 1
  created_at: string;
}

export interface Topic {
  id: string;
  subject_id: string;
  name: string;
  subtopics: string[]; // stored as JSON text in SQLite
  lecture_count: number;
  pyq_count: number;
  is_completed: number;
  completed_at: string | null;
  difficulty_level: DifficultyLevel;
  created_at: string;
}

export interface Lecture {
  id: string;
  subject_id: string;
  topic_id: string | null;
  lecture_num: number;
  title: string;
  duration_minutes: number;
  pw_url: string | null;
  is_completed: number;
  actual_time_spent_minutes: number;
  completed_at: string | null;
  created_at: string;
}

export interface DPP {
  id: string;
  subject_id: string;
  dpp_num: number;
  title: string;
  questions_count: number;
  attempted: number;
  correct: number;
  incorrect: number;
  is_completed: number;
  completed_at: string | null;
  time_spent_minutes: number;
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
  created_at: string;
}

export interface DailyTask {
  id: string;
  date: string; // YYYY-MM-DD
  category: TaskCategory;
  subject_id: string;
  topic_id: string | null;
  lecture_id: string | null;
  dpp_id: string | null;
  title: string;
  target_count: number;
  completed_count: number;
  is_completed: number;
  completed_at: string | null;
  notes: string | null;
  order_index: number;
  created_at: string;
  subject_name?: string;
  subject_color?: string;
  topic_name?: string;
}

export interface RevisionSchedule {
  id: string;
  subject_id: string;
  topic_id: string;
  interval_stage: RevisionStage;
  scheduled_date: string; // YYYY-MM-DD
  status: RevisionStatus;
  completed_at: string | null;
  skip_reason: string | null;
  time_spent_minutes: number;
  created_at: string;
}

export interface RevisionHistoryItem {
  id: string;
  schedule_id: string;
  subject_id: string;
  topic_id: string;
  interval_stage: RevisionStage;
  scheduled_date: string;
  completed_at: string;
  time_spent_minutes: number;
  notes: string | null;
  created_at: string;
}

export interface PyqAttempt {
  id: string;
  gate_year: number;
  subject_id: string;
  topic_id: string;
  question_number: number;
  marks: number; // 1 or 2
  difficulty: DifficultyLevel;
  is_correct: number; // 1 or 0
  time_taken_seconds: number;
  mistake_category: MistakeCategory | null;
  notes: string | null;
  attempted_at: string;
  created_at: string;
}

export interface MistakeLog {
  id: string;
  pyq_attempt_id: string | null;
  subject_id: string;
  topic_id: string;
  mistake_category: MistakeCategory;
  explanation: string;
  is_resolved: number;
  resolved_at: string | null;
  created_at: string;
}

export interface StudySession {
  id: string;
  date: string; // YYYY-MM-DD
  subject_id: string;
  task_category: TaskCategory;
  topic_id: string | null;
  duration_seconds: number;
  started_at: string;
  ended_at: string;
  is_paused: number;
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
  revisions_completed: number;
  revision_minutes: number;
  tasks_completed: number;
  total_tasks: number;
  created_at: string;
}

export interface WeakTopicAnalysis {
  topic_id: string;
  topic_name: string;
  subject_id: string;
  subject_name: string;
  total_attempts: number;
  correct_attempts: number;
  accuracy: number;
  status: 'Critical' | 'Needs Improvement' | 'Improving';
}

export interface SubjectProgressSummary {
  subject: Subject;
  total_topics: number;
  completed_topics: number;
  total_lectures: number;
  completed_lectures: number;
  is_lecture_count_estimated: boolean;
  total_dpps: number | null;
  completed_dpps: number;
  pyq_attempted: number;
  pyq_correct: number;
  pyq_accuracy: number | null; // null if zero attempts ("Not Started")
  total_revisions_due: number;
  revisions_completed: number;
  completion_percentage: number;
  weak_topics: WeakTopicAnalysis[];
}
