/**
 * Stats screen - Basic stats free, detailed stats premium
 * Also includes notification settings
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { useTheme } from '../../src/theme';
import { useUserStore } from '../../src/stores/userStore';
import { formatTime } from '../../src/utils/sharing';
import { PremiumModal } from '../../src/components/PremiumModal';
import {
  areNotificationsEnabled,
  toggleNotifications,
  requestNotificationPermissions,
  getReminderTime,
} from '../../src/services/notifications';
import { trackScreenView } from '../../src/services/analytics';

export default function StatsScreen() {
  const { theme } = useTheme();
  const { stats, premium, isLoading } = useUserStore();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState({ hour: 9, minute: 0 });
  
  const isPremium = premium.isPremium;
  
  // Track screen view
  useEffect(() => {
    trackScreenView('Stats');
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
          <Text style={[styles.title, { color: theme.text }]}>Statistics</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>Your puzzle-solving journey</Text>
        </View>
        
        {/* Main stats - FREE */}
        <View style={styles.mainStats}>
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{stats.dailyStreak}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Current Streak</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: theme.cardBackground }]}>
            <Text style={styles.statEmoji}>🏆</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{stats.totalPuzzlesCompleted}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>Puzzles Solved</Text>
          </View>
        </View>
        
        {/* Detailed stats - PREMIUM */}
        <View style={[styles.detailsCard, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.detailsHeader}>
            <Text style={[styles.detailsTitle, { color: theme.text }]}>Performance</Text>
            {!isPremium && (
              <View style={[styles.proBadge, { backgroundColor: theme.warning }]}>
                <Text style={styles.proBadgeText}>👑 PRO</Text>
              </View>
            )}
          </View>
          
          {isPremium ? (
            // Premium user - show all stats
            <>
              <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
                <View style={[styles.detailIcon, { backgroundColor: theme.buttonSecondary }]}>
                  <Text>✏️</Text>
                </View>
                <View style={styles.detailInfo}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Total Lines Drawn</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{stats.totalLinesDrawn}</Text>
                </View>
              </View>
              
              <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
                <View style={[styles.detailIcon, { backgroundColor: theme.buttonSecondary }]}>
                  <Text>⚡</Text>
                </View>
                <View style={styles.detailInfo}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Best Time</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {stats.bestTime ? formatTime(stats.bestTime) : '—'}
                  </Text>
                </View>
              </View>
              
              <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
                <View style={[styles.detailIcon, { backgroundColor: theme.buttonSecondary }]}>
                  <Text>⏱️</Text>
                </View>
                <View style={styles.detailInfo}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Average Time</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {stats.averageTime ? formatTime(stats.averageTime) : '—'}
                  </Text>
                </View>
              </View>
              
              <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
                <View style={[styles.detailIcon, { backgroundColor: theme.buttonSecondary }]}>
                  <Text>📅</Text>
                </View>
                <View style={styles.detailInfo}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Last Daily Played</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>
                    {stats.lastDailyDate || '—'}
                  </Text>
                </View>
              </View>
            </>
          ) : (
            // Free user - show locked stats
            <>
              <View style={[styles.detailRow, styles.lockedRow, { borderBottomColor: theme.border }]}>
                <View style={[styles.detailIcon, { backgroundColor: theme.buttonSecondary, opacity: 0.5 }]}>
                  <Text>✏️</Text>
                </View>
                <View style={styles.detailInfo}>
                  <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Total Lines Drawn</Text>
                  <Text style={[styles.lockedValue, { color: theme.textMuted }]}>🔒</Text>
                </View>
              </View>
              
              <View style={[styles.detailRow, styles.lockedRow, { borderBottomColor: theme.border }]}>
                <View style={[styles.detailIcon, { backgroundColor: theme.buttonSecondary, opacity: 0.5 }]}>
                  <Text>⚡</Text>
                </View>
                <View style={styles.detailInfo}>
                  <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Best Time</Text>
                  <Text style={[styles.lockedValue, { color: theme.textMuted }]}>🔒</Text>
                </View>
              </View>
              
              <View style={[styles.detailRow, styles.lockedRow, { borderBottomColor: theme.border }]}>
                <View style={[styles.detailIcon, { backgroundColor: theme.buttonSecondary, opacity: 0.5 }]}>
                  <Text>⏱️</Text>
                </View>
                <View style={styles.detailInfo}>
                  <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Average Time</Text>
                  <Text style={[styles.lockedValue, { color: theme.textMuted }]}>🔒</Text>
                </View>
              </View>
              
              <View style={[styles.detailRow, styles.lockedRow, { borderBottomColor: theme.border }]}>
                <View style={[styles.detailIcon, { backgroundColor: theme.buttonSecondary, opacity: 0.5 }]}>
                  <Text>📅</Text>
                </View>
                <View style={styles.detailInfo}>
                  <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Last Daily Played</Text>
                  <Text style={[styles.lockedValue, { color: theme.textMuted }]}>🔒</Text>
                </View>
              </View>
              
              {/* Unlock button */}
              <Pressable
                style={({ pressed }) => [
                  styles.unlockButton,
                  { backgroundColor: pressed ? theme.primaryDark : theme.primary },
                  pressed && styles.unlockButtonPressed,
                ]}
                onPress={() => setShowPremiumModal(true)}
              >
                <Text style={styles.unlockButtonText}>👑 Unlock Detailed Stats</Text>
              </Pressable>
            </>
          )}
        </View>
        
        {/* Settings Section */}
        <View style={[styles.settingsCard, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.settingsTitle, { color: theme.text }]}>Settings</Text>
          
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
        
        {/* Motivational message */}
        <View style={[styles.motivationCard, { backgroundColor: theme.backgroundTertiary }]}>
          <Text style={styles.motivationEmoji}>
            {stats.dailyStreak >= 7 ? '🌟' : stats.dailyStreak >= 3 ? '💪' : '🎯'}
          </Text>
          <Text style={[styles.motivationText, { color: theme.primary }]}>
            {stats.dailyStreak >= 7 
              ? "You're on fire! Keep that streak going!"
              : stats.dailyStreak >= 3
              ? "Great progress! You're building a habit!"
              : "Play daily to build your streak!"}
          </Text>
        </View>
      </ScrollView>
      
      <PremiumModal
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        feature="stats"
      />
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
  mainStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  statValue: {
    fontSize: 36,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  detailsCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  proBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  proBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  lockedRow: {
    opacity: 0.6,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 15,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  lockedValue: {
    fontSize: 16,
  },
  unlockButton: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  unlockButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  unlockButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
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
  motivationCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 40,
  },
  motivationEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  motivationText: {
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
});
