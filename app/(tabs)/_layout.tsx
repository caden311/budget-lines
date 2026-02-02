/**
 * Tab layout for Budget Lines
 */

import { Tabs } from 'expo-router';
import Constants from 'expo-constants';
import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useUserStore } from '../../src/stores/userStore';
import { useTheme } from '../../src/theme';

const showPracticeTab = Constants.expoConfig?.extra?.showPracticeTab === true;

function TabBarIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    home: '🏠',
    practice: '🎮',
    stats: '🏆',
    settings: '⚙️',
  };
  
  return (
    <Text style={[
      styles.icon, 
      { opacity: focused ? 1 : 0.6 }
    ]}>
      {icons[name] || '•'}
    </Text>
  );
}

export default function TabLayout() {
  const { theme } = useTheme();
  const { loadUserData, isLoading } = useUserStore();
  
  // Load user data on mount
  useEffect(() => {
    loadUserData();
  }, []);
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.tabBarBackground,
          borderTopColor: theme.tabBarBorder,
          borderTopWidth: 1,
          height: 90,
          paddingTop: 8,
          paddingBottom: 28,
        },
        tabBarActiveTintColor: theme.tabBarActive,
        tabBarInactiveTintColor: theme.tabBarInactive,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Daily',
          tabBarIcon: ({ focused }) => <TabBarIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: 'Practice',
          tabBarIcon: ({ focused }) => <TabBarIcon name="practice" focused={focused} />,
          href: showPracticeTab ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ focused }) => <TabBarIcon name="stats" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <TabBarIcon name="settings" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  icon: {
    fontSize: 24,
  },
});
