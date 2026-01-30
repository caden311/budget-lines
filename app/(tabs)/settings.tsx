/**
 * Settings screen - App preferences and configuration
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  Alert,
  Pressable,
} from 'react-native';
import { useTheme } from '../../src/theme';
import {
  areNotificationsEnabled,
  toggleNotifications,
  requestNotificationPermissions,
  getReminderTime,
} from '../../src/services/notifications';
import { trackScreenView } from '../../src/services/analytics';
import { setTutorialCompleted } from '../../src/utils/storage';

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState({ hour: 9, minute: 0 });
  
  // Track screen view
  useEffect(() => {
    trackScreenView('Settings');
  }, []);
  
  // Load notification settings
  useEffect(() => {
    const loadNotificationSettings = async () => {
      const enabled = await areNotificationsEnabled();
      const time = await getReminderTime();
      setNotificationsEnabled(enabled);
      setReminderTime(time);
    };
    loadNotificationSettings();
  }, []);
  
  const handleNotificationToggle = async () => {
    if (!notificationsEnabled) {
      // Turning on - need to request permissions
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permissions Required',
          'Please enable notifications in your device settings to receive daily puzzle reminders.',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    
    const newState = await toggleNotifications();
    setNotificationsEnabled(newState);
  };

  const handleResetTutorial = () => {
    Alert.alert(
      'Reset Tutorial',
      'This will show the tutorial again the next time you open the app. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await setTutorialCompleted(false);
            Alert.alert('Tutorial Reset', 'The tutorial will appear on your next app launch.');
          },
        },
      ]
    );
  };
  
  const formatReminderTime = (hour: number, minute: number): string => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Customize your app experience
          </Text>
        </View>
        
        {/* Appearance Section */}
        <View style={[styles.settingsCard, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.settingsTitle, { color: theme.text }]}>Appearance</Text>
          
          {/* Theme toggle */}
          <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
            <View style={[styles.settingIcon, { backgroundColor: theme.buttonSecondary }]}>
              <Text>{isDark ? '🌙' : '☀️'}</Text>
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Theme</Text>
              <Text style={[styles.settingDescription, { color: theme.textMuted }]}>
                {isDark ? 'Dark mode' : 'Light mode'}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ 
                false: theme.border, 
                true: theme.primaryDark 
              }}
              thumbColor={isDark ? theme.primary : theme.textMuted}
              ios_backgroundColor={theme.border}
            />
          </View>
        </View>
        
        {/* Notifications Section */}
        <View style={[styles.settingsCard, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.settingsTitle, { color: theme.text }]}>Notifications</Text>
          
          {/* Notification toggle */}
          <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
            <View style={[styles.settingIcon, { backgroundColor: theme.buttonSecondary }]}>
              <Text>🔔</Text>
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Daily Reminders</Text>
              <Text style={[styles.settingDescription, { color: theme.textMuted }]}>
                {notificationsEnabled 
                  ? `Reminder at ${formatReminderTime(reminderTime.hour, reminderTime.minute)}`
                  : 'Get notified when a new puzzle is ready'
                }
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              trackColor={{ 
                false: theme.border, 
                true: theme.primaryDark 
              }}
              thumbColor={notificationsEnabled ? theme.primary : theme.textMuted}
              ios_backgroundColor={theme.border}
            />
          </View>
        </View>
        
        {/* General Section */}
        <View style={[styles.settingsCard, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.settingsTitle, { color: theme.text }]}>General</Text>
          
          {/* Reset Tutorial */}
          <Pressable
            style={({ pressed }) => [
              styles.settingRow,
              { borderBottomColor: theme.border, opacity: pressed ? 0.6 : 1 },
            ]}
            onPress={handleResetTutorial}
          >
            <View style={[styles.settingIcon, { backgroundColor: theme.buttonSecondary }]}>
              <Text>📚</Text>
            </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingLabel, { color: theme.text }]}>Reset Tutorial</Text>
              <Text style={[styles.settingDescription, { color: theme.textMuted }]}>
                Show the tutorial again on next launch
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  header: {
    marginTop: 20,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
  },
  settingsCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  settingsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingDescription: {
    fontSize: 13,
    marginTop: 2,
  },
});
