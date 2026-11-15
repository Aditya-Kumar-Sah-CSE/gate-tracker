import * as SQLite from 'expo-sqlite';
import { runMigrations, seedDefaultSubjects, ensureSubjectSchema } from './migrations';
import { DEFAULT_GATE_SUBJECTS } from '../constants/gateSyllabus';
import {
  AppSettings,
  Subject,
  DailyGoal,
  DailyProgress,
  PyqAttempt,
  DayActivity,
  MistakeCategory,
  DifficultyLevel,
  DatabaseBackup,
} from '../types';

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('gate_track_90.db');
    await dbInstance.execAsync('PRAGMA foreign_keys = ON;');
    await ensureSubjectSchema(dbInstance);
    await runMigrations(dbInstance);
  }
  return dbInstance;
}

// ----------------------------------------------------
// APP SETTINGS
// ----------------------------------------------------
export async function getAppSettings(): Promise<AppSettings> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<AppSettings>('SELECT * FROM app_settings WHERE id = 1;');
  if (!row) {
    throw new Error('App settings record missing');
  }
  return row;
}

export async function updateAppSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const db = await getDatabase();
  const current = await getAppSettings();
  const updated: AppSettings = {
    ...current,
    ...settings,
    updated_at: new Date().toISOString()
  };

  await db.runAsync(
    `UPDATE app_settings SET
      prep_start_date = ?,
      target_exam_date = ?,
      daily_study_hours_target = ?,
      daily_lecture_target = ?,
      daily_dpp_target = ?,
      daily_pyq_target = ?,
      daily_revision_minutes_target = ?,
      daily_aptitude_target = ?,
      rest_day_preference = ?,
      weak_subject_1 = ?,
      weak_subject_2 = ?,
      critical_accuracy_threshold = ?,
      improvement_accuracy_threshold = ?,
      theme_preference = ?,
      notifications_enabled = ?,
      morning_reminder_time = ?,
      night_reminder_time = ?,
      is_onboarded = ?,
      updated_at = ?
    WHERE id = 1;`,
    [
      updated.prep_start_date,
      updated.target_exam_date,
      updated.daily_study_hours_target,
      updated.daily_lecture_target,
      updated.daily_dpp_target,
      updated.daily_pyq_target,
      updated.daily_revision_minutes_target,
      updated.daily_aptitude_target,
      updated.rest_day_preference,
      updated.weak_subject_1,
      updated.weak_subject_2,
      updated.critical_accuracy_threshold,
      updated.improvement_accuracy_threshold,
      updated.theme_preference,
      updated.notifications_enabled,
      updated.morning_reminder_time,
      updated.night_reminder_time,
      updated.is_onboarded,
      updated.updated_at
    ]
  );

  return updated;
}

// ----------------------------------------------------
// SUBJECTS QUEUE & DIRECT COUNTERS
// ----------------------------------------------------
export async function getSubjectsInQueue(): Promise<Subject[]> {
  const db = await getDatabase();
  let subjects = await db.getAllAsync<Subject>(
    'SELECT * FROM subjects ORDER BY queue_order ASC, rowid ASC;'
  );
  if (!subjects || subjects.length < DEFAULT_GATE_SUBJECTS.length) {
    await seedDefaultSubjects(db, true);
    subjects = await db.getAllAsync<Subject>(
      'SELECT * FROM subjects ORDER BY queue_order ASC, rowid ASC;'
    );
  }

  // Detect duplicate or uninitialized queue_order (e.g. all 1s from migration)
  const uniqueOrders = new Set(subjects.map((s) => s.queue_order));
  if (subjects.length > 1 && uniqueOrders.size < subjects.length) {
    for (let i = 0; i < subjects.length; i++) {
      const correctOrder = i + 1;
      await db.runAsync('UPDATE subjects SET queue_order = ? WHERE id = ?;', [
        correctOrder,
        subjects[i].id,
      ]);
      subjects[i].queue_order = correctOrder;
    }
  }

  return subjects;
}

export async function getActiveSubject(): Promise<Subject | null> {
  const db = await getDatabase();
  // First check if a subject is explicitly marked active or doing
  let active = await db.getFirstAsync<Subject>(
    'SELECT * FROM subjects WHERE is_active = 1 OR status = "doing" OR status = "active" ORDER BY queue_order ASC LIMIT 1;'
  );
  if (!active) {
    // Top of queue is active
    active = await db.getFirstAsync<Subject>(
      'SELECT * FROM subjects ORDER BY queue_order ASC LIMIT 1;'
    );
  }
  if (!active) {
    await seedDefaultSubjects(db, true);
    active = await db.getFirstAsync<Subject>(
      'SELECT * FROM subjects WHERE is_active = 1 OR status = "doing" OR status = "active" ORDER BY queue_order ASC LIMIT 1;'
    );
  }
  return active || null;
}

