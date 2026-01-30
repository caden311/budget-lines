/**
 * Home screen - Daily puzzle entry
 */

import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getDailyPuzzleId } from '../../src/core/puzzleGenerator';
import { trackScreenView } from '../../src/services/analytics';
import { useUserStore } from '../../src/stores/userStore';
import { useTheme } from '../../src/theme';
import { hasSavedProgress } from '../../src/utils/storage';

export default function HomeScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { stats, isLoading } = useUserStore();
  const [hasProgress, setHasProgress] = useState(false);
  const [today, setToday] = useState(() => new Date());
  
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  
  // Track screen view
  useEffect(() => {
    trackScreenView('Home');
  }, []);
  
  // Refresh date and check progress when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const now = new Date();
      setToday(now);
      
      const checkProgress = async () => {
        const puzzleId = getDailyPuzzleId(now);
        const saved = await hasSavedProgress(puzzleId);
        setHasProgress(saved);
      };
      checkProgress();
    }, [])
  );
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.logo, { color: theme.text }]}>Budget Lines</Text>
          <Text style={[styles.tagline, { color: theme.textMuted }]}>Draw paths. Hit the sum.</Text>
        </View>
        
        {/* Daily puzzle card */}
        <View style={[styles.dailyCard, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.dailyLabel, { color: theme.primary }]}>TODAY'S PUZZLE</Text>
          <Text style={[styles.dailyDate, { color: theme.text }]}>{dateString}</Text>
          
          <Pressable
            style={({ pressed }) => [
              styles.playButton,
              { backgroundColor: pressed ? theme.primaryDark : theme.primary },
              pressed && styles.playButtonPressed,
            ]}
            onPress={() => router.push('/game/daily')}
          >
            <Text style={styles.playButtonText}>
              {hasProgress ? 'Continue' : 'Play'}
            </Text>
          </Pressable>
          
          {hasProgress && (
            <Text style={[styles.progressHint, { color: theme.textMuted }]}>Progress saved</Text>
          )}
        </View>
        
        {/* Streak display */}
        <View style={[styles.streakCard, { backgroundColor: theme.cardBackground }]}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <View style={styles.streakInfo}>
            <Text style={[styles.streakValue, { color: theme.text }]}>{stats.dailyStreak}</Text>
            <Text style={[styles.streakLabel, { color: theme.textMuted }]}>Day Streak</Text>
          </View>
        </View>
        
        {/* How to play */}
        <View style={styles.howToPlay}>
          <Text style={[styles.howToPlayTitle, { color: theme.text }]}>How to Play</Text>
          <View style={styles.rule}>
            <Text style={[styles.ruleNumber, { backgroundColor: theme.buttonSecondary, color: theme.primary }]}>1</Text>
            <Text style={[styles.ruleText, { color: theme.textSecondary }]}>Draw a path through adjacent cells</Text>
          </View>
          <View style={styles.rule}>
            <Text style={[styles.ruleNumber, { backgroundColor: theme.buttonSecondary, color: theme.primary }]}>2</Text>
            <Text style={[styles.ruleText, { color: theme.textSecondary }]}>Make the path sum equal the target</Text>
          </View>
          <View style={styles.rule}>
            <Text style={[styles.ruleNumber, { backgroundColor: theme.buttonSecondary, color: theme.primary }]}>3</Text>
            <Text style={[styles.ruleText, { color: theme.textSecondary }]}>Clear all cells — more lines = higher score! 🎉</Text>
          </View>
        </View>
      </View>
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
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  logo: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    marginTop: 8,
  },
  dailyCard: {
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 20,
  },
  dailyLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  dailyDate: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 24,
  },
  playButton: {
    paddingVertical: 18,
    paddingHorizontal: 64,
    borderRadius: 16,
  },
  playButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  playButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  progressHint: {
    fontSize: 13,
    marginTop: 12,
  },
  streakCard: {
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
  },
  streakLabel: {
    fontSize: 14,
  },
  howToPlay: {
    gap: 12,
  },
  howToPlayTitle: {
    fontSize: 18,
    fontWeight: '700',
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
    textAlign: 'center',
    lineHeight: 28,
    fontSize: 14,
    fontWeight: '700',
  },
  ruleText: {
    flex: 1,
    fontSize: 15,
  },
});
