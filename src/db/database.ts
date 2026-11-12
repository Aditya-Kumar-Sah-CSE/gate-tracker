import * as SQLite from 'expo-sqlite';
import { runMigrations } from './migrations';
import {
  AppSettings,
  Subject,
  Topic,
  Lecture,
  DPP,
  DailyGoal,
  DailyTask,
  RevisionSchedule,
  RevisionHistoryItem,
  PyqAttempt,
  MistakeLog,
  StudySession,
  DailyProgress,
  WeakTopicAnalysis,
  SubjectProgressSummary,
  RevisionStage,
  MistakeCategory,
  DifficultyLevel,
  TaskCategory
} from '../types';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('gate_track_90.db');
    await dbInstance.execAsync('PRAGMA foreign_keys = ON;');
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
      revision_reminder_time = ?,
      target_reminder_time = ?,
      evening_reminder_time = ?,
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
      updated.revision_reminder_time,
      updated.target_reminder_time,
      updated.evening_reminder_time,
      updated.is_onboarded,
      updated.updated_at
    ]
  );

  return updated;
}

// ----------------------------------------------------
// SUBJECTS, TOPICS & LECTURES
// ----------------------------------------------------
export async function getAllSubjects(): Promise<Subject[]> {
  const db = await getDatabase();
  return await db.getAllAsync<Subject>('SELECT * FROM subjects ORDER BY default_order ASC;');
}

export async function updateSubjectCounts(
  subjectId: string,
  totalLectures: number,
  isLectureCountEstimated: boolean,
  totalDpps: number | null
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE subjects SET
      total_lectures = ?,
      is_lecture_count_estimated = ?,
      total_dpps = ?
    WHERE id = ?;`,
    [totalLectures, isLectureCountEstimated ? 1 : 0, totalDpps, subjectId]
  );
}

export async function getTopicsForSubject(subjectId: string): Promise<Topic[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    subject_id: string;
    name: string;
    subtopics_json: string;
    lecture_count: number;
    pyq_count: number;
    is_completed: number;
    completed_at: string | null;
    difficulty_level: DifficultyLevel;
    created_at: string;
  }>('SELECT * FROM topics WHERE subject_id = ? ORDER BY created_at ASC;', [subjectId]);

  return rows.map((r) => ({
    id: r.id,
    subject_id: r.subject_id,
    name: r.name,
    subtopics: JSON.parse(r.subtopics_json || '[]'),
    lecture_count: r.lecture_count,
    pyq_count: r.pyq_count,
    is_completed: r.is_completed,
    completed_at: r.completed_at,
    difficulty_level: r.difficulty_level,
    created_at: r.created_at
  }));
}

export async function getAllTopics(): Promise<Topic[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    subject_id: string;
    name: string;
    subtopics_json: string;
    lecture_count: number;
    pyq_count: number;
    is_completed: number;
    completed_at: string | null;
    difficulty_level: DifficultyLevel;
    created_at: string;
  }>('SELECT * FROM topics ORDER BY subject_id ASC, created_at ASC;');

  return rows.map((r) => ({
    id: r.id,
    subject_id: r.subject_id,
    name: r.name,
    subtopics: JSON.parse(r.subtopics_json || '[]'),
    lecture_count: r.lecture_count,
    pyq_count: r.pyq_count,
    is_completed: r.is_completed,
    completed_at: r.completed_at,
    difficulty_level: r.difficulty_level,
    created_at: r.created_at
  }));
}

export async function addCustomTopic(
  subjectId: string,
  name: string,
  subtopics: string[],
  lectureCount: number,
  difficulty: DifficultyLevel
): Promise<Topic> {
  const db = await getDatabase();
  const topicId = `custom_topic_${Date.now()}`;
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO topics (
      id, subject_id, name, subtopics_json, lecture_count, pyq_count, is_completed, completed_at, difficulty_level, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [topicId, subjectId, name, JSON.stringify(subtopics), lectureCount, 0, 0, null, difficulty, now]
  );

  for (let i = 1; i <= lectureCount; i++) {
    const lectureId = `${topicId}_lec_${i}`;
    await db.runAsync(
      `INSERT INTO lectures (
        id, subject_id, topic_id, lecture_num, title, duration_minutes, pw_url, is_completed, actual_time_spent_minutes, completed_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [lectureId, subjectId, topicId, i, `${name} - Part ${i}`, 90, null, 0, 0, null, now]
    );
  }

  return {
    id: topicId,
    subject_id: subjectId,
    name,
    subtopics,
    lecture_count: lectureCount,
    pyq_count: 0,
    is_completed: 0,
    completed_at: null,
    difficulty_level: difficulty,
    created_at: now
  };
}

export async function getLecturesForTopic(topicId: string): Promise<Lecture[]> {
  const db = await getDatabase();
  return await db.getAllAsync<Lecture>(
    'SELECT * FROM lectures WHERE topic_id = ? ORDER BY lecture_num ASC;',
    [topicId]
  );
}

export async function getLecturesForSubject(subjectId: string): Promise<Lecture[]> {
  const db = await getDatabase();
  return await db.getAllAsync<Lecture>(
    'SELECT * FROM lectures WHERE subject_id = ? ORDER BY lecture_num ASC;',
    [subjectId]
  );
}

export async function updateLecture(
  lectureId: string,
  updates: {
    title?: string;
    duration_minutes?: number;
    pw_url?: string | null;
    is_completed?: number;
    actual_time_spent_minutes?: number;
  }
): Promise<void> {
  const db = await getDatabase();
  const current = await db.getFirstAsync<Lecture>('SELECT * FROM lectures WHERE id = ?;', [lectureId]);
  if (!current) return;

  const isCompleted = updates.is_completed !== undefined ? updates.is_completed : current.is_completed;
  const now = new Date().toISOString();
  const completedAt = isCompleted ? (current.completed_at || now) : null;

  await db.runAsync(
    `UPDATE lectures SET
      title = COALESCE(?, title),
      duration_minutes = COALESCE(?, duration_minutes),
      pw_url = ?,
      is_completed = ?,
      actual_time_spent_minutes = COALESCE(?, actual_time_spent_minutes),
      completed_at = ?
    WHERE id = ?;`,
    [
      updates.title ?? null,
      updates.duration_minutes ?? null,
      updates.pw_url !== undefined ? updates.pw_url : current.pw_url,
      isCompleted,
      updates.actual_time_spent_minutes ?? null,
      completedAt,
      lectureId
    ]
  );

  // Update daily progress
  if (isCompleted && current.is_completed === 0) {
    const today = now.slice(0, 10);
    await incrementDailyProgress(today, {
      lectures_completed: 1,
      total_study_seconds: (updates.actual_time_spent_minutes || current.duration_minutes) * 60
    });
  }

  // If topic exists, check if all lectures in topic completed
  if (current.topic_id) {
    const remainingInTopic = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM lectures WHERE topic_id = ? AND is_completed = 0;',
      [current.topic_id]
    );

    if (remainingInTopic && remainingInTopic.count === 0) {
      await markTopicCompleted(current.topic_id, true);
    }
  }
}

