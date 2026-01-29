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
  const { premium, preferredDifficulty, setPreferredDifficulty } = useUserStore();
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(preferredDifficulty);
  
  const config = getDifficultyConfig(selectedDifficulty);
  
  const handlePlay = () => {
    setPreferredDifficulty(selectedDifficulty);
    router.push('/game/practice');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Practice Mode</Text>
          <Text style={styles.subtitle}>Unlimited puzzles to sharpen your skills</Text>
        </View>
        
        {/* Difficulty selector */}
        <View style={styles.difficultySection}>
          <Text style={styles.sectionTitle}>Select Difficulty</Text>
          
          <View style={styles.difficultyOptions}>
            {DIFFICULTIES.map((diff) => (
              <Pressable
                key={diff.id}
                style={[
                  styles.difficultyCard,
                  selectedDifficulty === diff.id && styles.difficultyCardSelected,
                ]}
                onPress={() => setSelectedDifficulty(diff.id)}
              >
                <Text style={styles.difficultyEmoji}>{diff.emoji}</Text>
                <Text style={[
                  styles.difficultyName,
                  selectedDifficulty === diff.id && styles.difficultyNameSelected,
                ]}>
                  {diff.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        
        {/* Difficulty details */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Puzzle Settings</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Grid Size</Text>
            <Text style={styles.detailValue}>{config.gridSize}×{config.gridSize}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Target Sum</Text>
            <Text style={styles.detailValue}>{config.targetSum}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Min Line Length</Text>
            <Text style={styles.detailValue}>{config.minLineLength} cells</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Cell Values</Text>
            <Text style={styles.detailValue}>{config.valueRange.min}-{config.valueRange.max}</Text>
          </View>
        </View>
        
        {/* Play button */}
        <View style={styles.playSection}>
          <Pressable
            style={({ pressed }) => [
              styles.playButton,
              pressed && styles.playButtonPressed,
            ]}
            onPress={handlePlay}
          >
            <Text style={styles.playButtonText}>Start Practice</Text>
          </Pressable>
          
          {!premium.isPremium && (
            <Text style={styles.premiumHint}>
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
  difficultySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
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
    backgroundColor: '#1e1e3a',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  difficultyCardSelected: {
    borderColor: '#a855f7',
    backgroundColor: '#2a2a4a',
  },
  difficultyEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  difficultyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
  },
  difficultyNameSelected: {
    color: '#ffffff',
  },
  detailsCard: {
    backgroundColor: '#1e1e3a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d44',
  },
  detailLabel: {
    fontSize: 15,
    color: '#64748b',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    fontVariant: ['tabular-nums'],
  },
  playSection: {
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: '#10b981',
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  playButtonPressed: {
    backgroundColor: '#059669',
    transform: [{ scale: 0.98 }],
  },
  playButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  premiumHint: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 12,
  },
});
