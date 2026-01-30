/**
 * Cell component for SumTrails
 * Displays a single cell on the game grid
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Cell as CellType } from '../core/types';
import { useTheme } from '../theme';

interface CellProps {
  cell: CellType;
  size: number;
  isOverTarget: boolean;
  isHinted?: boolean;
}

export function Cell({ cell, size, isOverTarget, isHinted = false }: CellProps) {
  const { theme, isDark } = useTheme();
  const { state, value } = cell;
  
  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = (() => {
      switch (state) {
        case 'spent':
          return theme.cellSpent;
        case 'in-path':
          return isOverTarget ? theme.cellInPathOver : theme.cellInPath;
        default:
          return isHinted ? theme.warning : theme.cellAvailable;
      }
    })();
    
    const scale = state === 'in-path' ? 0.95 : (isHinted ? 1.05 : 1);
    const borderColor = (() => {
      if (state === 'in-path') {
        return isOverTarget ? theme.pathStrokeOver : theme.pathStroke;
      }
      if (isHinted) {
        return theme.warning;
      }
      return 'transparent';
    })();
    
    return {
      backgroundColor: withTiming(backgroundColor, { duration: 150 }),
      transform: [{ scale: withSpring(scale, { damping: 15 }) }],
      borderColor: withTiming(borderColor, { duration: 150 }),
    };
  }, [state, isOverTarget, isHinted, theme]);
  
  const textStyle = useAnimatedStyle(() => {
    const color = state === 'spent' 
      ? theme.textMuted 
      : (state === 'in-path' ? '#ffffff' : theme.text);
    const opacity = state === 'spent' ? 0.4 : 1;
    
    return {
      color: withTiming(color, { duration: 150 }),
      opacity: withTiming(opacity, { duration: 150 }),
    };
  }, [state, theme]);
  
  return (
    <Animated.View
      style={[
        styles.cell,
        { width: size, height: size },
        animatedStyle,
      ]}
    >
      <Animated.Text style={[styles.value, textStyle]}>
        {value}
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cell: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
    margin: 3,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
