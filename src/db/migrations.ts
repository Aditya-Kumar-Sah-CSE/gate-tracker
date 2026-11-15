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

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
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
