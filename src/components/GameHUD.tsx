/**
 * Game HUD component for Budget Lines
 * Displays target sum, current sum, lines found, reset and hint buttons
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  withSpring,
  runOnJS,
  Easing,
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
  hintUsed?: boolean;
}

// Floating +1 indicator component
function FloatingPlusOne({ theme, onComplete }: { theme: any; onComplete: () => void }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withSpring(1.2, { damping: 8, stiffness: 200 });
    translateY.value = withTiming(-50, { duration: 800, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(0, { duration: 800, easing: Easing.in(Easing.cubic) }, () => {
      runOnJS(onComplete)();
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[styles.floatingPlusOne, { color: theme.success }, animatedStyle]}>
      +1
    </Animated.Text>
  );
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
  hintUsed = false,
}: GameHUDProps) {
  const { theme } = useTheme();
  const isOverTarget = currentSum > targetSum;
  const isExactMatch = currentSum === targetSum && currentPathLength >= minLineLength;
  
  // Track previous lines count for animation
  const prevLinesRef = useRef(linesFound);
  const [showPlusOne, setShowPlusOne] = useState(false);
  
  // Animated values for lines counter
  const linesScale = useSharedValue(1);
  
  // Detect when lines count increases
  useEffect(() => {
    if (linesFound > prevLinesRef.current) {
      // Trigger pulse animation
      linesScale.value = withSequence(
        withSpring(1.4, { damping: 6, stiffness: 300 }),
        withSpring(1, { damping: 8, stiffness: 200 })
      );
      // Show floating +1
      setShowPlusOne(true);
    }
    prevLinesRef.current = linesFound;
  }, [linesFound]);
  
  const linesAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: linesScale.value }],
  }));
  
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
          <View style={styles.linesContainer}>
            <Animated.Text style={[styles.statValue, styles.linesValue, { color: theme.success }, linesAnimatedStyle]}>
              {linesFound}
            </Animated.Text>
            {showPlusOne && (
              <FloatingPlusOne 
                theme={theme} 
                onComplete={() => setShowPlusOne(false)} 
              />
            )}
          </View>
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
              { backgroundColor: isPremium && !hintUsed ? theme.warning : theme.buttonSecondary },
              (pressed || hintUsed) && styles.buttonPressed
            ]}
            onPress={onHint}
            disabled={hintUsed}
          >
            <Text style={[
              styles.buttonText, 
              { color: isPremium && !hintUsed ? '#000' : theme.textSecondary },
              hintUsed && { opacity: 0.5 }
            ]}>
              💡 {hintUsed ? 'Used' : (isPremium ? 'Hint' : '🔒 Hint')}
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
  linesContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linesValue: {
    fontWeight: '800',
  },
  floatingPlusOne: {
    position: 'absolute',
    fontSize: 20,
    fontWeight: '800',
    top: 0,
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
