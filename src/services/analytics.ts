/**
 * Analytics Service for Budget Lines
 * Wraps Firebase Analytics for event tracking
 */

import analytics from '@react-native-firebase/analytics';
import { GameMode, Difficulty } from '../core/types';

/**
 * Check if analytics is available
 * Firebase might not be configured in development
 */
function isAnalyticsAvailable(): boolean {
  try {
    return !!analytics();
  } catch {
    return false;
  }
}

/**
 * Safe analytics call wrapper
 * Silently fails if analytics is not available
 */
async function safeLogEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
): Promise<void> {
  if (!isAnalyticsAvailable()) {
    // Log to console in development
    console.log(`[Analytics] ${eventName}:`, params);
    return;
  }
  
  try {
    await analytics().logEvent(eventName, params);
  } catch (error) {
    console.warn('Analytics event failed:', eventName, error);
  }
}

// ============ Game Events ============

/**
 * Track when a puzzle is started
 */
export async function trackPuzzleStarted(
  mode: GameMode,
  difficulty?: Difficulty
): Promise<void> {
  await safeLogEvent('puzzle_started', {
    mode,
    difficulty: difficulty || 'medium',
  });
}

/**
 * Track when a puzzle is completed
 */
export async function trackPuzzleCompleted(
  mode: GameMode,
  timeMs: number,
  linesCount: number,
  difficulty?: Difficulty
): Promise<void> {
  await safeLogEvent('puzzle_completed', {
    mode,
    time_seconds: Math.floor(timeMs / 1000),
    lines_count: linesCount,
    difficulty: difficulty || 'medium',
  });
}

/**
 * Track when a line is committed
 */
export async function trackLineCommitted(
  mode: GameMode,
  lineNumber: number
): Promise<void> {
  await safeLogEvent('line_committed', {
    mode,
    line_number: lineNumber,
  });
}

/**
 * Track when player gets stuck
 */
export async function trackPuzzleStuck(
  mode: GameMode,
  linesCompleted: number
): Promise<void> {
  await safeLogEvent('puzzle_stuck', {
    mode,
    lines_completed: linesCompleted,
  });
}

/**
 * Track puzzle reset
 */
export async function trackPuzzleReset(mode: GameMode): Promise<void> {
  await safeLogEvent('puzzle_reset', { mode });
}

// ============ Premium Events ============

/**
 * Track when premium modal is viewed
 */
export async function trackPremiumModalView(feature: string): Promise<void> {
  await safeLogEvent('premium_modal_viewed', {
    trigger_feature: feature,
  });
}

/**
 * Track successful premium purchase
 */
export async function trackPremiumPurchase(productId: string): Promise<void> {
  await safeLogEvent('premium_purchased', {
    product_id: productId,
  });
  
  // Also log as Firebase purchase event
  if (isAnalyticsAvailable()) {
    try {
      await analytics().logPurchase({
        value: 3.99,
        currency: 'USD',
        items: [{ item_id: productId, item_name: 'Premium Unlock' }],
      });
    } catch (error) {
      console.warn('Failed to log purchase event:', error);
    }
  }
}

/**
 * Track premium restore attempt
 */
export async function trackPremiumRestore(success: boolean): Promise<void> {
  await safeLogEvent('premium_restore_attempted', {
    success,
  });
}

// ============ Social Events ============

/**
 * Track when results are shared
 */
export async function trackShareResults(
  mode: GameMode,
  linesCount: number
): Promise<void> {
  await safeLogEvent('share_results', {
    mode,
    lines_count: linesCount,
  });
  
  // Also use Firebase's built-in share event
  if (isAnalyticsAvailable()) {
    try {
      await analytics().logShare({
        content_type: 'puzzle_result',
        item_id: mode,
        method: 'native_share',
      });
    } catch (error) {
      console.warn('Failed to log share event:', error);
    }
  }
}

// ============ Hint Events ============

/**
 * Track when a hint is requested
 */
export async function trackHintRequested(
  mode: GameMode,
  hintType: string
): Promise<void> {
  await safeLogEvent('hint_requested', {
    mode,
    hint_type: hintType,
  });
}

// ============ Navigation Events ============

/**
 * Track screen views
 */
export async function trackScreenView(screenName: string): Promise<void> {
  if (!isAnalyticsAvailable()) {
    console.log(`[Analytics] Screen: ${screenName}`);
    return;
  }
  
  try {
    await analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenName,
    });
  } catch (error) {
    console.warn('Failed to log screen view:', error);
  }
}

// ============ User Properties ============

/**
 * Set user as premium
 */
export async function setUserPremiumStatus(isPremium: boolean): Promise<void> {
  if (!isAnalyticsAvailable()) {
    console.log(`[Analytics] Set premium: ${isPremium}`);
    return;
  }
  
  try {
    await analytics().setUserProperty('is_premium', isPremium ? 'true' : 'false');
  } catch (error) {
    console.warn('Failed to set user property:', error);
  }
}

/**
 * Set user's total puzzles completed
 */
export async function setUserPuzzlesCompleted(count: number): Promise<void> {
  if (!isAnalyticsAvailable()) {
    return;
  }
  
  try {
    // Bucket into ranges for better analysis
    let bucket: string;
    if (count === 0) bucket = '0';
    else if (count <= 5) bucket = '1-5';
    else if (count <= 20) bucket = '6-20';
    else if (count <= 50) bucket = '21-50';
    else if (count <= 100) bucket = '51-100';
    else bucket = '100+';
    
    await analytics().setUserProperty('puzzles_completed_range', bucket);
  } catch (error) {
    console.warn('Failed to set user property:', error);
  }
}

/**
 * Set user's current streak
 */
export async function setUserStreak(streak: number): Promise<void> {
  if (!isAnalyticsAvailable()) {
    return;
  }
  
  try {
    // Bucket into ranges
    let bucket: string;
    if (streak === 0) bucket = '0';
    else if (streak <= 3) bucket = '1-3';
    else if (streak <= 7) bucket = '4-7';
    else if (streak <= 30) bucket = '8-30';
    else bucket = '30+';
    
    await analytics().setUserProperty('streak_range', bucket);
  } catch (error) {
    console.warn('Failed to set user property:', error);
  }
}
