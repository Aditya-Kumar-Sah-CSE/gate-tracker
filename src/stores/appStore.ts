import { create } from 'zustand';
import { AppSettings, TaskCategory, ThemeMode } from '../types';
import { getAppSettings, updateAppSettings, logStudySession } from '../db/database';
import { scheduleAppNotifications } from '../services/notificationService';

interface AppStoreState {
  settings: AppSettings | null;
  isLoading: boolean;
  theme: ThemeMode;
  
  // Timer State
  isTimerRunning: boolean;
  isTimerPaused: boolean;
  timerSeconds: number;
  timerSubjectId: string;
  timerTaskCategory: TaskCategory;
  timerTopicId: string | null;
  timerStartedAt: string | null;

  // Actions
  loadSettings: () => Promise<AppSettings>;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  setTheme: (theme: ThemeMode) => Promise<void>;

  // Timer Actions
  startTimer: (subjectId: string, taskCategory: TaskCategory, topicId?: string | null) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  tickTimer: () => void;
  stopTimer: () => Promise<number>;
  discardTimer: () => void;

  // Data reload trigger version
  dataVersion: number;
  triggerRefresh: () => void;
}

export const useAppStore = create<AppStoreState>((set, get) => ({
  settings: null,
  isLoading: true,
  theme: 'dark',

  // Timer State
  isTimerRunning: false,
  isTimerPaused: false,
  timerSeconds: 0,
  timerSubjectId: 'ds',
  timerTaskCategory: 'lecture',
  timerTopicId: null,
  timerStartedAt: null,

  dataVersion: 0,

  triggerRefresh: () => {
    set((state) => ({ dataVersion: state.dataVersion + 1 }));
  },

  loadSettings: async () => {
    set({ isLoading: true });
    try {
      const settings = await getAppSettings();
      set({
        settings,
        theme: settings.theme_preference || 'dark',
        isLoading: false
      });
      return settings;
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  updateSettings: async (newSettings: Partial<AppSettings>) => {
    const updated = await updateAppSettings(newSettings);
    set({
      settings: updated,
      theme: updated.theme_preference
    });
    // Reschedule notifications if changed
    if (
      newSettings.notifications_enabled !== undefined ||
      newSettings.morning_reminder_time !== undefined ||
      newSettings.night_reminder_time !== undefined
    ) {
      scheduleAppNotifications(updated).catch(() => {});
    }
  },

  setTheme: async (theme: ThemeMode) => {
    set({ theme });
    await updateAppSettings({ theme_preference: theme });
  },

  startTimer: (subjectId: string, taskCategory: TaskCategory, topicId: string | null = null) => {
    set({
      isTimerRunning: true,
      isTimerPaused: false,
      timerSeconds: 0,
      timerSubjectId: subjectId,
      timerTaskCategory: taskCategory,
      timerTopicId: topicId,
      timerStartedAt: new Date().toISOString()
    });
  },

  pauseTimer: () => {
    set({ isTimerPaused: true });
  },

  resumeTimer: () => {
    set({ isTimerPaused: false });
  },

  tickTimer: () => {
    const { isTimerRunning, isTimerPaused } = get();
    if (isTimerRunning && !isTimerPaused) {
      set((state) => ({ timerSeconds: state.timerSeconds + 1 }));
    }
  },

  stopTimer: async () => {
    const { timerSeconds, timerSubjectId, timerTaskCategory, timerTopicId, timerStartedAt } = get();
    if (timerSeconds >= 10 && timerStartedAt) {
      const today = new Date().toISOString().slice(0, 10);
      await logStudySession({
        date: today,
        subject_id: timerSubjectId,
        task_category: timerTaskCategory,
        topic_id: timerTopicId,
        duration_seconds: timerSeconds,
        started_at: timerStartedAt,
        ended_at: new Date().toISOString()
      });
    }

    set({
      isTimerRunning: false,
      isTimerPaused: false,
      timerSeconds: 0,
      timerStartedAt: null
    });

    get().triggerRefresh();
    return timerSeconds;
  },

  discardTimer: () => {
    set({
      isTimerRunning: false,
      isTimerPaused: false,
      timerSeconds: 0,
      timerStartedAt: null
    });
  }
}));

// Utility calculation helpers
export function calculatePrepDay(prepStartDateStr?: string): { day: number; totalDays: number; isAhead: boolean } {
  if (!prepStartDateStr) return { day: 1, totalDays: 90, isAhead: false };

  const start = new Date(prepStartDateStr);
  const now = new Date();
  
  // Normalize both dates to midnight UTC to prevent time zone drift
  const utcStart = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const utcNow = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

  const diffMs = utcNow - utcStart;
  const dayNumber = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

  return {
    day: Math.max(1, Math.min(dayNumber, 90)),
    totalDays: 90,
    isAhead: dayNumber > 90
  };
}

export function calculateDaysRemaining(targetExamDateStr?: string): number {
  if (!targetExamDateStr) return 0;
  const target = new Date(targetExamDateStr);
  const now = new Date();

  const utcTarget = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate());
  const utcNow = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

  const diffDays = Math.ceil((utcTarget - utcNow) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}h ${m}m ${s.toString().padStart(2, '0')}s`;
  }
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

export function formatTimeDigital(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const mStr = m.toString().padStart(2, '0');
  const sStr = s.toString().padStart(2, '0');

  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${mStr}:${sStr}`;
  }
  return `${mStr}:${sStr}`;
}