export async function markTopicCompleted(topicId: string, isCompleted: boolean): Promise<void> {
  const db = await getDatabase();
  const topic = await db.getFirstAsync<{ id: string; subject_id: string; is_completed: number }>(
    'SELECT id, subject_id, is_completed FROM topics WHERE id = ?;',
    [topicId]
  );
  if (!topic) return;

  const now = new Date().toISOString();
  const completedVal = isCompleted ? 1 : 0;
  const completedAt = isCompleted ? now : null;

  await db.runAsync(
    'UPDATE topics SET is_completed = ?, completed_at = ? WHERE id = ?;',
    [completedVal, completedAt, topicId]
  );

  if (isCompleted && topic.is_completed === 0) {
    await createSpacedRevisionSchedule(topic.subject_id, topicId);
  }
}

// ----------------------------------------------------
// DPP TRACKER (Physics Wallah Daily Practice Problems)
// ----------------------------------------------------
export async function getDppsForSubject(subjectId: string): Promise<DPP[]> {
  const db = await getDatabase();
  return await db.getAllAsync<DPP>(
    'SELECT * FROM dpps WHERE subject_id = ? ORDER BY dpp_num ASC;',
    [subjectId]
  );
}

export async function getAllDpps(): Promise<(DPP & { subject_name: string; subject_color: string })[]> {
  const db = await getDatabase();
  return await db.getAllAsync<DPP & { subject_name: string; subject_color: string }>(
    `SELECT d.*, s.name as subject_name, s.color as subject_color
     FROM dpps d
     JOIN subjects s ON d.subject_id = s.id
     ORDER BY s.default_order ASC, d.dpp_num ASC;`
  );
}

export async function addDpp(
  subjectId: string,
  dppNum: number,
  title: string,
  questionsCount: number
): Promise<DPP> {
  const db = await getDatabase();
  const id = `dpp_${subjectId}_${dppNum}_${Date.now()}`;
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO dpps (
      id, subject_id, dpp_num, title, questions_count, attempted, correct, incorrect, is_completed, completed_at, time_spent_minutes, created_at
    ) VALUES (?, ?, ?, ?, ?, 0, 0, 0, 0, null, 0, ?);`,
    [id, subjectId, dppNum, title, questionsCount, now]
  );

  return {
    id,
    subject_id: subjectId,
    dpp_num: dppNum,
    title,
    questions_count: questionsCount,
    attempted: 0,
    correct: 0,
    incorrect: 0,
    is_completed: 0,
    completed_at: null,
    time_spent_minutes: 0,
    created_at: now
  };
}

export async function updateDppAttempt(
  dppId: string,
  data: {
    attempted: number;
    correct: number;
    incorrect: number;
    time_spent_minutes: number;
    is_completed: boolean;
  }
): Promise<void> {
  const db = await getDatabase();
  const current = await db.getFirstAsync<DPP>('SELECT * FROM dpps WHERE id = ?;', [dppId]);
  if (!current) return;

  const now = new Date().toISOString();
  const isCompletedInt = data.is_completed ? 1 : 0;
  const completedAt = data.is_completed ? (current.completed_at || now) : null;

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE dpps SET
        attempted = ?,
        correct = ?,
        incorrect = ?,
        time_spent_minutes = ?,
        is_completed = ?,
        completed_at = ?
      WHERE id = ?;`,
      [
        data.attempted,
        data.correct,
        data.incorrect,
        data.time_spent_minutes,
        isCompletedInt,
        completedAt,
        dppId
      ]
    );

    // If marked completed, increment daily progress
    if (data.is_completed && current.is_completed === 0) {
      const today = now.slice(0, 10);
      await incrementDailyProgress(today, {
        dpps_completed: 1,
        total_study_seconds: data.time_spent_minutes * 60
      });
    }
  });
}

// ----------------------------------------------------
// SMART SPACED REVISION (R1 to R5)
// ----------------------------------------------------
export async function createSpacedRevisionSchedule(subjectId: string, topicId: string): Promise<void> {
  const db = await getDatabase();
  const intervals: { stage: RevisionStage; days: number }[] = [
    { stage: 'R1', days: 1 },
    { stage: 'R2', days: 3 },
    { stage: 'R3', days: 7 },
    { stage: 'R4', days: 15 },
    { stage: 'R5', days: 30 }
  ];

  const now = new Date();
  const nowIso = now.toISOString();

  for (const item of intervals) {
    const targetDate = new Date(now.getTime() + item.days * 24 * 60 * 60 * 1000);
    const dateStr = targetDate.toISOString().slice(0, 10);
    const scheduleId = `rev_${topicId}_${item.stage}`;

    await db.runAsync(
      `INSERT OR IGNORE INTO revision_schedules (
        id, subject_id, topic_id, interval_stage, scheduled_date, status, completed_at, skip_reason, time_spent_minutes, created_at
      ) VALUES (?, ?, ?, ?, ?, 'pending', null, null, 0, ?);`,
      [scheduleId, subjectId, topicId, item.stage, dateStr, nowIso]
    );
  }
}

export async function getRevisionItems(filter: 'due_today' | 'upcoming' | 'overdue' | 'all'): Promise<
  (RevisionSchedule & { topic_name: string; subject_name: string; subject_color: string })[]
> {
  const db = await getDatabase();
  const today = new Date().toISOString().slice(0, 10);

  let query = `
    SELECT r.*, t.name as topic_name, s.name as subject_name, s.color as subject_color
    FROM revision_schedules r
    JOIN topics t ON r.topic_id = t.id
    JOIN subjects s ON r.subject_id = s.id
  `;

  if (filter === 'due_today') {
    query += ` WHERE r.scheduled_date = '${today}' AND r.status = 'pending' ORDER BY r.created_at ASC;`;
  } else if (filter === 'overdue') {
    query += ` WHERE r.scheduled_date < '${today}' AND r.status = 'pending' ORDER BY r.scheduled_date ASC;`;
  } else if (filter === 'upcoming') {
    query += ` WHERE r.scheduled_date > '${today}' AND r.status = 'pending' ORDER BY r.scheduled_date ASC;`;
  } else {
    query += ` ORDER BY r.scheduled_date ASC;`;
  }

  return await db.getAllAsync<RevisionSchedule & { topic_name: string; subject_name: string; subject_color: string }>(query);
}