export async function toggleSubjectStatus(
  subjectId: string,
  newStatus: 'doing' | 'done'
): Promise<Subject> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    const subj = await db.getFirstAsync<Subject>('SELECT * FROM subjects WHERE id = ?;', [subjectId]);
    if (!subj) return;

    if (newStatus === 'done') {
      await db.runAsync(
        'UPDATE subjects SET status = "done", is_active = 0 WHERE id = ?;',
        [subjectId]
      );
    } else {
      // Mark as doing and make this active
      await db.runAsync('UPDATE subjects SET is_active = 0 WHERE is_active = 1;');
      await db.runAsync(
        'UPDATE subjects SET status = "doing", is_active = 1 WHERE id = ?;',
        [subjectId]
      );
    }
  });

  const updated = await db.getFirstAsync<Subject>('SELECT * FROM subjects WHERE id = ?;', [subjectId]);
  return updated!;
}

export async function resetAllSubjectsToDefault(): Promise<Subject[]> {
  const db = await getDatabase();
  await seedDefaultSubjects(db, true);
  for (let i = 0; i < DEFAULT_GATE_SUBJECTS.length; i++) {
    await db.runAsync(
      'UPDATE subjects SET queue_order = ?, is_active = ? WHERE id = ?;',
      [i + 1, i === 0 ? 1 : 0, DEFAULT_GATE_SUBJECTS[i].id]
    );
  }
  return getSubjectsInQueue();
}

export async function setSubjectActive(subjectId: string): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    const subjects = await db.getAllAsync<Subject>(
      'SELECT * FROM subjects ORDER BY queue_order ASC, rowid ASC;'
    );
    const targetIdx = subjects.findIndex((s) => s.id === subjectId);
    if (targetIdx === -1) return;

    // Move target to index 0
    const [target] = subjects.splice(targetIdx, 1);
    subjects.unshift(target);

    // Save normalized queue_order 1..N
    for (let i = 0; i < subjects.length; i++) {
      const order = i + 1;
      const isAct = i === 0 ? 1 : 0;
      await db.runAsync(
        'UPDATE subjects SET queue_order = ?, is_active = ?, status = CASE WHEN ? = 1 AND status != "done" THEN "doing" ELSE status END WHERE id = ?;',
        [order, isAct, isAct, subjects[i].id]
      );
    }
  });
}

export async function moveSubjectQueue(subjectId: string, direction: 'up' | 'down'): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    const subjects = await db.getAllAsync<Subject>(
      'SELECT * FROM subjects ORDER BY queue_order ASC, rowid ASC;'
    );
    const index = subjects.findIndex((s) => s.id === subjectId);
    if (index === -1) return;

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= subjects.length) return;

    // Swap elements in memory
    const temp = subjects[index];
    subjects[index] = subjects[swapIndex];
    subjects[swapIndex] = temp;

    // Persist normalized sequential order 1..N
    for (let i = 0; i < subjects.length; i++) {
      const order = i + 1;
      const isAct = i === 0 ? 1 : 0;
      await db.runAsync(
        'UPDATE subjects SET queue_order = ?, is_active = ? WHERE id = ?;',
        [order, isAct, subjects[i].id]
      );
    }
  });
}

