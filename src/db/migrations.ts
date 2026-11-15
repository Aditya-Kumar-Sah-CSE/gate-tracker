import { SQLiteDatabase } from 'expo-sqlite';
import { CREATE_TABLES_SQL } from './schema';
import { DEFAULT_GATE_SUBJECTS } from '../constants/gateSyllabus';

export const CURRENT_SCHEMA_VERSION = 3;

export async function seedDefaultSubjects(db: SQLiteDatabase, force: boolean = false): Promise<void> {
  const now = new Date().toISOString();

  if (!force) {
    try {
      const existing = await db.getAllAsync<{ id: string }>('SELECT id FROM subjects;');
      if (existing && existing.length >= DEFAULT_GATE_SUBJECTS.length) {
        return; // Already populated
      }
    } catch {
      // Table may not exist yet, will be inserted below
    }
  }

  for (const subj of DEFAULT_GATE_SUBJECTS) {
    await db.runAsync(
      `INSERT INTO subjects (
        id, code, name, icon, color, gradient_start, gradient_end,
        queue_order, total_lectures, completed_lectures, is_lecture_count_estimated,
        total_dpps, completed_dpps, pyqs_attempted, pyqs_correct, pyqs_target,
        is_active, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        code = excluded.code,
        name = excluded.name,
        icon = excluded.icon,
        color = excluded.color,
        gradient_start = excluded.gradient_start,
        gradient_end = excluded.gradient_end,
        total_lectures = CASE WHEN subjects.total_lectures <= 0 THEN excluded.total_lectures ELSE subjects.total_lectures END,
        total_dpps = CASE WHEN subjects.total_dpps <= 0 THEN excluded.total_dpps ELSE subjects.total_dpps END,
        pyqs_target = CASE WHEN subjects.pyqs_target <= 0 THEN excluded.pyqs_target ELSE subjects.pyqs_target END;`,
      [
        subj.id,
        subj.code,
        subj.name,
        subj.icon,
        subj.color,
        subj.gradient[0],
        subj.gradient[1],
        subj.queue_order,
        subj.total_lectures,
        subj.completed_lectures,
        subj.is_lecture_count_estimated,
        subj.total_dpps,
        subj.completed_dpps,
        subj.pyqs_attempted,
        subj.pyqs_correct,
        subj.pyqs_target,
        subj.is_active,
        subj.status,
        now,
      ]
    );
  }
}

