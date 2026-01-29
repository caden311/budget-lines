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
import { useUserStore } from '../../src/stores/userStore';
import { formatTime } from '../../src/utils/sharing';

export default function StatsScreen() {
  const { stats, isLoading } = useUserStore();
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Statistics</Text>
          <Text style={styles.subtitle}>Your puzzle-solving journey</Text>
        </View>
        
        {/* Main stats */}
        <View style={styles.mainStats}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statValue}>{stats.dailyStreak}</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🏆</Text>
            <Text style={styles.statValue}>{stats.totalPuzzlesCompleted}</Text>
            <Text style={styles.statLabel}>Puzzles Solved</Text>
          </View>
        </View>
        
        {/* Detailed stats */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Performance</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Text>✏️</Text>
            </View>
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Total Lines Drawn</Text>
              <Text style={styles.detailValue}>{stats.totalLinesDrawn}</Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Text>⚡</Text>
            </View>
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Best Time</Text>
              <Text style={styles.detailValue}>
                {stats.bestTime ? formatTime(stats.bestTime) : '—'}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Text>⏱️</Text>
            </View>
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Average Time</Text>
              <Text style={styles.detailValue}>
                {stats.averageTime ? formatTime(stats.averageTime) : '—'}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Text>📅</Text>
            </View>
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Last Daily Played</Text>
              <Text style={styles.detailValue}>
                {stats.lastDailyDate || '—'}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Motivational message */}
        <View style={styles.motivationCard}>
          <Text style={styles.motivationEmoji}>
            {stats.dailyStreak >= 7 ? '🌟' : stats.dailyStreak >= 3 ? '💪' : '🎯'}
          </Text>
          <Text style={styles.motivationText}>
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
    backgroundColor: '#0f0f1a',
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
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 8,
  },
  mainStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1e1e3a',
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
    color: '#ffffff',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  detailsCard: {
    backgroundColor: '#1e1e3a',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d44',
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#2d2d44',
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
    color: '#94a3b8',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontVariant: ['tabular-nums'],
  },
  motivationCard: {
    backgroundColor: '#2a2a4a',
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
    color: '#a855f7',
    textAlign: 'center',
    fontWeight: '500',
  },
});