export async function updateSubjectProgress(
  subjectId: string,
  delta: {
    completed_lectures?: number;
    completed_dpps?: number;
    pyqs_attempted?: number;
    pyqs_correct?: number;
  }
): Promise<Subject> {
  const db = await getDatabase();
  const today = new Date().toISOString().slice(0, 10);

  let updatedSubject: Subject | null = null;

  await db.withTransactionAsync(async () => {
    const subj = await db.getFirstAsync<Subject>('SELECT * FROM subjects WHERE id = ?;', [subjectId]);
    if (!subj) throw new Error('Subject not found');

    const newLectures = Math.max(0, subj.completed_lectures + (delta.completed_lectures || 0));
    const newDpps = Math.max(0, subj.completed_dpps + (delta.completed_dpps || 0));
    const newPyqsAttempted = Math.max(0, subj.pyqs_attempted + (delta.pyqs_attempted || 0));
    const newPyqsCorrect = Math.max(0, subj.pyqs_correct + (delta.pyqs_correct || 0));

    const status = newLectures >= subj.total_lectures && subj.total_lectures > 0 ? 'completed' : subj.status;

    await db.runAsync(
      `UPDATE subjects SET
        completed_lectures = ?,
        completed_dpps = ?,
        pyqs_attempted = ?,
        pyqs_correct = ?,
        status = ?
      WHERE id = ?;`,
      [newLectures, newDpps, newPyqsAttempted, newPyqsCorrect, status, subjectId]
    );

    // Also update today's daily_progress
    const prog = await getTodayProgress();
    const dLectures = Math.max(0, prog.lectures_completed + (delta.completed_lectures || 0));
    const dDpps = Math.max(0, prog.dpps_completed + (delta.completed_dpps || 0));
    const dPyqs = Math.max(0, prog.pyqs_attempted + (delta.pyqs_attempted || 0));
    const dCorrect = Math.max(0, prog.pyqs_correct + (delta.pyqs_correct || 0));

    // Calculate target achieved percentage
    const goals = await getTodayGoals();
    const lPct = goals.target_lectures > 0 ? (dLectures / goals.target_lectures) * 100 : 0;
    const dPct = goals.target_dpps > 0 ? (dDpps / goals.target_dpps) * 100 : 0;
    const pPct = goals.target_pyqs > 0 ? (dPyqs / goals.target_pyqs) * 100 : 0;
    const totalAchievedPct = Math.min(100, Math.round((lPct + dPct + pPct) / 3));

    await db.runAsync(
      `UPDATE daily_progress SET
        lectures_completed = ?,
        dpps_completed = ?,
        pyqs_attempted = ?,
        pyqs_correct = ?,
        target_achieved_pct = ?
      WHERE date = ?;`,
      [dLectures, dDpps, dPyqs, dCorrect, totalAchievedPct, today]
    );

    updatedSubject = await db.getFirstAsync<Subject>('SELECT * FROM subjects WHERE id = ?;', [subjectId]);
  });

  return updatedSubject!;
}

export async function updateSubjectDetails(
  subjectId: string,
  data: {
    name?: string;
    total_lectures?: number;
    total_dpps?: number;
    is_lecture_count_estimated?: number;
  }
): Promise<void> {
  const db = await getDatabase();
  const subj = await db.getFirstAsync<Subject>('SELECT * FROM subjects WHERE id = ?;', [subjectId]);
  if (!subj) return;

  const newName = data.name ?? subj.name;
  const newLectures = data.total_lectures ?? subj.total_lectures;
  const newDpps = data.total_dpps ?? subj.total_dpps;
  const newEstimated = data.is_lecture_count_estimated ?? subj.is_lecture_count_estimated;

  await db.runAsync(
    `UPDATE subjects SET
      name = ?,
      total_lectures = ?,
      total_dpps = ?,
      is_lecture_count_estimated = ?
    WHERE id = ?;`,
    [newName, newLectures, newDpps, newEstimated, subjectId]
  );
}

// ----------------------------------------------------
// DAILY GOALS & MORNING KICKOFF
// ----------------------------------------------------
export async function getTodayGoals(): Promise<DailyGoal> {
  const db = await getDatabase();
  const today = getTodayDateString();
  let goal = await db.getFirstAsync<DailyGoal>('SELECT * FROM daily_goals WHERE date = ?;', [today]);

  if (!goal) {
    const settings = await getAppSettings();
    const activeSubj = await getActiveSubject();
    const now = new Date().toISOString();

    try {
      await db.runAsync(
        `INSERT OR IGNORE INTO daily_goals (
          id, date, target_study_minutes, target_lectures, target_dpps, target_pyqs,
          target_revision_minutes, focus_subject_id, is_morning_set, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          'goal_' + today,
          today,
          Math.round(settings.daily_study_hours_target * 60),
          settings.daily_lecture_target,
          settings.daily_dpp_target,
          settings.daily_pyq_target,
          settings.daily_revision_minutes_target,
          activeSubj?.id ?? 'cs_cp',
          0,
          now,
        ]
      );
    } catch {
      await ensureSubjectSchema(db);
      try {
        await db.runAsync(
          `INSERT OR IGNORE INTO daily_goals (
            id, date, target_study_minutes, target_lectures, target_dpps, target_pyqs,
            target_revision_minutes, is_morning_set, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            'goal_' + today,
            today,
            Math.round(settings.daily_study_hours_target * 60),
            settings.daily_lecture_target,
            settings.daily_dpp_target,
            settings.daily_pyq_target,
            settings.daily_revision_minutes_target,
            0,
            now,
          ]
        );
      } catch {}
    }

    goal = await db.getFirstAsync<DailyGoal>('SELECT * FROM daily_goals WHERE date = ?;', [today]);
  }

  return goal!;
}

