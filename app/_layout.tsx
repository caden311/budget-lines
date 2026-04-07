/**
 * Root layout for Budget Lines
 */

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { ThemeProvider, useTheme } from '../src/theme';
import { useUserStore } from '../src/stores/userStore';
import { initializeIAP, terminateIAP } from '../src/services/iap';
import { configureNotifications, requestNotificationPermissions, restoreScheduledNotifications, scheduleDailyReminder } from '../src/services/notifications';
import { setUserPremiumStatus, setUserPuzzlesCompleted, setUserStreak } from '../src/services/analytics';

function RootLayoutNav() {
  const { theme, isDark } = useTheme();
  const { loadUserData, stats, premium, setHasSeenNotificationPrompt } = useUserStore();
  
  useEffect(() => {
    // Initialize services on app start
    const initializeApp = async () => {
      // Load user data
      await loadUserData();
      
      // Initialize IAP
      await initializeIAP();
      
      // Configure notifications
      configureNotifications();
      
      // Restore scheduled notifications if they were cleared
      await restoreScheduledNotifications();
    };
    
    initializeApp();
    
    // Handle app state changes for IAP cleanup
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App is going to background - could cleanup here if needed
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Cleanup IAP on unmount
    return () => {
      subscription.remove();
      terminateIAP();
    };
  }, []);
  
  // Prompt for notification permissions on first launch
  useEffect(() => {
    const promptForNotifications = async () => {
      if (stats && !stats.hasSeenNotificationPrompt) {
        const granted = await requestNotificationPermissions();
        await setHasSeenNotificationPrompt();
        // If permission granted, actually enable notifications
        if (granted) {
          await scheduleDailyReminder();
        }
      }
    };
    promptForNotifications();
  }, [stats?.hasSeenNotificationPrompt]);

  // Update analytics user properties when user data changes
  useEffect(() => {
    if (premium) {
      setUserPremiumStatus(premium.isPremium);
    }
  }, [premium?.isPremium]);
  
  useEffect(() => {
    if (stats) {
      setUserPuzzlesCompleted(stats.totalPuzzlesCompleted);
      setUserStreak(stats.dailyStreak);
    }
  }, [stats?.totalPuzzlesCompleted, stats?.dailyStreak]);
  
  return (
    <>
      {Platform.OS === 'web' && (
        <Head>
          <title>SumTrails - Daily Number Puzzle Game</title>
          <meta name="description" content="Draw paths through numbered cells to hit the target sum. A free daily puzzle game that challenges your math skills. New puzzle every day!" />
          <meta name="keywords" content="puzzle game, math game, number puzzle, daily puzzle, brain teaser, sum game, path drawing" />
          <meta name="author" content="vientapps" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="theme-color" content="#0c1222" />

          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://sumtrails.vientapps.com/" />
          <meta property="og:title" content="SumTrails - Daily Number Puzzle Game" />
          <meta property="og:description" content="Draw paths through numbered cells to hit the target sum. A free daily puzzle game that challenges your math skills." />
          <meta property="og:image" content="https://sumtrails.vientapps.com/og-image.png" />
          <meta property="og:site_name" content="SumTrails" />

          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="SumTrails - Daily Number Puzzle Game" />
          <meta name="twitter:description" content="Draw paths through numbered cells to hit the target sum. A free daily puzzle game that challenges your math skills." />
          <meta name="twitter:image" content="https://sumtrails.vientapps.com/og-image.png" />

          <link rel="canonical" href="https://sumtrails.vientapps.com/" />
        </Head>
      )}
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen 
          name="game/daily" 
          options={{
            presentation: 'card',
          }}
        />
        <Stack.Screen 
          name="game/practice" 
          options={{
            presentation: 'card',
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
  );
}