export async function completeRevisionSchedule(
  scheduleId: string,
  timeSpentMinutes: number,
  notes?: string
): Promise<void> {
  const db = await getDatabase();
  const schedule = await db.getFirstAsync<RevisionSchedule>(
    'SELECT * FROM revision_schedules WHERE id = ?;',
    [scheduleId]
  );
  if (!schedule) return;

  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE revision_schedules SET
        status = 'completed',
        completed_at = ?,
        time_spent_minutes = ?
      WHERE id = ?;`,
      [now, timeSpentMinutes, scheduleId]
    );

    const historyId = `revhist_${Date.now()}`;
    await db.runAsync(
      `INSERT INTO revision_history (
        id, schedule_id, subject_id, topic_id, interval_stage, scheduled_date, completed_at, time_spent_minutes, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        historyId,
        scheduleId,
        schedule.subject_id,
        schedule.topic_id,
        schedule.interval_stage,
        schedule.scheduled_date,
        now,
        timeSpentMinutes,
        notes || null,
        now
      ]
    );

    const today = now.slice(0, 10);
    await incrementDailyProgress(today, {
      revisions_completed: 1,
      revision_minutes: timeSpentMinutes,
      total_study_seconds: timeSpentMinutes * 60
    });
  });
}

export async function rescheduleRevision(scheduleId: string, newDate: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE revision_schedules SET
      scheduled_date = ?,
      status = 'pending'
    WHERE id = ?;`,
    [newDate, scheduleId]
  );
}

export async function skipRevision(scheduleId: string, reason: string): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `UPDATE revision_schedules SET
      status = 'skipped',
      skip_reason = ?,
      completed_at = ?
    WHERE id = ?;`,
    [reason, now, scheduleId]
  );
}

// ----------------------------------------------------
// SMART DAILY PLANNER (5 Lectures + 2-3 DPP + 20 PYQs + Revision)
// ----------------------------------------------------
export async function getDailyTasks(dateStr: string): Promise<
  (DailyTask & { subject_name?: string; subject_color?: string; topic_name?: string })[]
> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DailyTask & { subject_name?: string; subject_color?: string; topic_name?: string }>(
    `SELECT d.*, s.name as subject_name, s.color as subject_color, t.name as topic_name
     FROM daily_tasks d
     LEFT JOIN subjects s ON d.subject_id = s.id
     LEFT JOIN topics t ON d.topic_id = t.id
     WHERE d.date = ?
     ORDER BY d.order_index ASC, d.created_at ASC;`,
    [dateStr]
  );

  // If no tasks exist for this date, automatically synthesize the smart plan!
  if (rows.length === 0) {
    return await generateSmartDailyPlan(dateStr);
  }

  return rows;
}

export async function generateSmartDailyPlan(dateStr: string): Promise<
  (DailyTask & { subject_name?: string; subject_color?: string; topic_name?: string })[]
> {
  const db = await getDatabase();
  const settings = await getAppSettings();

  // Find next incomplete lectures across active subjects following default_order
  const nextLectures = await db.getAllAsync<{
    id: string;
    subject_id: string;
    topic_id: string | null;
    lecture_num: number;
    title: string;
    subject_name: string;
    subject_color: string;
  }>(`
    SELECT l.id, l.subject_id, l.topic_id, l.lecture_num, l.title, s.name as subject_name, s.color as subject_color
    FROM lectures l
    JOIN subjects s ON l.subject_id = s.id
    WHERE l.is_completed = 0
    ORDER BY s.default_order ASC, l.lecture_num ASC
    LIMIT ?;
  `, [settings.daily_lecture_target]);

  const tasksToCreate: (DailyTask & { subject_name?: string; subject_color?: string; topic_name?: string })[] = [];
  const now = new Date().toISOString();
  let orderIndex = 1;

  await db.withTransactionAsync(async () => {
    // 1. Add 5 Daily Lectures
    for (const lec of nextLectures) {
      const taskId = `task_${dateStr}_lec_${lec.id}`;
      await db.runAsync(
        `INSERT OR IGNORE INTO daily_tasks (
          id, date, category, subject_id, topic_id, lecture_id, dpp_id, title, target_count, completed_count, is_completed, completed_at, notes, order_index, created_at
        ) VALUES (?, ?, 'lecture', ?, ?, ?, null, ?, 1, 0, 0, null, null, ?, ?);`,
        [taskId, dateStr, lec.subject_id, lec.topic_id, lec.id, `Lecture ${lec.lecture_num}: ${lec.title}`, orderIndex, now]
      );

      tasksToCreate.push({
        id: taskId,
        date: dateStr,
        category: 'lecture',
        subject_id: lec.subject_id,
        topic_id: lec.topic_id,
        lecture_id: lec.id,
        dpp_id: null,
        title: `Lecture ${lec.lecture_num}: ${lec.title}`,
        target_count: 1,
        completed_count: 0,
        is_completed: 0,
        completed_at: null,
        notes: null,
        order_index: orderIndex++,
        created_at: now,
        subject_name: lec.subject_name,
        subject_color: lec.subject_color
      });
    }

    // 2. Add DPP Task (Target: 2-3 DPPs)
    // Find next incomplete DPP if available
    const nextDpp = await db.getFirstAsync<{ id: string; subject_id: string; title: string; dpp_num: number; subject_name: string; subject_color: string }>(
      `SELECT d.id, d.subject_id, d.title, d.dpp_num, s.name as subject_name, s.color as subject_color
       FROM dpps d
       JOIN subjects s ON d.subject_id = s.id
       WHERE d.is_completed = 0
       ORDER BY s.default_order ASC, d.dpp_num ASC
       LIMIT 1;`
    );

    const dppSubjId = nextDpp?.subject_id || nextLectures[0]?.subject_id || 'ga';
    const dppTaskId = `task_${dateStr}_dpp_${Date.now()}`;
    const dppTitle = nextDpp ? `Complete ${nextDpp.title}` : `Solve PW DPP (${settings.daily_dpp_target} sheets)`;

    await db.runAsync(
      `INSERT OR IGNORE INTO daily_tasks (
        id, date, category, subject_id, topic_id, lecture_id, dpp_id, title, target_count, completed_count, is_completed, completed_at, notes, order_index, created_at
      ) VALUES (?, ?, 'dpp', ?, null, null, ?, ?, ?, 0, 0, null, null, ?, ?);`,
      [dppTaskId, dateStr, dppSubjId, nextDpp?.id || null, dppTitle, settings.daily_dpp_target, orderIndex, now]
    );

    tasksToCreate.push({
      id: dppTaskId,
      date: dateStr,
      category: 'dpp',
      subject_id: dppSubjId,
      topic_id: null,
      lecture_id: null,
      dpp_id: nextDpp?.id || null,
      title: dppTitle,
      target_count: settings.daily_dpp_target,
      completed_count: 0,
      is_completed: 0,
      completed_at: null,
      notes: null,
      order_index: orderIndex++,
      created_at: now,
      subject_name: nextDpp?.subject_name || 'Active Subject',
      subject_color: nextDpp?.subject_color || '#38BDF8'
    });

    // 3. Add GATE PYQ Task (Target: 20 Questions)
    const pyqSubjId = nextLectures[0]?.subject_id || 'c_prog';
    const pyqTaskId = `task_${dateStr}_pyq_${Date.now()}`;
    const pyqTitle = `Solve 20 GATE CSE PYQs`;

    await db.runAsync(
      `INSERT OR IGNORE INTO daily_tasks (
        id, date, category, subject_id, topic_id, lecture_id, dpp_id, title, target_count, completed_count, is_completed, completed_at, notes, order_index, created_at
      ) VALUES (?, ?, 'pyq_practice', ?, null, null, null, ?, ?, 0, 0, null, null, ?, ?);`,
      [pyqTaskId, dateStr, pyqSubjId, pyqTitle, settings.daily_pyq_target, orderIndex, now]
    );

    tasksToCreate.push({
      id: pyqTaskId,
      date: dateStr,
      category: 'pyq_practice',
      subject_id: pyqSubjId,
      topic_id: null,
      lecture_id: null,
      dpp_id: null,
      title: pyqTitle,
      target_count: settings.daily_pyq_target,
      completed_count: 0,
      is_completed: 0,
      completed_at: null,
      notes: null,
      order_index: orderIndex++,
      created_at: now,
      subject_name: 'PYQ Practice',
      subject_color: '#F59E0B'
    });

    // 4. Add Revision Task (Target: 60 Minutes)
    const revTaskId = `task_${dateStr}_rev_${Date.now()}`;
    const revTitle = `Focused Revision (${settings.daily_revision_minutes_target} mins)`;

    await db.runAsync(
      `INSERT OR IGNORE INTO daily_tasks (
        id, date, category, subject_id, topic_id, lecture_id, dpp_id, title, target_count, completed_count, is_completed, completed_at, notes, order_index, created_at
      ) VALUES (?, ?, 'revision', ?, null, null, null, ?, ?, 0, 0, null, null, ?, ?);`,
      [revTaskId, dateStr, pyqSubjId, revTitle, settings.daily_revision_minutes_target, orderIndex, now]
    );

    tasksToCreate.push({
      id: revTaskId,
      date: dateStr,
      category: 'revision',
      subject_id: pyqSubjId,
      topic_id: null,
      lecture_id: null,
      dpp_id: null,
      title: revTitle,
      target_count: settings.daily_revision_minutes_target,
      completed_count: 0,
      is_completed: 0,
      completed_at: null,
      notes: null,
      order_index: orderIndex++,
      created_at: now,
      subject_name: 'Spaced Repetition',
      subject_color: '#818CF8'
    });
  });

  return tasksToCreate;
}

export async function addDailyTask(task: Omit<DailyTask, 'id' | 'created_at'>): Promise<DailyTask> {
  const db = await getDatabase();
  const id = `task_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO daily_tasks (
      id, date, category, subject_id, topic_id, lecture_id, dpp_id, title, target_count, completed_count, is_completed, completed_at, notes, order_index, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      task.date,
      task.category,
      task.subject_id,
      task.topic_id || null,
      task.lecture_id || null,
      task.dpp_id || null,
      task.title,
      task.target_count || 1,
      task.completed_count || 0,
      task.is_completed || 0,
      task.completed_at || null,
      task.notes || null,
      task.order_index || 0,
      now
    ]
  );

  return {
    ...task,
    id,
    created_at: now
  };
}

