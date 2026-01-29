/**
 * Tab layout for Budget Lines
 */

import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useUserStore } from '../../src/stores/userStore';
import { useTheme } from '../../src/theme';

function TabBarIcon({ name, focused }: { name: string; focused: boolean }) {
  const { theme } = useTheme();
  const { premium } = useUserStore();
  const isPremium = premium.isPremium;
  
  const icons: Record<string, string> = {
    home: '🏠',
    practice: '🎮',
    stats: '📊',
  };
  
  // Features that require premium
  const premiumFeatures = ['practice'];
  const showLock = !isPremium && premiumFeatures.includes(name);
  
  return (
    <View style={styles.iconContainer}>
      <Text style={[
        styles.icon, 
        { opacity: focused ? 1 : 0.6 }
      ]}>
        {icons[name] || '•'}
      </Text>
      {showLock && (
        <View style={[styles.lockBadge, { backgroundColor: theme.warning }]}>
          <Text style={styles.lockText}>👑</Text>
        </View>
      )}
    </View>
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
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ focused }) => <TabBarIcon name="stats" focused={focused} />,
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
  iconContainer: {
    position: 'relative',
  },
  icon: {
    fontSize: 24,
  },
  lockBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockText: {
    fontSize: 10,
  },
});
