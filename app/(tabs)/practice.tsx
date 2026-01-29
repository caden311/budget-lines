/**
 * Practice mode screen - Premium feature
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
import { PremiumModal } from '../../src/components/PremiumModal';

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
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  
  const config = getDifficultyConfig(selectedDifficulty);
  const isPremium = premium.isPremium;
  
  const handlePlay = () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    setPreferredDifficulty(selectedDifficulty);
    router.push('/game/practice');
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: theme.text }]}>Practice Mode</Text>
            {!isPremium && (
              <View style={[styles.premiumBadge, { backgroundColor: theme.warning }]}>
                <Text style={styles.premiumBadgeText}>👑 PRO</Text>
              </View>
            )}
          </View>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Unlimited puzzles to sharpen your skills
          </Text>
        </View>
        
        {/* Premium upsell banner (if not premium) */}
        {!isPremium && (
          <Pressable
            style={[styles.upsellBanner, { backgroundColor: theme.backgroundTertiary }]}
            onPress={() => setShowPremiumModal(true)}
          >
            <Text style={styles.upsellEmoji}>✨</Text>
            <View style={styles.upsellContent}>
              <Text style={[styles.upsellTitle, { color: theme.text }]}>
                Unlock Practice Mode
              </Text>
              <Text style={[styles.upsellText, { color: theme.textMuted }]}>
                Play unlimited puzzles at any difficulty
              </Text>
            </View>
            <Text style={[styles.upsellArrow, { color: theme.textMuted }]}>→</Text>
          </Pressable>
        )}
        
        {/* Difficulty selector */}
        <View style={[styles.difficultySection, !isPremium && styles.lockedSection]}>
          <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Select Difficulty</Text>
          
          <View style={styles.difficultyOptions}>
            {DIFFICULTIES.map((diff) => (
              <Pressable
                key={diff.id}
                style={[
                  styles.difficultyCard,
                  { backgroundColor: theme.cardBackground },
                  selectedDifficulty === diff.id && { 
                    borderColor: isPremium ? theme.primary : theme.textMuted,
                    backgroundColor: theme.backgroundTertiary,
                  },
                  !isPremium && styles.lockedCard,
                ]}
                onPress={() => setSelectedDifficulty(diff.id)}
                disabled={!isPremium}
              >
                <Text style={[styles.difficultyEmoji, !isPremium && styles.lockedEmoji]}>
                  {diff.emoji}
                </Text>
                <Text style={[
                  styles.difficultyName,
                  { color: theme.textSecondary },
                  selectedDifficulty === diff.id && { color: theme.text },
                  !isPremium && { color: theme.textMuted },
                ]}>
                  {diff.name}
                </Text>
                {!isPremium && (
                  <Text style={styles.lockIcon}>🔒</Text>
                )}
              </Pressable>
            ))}
          </View>
        </View>
        
        {/* Difficulty details */}
        <View style={[
          styles.detailsCard, 
          { backgroundColor: theme.cardBackground },
          !isPremium && styles.lockedSection,
        ]}>
          <Text style={[styles.detailsTitle, { color: theme.text }]}>Puzzle Settings</Text>
          <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Grid Size</Text>
            <Text style={[styles.detailValue, { color: isPremium ? theme.text : theme.textMuted }]}>
              {isPremium ? `${config.gridSize}×${config.gridSize}` : '???'}
            </Text>
          </View>
          <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Target Sum</Text>
            <Text style={[styles.detailValue, { color: isPremium ? theme.text : theme.textMuted }]}>
              {isPremium ? config.targetSum : '???'}
            </Text>
          </View>
          <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Min Line Length</Text>
            <Text style={[styles.detailValue, { color: isPremium ? theme.text : theme.textMuted }]}>
              {isPremium ? `${config.minLineLength} cells` : '???'}
            </Text>
          </View>
          <View style={[styles.detailRow, { borderBottomColor: theme.border }]}>
            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Cell Values</Text>
            <Text style={[styles.detailValue, { color: isPremium ? theme.text : theme.textMuted }]}>
              {isPremium ? `${config.valueRange.min}-${config.valueRange.max}` : '???'}
            </Text>
          </View>
        </View>
        
        {/* Play button */}
        <View style={styles.playSection}>
          <Pressable
            style={({ pressed }) => [
              styles.playButton,
              { backgroundColor: pressed 
                ? (isPremium ? theme.primaryDark : theme.textMuted)
                : (isPremium ? theme.success : theme.buttonSecondary) 
              },
              pressed && styles.playButtonPressed,
            ]}
            onPress={handlePlay}
          >
            <Text style={[
              styles.playButtonText,
              !isPremium && { color: theme.text }
            ]}>
              {isPremium ? 'Start Practice' : '🔒 Unlock to Play'}
            </Text>
          </Pressable>
        </View>
      </View>
      
      <PremiumModal
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        feature="practice"
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
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
  },
  premiumBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  premiumBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
  },
  upsellBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    gap: 12,
  },
  upsellEmoji: {
    fontSize: 28,
  },
  upsellContent: {
    flex: 1,
  },
  upsellTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  upsellText: {
    fontSize: 13,
    marginTop: 2,
  },
  upsellArrow: {
    fontSize: 20,
    fontWeight: '600',
  },
  difficultySection: {
    marginBottom: 24,
  },
  lockedSection: {
    opacity: 0.6,
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
  lockedCard: {
    opacity: 0.8,
  },
  difficultyEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  lockedEmoji: {
    opacity: 0.5,
  },
  difficultyName: {
    fontSize: 16,
    fontWeight: '600',
  },
  lockIcon: {
    fontSize: 14,
    marginTop: 6,
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