export async function ensureAllSchemas(db: SQLiteDatabase): Promise<void> {
  try {
    // 1. Ensure subjects table and columns
    const subjectsTable = await db.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='subjects';"
    );
    if (!subjectsTable) {
      await db.execAsync(CREATE_TABLES_SQL);
      await seedDefaultSubjects(db, true);
    } else {
      const subjectCols = await db.getAllAsync<{ name: string }>("PRAGMA table_info(subjects);");
      const subjectColNames = new Set(subjectCols.map((c) => c.name));

      const neededSubjectCols: [string, string][] = [
        ['queue_order', 'INTEGER DEFAULT 1'],
        ['total_lectures', 'INTEGER DEFAULT 30'],
        ['completed_lectures', 'INTEGER DEFAULT 0'],
        ['is_lecture_count_estimated', 'INTEGER DEFAULT 1'],
        ['total_dpps', 'INTEGER DEFAULT 0'],
        ['completed_dpps', 'INTEGER DEFAULT 0'],
        ['pyqs_attempted', 'INTEGER DEFAULT 0'],
        ['pyqs_correct', 'INTEGER DEFAULT 0'],
        ['pyqs_target', 'INTEGER DEFAULT 80'],
        ['is_active', 'INTEGER DEFAULT 0'],
        ['status', "TEXT DEFAULT 'in_queue'"],
        ['gradient_start', "TEXT DEFAULT '#6366F1'"],
        ['gradient_end', "TEXT DEFAULT '#8B5CF6'"],
      ];

      for (const [colName, colDef] of neededSubjectCols) {
        if (!subjectColNames.has(colName)) {
          try {
            await db.execAsync(`ALTER TABLE subjects ADD COLUMN ${colName} ${colDef};`);
          } catch (err) {
            console.warn(`Failed to add column ${colName} to subjects:`, err);
          }
        }
      }

      // Check and normalize queue_order if corrupt/duplicates
      try {
        const existingSubjs = await db.getAllAsync<{ id: string; queue_order: number }>(
          'SELECT id, queue_order FROM subjects ORDER BY queue_order ASC, rowid ASC;'
        );
        const uniqueSet = new Set(existingSubjs.map((s) => s.queue_order));
        if (existingSubjs.length > 1 && uniqueSet.size < existingSubjs.length) {
          for (let i = 0; i < existingSubjs.length; i++) {
            await db.runAsync('UPDATE subjects SET queue_order = ? WHERE id = ?;', [
              i + 1,
              existingSubjs[i].id,
            ]);
          }
        }
      } catch (err) {
        console.warn('Queue order check warning:', err);
      }
    }

    // 2. Ensure daily_goals table and columns
    const goalsTable = await db.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='daily_goals';"
    );
    if (!goalsTable) {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS daily_goals (
          id TEXT PRIMARY KEY,
          date TEXT NOT NULL UNIQUE,
          target_study_minutes INTEGER NOT NULL DEFAULT 480,
          target_lectures INTEGER NOT NULL DEFAULT 5,
          target_dpps INTEGER NOT NULL DEFAULT 2,
          target_pyqs INTEGER NOT NULL DEFAULT 20,
          target_revision_minutes INTEGER NOT NULL DEFAULT 60,
          focus_subject_id TEXT,
          is_morning_set INTEGER NOT NULL DEFAULT 0,
          morning_set_at TEXT,
          created_at TEXT NOT NULL
        );
      `);
    } else {
      const goalCols = await db.getAllAsync<{ name: string }>("PRAGMA table_info(daily_goals);");
      const goalColNames = new Set(goalCols.map((c) => c.name));

      const neededGoalCols: [string, string][] = [
        ['focus_subject_id', 'TEXT DEFAULT NULL'],
        ['is_morning_set', 'INTEGER DEFAULT 0'],
        ['morning_set_at', 'TEXT DEFAULT NULL'],
        ['target_study_minutes', 'INTEGER DEFAULT 480'],
        ['target_lectures', 'INTEGER DEFAULT 5'],
        ['target_dpps', 'INTEGER DEFAULT 2'],
        ['target_pyqs', 'INTEGER DEFAULT 20'],
        ['target_revision_minutes', 'INTEGER DEFAULT 60'],
      ];

      for (const [colName, colDef] of neededGoalCols) {
        if (!goalColNames.has(colName)) {
          try {
            await db.execAsync(`ALTER TABLE daily_goals ADD COLUMN ${colName} ${colDef};`);
          } catch (err) {
            console.warn(`Failed to add column ${colName} to daily_goals:`, err);
          }
        }
      }

      // Re-verify focus_subject_id
      const recheckGoalCols = await db.getAllAsync<{ name: string }>("PRAGMA table_info(daily_goals);");
      const recheckGoalColNames = new Set(recheckGoalCols.map((c) => c.name));
      if (!recheckGoalColNames.has('focus_subject_id')) {
        // Fallback: create table afresh if still missing
        await db.withTransactionAsync(async () => {
          try {
            await db.execAsync("DROP TABLE IF EXISTS daily_goals;");
          } catch {}
          await db.execAsync(`
            CREATE TABLE IF NOT EXISTS daily_goals (
              id TEXT PRIMARY KEY,
              date TEXT NOT NULL UNIQUE,
              target_study_minutes INTEGER NOT NULL DEFAULT 480,
              target_lectures INTEGER NOT NULL DEFAULT 5,
              target_dpps INTEGER NOT NULL DEFAULT 2,
              target_pyqs INTEGER NOT NULL DEFAULT 20,
              target_revision_minutes INTEGER NOT NULL DEFAULT 60,
              focus_subject_id TEXT,
              is_morning_set INTEGER NOT NULL DEFAULT 0,
              morning_set_at TEXT,
              created_at TEXT NOT NULL
            );
          `);
        });
      }
    }

    // 3. Ensure daily_progress table and columns
    const progressTable = await db.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='daily_progress';"
    );
    if (!progressTable) {
      await db.execAsync(`
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
      `);
    } else {
      const progCols = await db.getAllAsync<{ name: string }>("PRAGMA table_info(daily_progress);");
      const progColNames = new Set(progCols.map((c) => c.name));

      const neededProgCols: [string, string][] = [
        ['total_study_seconds', 'INTEGER DEFAULT 0'],
        ['lectures_completed', 'INTEGER DEFAULT 0'],
        ['dpps_completed', 'INTEGER DEFAULT 0'],
        ['pyqs_attempted', 'INTEGER DEFAULT 0'],
        ['pyqs_correct', 'INTEGER DEFAULT 0'],
        ['night_review_done', 'INTEGER DEFAULT 0'],
        ['night_review_at', 'TEXT DEFAULT NULL'],
        ['reflection_notes', 'TEXT DEFAULT NULL'],
        ['target_achieved_pct', 'REAL DEFAULT 0.0'],
      ];

      for (const [colName, colDef] of neededProgCols) {
        if (!progColNames.has(colName)) {
          try {
            await db.execAsync(`ALTER TABLE daily_progress ADD COLUMN ${colName} ${colDef};`);
          } catch (err) {
            console.warn(`Failed to add column ${colName} to daily_progress:`, err);
          }
        }
      }
    }
  } catch (err) {
    console.error('ensureAllSchemas error:', err);
  }
}

export const ensureSubjectSchema = ensureAllSchemas;

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  // First guarantee subject schema integrity
  await ensureSubjectSchema(db);

  // Ensure migration tracking table exists
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const rows = await db.getAllAsync<{ version: number }>(
    'SELECT version FROM schema_migrations ORDER BY version ASC;'
  );
  const appliedVersions = new Set(rows.map((r) => r.version));

  // Migration 1: Base Tables
  if (!appliedVersions.has(1)) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(CREATE_TABLES_SQL);

      const existingSettings = await db.getFirstAsync<{ id: number }>(
        'SELECT id FROM app_settings WHERE id = 1;'
      );

      const now = new Date().toISOString();
      const today = now.slice(0, 10);
      const targetExamDate = '2027-02-06'; // GATE CSE 2027

      if (!existingSettings) {
        await db.runAsync(
          `INSERT INTO app_settings (
            id, prep_start_date, target_exam_date, daily_study_hours_target,
            daily_lecture_target, daily_dpp_target, daily_pyq_target, daily_revision_minutes_target,
            daily_aptitude_target, rest_day_preference, weak_subject_1, weak_subject_2,
            critical_accuracy_threshold, improvement_accuracy_threshold, theme_preference,
            notifications_enabled, morning_reminder_time, night_reminder_time,
            is_onboarded, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            1,
            today,
            targetExamDate,
            8.0,
            5, // 5 Lectures
            2, // 2-3 DPP
            20, // 20 PYQs
            60, // 60 min Revision
            10,
            'Sunday',
            'CS-COA',
            'CS-CD',
            50.0,
            70.0,
            'dark',
            1,
            '07:00',
            '21:00',
            1, // Mark onboarded by default for direct use
            now,
            now,
          ]
        );
      }

      // Seed subjects
      for (const subj of DEFAULT_GATE_SUBJECTS) {
        await db.runAsync(
          `INSERT OR REPLACE INTO subjects (
            id, code, name, icon, color, gradient_start, gradient_end,
            queue_order, total_lectures, completed_lectures, is_lecture_count_estimated,
            total_dpps, completed_dpps, pyqs_attempted, pyqs_correct, pyqs_target,
            is_active, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            subj.id,
            subj.code,
            subj.name,
            subj.icon,
            subj.color,
            subj.gradient[0],
            subj.gradient[1],
            subj.queue_order,
            subj.total_lectures,
            subj.completed_lectures,
            subj.is_lecture_count_estimated,
            subj.total_dpps,
            subj.completed_dpps,
            subj.pyqs_attempted,
            subj.pyqs_correct,
            subj.pyqs_target,
            subj.is_active,
            subj.status,
            now,
          ]
        );
      }

      // Initialize today's goal and progress
      await db.runAsync(
        `INSERT OR IGNORE INTO daily_goals (
          id, date, target_study_minutes, target_lectures, target_dpps, target_pyqs,
          target_revision_minutes, focus_subject_id, is_morning_set, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        ['goal_' + today, today, 480, 5, 2, 20, 60, 'cs_cp', 0, now]
      );

      await db.runAsync(
        `INSERT OR IGNORE INTO daily_progress (
          id, date, total_study_seconds, lectures_completed, dpps_completed,
          pyqs_attempted, pyqs_correct, night_review_done, target_achieved_pct, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        ['prog_' + today, today, 0, 0, 0, 0, 0, 0, 0.0, now]
      );

      await db.runAsync(
        'INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?);',
        [1, now]
      );
    });
  }

  // Migration 2: Upgrade to Simplified Queue & Direct Counters Schema
  if (!appliedVersions.has(2)) {
    await db.withTransactionAsync(async () => {
      const now = new Date().toISOString();

      // Check if columns exist in subjects table, add them if missing
      const subjectCols = await db.getAllAsync<{ name: string }>(
        "PRAGMA table_info(subjects);"
      );
      const colNames = new Set(subjectCols.map((c) => c.name));

      if (!colNames.has('queue_order')) {
        try { await db.execAsync("ALTER TABLE subjects ADD COLUMN queue_order INTEGER NOT NULL DEFAULT 1;"); } catch {}
      }
      if (!colNames.has('completed_lectures')) {
        try { await db.execAsync("ALTER TABLE subjects ADD COLUMN completed_lectures INTEGER NOT NULL DEFAULT 0;"); } catch {}
      }
      if (!colNames.has('completed_dpps')) {
        try { await db.execAsync("ALTER TABLE subjects ADD COLUMN completed_dpps INTEGER NOT NULL DEFAULT 0;"); } catch {}
      }
      if (!colNames.has('pyqs_attempted')) {
        try { await db.execAsync("ALTER TABLE subjects ADD COLUMN pyqs_attempted INTEGER NOT NULL DEFAULT 0;"); } catch {}
      }
      if (!colNames.has('pyqs_correct')) {
        try { await db.execAsync("ALTER TABLE subjects ADD COLUMN pyqs_correct INTEGER NOT NULL DEFAULT 0;"); } catch {}
      }
      if (!colNames.has('pyqs_target')) {
        try { await db.execAsync("ALTER TABLE subjects ADD COLUMN pyqs_target INTEGER NOT NULL DEFAULT 80;"); } catch {}
      }
      if (!colNames.has('is_active')) {
        try { await db.execAsync("ALTER TABLE subjects ADD COLUMN is_active INTEGER NOT NULL DEFAULT 0;"); } catch {}
      }
      if (!colNames.has('status')) {
        try { await db.execAsync("ALTER TABLE subjects ADD COLUMN status TEXT NOT NULL DEFAULT 'in_queue';"); } catch {}
      }
      if (!colNames.has('gradient_start')) {
        try { await db.execAsync("ALTER TABLE subjects ADD COLUMN gradient_start TEXT NOT NULL DEFAULT '#6366F1';"); } catch {}
      }
      if (!colNames.has('gradient_end')) {
        try { await db.execAsync("ALTER TABLE subjects ADD COLUMN gradient_end TEXT NOT NULL DEFAULT '#8B5CF6';"); } catch {}
      }

      // Check daily_progress columns
      const progCols = await db.getAllAsync<{ name: string }>(
        "PRAGMA table_info(daily_progress);"
      );
      const progColNames = new Set(progCols.map((c) => c.name));

      if (!progColNames.has('night_review_done')) {
        try { await db.execAsync("ALTER TABLE daily_progress ADD COLUMN night_review_done INTEGER NOT NULL DEFAULT 0;"); } catch {}
      }
      if (!progColNames.has('night_review_at')) {
        try { await db.execAsync("ALTER TABLE daily_progress ADD COLUMN night_review_at TEXT;"); } catch {}
      }
      if (!progColNames.has('reflection_notes')) {
        try { await db.execAsync("ALTER TABLE daily_progress ADD COLUMN reflection_notes TEXT;"); } catch {}
      }

      // Seed / update all subjects to clean default values if needed
      for (const subj of DEFAULT_GATE_SUBJECTS) {
        await db.runAsync(
          `INSERT OR REPLACE INTO subjects (
            id, code, name, icon, color, gradient_start, gradient_end,
            queue_order, total_lectures, completed_lectures, is_lecture_count_estimated,
            total_dpps, completed_dpps, pyqs_attempted, pyqs_correct, pyqs_target,
            is_active, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            subj.id,
            subj.code,
            subj.name,
            subj.icon,
            subj.color,
            subj.gradient[0],
            subj.gradient[1],
            subj.queue_order,
            subj.total_lectures,
            subj.completed_lectures,
            subj.is_lecture_count_estimated,
            subj.total_dpps,
            subj.completed_dpps,
            subj.pyqs_attempted,
            subj.pyqs_correct,
            subj.pyqs_target,
            subj.is_active,
            subj.status,
            now,
          ]
        );
      }

      // Drop old heavy tables if present to keep DB clean and fast
      await db.execAsync(`
        DROP TABLE IF EXISTS topics;
        DROP TABLE IF EXISTS lectures;
        DROP TABLE IF EXISTS dpps;
        DROP TABLE IF EXISTS daily_tasks;
        DROP TABLE IF EXISTS revision_schedules;
        DROP TABLE IF EXISTS revision_history;
      `);

      await db.runAsync(
        'INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?);',
        [2, now]
      );
    });
  }

  // Migration 3: Guarantee all 12 subjects are seeded and statuses initialized
  if (!appliedVersions.has(3)) {
    await db.withTransactionAsync(async () => {
      const now = new Date().toISOString();
      await seedDefaultSubjects(db, true);
      await db.runAsync(
        'INSERT OR REPLACE INTO schema_migrations (version, applied_at) VALUES (?, ?);',
        [3, now]
      );
    });
  }

  // Final Auto-Healing Check: Always verify at least 12 subjects exist
  try {
    const subjectCountRow = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM subjects;'
    );
    if (!subjectCountRow || subjectCountRow.count < DEFAULT_GATE_SUBJECTS.length) {
      await seedDefaultSubjects(db, true);
    }
  } catch (err) {
    console.error('Error during auto-healing subject verification:', err);
  }
}
