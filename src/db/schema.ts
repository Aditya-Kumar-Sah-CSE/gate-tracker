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
  revision_reminder_time TEXT NOT NULL DEFAULT '14:00',
  target_reminder_time TEXT NOT NULL DEFAULT '18:00',
  evening_reminder_time TEXT NOT NULL DEFAULT '22:00',
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
  default_order INTEGER NOT NULL,
  target_week INTEGER NOT NULL,
  total_lectures INTEGER NOT NULL DEFAULT 30,
  is_lecture_count_estimated INTEGER NOT NULL DEFAULT 1,
  total_dpps INTEGER,
  is_custom INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS topics (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subtopics_json TEXT NOT NULL DEFAULT '[]',
  lecture_count INTEGER NOT NULL DEFAULT 0,
  pyq_count INTEGER NOT NULL DEFAULT 0,
  is_completed INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  difficulty_level TEXT NOT NULL DEFAULT 'Medium',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS lectures (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  topic_id TEXT REFERENCES topics(id) ON DELETE CASCADE,
  lecture_num INTEGER NOT NULL,
  title TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 90,
  pw_url TEXT,
  is_completed INTEGER NOT NULL DEFAULT 0,
  actual_time_spent_minutes INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dpps (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  dpp_num INTEGER NOT NULL,
  title TEXT NOT NULL,
  questions_count INTEGER NOT NULL DEFAULT 10,
  attempted INTEGER NOT NULL DEFAULT 0,
  correct INTEGER NOT NULL DEFAULT 0,
  incorrect INTEGER NOT NULL DEFAULT 0,
  is_completed INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  time_spent_minutes INTEGER NOT NULL DEFAULT 0,
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
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_tasks (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  category TEXT NOT NULL,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL,
  lecture_id TEXT REFERENCES lectures(id) ON DELETE SET NULL,
  dpp_id TEXT REFERENCES dpps(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  target_count INTEGER NOT NULL DEFAULT 1,
  completed_count INTEGER NOT NULL DEFAULT 0,
  is_completed INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  notes TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS revision_schedules (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  interval_stage TEXT NOT NULL,
  scheduled_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  completed_at TEXT,
  skip_reason TEXT,
  time_spent_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS revision_history (
  id TEXT PRIMARY KEY,
  schedule_id TEXT NOT NULL,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  interval_stage TEXT NOT NULL,
  scheduled_date TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  time_spent_minutes INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pyq_attempts (
  id TEXT PRIMARY KEY,
  gate_year INTEGER NOT NULL,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
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
  topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
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
  task_category TEXT NOT NULL,
  topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  started_at TEXT NOT NULL,
  ended_at TEXT NOT NULL,
  is_paused INTEGER NOT NULL DEFAULT 0,
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
  revisions_completed INTEGER NOT NULL DEFAULT 0,
  revision_minutes INTEGER NOT NULL DEFAULT 0,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  total_tasks INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

-- Essential Performance Indexes
CREATE INDEX IF NOT EXISTS idx_topics_subject ON topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_lectures_topic ON lectures(topic_id);
CREATE INDEX IF NOT EXISTS idx_dpps_subject ON dpps(subject_id);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_date ON daily_tasks(date);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_cat ON daily_tasks(category);
CREATE INDEX IF NOT EXISTS idx_revision_date ON revision_schedules(scheduled_date, status);
CREATE INDEX IF NOT EXISTS idx_revision_topic ON revision_schedules(topic_id);
CREATE INDEX IF NOT EXISTS idx_pyq_subject_topic ON pyq_attempts(subject_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_pyq_date ON pyq_attempts(attempted_at);
CREATE INDEX IF NOT EXISTS idx_mistake_topic ON mistake_logs(topic_id);
CREATE INDEX IF NOT EXISTS idx_study_date ON study_sessions(date);
CREATE INDEX IF NOT EXISTS idx_daily_progress_date ON daily_progress(date);
`;
