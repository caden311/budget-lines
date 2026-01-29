/**
 * Root layout for Budget Lines
 */

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useUserStore } from '../src/stores/userStore';

export default function RootLayout() {
  const { loadUserData } = useUserStore();
  
  useEffect(() => {
    loadUserData();
  }, []);
  
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0f0f1a' },
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
