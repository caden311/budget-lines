/**
 * Analytics Service for Budget Lines - Web Stub
 * Logs analytics events to console on web (Firebase Analytics is native-only)
 */

import { GameMode, Difficulty } from '../core/types';

// ============ Game Events ============

/**
 * Track when a puzzle is started
 */
export async function trackPuzzleStarted(
  mode: GameMode,
  difficulty?: Difficulty
): Promise<void> {
  console.log('[Analytics] puzzle_started:', { mode, difficulty: difficulty || 'medium' });
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
  console.log('[Analytics] puzzle_completed:', {
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
  console.log('[Analytics] line_committed:', { mode, line_number: lineNumber });
}

/**
 * Track when player gets stuck
 */
export async function trackPuzzleStuck(
  mode: GameMode,
  linesCompleted: number
): Promise<void> {
  console.log('[Analytics] puzzle_stuck:', { mode, lines_completed: linesCompleted });
}

/**
 * Track puzzle reset
 */
export async function trackPuzzleReset(mode: GameMode): Promise<void> {
  console.log('[Analytics] puzzle_reset:', { mode });
}

// ============ Premium Events ============

/**
 * Track when premium modal is viewed
 */
export async function trackPremiumModalView(feature: string): Promise<void> {
  console.log('[Analytics] premium_modal_viewed:', { trigger_feature: feature });
}

/**
 * Track successful premium purchase
 */
export async function trackPremiumPurchase(productId: string): Promise<void> {
  console.log('[Analytics] premium_purchased:', { product_id: productId });
}

/**
 * Track premium restore attempt
 */
export async function trackPremiumRestore(success: boolean): Promise<void> {
  console.log('[Analytics] premium_restore_attempted:', { success });
}

// ============ Social Events ============

/**
 * Track when results are shared
 */
export async function trackShareResults(
  mode: GameMode,
  linesCount: number
): Promise<void> {
  console.log('[Analytics] share_results:', { mode, lines_count: linesCount });
}

// ============ Hint Events ============

/**
 * Track when a hint is requested
 */
export async function trackHintRequested(
  mode: GameMode,
  hintType: string
): Promise<void> {
  console.log('[Analytics] hint_requested:', { mode, hint_type: hintType });
}

// ============ Navigation Events ============

/**
 * Track screen views
 */
export async function trackScreenView(screenName: string): Promise<void> {
  console.log('[Analytics] Screen:', screenName);
}

// ============ User Properties ============

/**
 * Set user as premium
 */
export async function setUserPremiumStatus(isPremium: boolean): Promise<void> {
  console.log('[Analytics] Set premium:', isPremium);
}

/**
 * Set user's total puzzles completed
 */
export async function setUserPuzzlesCompleted(count: number): Promise<void> {
  console.log('[Analytics] Set puzzles completed:', count);
}

/**
 * Set user's current streak
 */
export async function setUserStreak(streak: number): Promise<void> {
  console.log('[Analytics] Set streak:', streak);
}