export async function toggleTaskCompletion(taskId: string, isCompleted: boolean): Promise<void> {
  const db = await getDatabase();
  const task = await db.getFirstAsync<DailyTask>('SELECT * FROM daily_tasks WHERE id = ?;', [taskId]);
  if (!task) return;

  const now = new Date().toISOString();
  const completedVal = isCompleted ? 1 : 0;
  const completedAt = isCompleted ? now : null;

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'UPDATE daily_tasks SET is_completed = ?, completed_at = ?, completed_count = ? WHERE id = ?;',
      [completedVal, completedAt, isCompleted ? task.target_count : 0, taskId]
    );

    // If lecture task, update lecture status
    if (task.lecture_id) {
      await updateLecture(task.lecture_id, { is_completed: completedVal });
    }

    // If DPP task, update DPP status
    if (task.dpp_id) {
      await db.runAsync(
        'UPDATE dpps SET is_completed = ?, completed_at = ? WHERE id = ?;',
        [completedVal, completedAt, task.dpp_id]
      );
    }

    // Update daily progress
    await incrementDailyProgress(task.date, {
      tasks_completed: isCompleted ? 1 : -1
    });
  });
}

export async function shiftIncompleteTasks(fromDate: string, toDate: string): Promise<number> {
  const db = await getDatabase();
  const incomplete = await db.getAllAsync<DailyTask>(
    'SELECT * FROM daily_tasks WHERE date = ? AND is_completed = 0;',
    [fromDate]
  );

  if (incomplete.length === 0) return 0;

  await db.withTransactionAsync(async () => {
    for (const task of incomplete) {
      const newId = `task_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const noteAppended = task.notes
        ? `${task.notes} (Shifted from ${fromDate})`
        : `Shifted from ${fromDate}`;

      await db.runAsync(
        `INSERT INTO daily_tasks (
          id, date, category, subject_id, topic_id, lecture_id, dpp_id, title, target_count, completed_count, is_completed, completed_at, notes, order_index, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, null, ?, ?, ?);`,
        [
          newId,
          toDate,
          task.category,
          task.subject_id,
          task.topic_id,
          task.lecture_id,
          task.dpp_id,
          task.title,
          task.target_count,
          noteAppended,
          task.order_index,
          new Date().toISOString()
        ]
      );

      await db.runAsync(
        `UPDATE daily_tasks SET notes = ? WHERE id = ?;`,
        [`[Moved to ${toDate}] ${task.notes || ''}`.trim(), task.id]
      );
    }
  });

  return incomplete.length;
}

// ----------------------------------------------------
// PYQ ATTEMPTS & ERROR TAXONOMY
// ----------------------------------------------------
export async function logPyqAttempt(attempt: {
  gate_year: number;
  subject_id: string;
  topic_id: string;
  question_number: number;
  marks: number;
  difficulty: DifficultyLevel;
  is_correct: boolean;
  time_taken_seconds: number;
  mistake_category?: MistakeCategory | null;
  notes?: string | null;
  explanation?: string | null;
}): Promise<PyqAttempt> {
  const db = await getDatabase();
  const id = `pyq_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const now = new Date().toISOString();
  const isCorrectInt = attempt.is_correct ? 1 : 0;

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO pyq_attempts (
        id, gate_year, subject_id, topic_id, question_number, marks, difficulty, is_correct, time_taken_seconds, mistake_category, notes, attempted_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        attempt.gate_year,
        attempt.subject_id,
        attempt.topic_id,
        attempt.question_number,
        attempt.marks,
        attempt.difficulty,
        isCorrectInt,
        attempt.time_taken_seconds,
        attempt.mistake_category || null,
        attempt.notes || null,
        now,
        now
      ]
    );

    if (!attempt.is_correct && attempt.mistake_category) {
      const mistakeId = `mistake_${Date.now()}`;
      await db.runAsync(
        `INSERT INTO mistake_logs (
          id, pyq_attempt_id, subject_id, topic_id, mistake_category, explanation, is_resolved, resolved_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 0, null, ?);`,
        [
          mistakeId,
          id,
          attempt.subject_id,
          attempt.topic_id,
          attempt.mistake_category,
          attempt.explanation || attempt.notes || 'Identified during PYQ drill',
          now
        ]
      );
    }

    const today = now.slice(0, 10);
    await incrementDailyProgress(today, {
      pyqs_attempted: 1,
      pyqs_correct: isCorrectInt,
      total_study_seconds: attempt.time_taken_seconds
    });
  });

  return {
    id,
    gate_year: attempt.gate_year,
    subject_id: attempt.subject_id,
    topic_id: attempt.topic_id,
    question_number: attempt.question_number,
    marks: attempt.marks,
    difficulty: attempt.difficulty,
    is_correct: isCorrectInt,
    time_taken_seconds: attempt.time_taken_seconds,
    mistake_category: attempt.mistake_category || null,
    notes: attempt.notes || null,
    attempted_at: now,
    created_at: now
  };
}

