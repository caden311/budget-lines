/**
 * Tab layout for Budget Lines
 */

import { Tabs } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { useTheme } from '../../src/theme';

function TabBarIcon({ name, focused }: { name: string; focused: boolean }) {
  const { theme } = useTheme();
  const icons: Record<string, string> = {
    home: '🏠',
    practice: '🎮',
    stats: '📊',
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
  icon: {
    fontSize: 24,
  },
});