export async function saveMorningGoals(goals: {
  target_lectures: number;
  target_dpps: number;
  target_pyqs: number;
  target_study_minutes: number;
  focus_subject_id?: string;
}): Promise<DailyGoal> {
  const db = await getDatabase();
  const today = getTodayDateString();
  const now = new Date().toISOString();

  // Validate or fallback focus_subject_id to prevent FK errors
  let targetSubjectId = goals.focus_subject_id;
  const existingSubjects = await getSubjectsInQueue();
  if (targetSubjectId) {
    const exists = existingSubjects.some((s) => s.id === targetSubjectId);
    if (!exists) {
      targetSubjectId = existingSubjects[0]?.id || 'cs_cp';
    }
  } else {
    targetSubjectId = existingSubjects[0]?.id || 'cs_cp';
  }

  try {
    await db.runAsync(
      `INSERT INTO daily_goals (
        id, date, target_study_minutes, target_lectures, target_dpps, target_pyqs,
        target_revision_minutes, focus_subject_id, is_morning_set, morning_set_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        target_study_minutes = excluded.target_study_minutes,
        target_lectures = excluded.target_lectures,
        target_dpps = excluded.target_dpps,
        target_pyqs = excluded.target_pyqs,
        focus_subject_id = excluded.focus_subject_id,
        is_morning_set = 1,
        morning_set_at = excluded.morning_set_at;`,
      [
        'goal_' + today,
        today,
        goals.target_study_minutes,
        goals.target_lectures,
        goals.target_dpps,
        goals.target_pyqs,
        60,
        targetSubjectId,
        1,
        now,
        now,
      ]
    );
  } catch (err) {
    console.warn('saveMorningGoals failed, running schema auto-heal and retrying:', err);
    await ensureSubjectSchema(db);
    try {
      await db.runAsync(
        `INSERT INTO daily_goals (
          id, date, target_study_minutes, target_lectures, target_dpps, target_pyqs,
          target_revision_minutes, focus_subject_id, is_morning_set, morning_set_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(date) DO UPDATE SET
          target_study_minutes = excluded.target_study_minutes,
          target_lectures = excluded.target_lectures,
          target_dpps = excluded.target_dpps,
          target_pyqs = excluded.target_pyqs,
          focus_subject_id = excluded.focus_subject_id,
          is_morning_set = 1,
          morning_set_at = excluded.morning_set_at;`,
        [
          'goal_' + today,
          today,
          goals.target_study_minutes,
          goals.target_lectures,
          goals.target_dpps,
          goals.target_pyqs,
          60,
          targetSubjectId,
          1,
          now,
          now,
        ]
      );
    } catch {
      // Last-ditch fallback: update without focus_subject_id if column failed
      await db.runAsync(
        `INSERT INTO daily_goals (
          id, date, target_study_minutes, target_lectures, target_dpps, target_pyqs,
          target_revision_minutes, is_morning_set, morning_set_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(date) DO UPDATE SET
          target_study_minutes = excluded.target_study_minutes,
          target_lectures = excluded.target_lectures,
          target_dpps = excluded.target_dpps,
          target_pyqs = excluded.target_pyqs,
          is_morning_set = 1,
          morning_set_at = excluded.morning_set_at;`,
        [
          'goal_' + today,
          today,
          goals.target_study_minutes,
          goals.target_lectures,
          goals.target_dpps,
          goals.target_pyqs,
          60,
          1,
          now,
          now,
        ]
      );
    }
  }

  if (targetSubjectId) {
    await setSubjectActive(targetSubjectId);
  }

  return getTodayGoals();
}

