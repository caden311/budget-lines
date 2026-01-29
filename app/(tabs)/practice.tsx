/**
 * Practice mode screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme';
import { useUserStore } from '../../src/stores/userStore';
import { Difficulty } from '../../src/core/types';
import { getDifficultyConfig } from '../../src/core/puzzleGenerator';

const DIFFICULTIES: { id: Difficulty; name: string; emoji: string }[] = [
  { id: 'easy', name: 'Easy', emoji: '🌱' },
  { id: 'medium', name: 'Medium', emoji: '🌿' },
  { id: 'hard', name: 'Hard', emoji: '🌲' },
];

export default function PracticeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { premium, preferredDifficulty, setPreferredDifficulty } = useUserStore();
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(preferredDifficulty);
  
  const config = getDifficultyConfig(selectedDifficulty);
  
  const handlePlay = () => {
    setPreferredDifficulty(selectedDifficulty);
    router.push('/game/practice');
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Practice Mode</Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>Unlimited puzzles to sharpen your skills</Text>
        </View>
        
        {/* Difficulty selector */}
        <View style={styles.difficultySection}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Select Difficulty</Text>
          
          <View style={styles.difficultyOptions}>
            {DIFFICULTIES.map((diff) => (
              <Pressable
                key={diff.id}
                style={[
                  styles.difficultyCard,
                  { backgroundColor: theme.cardBackground },
                  selectedDifficulty === diff.id && { 
                    borderColor: theme.primary,
                    backgroundColor: theme.backgroundTertiary,
                  },
                ]}
                onPress={() => setSelectedDifficulty(diff.id)}
              >
                <Text style={styles.difficultyEmoji}>{diff.emoji}</Text>
                <Text style={[
                  styles.difficultyName,
                  { color: theme.textSecondary },
                  selectedDifficulty === diff.id && { color: theme.text },
                ]}>
                  {diff.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        
        {/* Difficulty details */}
        <View style={[styles.detailsCard, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.detailsTitle, { color: theme.text }]}>Puzzle Settings</Text>
          <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Grid Size</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>{config.gridSize}×{config.gridSize}</Text>
          </View>
          <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Target Sum</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>{config.targetSum}</Text>
          </View>
          <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Min Line Length</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>{config.minLineLength} cells</Text>
          </View>
          <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Cell Values</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>{config.valueRange.min}-{config.valueRange.max}</Text>
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
          
          {!premium.isPremium && (
            <Text style={[styles.premiumHint, { color: theme.textMuted }]}>
              Practice mode is free during beta!
            </Text>
          )}
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
  difficultySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  difficultyOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  difficultyCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  difficultyEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  difficultyName: {
    fontSize: 16,
    fontWeight: '600',
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
  premiumHint: {
    fontSize: 13,
    marginTop: 12,
  },
});
