/**
 * Home screen - Daily puzzle entry
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../src/stores/userStore';
import { hasSavedProgress } from '../../src/utils/storage';
import { getDailyPuzzleId } from '../../src/core/puzzleGenerator';

export default function HomeScreen() {
  const router = useRouter();
  const { stats, isLoading } = useUserStore();
  const [hasProgress, setHasProgress] = useState(false);
  
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  
  useEffect(() => {
    const checkProgress = async () => {
      const puzzleId = getDailyPuzzleId(today);
      const saved = await hasSavedProgress(puzzleId);
      setHasProgress(saved);
    };
    checkProgress();
  }, []);
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Budget Lines</Text>
          <Text style={styles.tagline}>Draw paths. Hit the sum.</Text>
        </View>
        
        {/* Daily puzzle card */}
        <View style={styles.dailyCard}>
          <Text style={styles.dailyLabel}>TODAY'S PUZZLE</Text>
          <Text style={styles.dailyDate}>{dateString}</Text>
          
          <Pressable
            style={({ pressed }) => [
              styles.playButton,
              pressed && styles.playButtonPressed,
            ]}
            onPress={() => router.push('/game/daily')}
          >
            <Text style={styles.playButtonText}>
              {hasProgress ? 'Continue' : 'Play'}
            </Text>
          </Pressable>
          
          {hasProgress && (
            <Text style={styles.progressHint}>Progress saved</Text>
          )}
        </View>
        
        {/* Streak display */}
        <View style={styles.streakCard}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <View style={styles.streakInfo}>
            <Text style={styles.streakValue}>{stats.dailyStreak}</Text>
            <Text style={styles.streakLabel}>Day Streak</Text>
          </View>
        </View>
        
        {/* How to play */}
        <View style={styles.howToPlay}>
          <Text style={styles.howToPlayTitle}>How to Play</Text>
          <View style={styles.rule}>
            <Text style={styles.ruleNumber}>1</Text>
            <Text style={styles.ruleText}>Draw a path through adjacent cells</Text>
          </View>
          <View style={styles.rule}>
            <Text style={styles.ruleNumber}>2</Text>
            <Text style={styles.ruleText}>Make the path sum equal the target</Text>
          </View>
          <View style={styles.rule}>
            <Text style={styles.ruleNumber}>3</Text>
            <Text style={styles.ruleText}>Use all cells to win!</Text>
          </View>
        </View>
      </View>
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
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  logo: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 8,
  },
  dailyCard: {
    backgroundColor: '#1e1e3a',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 20,
  },
  dailyLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#a855f7',
    letterSpacing: 2,
    marginBottom: 8,
  },
  dailyDate: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 24,
  },
  playButton: {
    backgroundColor: '#a855f7',
    paddingVertical: 18,
    paddingHorizontal: 64,
    borderRadius: 16,
  },
  playButtonPressed: {
    backgroundColor: '#9333ea',
    transform: [{ scale: 0.98 }],
  },
  playButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  progressHint: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 12,
  },
  streakCard: {
    backgroundColor: '#1e1e3a',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  streakEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  streakInfo: {
    flex: 1,
  },
  streakValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
  },
  streakLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  howToPlay: {
    gap: 12,
  },
  howToPlayTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  rule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ruleNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2d2d44',
    textAlign: 'center',
    lineHeight: 28,
    fontSize: 14,
    fontWeight: '700',
    color: '#a855f7',
  },
  ruleText: {
    flex: 1,
    fontSize: 15,
    color: '#94a3b8',
  },
});