// ----------------------------------------------------
// DAILY PROGRESS & 9 PM NIGHT REVIEW
// ----------------------------------------------------
export async function getTodayProgress(): Promise<DailyProgress> {
  const db = await getDatabase();
  const today = getTodayDateString();
  let progress = await db.getFirstAsync<DailyProgress>(
    'SELECT * FROM daily_progress WHERE date = ?;',
    [today]
  );

  if (!progress) {
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT OR IGNORE INTO daily_progress (
        id, date, total_study_seconds, lectures_completed, dpps_completed,
        pyqs_attempted, pyqs_correct, night_review_done, target_achieved_pct, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      ['prog_' + today, today, 0, 0, 0, 0, 0, 0, 0.0, now]
    );

    progress = await db.getFirstAsync<DailyProgress>(
      'SELECT * FROM daily_progress WHERE date = ?;',
      [today]
    );
  }

  return progress!;
}

export async function updateTodayProgressItem(
  item: 'lecture' | 'dpp' | 'pyq' | 'hours',
  delta: number,
  subjectId?: string
): Promise<{ progress: DailyProgress; subject: Subject | null }> {
  const db = await getDatabase();
  const today = getTodayDateString();

  await getTodayProgress();

  let targetSubjectId = subjectId;
  if (!targetSubjectId) {
    const active = await getActiveSubject();
    targetSubjectId = active?.id;
  }

  let updatedProg: DailyProgress | null = null;
  let updatedSubj: Subject | null = null;

  await db.withTransactionAsync(async () => {
    const prog = await getTodayProgress();
    let newLec = prog.lectures_completed;
    let newDpp = prog.dpps_completed;
    let newPyq = prog.pyqs_attempted;
    let newCorrect = prog.pyqs_correct;
    let newSec = prog.total_study_seconds;

    if (item === 'lecture') {
      newLec = Math.max(0, prog.lectures_completed + delta);
    } else if (item === 'dpp') {
      newDpp = Math.max(0, prog.dpps_completed + delta);
    } else if (item === 'pyq') {
      newPyq = Math.max(0, prog.pyqs_attempted + delta);
      newCorrect = Math.max(0, prog.pyqs_correct + delta);
    } else if (item === 'hours') {
      newSec = Math.max(0, prog.total_study_seconds + Math.round(delta * 3600));
    }

    const goals = await getTodayGoals();
    const lPct = goals.target_lectures > 0 ? (newLec / goals.target_lectures) * 100 : 0;
    const dPct = goals.target_dpps > 0 ? (newDpp / goals.target_dpps) * 100 : 0;
    const pPct = goals.target_pyqs > 0 ? (newPyq / goals.target_pyqs) * 100 : 0;
    const totalAchievedPct = Math.min(100, Math.round((lPct + dPct + pPct) / 3));

    await db.runAsync(
      `UPDATE daily_progress SET
        total_study_seconds = ?,
        lectures_completed = ?,
        dpps_completed = ?,
        pyqs_attempted = ?,
        pyqs_correct = ?,
        target_achieved_pct = ?
      WHERE date = ?;`,
      [newSec, newLec, newDpp, newPyq, newCorrect, totalAchievedPct, today]
    );

    if (targetSubjectId && (item === 'lecture' || item === 'dpp' || item === 'pyq')) {
      const subj = await db.getFirstAsync<Subject>('SELECT * FROM subjects WHERE id = ?;', [targetSubjectId]);
      if (subj) {
        let sLec = subj.completed_lectures;
        let sDpp = subj.completed_dpps;
        let sPyq = subj.pyqs_attempted;
        let sCorr = subj.pyqs_correct;

        if (item === 'lecture') sLec = Math.max(0, subj.completed_lectures + delta);
        if (item === 'dpp') sDpp = Math.max(0, subj.completed_dpps + delta);
        if (item === 'pyq') {
          sPyq = Math.max(0, subj.pyqs_attempted + delta);
          sCorr = Math.max(0, subj.pyqs_correct + delta);
        }

        const status = sLec >= subj.total_lectures && subj.total_lectures > 0 ? 'completed' : subj.status;

        await db.runAsync(
          `UPDATE subjects SET
            completed_lectures = ?,
            completed_dpps = ?,
            pyqs_attempted = ?,
            pyqs_correct = ?,
            status = ?
          WHERE id = ?;`,
          [sLec, sDpp, sPyq, sCorr, status, targetSubjectId]
        );
        updatedSubj = await db.getFirstAsync<Subject>('SELECT * FROM subjects WHERE id = ?;', [targetSubjectId]);
      }
    }

    updatedProg = await db.getFirstAsync<DailyProgress>('SELECT * FROM daily_progress WHERE date = ?;', [today]);
  });

  return { progress: updatedProg!, subject: updatedSubj };
}

