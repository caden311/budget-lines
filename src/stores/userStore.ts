/**
 * User state store using Zustand
 * Handles user preferences, stats, and premium status
 */

import { create } from 'zustand';
import { UserStats, PremiumStatus, Difficulty } from '../core/types';
import {
  loadUserStats,
  saveUserStats,
  loadPremiumStatus,
  savePremiumStatus,
} from '../utils/storage';

interface UserStore {
  // State
  stats: UserStats;
  premium: PremiumStatus;
  preferredDifficulty: Difficulty;
  isLoading: boolean;
  
  // Actions
  loadUserData: () => Promise<void>;
  
  // Stats updates
  recordPuzzleComplete: (timeMs: number, puzzleId: string) => Promise<void>;
  recordLineDrawn: () => Promise<void>;
  updateDailyStreak: () => Promise<void>;
  
  // Premium
  setPremiumStatus: (status: PremiumStatus) => Promise<void>;
  
  // Preferences
  setPreferredDifficulty: (difficulty: Difficulty) => void;

  // Prompts
  setHasSeenNotificationPrompt: () => Promise<void>;
  setHasSeenRatingPrompt: () => Promise<void>;
}

const DEFAULT_STATS: UserStats = {
  dailyStreak: 0,
  lastDailyDate: null,
  lastCompletedPuzzleId: null,
  totalPuzzlesCompleted: 0,
  totalLinesDrawn: 0,
  bestTime: null,
  averageTime: null,
  hasSeenNotificationPrompt: false,
  hasSeenRatingPrompt: false,
};

const DEFAULT_PREMIUM: PremiumStatus = {
  isPremium: false,
  purchaseDate: null,
  productId: null,
};

export const useUserStore = create<UserStore>((set, get) => ({
  stats: DEFAULT_STATS,
  premium: DEFAULT_PREMIUM,
  preferredDifficulty: 'medium',
  isLoading: true,
  
  loadUserData: async () => {
    set({ isLoading: true });
    
    const [stats, premium] = await Promise.all([
      loadUserStats(),
      loadPremiumStatus(),
    ]);
    
    set({
      stats: stats ?? DEFAULT_STATS,
      premium: premium ?? DEFAULT_PREMIUM,
      isLoading: false,
    });
  },
  
  recordPuzzleComplete: async (timeMs: number, puzzleId: string) => {
    const { stats } = get();
    
    // Only count each puzzle once (prevents counting after reset)
    if (stats.lastCompletedPuzzleId === puzzleId) {
      return;
    }
    
    const totalTime = stats.averageTime
      ? stats.averageTime * stats.totalPuzzlesCompleted + timeMs
      : timeMs;
    const newCount = stats.totalPuzzlesCompleted + 1;
    
    const newStats: UserStats = {
      ...stats,
      totalPuzzlesCompleted: newCount,
      lastCompletedPuzzleId: puzzleId,
      bestTime: stats.bestTime ? Math.min(stats.bestTime, timeMs) : timeMs,
      averageTime: Math.round(totalTime / newCount),
    };
    
    set({ stats: newStats });
    await saveUserStats(newStats);
  },
  
  recordLineDrawn: async () => {
    const { stats } = get();
    
    const newStats: UserStats = {
      ...stats,
      totalLinesDrawn: stats.totalLinesDrawn + 1,
    };
    
    set({ stats: newStats });
    await saveUserStats(newStats);
  },
  
  updateDailyStreak: async () => {
    const { stats } = get();
    
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    let newStreak = stats.dailyStreak;
    
    if (stats.lastDailyDate === yesterday) {
      // Continuing streak
      newStreak = stats.dailyStreak + 1;
    } else if (stats.lastDailyDate !== today) {
      // Streak broken or first day
      newStreak = 1;
    }
    
    const newStats: UserStats = {
      ...stats,
      dailyStreak: newStreak,
      lastDailyDate: today,
    };
    
    set({ stats: newStats });
    await saveUserStats(newStats);
  },
  
  setPremiumStatus: async (status: PremiumStatus) => {
    set({ premium: status });
    await savePremiumStatus(status);
  },
  
  setPreferredDifficulty: (difficulty: Difficulty) => {
    set({ preferredDifficulty: difficulty });
  },

  setHasSeenNotificationPrompt: async () => {
    const { stats } = get();
    const newStats: UserStats = {
      ...stats,
      hasSeenNotificationPrompt: true,
    };
    set({ stats: newStats });
    await saveUserStats(newStats);
  },

  setHasSeenRatingPrompt: async () => {
    const { stats } = get();
    const newStats: UserStats = {
      ...stats,
      hasSeenRatingPrompt: true,
    };
    set({ stats: newStats });
    await saveUserStats(newStats);
  },
}));
