/**
 * Stats screen
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../src/theme';
import { useUserStore } from '../../src/stores/userStore';
import { formatTime } from '../../src/utils/sharing';

export default function StatsScreen() {
  const { theme } = useTheme();
  const { stats, isLoading } = useUserStore();
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Statistics</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>Your puzzle-solving journey</Text>
        </View>
        
        {/* Main stats */}
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
        
        {/* Detailed stats */}
        <View style={[styles.detailsCard, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.detailsTitle, { color: theme.text }]}>Performance</Text>
          
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
  detailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
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