export async function getPyqAttempts(filters?: {
  subject_id?: string;
  topic_id?: string;
  gate_year?: number;
  difficulty?: DifficultyLevel;
  mistake_category?: MistakeCategory;
}): Promise<(PyqAttempt & { subject_name: string; topic_name: string })[]> {
  const db = await getDatabase();
  let query = `
    SELECT p.*, s.name as subject_name, t.name as topic_name
    FROM pyq_attempts p
    JOIN subjects s ON p.subject_id = s.id
    JOIN topics t ON p.topic_id = t.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (filters?.subject_id) {
    query += ` AND p.subject_id = ?`;
    params.push(filters.subject_id);
  }
  if (filters?.topic_id) {
    query += ` AND p.topic_id = ?`;
    params.push(filters.topic_id);
  }
  if (filters?.gate_year) {
    query += ` AND p.gate_year = ?`;
    params.push(filters.gate_year);
  }
  if (filters?.difficulty) {
    query += ` AND p.difficulty = ?`;
    params.push(filters.difficulty);
  }
  if (filters?.mistake_category) {
    query += ` AND p.mistake_category = ?`;
    params.push(filters.mistake_category);
  }

  query += ` ORDER BY p.attempted_at DESC;`;

  return await db.getAllAsync<PyqAttempt & { subject_name: string; topic_name: string }>(query, params);
}

export async function getMistakeLogs(onlyUnresolved = false): Promise<
  (MistakeLog & { subject_name: string; topic_name: string; gate_year?: number; question_number?: number })[]
> {
  const db = await getDatabase();
  let query = `
    SELECT m.*, s.name as subject_name, t.name as topic_name, p.gate_year, p.question_number
    FROM mistake_logs m
    JOIN subjects s ON m.subject_id = s.id
    JOIN topics t ON m.topic_id = t.id
    LEFT JOIN pyq_attempts p ON m.pyq_attempt_id = p.id
  `;
  if (onlyUnresolved) {
    query += ` WHERE m.is_resolved = 0`;
  }
  query += ` ORDER BY m.created_at DESC;`;

  return await db.getAllAsync<MistakeLog & { subject_name: string; topic_name: string; gate_year?: number; question_number?: number }>(query);
}

export async function resolveMistake(mistakeId: string, isResolved = true): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    'UPDATE mistake_logs SET is_resolved = ?, resolved_at = ? WHERE id = ?;',
    [isResolved ? 1 : 0, isResolved ? now : null, mistakeId]
  );
}

// ----------------------------------------------------
// WEAK TOPIC DETECTION
// ----------------------------------------------------
export async function getWeakTopics(limit = 10): Promise<WeakTopicAnalysis[]> {
  const db = await getDatabase();
  const settings = await getAppSettings();

  const rows = await db.getAllAsync<{
    topic_id: string;
    topic_name: string;
    subject_id: string;
    subject_name: string;
    total_attempts: number;
    correct_attempts: number;
  }>(`
    SELECT 
      t.id as topic_id,
      t.name as topic_name,
      s.id as subject_id,
      s.name as subject_name,
      COUNT(p.id) as total_attempts,
      SUM(CASE WHEN p.is_correct = 1 THEN 1 ELSE 0 END) as correct_attempts
    FROM pyq_attempts p
    JOIN topics t ON p.topic_id = t.id
    JOIN subjects s ON p.subject_id = s.id
    GROUP BY t.id
    HAVING total_attempts >= 3
  `);

  const analyzed: WeakTopicAnalysis[] = rows.map((r) => {
    const accuracy = r.total_attempts > 0 ? (r.correct_attempts / r.total_attempts) * 100 : 0;
    let status: 'Critical' | 'Needs Improvement' | 'Improving' = 'Improving';
    if (accuracy < settings.critical_accuracy_threshold) {
      status = 'Critical';
    } else if (accuracy <= settings.improvement_accuracy_threshold) {
      status = 'Needs Improvement';
    }

    return {
      topic_id: r.topic_id,
      topic_name: r.topic_name,
      subject_id: r.subject_id,
      subject_name: r.subject_name,
      total_attempts: r.total_attempts,
      correct_attempts: r.correct_attempts,
      accuracy: Math.round(accuracy * 10) / 10,
      status
    };
  });

  analyzed.sort((a, b) => a.accuracy - b.accuracy);
  return analyzed.slice(0, limit);
}

// ----------------------------------------------------
// STUDY SESSIONS & TIMER
// ----------------------------------------------------
export async function logStudySession(session: {
  date: string;
  subject_id: string;
  task_category: TaskCategory;
  topic_id?: string | null;
  duration_seconds: number;
  started_at: string;
  ended_at: string;
}): Promise<StudySession> {
  const db = await getDatabase();
  const id = `session_${Date.now()}`;
  const now = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO study_sessions (
        id, date, subject_id, task_category, topic_id, duration_seconds, started_at, ended_at, is_paused, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?);`,
      [
        id,
        session.date,
        session.subject_id,
        session.task_category,
        session.topic_id || null,
        session.duration_seconds,
        session.started_at,
        session.ended_at,
        now
      ]
    );

    await incrementDailyProgress(session.date, {
      total_study_seconds: session.duration_seconds
    });
  });

  return {
    id,
    date: session.date,
    subject_id: session.subject_id,
    task_category: session.task_category,
    topic_id: session.topic_id || null,
    duration_seconds: session.duration_seconds,
    started_at: session.started_at,
    ended_at: session.ended_at,
    is_paused: 0,
    created_at: now
  };
}

export async function getStudySecondsForDate(dateStr: string): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ total: number | null }>(
    'SELECT SUM(duration_seconds) as total FROM study_sessions WHERE date = ?;',
    [dateStr]
  );
  return row?.total || 0;
}

