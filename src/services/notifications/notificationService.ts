import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Habit } from '../../types';
import { APP_CONFIG } from '../../constants/appConfig';

// Set notification handler for when the app is in the foreground
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Android Notification Channel Setup
 * Android 8.0 (API 26)+ requires a channel for all notifications.
 * Call this once at app startup before scheduling any notifications.
 */
export const setupAndroidNotificationChannel = async (): Promise<void> => {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync(APP_CONFIG.NOTIFICATION_CHANNEL_ID, {
      name: APP_CONFIG.NOTIFICATION_CHANNEL_NAME,
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF8A7A',
      sound: 'default',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      bypassDnd: false,
      showBadge: false,
    });
  } catch (error) {
    if (__DEV__) {
      console.error('[notifications] Failed to create Android channel:', error);
    }
  }
};

// Request permission only when needed
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return true;
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

export const getNotificationPermissionStatus = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return true;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
};

// Cancel specific scheduled notifications by IDs
export const cancelNotificationsByIds = async (ids: string[]): Promise<void> => {
  if (Platform.OS === 'web' || ids.length === 0) return;
  try {
    for (const id of ids) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
  } catch (error) {
    console.error('Error canceling notifications:', error);
  }
};

// Cancel all notifications scheduled by this app
export const cancelAllAppNotifications = async (): Promise<void> => {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling all notifications:', error);
  }
};

// Schedule daily water reminder alarms at set intervals
export const scheduleWaterReminders = async (
  startTime: string, // HH:MM
  endTime: string,   // HH:MM
  intervalMinutes: number
): Promise<string[]> => {
  if (Platform.OS === 'web') return [];
  
  const hasPermission = await getNotificationPermissionStatus();
  if (!hasPermission) return [];

  const scheduledIds: string[] = [];
  const startHour = parseInt(startTime.split(':')[0], 10);
  const startMin = parseInt(startTime.split(':')[1], 10);
  const endHour = parseInt(endTime.split(':')[0], 10);
  const endMin = parseInt(endTime.split(':')[1], 10);

  const startMins = startHour * 60 + startMin;
  const endMins = endHour * 60 + endMin;

  const texts = [
    'Biraz su molası? 💧',
    'Bugün kendine küçük bir su molası ver. 💧',
    'Su şişen yakınındaysa birkaç yudum alabilirsin. 💧',
    'Kendine özen göstermeyi unutma, ufak bir yudum su al. 💧',
  ];

  try {
    let currentMins = startMins;
    let idx = 0;
    while (currentMins <= endMins) {
      const hh = Math.floor(currentMins / 60);
      const mm = currentMins % 60;

      const title = 'Su Hatırlatıcısı 💧';
      const body = texts[idx % texts.length];

      // Schedule a daily recurring notification at hh:mm
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { screen: 'water' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hh,
          minute: mm,
        },
      });

      scheduledIds.push(id);
      currentMins += intervalMinutes;
      idx++;
    }
  } catch (error) {
    console.error('Error scheduling water reminders:', error);
  }

  return scheduledIds;
};

// Schedule weekly reminders for a single habit
export const scheduleHabitReminder = async (habit: Habit): Promise<string[]> => {
  if (Platform.OS === 'web' || !habit.reminderEnabled || !habit.reminderTime) return [];

  const hasPermission = await getNotificationPermissionStatus();
  if (!hasPermission) return [];

  const scheduledIds: string[] = [];
  const hour = parseInt(habit.reminderTime.split(':')[0], 10);
  const minute = parseInt(habit.reminderTime.split(':')[1], 10);

  try {
    // If no specific days, default to every day
    const targetDays = habit.repeatDays.length > 0 ? habit.repeatDays : [0, 1, 2, 3, 4, 5, 6];

    for (const dayOfWeek of targetDays) {
      // expo-notifications SchedulableTriggerInputTypes.WEEKLY takes weekday (1 = Sunday, 2 = Monday, ..., 7 = Saturday)
      // Our state weekday model: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const notificationWeekday = dayOfWeek === 0 ? 1 : dayOfWeek + 1;

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${habit.emoji} Rutin Zamanı`,
          body: `Bugünkü "${habit.name}" rutinini tamamlamayı unutma. 🌱`,
          data: { screen: 'habits', habitId: habit.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: notificationWeekday,
          hour,
          minute,
        },
      });
      scheduledIds.push(id);
    }
  } catch (error) {
    console.error(`Error scheduling reminders for habit ${habit.id}:`, error);
  }

  return scheduledIds;
};
