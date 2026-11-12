import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { AppSettings } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('gate_track_reminders', {
      name: 'GATE Preparation Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#38BDF8',
    });
  }

  return true;
}

export async function scheduleAppNotifications(settings: AppSettings): Promise<void> {
  if (Platform.OS === 'web') return;

  // Cancel all existing scheduled notifications
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!settings.notifications_enabled) {
    return;
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  // Parse time helper
  const parseTime = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return { hour: isNaN(h) ? 7 : h, minute: isNaN(m) ? 0 : m };
  };

  // 1. Morning Study Reminder
  const morning = parseTime(settings.morning_reminder_time || '07:00');
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🎯 GATE TRACK 90: Morning Focus',
      body: `Your daily target: ${settings.daily_lecture_target} Lectures, ${settings.daily_pyq_target} PYQs. Lock in!`,
      data: { screen: 'planner' },
      sound: true
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: morning.hour,
      minute: morning.minute,
      channelId: 'gate_track_reminders'
    }
  });

  // 2. Revision Due Reminder
  const revision = parseTime(settings.revision_reminder_time || '14:00');
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🧠 Spaced Repetition Due',
      body: 'Review your scheduled R1-R5 topics today to prevent memory decay.',
      data: { screen: 'planner' },
      sound: true
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: revision.hour,
      minute: revision.minute,
      channelId: 'gate_track_reminders'
    }
  });

  // 3. Evening Progress Review
  const evening = parseTime(settings.evening_reminder_time || '22:00');
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '📊 Day Audit: GATE TRACK 90',
      body: 'Did you hit your 8-hour target? Record your study sessions and mistake logs.',
      data: { screen: 'analytics' },
      sound: true
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: evening.hour,
      minute: evening.minute,
      channelId: 'gate_track_reminders'
    }
  });
}
