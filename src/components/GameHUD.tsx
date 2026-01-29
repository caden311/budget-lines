/**
 * Game HUD component for Budget Lines
 * Displays target sum, current sum, lines found, reset and hint buttons
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../theme';

interface GameHUDProps {
  targetSum: number;
  currentSum: number;
  minLineLength: number;
  currentPathLength: number;
  linesFound: number;
  remainingCells: number;
  onReset: () => void;
  onHint?: () => void;
  isPremium?: boolean;
  hintCellId?: string | null;
}

export function GameHUD({
  targetSum,
  currentSum,
  minLineLength,
  currentPathLength,
  linesFound,
  remainingCells,
  onReset,
  onHint,
  isPremium = false,
  hintCellId,
}: GameHUDProps) {
  const { theme } = useTheme();
  const isOverTarget = currentSum > targetSum;
  const isExactMatch = currentSum === targetSum && currentPathLength >= minLineLength;
  
  const sumStyle = useAnimatedStyle(() => {
    let color = theme.textMuted; // Default gray
    
    if (currentSum > 0) {
      if (isExactMatch) {
        color = theme.success; // Green for exact match
      } else if (isOverTarget) {
        color = theme.error; // Red for over
      } else {
        color = theme.warning; // Amber for in progress
      }
    }
    
    return {
      color: withTiming(color, { duration: 100 }),
    };
  }, [currentSum, isOverTarget, isExactMatch, theme]);
  
  return (
    <View style={styles.container}>
      {/* Top row - Target and Lines */}
      <View style={styles.topRow}>
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>TARGET</Text>
          <Text style={[styles.targetValue, { color: theme.primary }]}>{targetSum}</Text>
        </View>
        
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>LINES</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>{linesFound}</Text>
        </View>
        
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { color: theme.textMuted }]}>CELLS</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>{remainingCells}</Text>
        </View>
      </View>
      
      {/* Current sum display */}
      <View style={[styles.sumContainer, { backgroundColor: theme.cardBackground }]}>
        <Text style={[styles.sumLabel, { color: theme.textMuted }]}>Current Sum</Text>
        <View style={styles.sumRow}>
          <Animated.Text style={[styles.sumValue, sumStyle]}>
            {currentSum || '—'}
          </Animated.Text>
          <Text style={[styles.sumTarget, { color: theme.textMuted }]}>/ {targetSum}</Text>
        </View>
        <Text style={[styles.lengthHint, { color: theme.textMuted }]}>
          {currentPathLength > 0 
            ? `${currentPathLength} cells (min ${minLineLength})`
            : `Draw ${minLineLength}+ cells`
          }
        </Text>
      </View>
      
      {/* Hint indicator */}
      {hintCellId && (
        <View style={[styles.hintBanner, { backgroundColor: theme.backgroundTertiary }]}>
          <Text style={styles.hintEmoji}>💡</Text>
          <Text style={[styles.hintText, { color: theme.text }]}>
            Hint: Look for the glowing cell!
          </Text>
        </View>
      )}
      
      {/* Action buttons */}
      <View style={styles.buttonRow}>
        <Pressable 
          style={({ pressed }) => [
            styles.actionButton,
            styles.resetButton,
            { backgroundColor: theme.buttonSecondary },
            pressed && styles.buttonPressed
          ]}
          onPress={onReset}
        >
          <Text style={[styles.buttonText, { color: theme.textSecondary }]}>↺ Reset</Text>
        </Pressable>
        
        {onHint && (
          <Pressable 
            style={({ pressed }) => [
              styles.actionButton,
              styles.hintButton,
              { backgroundColor: isPremium ? theme.warning : theme.buttonSecondary },
              pressed && styles.buttonPressed
            ]}
            onPress={onHint}
          >
            <Text style={[
              styles.buttonText, 
              { color: isPremium ? '#000' : theme.textSecondary }
            ]}>
              💡 {isPremium ? 'Hint' : '🔒 Hint'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  stat: {
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  targetValue: {
    fontSize: 32,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  sumContainer: {
    alignItems: 'center',
    borderRadius: 16,
    padding: 20,
  },
  sumLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sumRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  sumValue: {
    fontSize: 48,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  sumTarget: {
    fontSize: 24,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  lengthHint: {
    fontSize: 13,
    marginTop: 8,
  },
  hintBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  hintEmoji: {
    fontSize: 20,
  },
  hintText: {
    fontSize: 14,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetButton: {},
  hintButton: {},
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.8,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
