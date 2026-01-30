/**
 * Notifications Service for Budget Lines
 * Handles daily puzzle reminders using expo-notifications
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  NOTIFICATIONS_ENABLED: 'notifications_enabled',
  REMINDER_HOUR: 'reminder_hour',
  REMINDER_MINUTE: 'reminder_minute',
};

// Default reminder time: 9:00 AM
const DEFAULT_REMINDER_HOUR = 9;
const DEFAULT_REMINDER_MINUTE = 0;

// Notification identifier for daily reminder
const DAILY_REMINDER_ID = 'daily-puzzle-reminder';

/**
 * Configure notification handler
 * Call this at app startup
 */
export function configureNotifications(): void {
  // Set how notifications should be handled when app is in foreground
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
 * Request notification permissions
 * Returns true if granted, false otherwise
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    
    if (existingStatus === 'granted') {
      return true;
    }
    
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Failed to request notification permissions:', error);
    return false;
  }
}

/**
 * Check if notification permissions are granted
 */
export async function hasNotificationPermissions(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Failed to check notification permissions:', error);
    return false;
  }
}

/**
 * Schedule daily puzzle reminder
 * @param hour - Hour of day (0-23)
 * @param minute - Minute of hour (0-59)
 */
export async function scheduleDailyReminder(
  hour: number = DEFAULT_REMINDER_HOUR,
  minute: number = DEFAULT_REMINDER_MINUTE
): Promise<boolean> {
  try {
    // Cancel any existing reminders first
    await cancelDailyReminder();
    
    // Check permissions
    const hasPermission = await hasNotificationPermissions();
    if (!hasPermission) {
      console.warn('Notification permissions not granted');
      return false;
    }
    
    // Schedule the daily notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Today's Puzzle Awaits! 🧩",
        body: "A new daily puzzle is ready. Can you solve it?",
        sound: true,
        priority: Notifications.AndroidNotificationPriority.DEFAULT,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
      identifier: DAILY_REMINDER_ID,
    });
    
    // Save settings
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.NOTIFICATIONS_ENABLED, 'true'],
      [STORAGE_KEYS.REMINDER_HOUR, hour.toString()],
      [STORAGE_KEYS.REMINDER_MINUTE, minute.toString()],
    ]);
    
    console.log(`Daily reminder scheduled for ${hour}:${minute.toString().padStart(2, '0')}`);
    return true;
  } catch (error) {
    console.error('Failed to schedule daily reminder:', error);
    return false;
  }
}

/**
 * Cancel the daily reminder
 */
export async function cancelDailyReminder(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID);
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED, 'false');
    console.log('Daily reminder cancelled');
  } catch (error) {
    console.error('Failed to cancel daily reminder:', error);
  }
}

/**
 * Check if notifications are enabled
 */
export async function areNotificationsEnabled(): Promise<boolean> {
  try {
    const enabled = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED);
    return enabled === 'true';
  } catch (error) {
    return false;
  }
}

/**
 * Get current reminder time settings
 */
export async function getReminderTime(): Promise<{ hour: number; minute: number }> {
  try {
    const [[, hour], [, minute]] = await AsyncStorage.multiGet([
      STORAGE_KEYS.REMINDER_HOUR,
      STORAGE_KEYS.REMINDER_MINUTE,
    ]);
    
    return {
      hour: hour ? parseInt(hour, 10) : DEFAULT_REMINDER_HOUR,
      minute: minute ? parseInt(minute, 10) : DEFAULT_REMINDER_MINUTE,
    };
  } catch (error) {
    return {
      hour: DEFAULT_REMINDER_HOUR,
      minute: DEFAULT_REMINDER_MINUTE,
    };
  }
}

/**
 * Toggle notifications on/off
 * Returns the new enabled state
 */
export async function toggleNotifications(): Promise<boolean> {
  const currentlyEnabled = await areNotificationsEnabled();
  
  if (currentlyEnabled) {
    await cancelDailyReminder();
    return false;
  } else {
    // Request permissions if needed
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return false;
    }
    
    const { hour, minute } = await getReminderTime();
    await scheduleDailyReminder(hour, minute);
    return true;
  }
}

/**
 * Update reminder time
 */
export async function updateReminderTime(hour: number, minute: number): Promise<boolean> {
  const enabled = await areNotificationsEnabled();
  
  if (enabled) {
    return await scheduleDailyReminder(hour, minute);
  } else {
    // Just save the time for later
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.REMINDER_HOUR, hour.toString()],
      [STORAGE_KEYS.REMINDER_MINUTE, minute.toString()],
    ]);
    return true;
  }
}

/**
 * Send a local notification immediately (for testing)
 */
export async function sendTestNotification(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Test Notification 🎉",
      body: "Notifications are working!",
    },
    trigger: null, // Immediate
  });
}

/**
 * Get all scheduled notifications (for debugging)
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return await Notifications.getAllScheduledNotificationsAsync();
}
