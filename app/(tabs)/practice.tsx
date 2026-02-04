/**
 * Practice mode screen - Free for all users
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme';
import { trackScreenView } from '../../src/services/analytics';

export default function PracticeScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  // Track screen view
  useEffect(() => {
    trackScreenView('Practice');
  }, []);

  const handlePlay = () => {
    router.push('/game/practice');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Practice Mode</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Unlimited puzzles to sharpen your skills
          </Text>
        </View>

        {/* Puzzle details */}
        <View style={[styles.detailsCard, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.detailsTitle, { color: theme.text }]}>Puzzle Settings</Text>
          <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Grid Size</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>7x7</Text>
          </View>
          <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Target Sum</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>18</Text>
          </View>
          <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Min Line Length</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>3 cells</Text>
          </View>
          <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Cell Values</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>1-8</Text>
          </View>
        </View>

        {/* Play button */}
        <View style={styles.playSection}>
          <Pressable
            style={({ pressed }) => [
              styles.playButton,
              { backgroundColor: pressed ? theme.primaryDark : theme.success },
              pressed && styles.playButtonPressed,
            ]}
            onPress={handlePlay}
          >
            <Text style={styles.playButtonText}>Start Practice</Text>
          </Pressable>
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
    marginTop: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
  },
  detailsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 15,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  playSection: {
    alignItems: 'center',
  },
  playButton: {
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  playButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  playButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
});
