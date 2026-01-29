/**
 * Game HUD component for Budget Lines
 * Displays target sum, current sum, lines found, and reset button
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface GameHUDProps {
  targetSum: number;
  currentSum: number;
  minLineLength: number;
  currentPathLength: number;
  linesFound: number;
  remainingCells: number;
  onReset: () => void;
}

export function GameHUD({
  targetSum,
  currentSum,
  minLineLength,
  currentPathLength,
  linesFound,
  remainingCells,
  onReset,
}: GameHUDProps) {
  const isOverTarget = currentSum > targetSum;
  const isExactMatch = currentSum === targetSum && currentPathLength >= minLineLength;
  
  const sumStyle = useAnimatedStyle(() => {
    let color = '#94a3b8'; // Default gray
    
    if (currentSum > 0) {
      if (isExactMatch) {
        color = '#34d399'; // Green for exact match
      } else if (isOverTarget) {
        color = '#ef4444'; // Red for over
      } else {
        color = '#fbbf24'; // Yellow for in progress
      }
    }
    
    return {
      color: withTiming(color, { duration: 100 }),
    };
  }, [currentSum, isOverTarget, isExactMatch]);
  
  return (
    <View style={styles.container}>
      {/* Top row - Target and Lines */}
      <View style={styles.topRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>TARGET</Text>
          <Text style={styles.targetValue}>{targetSum}</Text>
        </View>
        
        <View style={styles.stat}>
          <Text style={styles.statLabel}>LINES</Text>
          <Text style={styles.statValue}>{linesFound}</Text>
        </View>
        
        <View style={styles.stat}>
          <Text style={styles.statLabel}>CELLS</Text>
          <Text style={styles.statValue}>{remainingCells}</Text>
        </View>
      </View>
      
      {/* Current sum display */}
      <View style={styles.sumContainer}>
        <Text style={styles.sumLabel}>Current Sum</Text>
        <View style={styles.sumRow}>
          <Animated.Text style={[styles.sumValue, sumStyle]}>
            {currentSum || '—'}
          </Animated.Text>
          <Text style={styles.sumTarget}>/ {targetSum}</Text>
        </View>
        <Text style={styles.lengthHint}>
          {currentPathLength > 0 
            ? `${currentPathLength} cells (min ${minLineLength})`
            : `Draw ${minLineLength}+ cells`
          }
        </Text>
      </View>
      
      {/* Reset button */}
      <Pressable 
        style={({ pressed }) => [
          styles.resetButton,
          pressed && styles.resetButtonPressed
        ]}
        onPress={onReset}
      >
        <Text style={styles.resetButtonText}>↺ Reset Puzzle</Text>
      </Pressable>
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
    color: '#64748b',
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#e2e8f0',
    fontVariant: ['tabular-nums'],
  },
  targetValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#a855f7',
    fontVariant: ['tabular-nums'],
  },
  sumContainer: {
    alignItems: 'center',
    backgroundColor: '#1e1e3a',
    borderRadius: 16,
    padding: 20,
  },
  sumLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
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
    color: '#475569',
    fontVariant: ['tabular-nums'],
  },
  lengthHint: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 8,
  },
  resetButton: {
    backgroundColor: '#2d2d44',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetButtonPressed: {
    backgroundColor: '#3d3d5c',
    transform: [{ scale: 0.98 }],
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
  },
});
