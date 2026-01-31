/**
 * Root layout for Budget Lines
 */

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppState, AppStateStatus } from 'react-native';
import { ThemeProvider, useTheme } from '../src/theme';
import { useUserStore } from '../src/stores/userStore';
import { initializeIAP, terminateIAP } from '../src/services/iap';
import { configureNotifications, restoreScheduledNotifications } from '../src/services/notifications';
import { setUserPremiumStatus, setUserPuzzlesCompleted, setUserStreak } from '../src/services/analytics';

function RootLayoutNav() {
  const { theme, isDark } = useTheme();
  const { loadUserData, stats, premium } = useUserStore();
  
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