// ----------------------------------------------------
// DAILY PROGRESS & AGGREGATIONS
// ----------------------------------------------------
export async function incrementDailyProgress(
  dateStr: string,
  increments: {
    total_study_seconds?: number;
    lectures_completed?: number;
    dpps_completed?: number;
    pyqs_attempted?: number;
    pyqs_correct?: number;
    revisions_completed?: number;
    revision_minutes?: number;
    tasks_completed?: number;
  }
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT OR IGNORE INTO daily_progress (
      id, date, total_study_seconds, lectures_completed, dpps_completed, pyqs_attempted, pyqs_correct, revisions_completed, revision_minutes, tasks_completed, total_tasks, created_at
    ) VALUES (?, ?, 0, 0, 0, 0, 0, 0, 0, 0, 0, ?);`,
    [`dp_${dateStr}`, dateStr, now]
  );

  const updates: string[] = [];
  const params: any[] = [];

  if (increments.total_study_seconds) {
    updates.push('total_study_seconds = MAX(0, total_study_seconds + ?)');
    params.push(increments.total_study_seconds);
  }
  if (increments.lectures_completed) {
    updates.push('lectures_completed = MAX(0, lectures_completed + ?)');
    params.push(increments.lectures_completed);
  }
  if (increments.dpps_completed) {
    updates.push('dpps_completed = MAX(0, dpps_completed + ?)');
    params.push(increments.dpps_completed);
  }
  if (increments.pyqs_attempted) {
    updates.push('pyqs_attempted = MAX(0, pyqs_attempted + ?)');
    params.push(increments.pyqs_attempted);
  }
  if (increments.pyqs_correct) {
    updates.push('pyqs_correct = MAX(0, pyqs_correct + ?)');
    params.push(increments.pyqs_correct);
  }
  if (increments.revisions_completed) {
    updates.push('revisions_completed = MAX(0, revisions_completed + ?)');
    params.push(increments.revisions_completed);
  }
  if (increments.revision_minutes) {
    updates.push('revision_minutes = MAX(0, revision_minutes + ?)');
    params.push(increments.revision_minutes);
  }
  if (increments.tasks_completed) {
    updates.push('tasks_completed = MAX(0, tasks_completed + ?)');
    params.push(increments.tasks_completed);
  }

  if (updates.length > 0) {
    params.push(dateStr);
    await db.runAsync(
      `UPDATE daily_progress SET ${updates.join(', ')} WHERE date = ?;`,
      params
    );
  }
}

export async function getDailyProgress(dateStr: string): Promise<DailyProgress | null> {
  const db = await getDatabase();
  return await db.getFirstAsync<DailyProgress>(
    'SELECT * FROM daily_progress WHERE date = ?;',
    [dateStr]
  );
}

export async function getDailyProgressRange(days = 7): Promise<DailyProgress[]> {
  const db = await getDatabase();
  return await db.getAllAsync<DailyProgress>(
    `SELECT * FROM daily_progress ORDER BY date DESC LIMIT ?;`,
    [days]
  );
}

// ----------------------------------------------------
// SUBJECT PROGRESS SUMMARIES
// ----------------------------------------------------
export async function getSubjectProgressSummaries(): Promise<SubjectProgressSummary[]> {
  const db = await getDatabase();
  const subjects = await getAllSubjects();
  const allWeakTopics = await getWeakTopics(100);

  const summaries: SubjectProgressSummary[] = [];

  for (const subject of subjects) {
    const topicsRow = await db.getFirstAsync<{ total: number; completed: number }>(
      `SELECT COUNT(*) as total, SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed
       FROM topics WHERE subject_id = ?;`,
      [subject.id]
    );

    const lecturesRow = await db.getFirstAsync<{ total: number; completed: number }>(
      `SELECT COUNT(*) as total, SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed
       FROM lectures WHERE subject_id = ?;`,
      [subject.id]
    );

    const dppRow = await db.getFirstAsync<{ total: number; completed: number }>(
      `SELECT COUNT(*) as total, SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed
       FROM dpps WHERE subject_id = ?;`,
      [subject.id]
    );

    const pyqRow = await db.getFirstAsync<{ attempted: number; correct: number }>(
      `SELECT COUNT(*) as attempted, SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct
       FROM pyq_attempts WHERE subject_id = ?;`,
      [subject.id]
    );

    const revisionRow = await db.getFirstAsync<{ total_due: number; completed: number }>(
      `SELECT COUNT(*) as total_due, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
       FROM revision_schedules WHERE subject_id = ?;`,
      [subject.id]
    );

    const totalTopics = topicsRow?.total || 0;
    const completedTopics = topicsRow?.completed || 0;
    const completedLectures = lecturesRow?.completed || 0;
    const totalLectures = subject.total_lectures || (lecturesRow?.total || 30);
    const pyqAttempted = pyqRow?.attempted || 0;
    const pyqCorrect = pyqRow?.correct || 0;
    const accuracy = pyqAttempted > 0 ? Math.round((pyqCorrect / pyqAttempted) * 100) : null;

    const completionPercentage = totalLectures > 0
      ? Math.round((completedLectures / totalLectures) * 100)
      : (totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0);

    const subjectWeak = allWeakTopics.filter((w) => w.subject_id === subject.id);

    summaries.push({
      subject,
      total_topics: totalTopics,
      completed_topics: completedTopics,
      total_lectures: totalLectures,
      completed_lectures: completedLectures,
      is_lecture_count_estimated: Boolean(subject.is_lecture_count_estimated),
      total_dpps: subject.total_dpps,
      completed_dpps: dppRow?.completed || 0,
      pyq_attempted: pyqAttempted,
      pyq_correct: pyqCorrect,
      pyq_accuracy: accuracy,
      total_revisions_due: revisionRow?.total_due || 0,
      revisions_completed: revisionRow?.completed || 0,
      completion_percentage: completionPercentage,
      weak_topics: subjectWeak
    });
  }

  return summaries;
}

// ----------------------------------------------------
// SEPARATE REAL PROGRESS INDICATORS (Dashboard)
// ----------------------------------------------------
export interface RealProgressIndicators {
  // 1. PW Lectures
  completedLectures: number;
  totalLectures: number;
  confirmedLectures: number;
  estimatedLectures: number;
  lectureCompletionPct: number;

  // 2. DPP
  completedDpps: number;
  totalConfirmedDpps: number;
  dppCompletionPct: number;

  // 3. PYQ Practice
  todayPyqsAttempted: number;
  todayPyqTarget: number;
  totalPyqsAttempted: number;
  totalPyqsCorrect: number;
  overallAccuracyPct: number | null; // null if 0 attempts

  // 4. Revision
  todayRevisionsDue: number;
  todayRevisionsCompleted: number;
  totalRevisionsDue: number;
  totalRevisionsCompleted: number;

  // 5. Study Hours
  todayStudySeconds: number;
  todayTargetStudySeconds: number;
  totalStudySeconds: number;

  // Streak
  currentStreak: number;
}

export async function getRealProgressIndicators(): Promise<RealProgressIndicators> {
  const db = await getDatabase();
  const settings = await getAppSettings();
  const today = new Date().toISOString().slice(0, 10);

  // 1. PW Lectures
  const subjRows = await db.getAllAsync<{
    total_lectures: number;
    is_lecture_count_estimated: number;
  }>('SELECT total_lectures, is_lecture_count_estimated FROM subjects;');

  let totalLectures = 0;
  let confirmedLectures = 0;
  let estimatedLectures = 0;

  for (const s of subjRows) {
    totalLectures += s.total_lectures;
    if (s.is_lecture_count_estimated) {
      estimatedLectures += s.total_lectures;
    } else {
      confirmedLectures += s.total_lectures;
    }
  }

  const completedLecRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM lectures WHERE is_completed = 1;'
  );
  const completedLectures = completedLecRow?.count || 0;
  const lectureCompletionPct = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;

  // 2. DPPs
  const dppTotalRow = await db.getFirstAsync<{ total: number; completed: number }>(
    'SELECT COUNT(*) as total, SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed FROM dpps;'
  );
  const totalConfirmedDpps = dppTotalRow?.total || 0;
  const completedDpps = dppTotalRow?.completed || 0;
  const dppCompletionPct = totalConfirmedDpps > 0 ? Math.round((completedDpps / totalConfirmedDpps) * 100) : 0;

  // 3. PYQs
  const pyqTotalRow = await db.getFirstAsync<{ total: number; correct: number }>(
    'SELECT COUNT(*) as total, SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct FROM pyq_attempts;'
  );
  const todayPyqRow = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM pyq_attempts WHERE date(attempted_at) = ?;`,
    [today]
  );
  const totalPyqs = pyqTotalRow?.total || 0;
  const correctPyqs = pyqTotalRow?.correct || 0;
  const overallAccuracyPct = totalPyqs > 0 ? Math.round((correctPyqs / totalPyqs) * 100) : null;

  // 4. Revision
  const todayRevRow = await db.getFirstAsync<{ due: number; completed: number }>(
    `SELECT COUNT(*) as due, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
     FROM revision_schedules WHERE scheduled_date = ?;`,
    [today]
  );
  const totalRevRow = await db.getFirstAsync<{ due: number; completed: number }>(
    `SELECT COUNT(*) as due, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
     FROM revision_schedules;`
  );

  // 5. Study Seconds
  const todayStudyRow = await db.getFirstAsync<{ total: number | null }>(
    'SELECT SUM(duration_seconds) as total FROM study_sessions WHERE date = ?;',
    [today]
  );
  const totalStudyRow = await db.getFirstAsync<{ total: number | null }>(
    'SELECT SUM(duration_seconds) as total FROM study_sessions;'
  );

  // Streak
  const activeDays = await db.getAllAsync<{ date: string }>(
    `SELECT DISTINCT date FROM study_sessions WHERE duration_seconds >= 600 ORDER BY date DESC LIMIT 60;`
  );

  let currentStreak = 0;
  if (activeDays.length > 0) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const daySet = new Set(activeDays.map((d) => d.date));
    let checkDate = daySet.has(today) ? new Date() : (daySet.has(yesterday) ? new Date(Date.now() - 86400000) : null);
    if (checkDate) {
      while (true) {
        const dateStr = checkDate.toISOString().slice(0, 10);
        if (daySet.has(dateStr)) {
          currentStreak++;
          checkDate = new Date(checkDate.getTime() - 86400000);
        } else {
          break;
        }
      }
    }
  }

  return {
    completedLectures,
    totalLectures,
    confirmedLectures,
    estimatedLectures,
    lectureCompletionPct,
    completedDpps,
    totalConfirmedDpps,
    dppCompletionPct,
    todayPyqsAttempted: todayPyqRow?.count || 0,
    todayPyqTarget: settings.daily_pyq_target,
    totalPyqsAttempted: totalPyqs,
    totalPyqsCorrect: correctPyqs,
    overallAccuracyPct,
    todayRevisionsDue: todayRevRow?.due || 0,
    todayRevisionsCompleted: todayRevRow?.completed || 0,
    totalRevisionsDue: totalRevRow?.due || 0,
    totalRevisionsCompleted: totalRevRow?.completed || 0,
    todayStudySeconds: todayStudyRow?.total || 0,
    todayTargetStudySeconds: Math.round(settings.daily_study_hours_target * 3600),
    totalStudySeconds: totalStudyRow?.total || 0,
    currentStreak
  };
}

