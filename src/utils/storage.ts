/**
 * Storage utilities for Budget Lines
 * Handles persisting game progress, user stats, and premium status
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { PremiumStatus, SavedGameProgress, UserStats } from '../core/types';

const KEYS = {
  GAME_PROGRESS_PREFIX: 'game_progress_',
  USER_STATS: 'user_stats',
  PREMIUM_STATUS: 'premium_status',
  SAVED_GAMES_LIST: 'saved_games_list',
  TUTORIAL_COMPLETED: 'tutorial_completed',
};

// ============ Game Progress ============

/** Save game progress */
export async function saveGameProgress(progress: SavedGameProgress): Promise<void> {
  try {
    const key = KEYS.GAME_PROGRESS_PREFIX + progress.puzzleId;
    await AsyncStorage.setItem(key, JSON.stringify(progress));
    
    // Also update the list of saved games
    await addToSavedGamesList(progress.puzzleId);
  } catch (error) {
    console.error('Failed to save game progress:', error);
  }
}

/** Load game progress */
export async function loadGameProgress(puzzleId: string): Promise<SavedGameProgress | null> {
  try {
    const key = KEYS.GAME_PROGRESS_PREFIX + puzzleId;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load game progress:', error);
    return null;
  }
}

/** Clear game progress */
export async function clearGameProgress(puzzleId: string): Promise<void> {
  try {
    const key = KEYS.GAME_PROGRESS_PREFIX + puzzleId;
    await AsyncStorage.removeItem(key);
    await removeFromSavedGamesList(puzzleId);
  } catch (error) {
    console.error('Failed to clear game progress:', error);
  }
}

/** Check if saved progress exists */
export async function hasSavedProgress(puzzleId: string): Promise<boolean> {
  try {
    const key = KEYS.GAME_PROGRESS_PREFIX + puzzleId;
    const data = await AsyncStorage.getItem(key);
    return data !== null;
  } catch (error) {
    return false;
  }
}

// ============ Saved Games List ============

async function addToSavedGamesList(puzzleId: string): Promise<void> {
  try {
    const list = await getSavedGamesList();
    if (!list.includes(puzzleId)) {
      list.push(puzzleId);
      await AsyncStorage.setItem(KEYS.SAVED_GAMES_LIST, JSON.stringify(list));
    }
  } catch (error) {
    console.error('Failed to update saved games list:', error);
  }
}

async function removeFromSavedGamesList(puzzleId: string): Promise<void> {
  try {
    const list = await getSavedGamesList();
    const newList = list.filter(id => id !== puzzleId);
    await AsyncStorage.setItem(KEYS.SAVED_GAMES_LIST, JSON.stringify(newList));
  } catch (error) {
    console.error('Failed to update saved games list:', error);
  }
}

export async function getSavedGamesList(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.SAVED_GAMES_LIST);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    return [];
  }
}

// ============ User Stats ============

/** Save user stats */
export async function saveUserStats(stats: UserStats): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.USER_STATS, JSON.stringify(stats));
  } catch (error) {
    console.error('Failed to save user stats:', error);
  }
}

/** Load user stats */
export async function loadUserStats(): Promise<UserStats | null> {
  try {
    const data = await AsyncStorage.getItem(KEYS.USER_STATS);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load user stats:', error);
    return null;
  }
}

// ============ Premium Status (Secure) ============

/** Save premium status (uses SecureStore for receipts) */
export async function savePremiumStatus(status: PremiumStatus): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEYS.PREMIUM_STATUS, JSON.stringify(status));
  } catch (error) {
    // Fallback to AsyncStorage if SecureStore fails (e.g., on web)
    console.warn('SecureStore failed, falling back to AsyncStorage:', error);
    await AsyncStorage.setItem(KEYS.PREMIUM_STATUS, JSON.stringify(status));
  }
}

/** Load premium status */
export async function loadPremiumStatus(): Promise<PremiumStatus | null> {
  try {
    const data = await SecureStore.getItemAsync(KEYS.PREMIUM_STATUS);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    // Fallback to AsyncStorage
    try {
      const fallbackData = await AsyncStorage.getItem(KEYS.PREMIUM_STATUS);
      return fallbackData ? JSON.parse(fallbackData) : null;
    } catch {
      return null;
    }
  }
}

// ============ Tutorial ============

/** Check if user has completed the tutorial */
export async function getTutorialCompleted(): Promise<boolean> {
  try {
    const data = await AsyncStorage.getItem(KEYS.TUTORIAL_COMPLETED);
    return data === 'true';
  } catch (error) {
    console.error('Failed to get tutorial status:', error);
    return false;
  }
}

/** Mark the tutorial as completed */
export async function setTutorialCompleted(completed: boolean = true): Promise<void> {
  try {
    await AsyncStorage.setItem(KEYS.TUTORIAL_COMPLETED, completed ? 'true' : 'false');
  } catch (error) {
    console.error('Failed to set tutorial status:', error);
  }
}

// ============ Cleanup ============

/** Clear all stored data (for testing/debugging) */
export async function clearAllData(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(keys);
    await SecureStore.deleteItemAsync(KEYS.PREMIUM_STATUS);
  } catch (error) {
    console.error('Failed to clear all data:', error);
  }
}
