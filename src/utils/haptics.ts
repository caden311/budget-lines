/**
 * Haptic feedback utilities for Budget Lines
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Check if haptics are available */
const hapticsAvailable = Platform.OS === 'ios' || Platform.OS === 'android';

/** Light tap - for cell selection */
export function lightTap(): void {
  if (hapticsAvailable) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

/** Medium tap - for path changes */
export function mediumTap(): void {
  if (hapticsAvailable) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
}

/** Heavy tap - for line completion */
export function heavyTap(): void {
  if (hapticsAvailable) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }
}

/** Success - for winning */
export function success(): void {
  if (hapticsAvailable) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
}

/** Warning - for stuck state */
export function warning(): void {
  if (hapticsAvailable) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }
}

/** Error - for invalid moves */
export function error(): void {
  if (hapticsAvailable) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
}

/** Selection changed */
export function selection(): void {
  if (hapticsAvailable) {
    Haptics.selectionAsync();
  }
}