// ----------------------------------------------------
// BACKUP & RESTORE
// ----------------------------------------------------
export interface DatabaseBackup {
  version: number;
  exported_at: string;
  app_name: 'GATE TRACK 90';
  tables: {
    app_settings: AppSettings[];
    subjects: Subject[];
    topics: Topic[];
    lectures: Lecture[];
    dpps: DPP[];
    daily_goals: DailyGoal[];
    daily_tasks: DailyTask[];
    revision_schedules: RevisionSchedule[];
    revision_history: RevisionHistoryItem[];
    pyq_attempts: PyqAttempt[];
    mistake_logs: MistakeLog[];
    study_sessions: StudySession[];
    daily_progress: DailyProgress[];
  };
}

export async function exportDatabaseToJson(): Promise<DatabaseBackup> {
  const db = await getDatabase();
  const settings = await db.getAllAsync<AppSettings>('SELECT * FROM app_settings;');
  const subjects = await db.getAllAsync<Subject>('SELECT * FROM subjects;');
  const topics = await getAllTopics();
  const lectures = await db.getAllAsync<Lecture>('SELECT * FROM lectures;');
  const dpps = await db.getAllAsync<DPP>('SELECT * FROM dpps;');
  const daily_goals = await db.getAllAsync<DailyGoal>('SELECT * FROM daily_goals;');
  const daily_tasks = await db.getAllAsync<DailyTask>('SELECT * FROM daily_tasks;');
  const revision_schedules = await db.getAllAsync<RevisionSchedule>('SELECT * FROM revision_schedules;');
  const revision_history = await db.getAllAsync<RevisionHistoryItem>('SELECT * FROM revision_history;');
  const pyq_attempts = await db.getAllAsync<PyqAttempt>('SELECT * FROM pyq_attempts;');
  const mistake_logs = await db.getAllAsync<MistakeLog>('SELECT * FROM mistake_logs;');
  const study_sessions = await db.getAllAsync<StudySession>('SELECT * FROM study_sessions;');
  const daily_progress = await db.getAllAsync<DailyProgress>('SELECT * FROM daily_progress;');

  return {
    version: 1,
    exported_at: new Date().toISOString(),
    app_name: 'GATE TRACK 90',
    tables: {
      app_settings: settings,
      subjects,
      topics,
      lectures,
      dpps,
      daily_goals,
      daily_tasks,
      revision_schedules,
      revision_history,
      pyq_attempts,
      mistake_logs,
      study_sessions,
      daily_progress
    }
  };
}

