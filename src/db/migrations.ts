import { SQLiteDatabase } from 'expo-sqlite';
import { CREATE_TABLES_SQL } from './schema';
import { DEFAULT_GATE_SYLLABUS } from '../constants/gateSyllabus';

export const CURRENT_SCHEMA_VERSION = 1;

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

  if (!appliedVersions.has(1)) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(CREATE_TABLES_SQL);

      // Check if default app_settings exists
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
            notifications_enabled, morning_reminder_time, revision_reminder_time,
            target_reminder_time, evening_reminder_time, is_onboarded, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
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
            '14:00',
            '18:00',
            '22:00',
            0,
            now,
            now
          ]
        );
      }

      // Populate default GATE CSE syllabus subjects, topics, lectures, and DPPs
      const existingSubjects = await db.getAllAsync<{ id: string }>('SELECT id FROM subjects;');
      if (existingSubjects.length === 0) {
        for (const subj of DEFAULT_GATE_SYLLABUS) {
          await db.runAsync(
            `INSERT INTO subjects (
              id, code, name, icon, color, default_order, target_week, total_lectures, is_lecture_count_estimated, total_dpps, is_custom, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
              subj.id,
              subj.code,
              subj.name,
              subj.icon,
              subj.color,
              subj.default_order,
              subj.target_week,
              subj.total_lectures,
              subj.is_lecture_count_estimated,
              subj.total_dpps,
              0,
              now
            ]
          );

          // Insert Topics and Lectures
          for (const topic of subj.topics) {
            await db.runAsync(
              `INSERT INTO topics (
                id, subject_id, name, subtopics_json, lecture_count, pyq_count, is_completed, completed_at, difficulty_level, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
              [
                topic.id,
                subj.id,
                topic.name,
                JSON.stringify(topic.subtopics),
                topic.lecture_count,
                topic.pyq_count,
                0,
                null,
                topic.difficulty_level,
                now
              ]
            );

            for (const lec of topic.lectures) {
              const lectureId = `${topic.id}_lec_${lec.lecture_num}`;
              await db.runAsync(
                `INSERT INTO lectures (
                  id, subject_id, topic_id, lecture_num, title, duration_minutes, pw_url, is_completed, actual_time_spent_minutes, completed_at, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
                [
                  lectureId,
                  subj.id,
                  topic.id,
                  lec.lecture_num,
                  lec.title,
                  lec.duration_minutes,
                  null,
                  0,
                  0,
                  null,
                  now
                ]
              );
            }
          }

          // Insert DPP records if confirmed for this subject
          if (subj.dpps && subj.dpps.length > 0) {
            for (const d of subj.dpps) {
              const dppId = `dpp_${subj.id}_${d.dpp_num}`;
              await db.runAsync(
                `INSERT INTO dpps (
                  id, subject_id, dpp_num, title, questions_count, attempted, correct, incorrect, is_completed, completed_at, time_spent_minutes, created_at
                ) VALUES (?, ?, ?, ?, ?, 0, 0, 0, 0, null, 0, ?);`,
                [dppId, subj.id, d.dpp_num, d.title, d.questions_count, now]
              );
            }
          }
        }
      }

      // Record migration 1
      await db.runAsync(
        'INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?);',
        [1, now]
      );
    });
  }
}
