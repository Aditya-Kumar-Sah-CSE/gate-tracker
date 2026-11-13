import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
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
      importance: AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#8B5CF6',
    });
  }

  return true;
}

export async function scheduleAppNotifications(settings: AppSettings): Promise<void> {
  if (Platform.OS === 'web') return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!settings.notifications_enabled) {
    return;
  }

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  const parseTime = (timeStr: string, defaultHour: number) => {
    if (!timeStr) return { hour: defaultHour, minute: 0 };
    const [h, m] = timeStr.split(':').map(Number);
    return { hour: isNaN(h) ? defaultHour : h, minute: isNaN(m) ? 0 : m };
  };

  // 1. Morning Kickoff Target Reminder (07:00)
  const morning = parseTime(settings.morning_reminder_time, 7);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌅 GATE TRACK 90 • Morning Kickoff',
      body: `Set today's focus subject and lock your ${settings.daily_lecture_target} Lectures & ${settings.daily_dpp_target} DPPs!`,
      data: { screen: 'planner' },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: morning.hour,
      minute: morning.minute,
      channelId: 'gate_track_reminders',
    },
  });

  // 2. Night 9:00 PM (21:00) Check-In Reminder
  const night = parseTime(settings.night_reminder_time, 21);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌙 9:00 PM Review • Target Achieved?',
      body: 'Check in now to log your completed lectures, DPPs, and PYQs today to keep your streak burning 🔥!',
      data: { screen: 'index' },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: night.hour,
      minute: night.minute,
      channelId: 'gate_track_reminders',
    },
  });
}