export async function importDatabaseFromJson(backup: DatabaseBackup): Promise<boolean> {
  if (!backup || backup.app_name !== 'GATE TRACK 90' || !backup.tables) {
    throw new Error('Invalid backup format: missing GATE TRACK 90 signatures');
  }

  const db = await getDatabase();

  await db.withTransactionAsync(async () => {
    if (backup.tables.app_settings && backup.tables.app_settings.length > 0) {
      const s = backup.tables.app_settings[0];
      await db.runAsync(
        `UPDATE app_settings SET
          prep_start_date = ?, target_exam_date = ?, daily_study_hours_target = ?,
          daily_lecture_target = ?, daily_dpp_target = ?, daily_pyq_target = ?,
          daily_revision_minutes_target = ?, daily_aptitude_target = ?, rest_day_preference = ?,
          weak_subject_1 = ?, weak_subject_2 = ?, critical_accuracy_threshold = ?,
          improvement_accuracy_threshold = ?, theme_preference = ?, notifications_enabled = ?,
          morning_reminder_time = ?, revision_reminder_time = ?, target_reminder_time = ?,
          evening_reminder_time = ?, is_onboarded = ?, updated_at = ?
        WHERE id = 1;`,
        [
          s.prep_start_date, s.target_exam_date, s.daily_study_hours_target,
          s.daily_lecture_target, s.daily_dpp_target, s.daily_pyq_target,
          s.daily_revision_minutes_target, s.daily_aptitude_target, s.rest_day_preference,
          s.weak_subject_1, s.weak_subject_2, s.critical_accuracy_threshold,
          s.improvement_accuracy_threshold, s.theme_preference, s.notifications_enabled,
          s.morning_reminder_time, s.revision_reminder_time, s.target_reminder_time,
          s.evening_reminder_time, s.is_onboarded, new Date().toISOString()
        ]
      );
    }

    await db.execAsync(`
      DELETE FROM mistake_logs;
      DELETE FROM pyq_attempts;
      DELETE FROM revision_history;
      DELETE FROM revision_schedules;
      DELETE FROM daily_tasks;
      DELETE FROM daily_goals;
      DELETE FROM study_sessions;
      DELETE FROM daily_progress;
    `);

    if (backup.tables.lectures) {
      for (const lec of backup.tables.lectures) {
        await db.runAsync(
          `UPDATE lectures SET is_completed = ?, actual_time_spent_minutes = ?, completed_at = ?, pw_url = ? WHERE id = ?;`,
          [lec.is_completed, lec.actual_time_spent_minutes, lec.completed_at, lec.pw_url, lec.id]
        );
      }
    }

    if (backup.tables.dpps) {
      for (const d of backup.tables.dpps) {
        await db.runAsync(
          `INSERT OR REPLACE INTO dpps (
            id, subject_id, dpp_num, title, questions_count, attempted, correct, incorrect, is_completed, completed_at, time_spent_minutes, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [d.id, d.subject_id, d.dpp_num, d.title, d.questions_count, d.attempted, d.correct, d.incorrect, d.is_completed, d.completed_at, d.time_spent_minutes, d.created_at]
        );
      }
    }

    if (backup.tables.topics) {
      for (const top of backup.tables.topics) {
        await db.runAsync(
          `UPDATE topics SET is_completed = ?, completed_at = ? WHERE id = ?;`,
          [top.is_completed, top.completed_at, top.id]
        );
      }
    }

    if (backup.tables.daily_tasks) {
      for (const t of backup.tables.daily_tasks) {
        await db.runAsync(
          `INSERT OR REPLACE INTO daily_tasks (
            id, date, category, subject_id, topic_id, lecture_id, dpp_id, title, target_count, completed_count, is_completed, completed_at, notes, order_index, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [t.id, t.date, t.category, t.subject_id, t.topic_id, t.lecture_id, t.dpp_id, t.title, t.target_count, t.completed_count, t.is_completed, t.completed_at, t.notes, t.order_index, t.created_at]
        );
      }
    }

    if (backup.tables.revision_schedules) {
      for (const r of backup.tables.revision_schedules) {
        await db.runAsync(
          `INSERT OR REPLACE INTO revision_schedules (
            id, subject_id, topic_id, interval_stage, scheduled_date, status, completed_at, skip_reason, time_spent_minutes, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [r.id, r.subject_id, r.topic_id, r.interval_stage, r.scheduled_date, r.status, r.completed_at, r.skip_reason, r.time_spent_minutes, r.created_at]
        );
      }
    }

    if (backup.tables.pyq_attempts) {
      for (const p of backup.tables.pyq_attempts) {
        await db.runAsync(
          `INSERT OR REPLACE INTO pyq_attempts (
            id, gate_year, subject_id, topic_id, question_number, marks, difficulty, is_correct, time_taken_seconds, mistake_category, notes, attempted_at, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [p.id, p.gate_year, p.subject_id, p.topic_id, p.question_number, p.marks, p.difficulty, p.is_correct, p.time_taken_seconds, p.mistake_category, p.notes, p.attempted_at, p.created_at]
        );
      }
    }

    if (backup.tables.mistake_logs) {
      for (const m of backup.tables.mistake_logs) {
        await db.runAsync(
          `INSERT OR REPLACE INTO mistake_logs (
            id, pyq_attempt_id, subject_id, topic_id, mistake_category, explanation, is_resolved, resolved_at, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [m.id, m.pyq_attempt_id, m.subject_id, m.topic_id, m.mistake_category, m.explanation, m.is_resolved, m.resolved_at, m.created_at]
        );
      }
    }

    if (backup.tables.study_sessions) {
      for (const s of backup.tables.study_sessions) {
        await db.runAsync(
          `INSERT OR REPLACE INTO study_sessions (
            id, date, subject_id, task_category, topic_id, duration_seconds, started_at, ended_at, is_paused, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [s.id, s.date, s.subject_id, s.task_category, s.topic_id, s.duration_seconds, s.started_at, s.ended_at, s.is_paused, s.created_at]
        );
      }
    }

    if (backup.tables.daily_progress) {
      for (const dp of backup.tables.daily_progress) {
        await db.runAsync(
          `INSERT OR REPLACE INTO daily_progress (
            id, date, total_study_seconds, lectures_completed, dpps_completed, pyqs_attempted, pyqs_correct, revisions_completed, revision_minutes, tasks_completed, total_tasks, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          [dp.id, dp.date, dp.total_study_seconds, dp.lectures_completed, dp.dpps_completed, dp.pyqs_attempted, dp.pyqs_correct, dp.revisions_completed, dp.revision_minutes, dp.tasks_completed, dp.total_tasks, dp.created_at]
        );
      }
    }
  });

  return true;
}