export async function saveNightReview(review: {
  lectures_completed: number;
  dpps_completed: number;
  pyqs_attempted: number;
  pyqs_correct: number;
  study_hours: number;
  reflection_notes?: string;
  subject_id?: string;
}): Promise<DailyProgress> {
  const db = await getDatabase();
  const today = getTodayDateString();
  const now = new Date().toISOString();

  const totalStudySeconds = Math.round(review.study_hours * 3600);

  const goals = await getTodayGoals();
  const lPct = goals.target_lectures > 0 ? (review.lectures_completed / goals.target_lectures) * 100 : 0;
  const dPct = goals.target_dpps > 0 ? (review.dpps_completed / goals.target_dpps) * 100 : 0;
  const pPct = goals.target_pyqs > 0 ? (review.pyqs_attempted / goals.target_pyqs) * 100 : 0;
  const targetAchievedPct = Math.min(100, Math.round((lPct + dPct + pPct) / 3));

  await db.withTransactionAsync(async () => {
    // Check current progress to accurately compute deltas and avoid double-counting
    const currentProg = await getTodayProgress();
    const deltaLectures = Math.max(0, review.lectures_completed - currentProg.lectures_completed);
    const deltaDpps = Math.max(0, review.dpps_completed - currentProg.dpps_completed);
    const deltaPyqs = Math.max(0, review.pyqs_attempted - currentProg.pyqs_attempted);
    const deltaCorrect = Math.max(0, review.pyqs_correct - currentProg.pyqs_correct);

    await db.runAsync(
      `INSERT INTO daily_progress (
        id, date, total_study_seconds, lectures_completed, dpps_completed,
        pyqs_attempted, pyqs_correct, night_review_done, night_review_at,
        reflection_notes, target_achieved_pct, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        total_study_seconds = excluded.total_study_seconds,
        lectures_completed = excluded.lectures_completed,
        dpps_completed = excluded.dpps_completed,
        pyqs_attempted = excluded.pyqs_attempted,
        pyqs_correct = excluded.pyqs_correct,
        night_review_done = 1,
        night_review_at = excluded.night_review_at,
        reflection_notes = excluded.reflection_notes,
        target_achieved_pct = excluded.target_achieved_pct;`,
      [
        'prog_' + today,
        today,
        totalStudySeconds,
        review.lectures_completed,
        review.dpps_completed,
        review.pyqs_attempted,
        review.pyqs_correct,
        1,
        now,
        review.reflection_notes || null,
        targetAchievedPct,
        now,
      ]
    );

    // If subject was designated, increment subject counters ONLY by the delta not yet counted
    if (review.subject_id && (deltaLectures > 0 || deltaDpps > 0 || deltaPyqs > 0 || deltaCorrect > 0)) {
      const subj = await db.getFirstAsync<Subject>('SELECT * FROM subjects WHERE id = ?;', [review.subject_id]);
      if (subj) {
        const newLectures = Math.max(0, subj.completed_lectures + deltaLectures);
        const newDpps = Math.max(0, subj.completed_dpps + deltaDpps);
        const newPyqsAttempted = Math.max(0, subj.pyqs_attempted + deltaPyqs);
        const newPyqsCorrect = Math.max(0, subj.pyqs_correct + deltaCorrect);
        const status = newLectures >= subj.total_lectures && subj.total_lectures > 0 ? 'completed' : subj.status;

        await db.runAsync(
          `UPDATE subjects SET
            completed_lectures = ?,
            completed_dpps = ?,
            pyqs_attempted = ?,
            pyqs_correct = ?,
            status = ?
          WHERE id = ?;`,
          [newLectures, newDpps, newPyqsAttempted, newPyqsCorrect, status, review.subject_id]
        );
      }
    }
  });

  return getTodayProgress();
}

export async function addStudySeconds(seconds: number, subjectId?: string): Promise<void> {
  const db = await getDatabase();
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO daily_progress (
      id, date, total_study_seconds, lectures_completed, dpps_completed,
      pyqs_attempted, pyqs_correct, night_review_done, target_achieved_pct, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET
      total_study_seconds = total_study_seconds + ?;`,
    ['prog_' + today, today, seconds, 0, 0, 0, 0, 0, 0.0, now, seconds]
  );

  if (subjectId) {
    await db.runAsync(
      `INSERT INTO study_sessions (
        id, date, subject_id, duration_seconds, started_at, ended_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        'sess_' + Date.now(),
        today,
        subjectId,
        seconds,
        now,
        now,
        now,
      ]
    );
  }
}

