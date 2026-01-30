/**
 * LineCelebration component
 * Displays a brief confetti/sparkle burst when a line is successfully committed
 */

import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface LineCelebrationProps {
  visible: boolean;
  onComplete: () => void;
}

interface ParticleProps {
  index: number;
  color: string;
  startX: number;
  startY: number;
  angle: number;
  distance: number;
  delay: number;
  size: number;
  isSparkle: boolean;
}

function Particle({ 
  index, 
  color, 
  startX, 
  startY, 
  angle, 
  distance, 
  delay, 
  size,
  isSparkle,
}: ParticleProps) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Burst outward
    scale.value = withDelay(delay, withSpring(1, { damping: 8, stiffness: 200 }));
    progress.value = withDelay(delay, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));
    rotation.value = withDelay(delay, withTiming(360 * (Math.random() > 0.5 ? 1 : -1), { duration: 600 }));
    opacity.value = withDelay(delay + 300, withTiming(0, { duration: 300 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const x = Math.cos(angle) * distance * progress.value;
    const y = Math.sin(angle) * distance * progress.value - (50 * progress.value * progress.value); // Arc upward
    
    return {
      transform: [
        { translateX: startX + x },
        { translateY: startY + y },
        { scale: scale.value * (1 - progress.value * 0.5) },
        { rotate: `${rotation.value}deg` },
      ],
      opacity: opacity.value,
    };
  });

  if (isSparkle) {
    return (
      <Animated.View style={[styles.sparkle, animatedStyle]}>
        <View style={[styles.sparkleCore, { backgroundColor: color, width: size, height: size }]} />
        <View style={[styles.sparkleRayH, { backgroundColor: color, width: size * 2.5, height: size * 0.3 }]} />
        <View style={[styles.sparkleRayV, { backgroundColor: color, width: size * 0.3, height: size * 2.5 }]} />
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

export function LineCelebration({ visible, onComplete }: LineCelebrationProps) {
  const { theme } = useTheme();
  
  // Celebration colors - vibrant and joyful
  const colors = useMemo(() => [
    theme.success,
    theme.primary,
    theme.warning,
    '#FF6B6B', // coral
    '#4ECDC4', // teal
    '#FFE66D', // yellow
    '#95E1D3', // mint
  ], [theme]);

  // Generate particles
  const particles = useMemo(() => {
    if (!visible) return [];
    
    const centerX = SCREEN_WIDTH / 2 - 10;
    const centerY = SCREEN_HEIGHT / 3;
    const particleCount = 24;
    
    return Array.from({ length: particleCount }, (_, i) => {
      const angle = (i / particleCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const distance = 80 + Math.random() * 60;
      const delay = Math.random() * 100;
      const size = 8 + Math.random() * 8;
      const isSparkle = i % 4 === 0; // Every 4th particle is a sparkle
      
      return {
        index: i,
        color: colors[i % colors.length],
        startX: centerX,
        startY: centerY,
        angle,
        distance,
        delay,
        size,
        isSparkle,
      };
    });
  }, [visible, colors]);

  // Trigger completion callback
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onComplete();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [visible, onComplete]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((particle) => (
        <Particle key={particle.index} {...particle} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  particle: {
    position: 'absolute',
  },
  sparkle: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleCore: {
    position: 'absolute',
    borderRadius: 100,
  },
  sparkleRayH: {
    position: 'absolute',
    borderRadius: 100,
  },
  sparkleRayV: {
    position: 'absolute',
    borderRadius: 100,
  },
});
