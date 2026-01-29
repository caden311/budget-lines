/**
 * Cell component for Budget Lines
 * Displays a single cell on the game grid
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { Cell as CellType } from '../core/types';

interface CellProps {
  cell: CellType;
  size: number;
  isOverTarget: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Cell({ cell, size, isOverTarget }: CellProps) {
  const { state, value } = cell;
  
  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = (() => {
      switch (state) {
        case 'spent':
          return '#1a1a2e';
        case 'in-path':
          return isOverTarget ? '#dc2626' : '#10b981';
        default:
          return '#2d2d44';
      }
    })();
    
    const scale = state === 'in-path' ? 0.95 : 1;
    const borderColor = state === 'in-path' 
      ? (isOverTarget ? '#ef4444' : '#34d399')
      : 'transparent';
    
    return {
      backgroundColor: withTiming(backgroundColor, { duration: 150 }),
      transform: [{ scale: withSpring(scale, { damping: 15 }) }],
      borderColor: withTiming(borderColor, { duration: 150 }),
    };
  }, [state, isOverTarget]);
  
  const textStyle = useAnimatedStyle(() => {
    const color = state === 'spent' ? '#4a4a5c' : '#ffffff';
    const opacity = state === 'spent' ? 0.5 : 1;
    
    return {
      color: withTiming(color, { duration: 150 }),
      opacity: withTiming(opacity, { duration: 150 }),
    };
  }, [state]);
  
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