// ----------------------------------------------------
// PYQ LOGGING
// ----------------------------------------------------
export async function logPyqAttempt(attempt: {
  subject_id: string;
  gate_year: number;
  question_number: number;
  marks?: number;
  difficulty?: DifficultyLevel;
  is_correct: boolean;
  time_taken_seconds?: number;
  mistake_category?: MistakeCategory;
  notes?: string;
}): Promise<PyqAttempt> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const id = 'pyq_' + Date.now();

  const record: PyqAttempt = {
    id,
    subject_id: attempt.subject_id,
    gate_year: attempt.gate_year,
    question_number: attempt.question_number,
    marks: attempt.marks || 1,
    difficulty: attempt.difficulty || 'Medium',
    is_correct: attempt.is_correct ? 1 : 0,
    time_taken_seconds: attempt.time_taken_seconds || 120,
    mistake_category: attempt.mistake_category || null,
    notes: attempt.notes || null,
    attempted_at: now,
    created_at: now,
  };

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO pyq_attempts (
        id, gate_year, subject_id, question_number, marks, difficulty,
        is_correct, time_taken_seconds, mistake_category, notes, attempted_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        record.id,
        record.gate_year,
        record.subject_id,
        record.question_number,
        record.marks,
        record.difficulty,
        record.is_correct,
        record.time_taken_seconds,
        record.mistake_category ?? null,
        record.notes ?? null,
        record.attempted_at,
        record.created_at,
      ]
    );

    // Update subject counters
    await updateSubjectProgress(attempt.subject_id, {
      pyqs_attempted: 1,
      pyqs_correct: attempt.is_correct ? 1 : 0,
    });

    // If mistake, log to mistake_logs
    if (!attempt.is_correct && attempt.mistake_category) {
      await db.runAsync(
        `INSERT INTO mistake_logs (
          id, pyq_attempt_id, subject_id, mistake_category, explanation, is_resolved, created_at
        ) VALUES (?, ?, ?, ?, ?, 0, ?);`,
        [
          'mistake_' + Date.now(),
          record.id,
          attempt.subject_id,
          attempt.mistake_category,
          attempt.notes || 'Recorded mistake during practice',
          now,
        ]
      );
    }
  });

  return record;
}

export async function getPyqAttempts(limit = 50): Promise<PyqAttempt[]> {
  const db = await getDatabase();
  return db.getAllAsync<PyqAttempt>(
    'SELECT * FROM pyq_attempts ORDER BY attempted_at DESC LIMIT ?;',
    [limit]
  );
}

// ----------------------------------------------------
// ANALYTICS & STREAK
// ----------------------------------------------------
export async function calculateStreak(): Promise<number> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ date: string }>(
    `SELECT date FROM daily_progress
     WHERE total_study_seconds > 0 OR lectures_completed > 0 OR dpps_completed > 0 OR pyqs_attempted > 0
     ORDER BY date DESC;`
  );

  if (rows.length === 0) return 0;

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const dates = rows.map((r) => r.date);
  const firstDate = dates[0];

  // If didn't study today or yesterday, streak is 0
  if (firstDate !== today && firstDate !== yesterday) {
    return 0;
  }

  let streak = 0;
  let checkDate = new Date(firstDate);

  for (const d of dates) {
    const expected = checkDate.toISOString().slice(0, 10);
    if (d === expected) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (d < expected) {
      break;
    }
  }

  return streak;
}

export async function getWeeklyActivity(days = 7): Promise<DayActivity[]> {
  const db = await getDatabase();
  const settings = await getAppSettings();
  const targetHours = settings.daily_study_hours_target;

  const result: DayActivity[] = [];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().slice(0, 10);
    const dayLabel = daysOfWeek[d.getDay()];

    const prog = await db.getFirstAsync<DailyProgress>(
      'SELECT * FROM daily_progress WHERE date = ?;',
      [dateStr]
    );

    const studyHours = prog ? Math.round((prog.total_study_seconds / 3600) * 10) / 10 : 0;
    const lectures = prog?.lectures_completed || 0;
    const dpps = prog?.dpps_completed || 0;
    const pyqs = prog?.pyqs_attempted || 0;
    const achievedPct = prog?.target_achieved_pct || 0;

    result.push({
      date: dateStr,
      dayLabel,
      studyHours,
      targetHours,
      lectures,
      dpps,
      pyqs,
      achievedPct,
    });
  }

  return result;
}

