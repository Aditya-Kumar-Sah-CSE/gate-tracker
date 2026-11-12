export const CREATE_TABLES_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  prep_start_date TEXT NOT NULL,
  target_exam_date TEXT NOT NULL,
  daily_study_hours_target REAL NOT NULL DEFAULT 8.0,
  daily_lecture_target INTEGER NOT NULL DEFAULT 5,
  daily_dpp_target INTEGER NOT NULL DEFAULT 2,
  daily_pyq_target INTEGER NOT NULL DEFAULT 20,
  daily_revision_minutes_target INTEGER NOT NULL DEFAULT 60,
  daily_aptitude_target INTEGER NOT NULL DEFAULT 10,
  rest_day_preference TEXT NOT NULL DEFAULT 'Sunday',
  weak_subject_1 TEXT NOT NULL DEFAULT 'CS-COA',
  weak_subject_2 TEXT NOT NULL DEFAULT 'CS-CD',
  critical_accuracy_threshold REAL NOT NULL DEFAULT 50.0,
  improvement_accuracy_threshold REAL NOT NULL DEFAULT 70.0,
  theme_preference TEXT NOT NULL DEFAULT 'dark',
  notifications_enabled INTEGER NOT NULL DEFAULT 1,
  morning_reminder_time TEXT NOT NULL DEFAULT '07:00',
  night_reminder_time TEXT NOT NULL DEFAULT '21:00',
  is_onboarded INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  gradient_start TEXT NOT NULL DEFAULT '#6366F1',
  gradient_end TEXT NOT NULL DEFAULT '#8B5CF6',
  queue_order INTEGER NOT NULL DEFAULT 1,
  total_lectures INTEGER NOT NULL DEFAULT 30,
  completed_lectures INTEGER NOT NULL DEFAULT 0,
  is_lecture_count_estimated INTEGER NOT NULL DEFAULT 1,
  total_dpps INTEGER NOT NULL DEFAULT 0,
  completed_dpps INTEGER NOT NULL DEFAULT 0,
  pyqs_attempted INTEGER NOT NULL DEFAULT 0,
  pyqs_correct INTEGER NOT NULL DEFAULT 0,
  pyqs_target INTEGER NOT NULL DEFAULT 80,
  is_active INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_queue',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_goals (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  target_study_minutes INTEGER NOT NULL DEFAULT 480,
  target_lectures INTEGER NOT NULL DEFAULT 5,
  target_dpps INTEGER NOT NULL DEFAULT 2,
  target_pyqs INTEGER NOT NULL DEFAULT 20,
  target_revision_minutes INTEGER NOT NULL DEFAULT 60,
  focus_subject_id TEXT REFERENCES subjects(id) ON DELETE SET NULL,
  is_morning_set INTEGER NOT NULL DEFAULT 0,
  morning_set_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_progress (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  total_study_seconds INTEGER NOT NULL DEFAULT 0,
  lectures_completed INTEGER NOT NULL DEFAULT 0,
  dpps_completed INTEGER NOT NULL DEFAULT 0,
  pyqs_attempted INTEGER NOT NULL DEFAULT 0,
  pyqs_correct INTEGER NOT NULL DEFAULT 0,
  night_review_done INTEGER NOT NULL DEFAULT 0,
  night_review_at TEXT,
  reflection_notes TEXT,
  target_achieved_pct REAL NOT NULL DEFAULT 0.0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pyq_attempts (
  id TEXT PRIMARY KEY,
  gate_year INTEGER NOT NULL,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  marks INTEGER NOT NULL DEFAULT 1,
  difficulty TEXT NOT NULL DEFAULT 'Medium',
  is_correct INTEGER NOT NULL DEFAULT 1,
  time_taken_seconds INTEGER NOT NULL DEFAULT 120,
  mistake_category TEXT,
  notes TEXT,
  attempted_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS mistake_logs (
  id TEXT PRIMARY KEY,
  pyq_attempt_id TEXT REFERENCES pyq_attempts(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  mistake_category TEXT NOT NULL,
  explanation TEXT NOT NULL,
  is_resolved INTEGER NOT NULL DEFAULT 0,
  resolved_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS study_sessions (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  started_at TEXT NOT NULL,
  ended_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

-- Essential Performance Indexes
CREATE INDEX IF NOT EXISTS idx_subjects_queue ON subjects(queue_order);
CREATE INDEX IF NOT EXISTS idx_subjects_active ON subjects(is_active);
CREATE INDEX IF NOT EXISTS idx_daily_goals_date ON daily_goals(date);
CREATE INDEX IF NOT EXISTS idx_daily_progress_date ON daily_progress(date);
CREATE INDEX IF NOT EXISTS idx_pyq_subject ON pyq_attempts(subject_id);
CREATE INDEX IF NOT EXISTS idx_pyq_date ON pyq_attempts(attempted_at);
CREATE INDEX IF NOT EXISTS idx_mistake_subject ON mistake_logs(subject_id);
CREATE INDEX IF NOT EXISTS idx_study_date ON study_sessions(date);
`;
