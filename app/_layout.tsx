/**
 * Root layout for Budget Lines
 */

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { ThemeProvider, useTheme } from '../src/theme';
import { useUserStore } from '../src/stores/userStore';

function RootLayoutNav() {
  const { theme, isDark } = useTheme();
  const { loadUserData } = useUserStore();
  
  useEffect(() => {
    loadUserData();
  }, []);
  
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