export async function getOverallStats() {
  const subjects = await getSubjectsInQueue();

  let totalLectures = 0;
  let completedLectures = 0;
  let totalDpps = 0;
  let completedDpps = 0;
  let totalPyqs = 0;
  let correctPyqs = 0;

  for (const s of subjects) {
    totalLectures += s.total_lectures;
    completedLectures += s.completed_lectures;
    totalDpps += s.total_dpps;
    completedDpps += s.completed_dpps;
    totalPyqs += s.pyqs_attempted;
    correctPyqs += s.pyqs_correct;
  }

  const streak = await calculateStreak();
  const settings = await getAppSettings();

  // Days left to GATE 2027
  const examDate = new Date(settings.target_exam_date).getTime();
  const todayTime = new Date().setHours(0, 0, 0, 0);
  const daysLeft = Math.max(0, Math.ceil((examDate - todayTime) / 86400000));

  // Day X / 90
  const prepStart = new Date(settings.prep_start_date).getTime();
  const dayNumber = Math.min(90, Math.max(1, Math.floor((todayTime - prepStart) / 86400000) + 1));

  const pyqAccuracy = totalPyqs > 0 ? Math.round((correctPyqs / totalPyqs) * 100) : 0;
  const lecturePct = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;
  const dppPct = totalDpps > 0 ? Math.round((completedDpps / totalDpps) * 100) : 0;

  return {
    totalLectures,
    completedLectures,
    lecturePct,
    totalDpps,
    completedDpps,
    dppPct,
    totalPyqs,
    correctPyqs,
    pyqAccuracy,
    streak,
    daysLeft,
    dayNumber,
  };
}

export async function logStudySession(session: {
  date: string;
  subject_id: string;
  duration_seconds: number;
  started_at: string;
  ended_at: string;
  task_category?: string;
  topic_id?: string | null;
}): Promise<void> {
  const db = await getDatabase();
  const id = 'sess_' + Date.now();
  await db.runAsync(
    `INSERT INTO study_sessions (
      id, date, subject_id, duration_seconds, started_at, ended_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      session.date,
      session.subject_id,
      session.duration_seconds,
      session.started_at,
      session.ended_at,
      new Date().toISOString(),
    ]
  );
  await addStudySeconds(session.duration_seconds, session.subject_id);
}

export async function exportDatabaseToJson(): Promise<string> {
  const db = await getDatabase();
  const settings = await getAppSettings();
  const subjects = await getSubjectsInQueue();
  const daily_goals = await db.getAllAsync<DailyGoal>('SELECT * FROM daily_goals;');
  const daily_progress = await db.getAllAsync<DailyProgress>('SELECT * FROM daily_progress;');
  const pyq_attempts = await db.getAllAsync<PyqAttempt>('SELECT * FROM pyq_attempts;');

  const backup: DatabaseBackup = {
    version: 2,
    exported_at: new Date().toISOString(),
    app_settings: settings,
    subjects,
    daily_goals,
    daily_progress,
    pyq_attempts,
  };

  return JSON.stringify(backup, null, 2);
}

export async function importDatabaseFromJson(input: string | DatabaseBackup): Promise<void> {
  const backup: DatabaseBackup = typeof input === 'string' ? JSON.parse(input) : input;
  const db = await getDatabase();

  await db.withTransactionAsync(async () => {
    if (backup.app_settings) {
      await updateAppSettings(backup.app_settings);
    }
    if (Array.isArray(backup.subjects)) {
      for (const s of backup.subjects) {
        await db.runAsync(
          `INSERT OR REPLACE INTO subjects (
            id, code, name, icon, color, gradient_start, gradient_end,
            queue_order, total_lectures, completed_lectures, is_lecture_count_estimated,
            total_dpps, completed_dpps, pyqs_attempted, pyqs_correct, pyqs_target,
            is_active, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [
            s.id,
            s.code,
            s.name,
            s.icon,
            s.color,
            s.gradient_start,
            s.gradient_end,
            s.queue_order,
            s.total_lectures,
            s.completed_lectures,
            s.is_lecture_count_estimated,
            s.total_dpps,
            s.completed_dpps,
            s.pyqs_attempted,
            s.pyqs_correct,
            s.pyqs_target,
            s.is_active,
            s.status,
            s.created_at || new Date().toISOString(),
          ]
        );
      }
    }
  });
}

