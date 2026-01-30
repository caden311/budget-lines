/**
 * Notifications Service for SumTrails - Web Stub
 * Push notifications are not fully supported on web - provides no-op implementations
 */

/**
 * Configure notification handler
 * No-op on web
 */
export function configureNotifications(): void {
  console.log('[Notifications] Web platform - notifications not available');
}

/**
 * Request notification permissions
 * Always returns false on web (not supported)
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  console.log('[Notifications] Web platform - permissions not available');
  return false;
}

/**
 * Check if notification permissions are granted
 * Always returns false on web
 */
export async function hasNotificationPermissions(): Promise<boolean> {
  return false;
}

/**
 * Schedule daily puzzle reminder
 * No-op on web
 */
export async function scheduleDailyReminder(
  _hour?: number,
  _minute?: number
): Promise<boolean> {
  console.log('[Notifications] Web platform - scheduling not available');
  return false;
}

/**
 * Cancel the daily reminder
 * No-op on web
 */
export async function cancelDailyReminder(): Promise<void> {
  // No-op on web
}

/**
 * Check if notifications are enabled
 * Always returns false on web
 */
export async function areNotificationsEnabled(): Promise<boolean> {
  return false;
}

/**
 * Get current reminder time settings
 * Returns default values on web
 */
export async function getReminderTime(): Promise<{ hour: number; minute: number }> {
  return {
    hour: 9,
    minute: 0,
  };
}

/**
 * Toggle notifications on/off
 * Always returns false on web (not supported)
 */
export async function toggleNotifications(): Promise<boolean> {
  console.log('[Notifications] Web platform - notifications not available');
  return false;
}

/**
 * Update reminder time
 * No-op on web
 */
export async function updateReminderTime(_hour: number, _minute: number): Promise<boolean> {
  return false;
}

/**
 * Send a local notification immediately (for testing)
 * No-op on web
 */
export async function sendTestNotification(): Promise<void> {
  console.log('[Notifications] Web platform - test notification not available');
}

/**
 * Get all scheduled notifications (for debugging)
 * Returns empty array on web
 */
export async function getScheduledNotifications(): Promise<never[]> {
  return [];
}
