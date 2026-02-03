/**
 * Tutorial component for SumTrails
 * Interactive, animated multi-step tutorial for first-time users
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TutorialProps {
  visible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

type TutorialStep = 'welcome' | 'goal' | 'demo' | 'practice' | 'complete';

const STEPS: TutorialStep[] = ['welcome', 'goal', 'demo', 'practice', 'complete'];

// Mini demo grid values
const DEMO_GRID = [
  [3, 5, 2],
  [4, 1, 6],
  [2, 3, 4],
];

// Target sum for demo (path: 3 + 4 + 2 + 3 = 12, or 3 + 5 + 4 = 12)
const DEMO_TARGET = 12;

// Demo path: cells (0,0) -> (1,0) -> (2,0) -> (2,1) = 3 + 4 + 2 + 3 = 12
const DEMO_PATH = [
  { row: 0, col: 0 },
  { row: 1, col: 0 },
  { row: 2, col: 0 },
  { row: 2, col: 1 },
];

// Cell size and gap for the practice grid
const CELL_SIZE = 56;
const CELL_GAP = 4;
const GRID_SIZE = 3;

export function Tutorial({ visible, onComplete, onSkip }: TutorialProps) {
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState<TutorialStep>('welcome');
  const [demoPathIndex, setDemoPathIndex] = useState(-1);
  const [practiceComplete, setPracticeComplete] = useState(false);
  const [practicePath, setPracticePath] = useState<{ row: number; col: number }[]>([]);
  
  // For gesture-based practice grid
  const lastCellId = useSharedValue<string | null>(null);
  const practicePathRef = useRef<{ row: number; col: number }[]>([]);

  // Animated values
  const handX = useSharedValue(0);
  const handY = useSharedValue(0);
  const handOpacity = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  // Reset state when tutorial opens
  useEffect(() => {
    if (visible) {
      setCurrentStep('welcome');
      setDemoPathIndex(-1);
      setPracticeComplete(false);
      setPracticePath([]);
      practicePathRef.current = [];
    }
  }, [visible]);
  
  // Keep ref in sync with state
  useEffect(() => {
    practicePathRef.current = practicePath;
  }, [practicePath]);

  // Animate demo path drawing
  useEffect(() => {
    if (currentStep === 'demo' && visible) {
      setDemoPathIndex(-1);
      let cancelled = false;
      
      // Start the demo animation sequence
      const animateDemo = async () => {
        if (cancelled) return;
        for (let i = 0; i < DEMO_PATH.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 600));
          if (cancelled) return;
          setDemoPathIndex(i);
        }
        // Pause at end then reset
        await new Promise(resolve => setTimeout(resolve, 1500));
        if (cancelled) return;
        setDemoPathIndex(-1);
        // Loop
        if (!cancelled) {
          setTimeout(animateDemo, 500);
        }
      };
      
      const timeout = setTimeout(animateDemo, 500);
      return () => {
        cancelled = true;
        clearTimeout(timeout);
      };
    }
  }, [currentStep, visible]);

  // Animate hand gesture
  useEffect(() => {
    if (currentStep === 'demo' || currentStep === 'practice') {
      // Hand animation synced to demo path timing (~4400ms cycle)
      // Demo timing: 500ms initial delay, then 600ms per cell (4 cells), 1500ms pause, 500ms before next
      // Path: (0,0) → (1,0) → (2,0) → (2,1) = down, down, right
      
      // Opacity: visible during animation, fade out during pause
      handOpacity.value = withRepeat(
        withSequence(
          withDelay(500, withTiming(1, { duration: 200 })),  // Fade in after initial delay
          withDelay(2200, withTiming(0, { duration: 300 })), // Fade out after cells complete (500+200+2200=2900ms)
          withDelay(1500, withTiming(0, { duration: 0 }))    // Stay invisible during reset (total ~4400ms)
        ),
        -1,
        false
      );
      
      // X: stay at 0 while moving down (cells 0→1→2), then move right (cell 2→3)
      handX.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 500 }),     // Initial delay (match demo's setTimeout)
          withTiming(0, { duration: 1800 }),    // Stay at X=0 for 3 cells going down (600ms × 3)
          withTiming(60, { duration: 600, easing: Easing.inOut(Easing.ease) }), // Move right for cell 3
          withDelay(1500, withTiming(0, { duration: 0 })) // Reset after pause (total ~4400ms)
        ),
        -1,
        false
      );
      
      // Y: move down for first 3 cells, then stay while X moves right
      handY.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 500 }),     // Initial delay
          withTiming(120, { duration: 1800, easing: Easing.inOut(Easing.ease) }), // Move down (3 cells × 600ms)
          withTiming(120, { duration: 600 }),   // Stay at Y=120 while X moves right
          withDelay(1500, withTiming(0, { duration: 0 })) // Reset after pause
        ),
        -1,
        false
      );
    } else {
      cancelAnimation(handOpacity);
      cancelAnimation(handX);
      cancelAnimation(handY);
    }
  }, [currentStep, handX, handY, handOpacity]);

  // Pulse animation for practice cells
  useEffect(() => {
    if (currentStep === 'practice' && !practiceComplete) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(pulseScale);
      pulseScale.value = 1;
    }
  }, [currentStep, practiceComplete, pulseScale]);

  const handStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: handX.value },
      { translateY: handY.value },
    ],
    opacity: handOpacity.value,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const stepIndex = STEPS.indexOf(currentStep);

  const goToNextStep = useCallback(() => {
    const nextIndex = stepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
    }
    if (currentStep === 'complete') {
      onComplete();
    }
  }, [stepIndex, currentStep, onComplete]);

  const goToPrevStep = useCallback(() => {
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
    }
  }, [stepIndex]);

  // Convert touch position to cell coordinates
  const getCellFromPosition = (x: number, y: number): { row: number; col: number } | null => {
    'worklet';
    const col = Math.floor(x / (CELL_SIZE + CELL_GAP));
    const row = Math.floor(y / (CELL_SIZE + CELL_GAP));
    
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) {
      return null;
    }
    
    return { row, col };
  };
  
  // Handle adding a cell to the practice path (called from JS thread)
  const handlePracticeCell = useCallback((row: number, col: number) => {
    if (practiceComplete) return;
    
    const currentPath = practicePathRef.current;
    const targetPath = DEMO_PATH;
    
    // Check if cell is already in path (backtrack)
    const existingIndex = currentPath.findIndex(p => p.row === row && p.col === col);
    if (existingIndex !== -1) {
      // Backtrack to this cell (keep it, remove everything after)
      const newPath = currentPath.slice(0, existingIndex + 1);
      setPracticePath(newPath);
      return;
    }
    
    // First cell - must be the start
    if (currentPath.length === 0) {
      if (row === targetPath[0].row && col === targetPath[0].col) {
        setPracticePath([{ row, col }]);
      }
      return;
    }
    
    // Check adjacency
    const lastCell = currentPath[currentPath.length - 1];
    const isAdjacent = 
      (Math.abs(lastCell.row - row) === 1 && lastCell.col === col) ||
      (Math.abs(lastCell.col - col) === 1 && lastCell.row === row);
    
    if (!isAdjacent) return;
    
    // Check if this is the expected next cell (for guided tutorial)
    const expectedNext = targetPath[currentPath.length];
    if (expectedNext && row === expectedNext.row && col === expectedNext.col) {
      const newPath = [...currentPath, { row, col }];
      setPracticePath(newPath);
      
      // Check if complete
      if (newPath.length === targetPath.length) {
        setPracticeComplete(true);
      }
    }
  }, [practiceComplete]);
  
  // Pan gesture for practice grid
  const practiceGesture = Gesture.Pan()
    .onStart((event) => {
      'worklet';
      const cell = getCellFromPosition(event.x, event.y);
      if (cell) {
        lastCellId.value = `${cell.row}-${cell.col}`;
        runOnJS(handlePracticeCell)(cell.row, cell.col);
      }
    })
    .onUpdate((event) => {
      'worklet';
      const cell = getCellFromPosition(event.x, event.y);
      if (cell) {
        const cellId = `${cell.row}-${cell.col}`;
        if (cellId !== lastCellId.value) {
          lastCellId.value = cellId;
          runOnJS(handlePracticeCell)(cell.row, cell.col);
        }
      }
    })
    .onEnd(() => {
      'worklet';
      lastCellId.value = null;
    });

  const renderDemoGrid = (interactive: boolean = false) => {
    const activePath = interactive ? practicePath : DEMO_PATH.slice(0, demoPathIndex + 1);
    
    const gridContent = (
      <View style={styles.demoGrid}>
        {DEMO_GRID.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.demoRow}>
            {row.map((value, colIndex) => {
              const isInPath = activePath.some(
                p => p.row === rowIndex && p.col === colIndex
              );
              const isHintCell = interactive && !practiceComplete && 
                practicePath.length < DEMO_PATH.length &&
                rowIndex === DEMO_PATH[practicePath.length]?.row && 
                colIndex === DEMO_PATH[practicePath.length]?.col;
              
              return (
                <Animated.View
                  key={colIndex}
                  style={[
                    styles.demoCell,
                    { 
                      backgroundColor: isInPath 
                        ? theme.cellInPath 
                        : theme.cellAvailable,
                      borderColor: isHintCell ? theme.primary : 'transparent',
                      borderWidth: isHintCell ? 2 : 0,
                    },
                    isHintCell && pulseStyle,
                  ]}
                >
                  <Text style={[
                    styles.demoCellText,
                    { color: isInPath ? '#ffffff' : theme.text }
                  ]}>
                    {value}
                  </Text>
                </Animated.View>
              );
            })}
          </View>
        ))}
      </View>
    );
    
    return (
      <View style={styles.demoGridContainer}>
        <View style={[styles.targetBadge, { backgroundColor: theme.primary }]}>
          <Text style={styles.targetText}>Target: {DEMO_TARGET}</Text>
        </View>
        
        {interactive && !practiceComplete ? (
          <GestureDetector gesture={practiceGesture}>
            <Animated.View>
              {gridContent}
            </Animated.View>
          </GestureDetector>
        ) : (
          gridContent
        )}
        
        {/* Current sum indicator */}
        {activePath.length > 0 && (
          <View style={styles.sumIndicator}>
            <Text style={[styles.sumText, { color: theme.textSecondary }]}>
              Sum: {activePath.reduce((sum, p) => sum + DEMO_GRID[p.row][p.col], 0)}
              {activePath.length === DEMO_PATH.length && ' ✓'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <Animated.View 
            entering={FadeIn.duration(400)}
            exiting={FadeOut.duration(200)}
            style={styles.stepContent}
          >
            <Text style={styles.welcomeEmoji}>👋</Text>
            <Text style={[styles.stepTitle, { color: theme.text }]}>
              Welcome to SumTrails!
            </Text>
            <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
              A relaxing puzzle game where you draw paths through numbered cells to reach a target sum.
            </Text>
            <Text style={[styles.stepHint, { color: theme.textMuted }]}>
              Let's learn how to play in just a few steps!
            </Text>
          </Animated.View>
        );
      
      case 'goal':
        return (
          <Animated.View 
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(200)}
            style={styles.stepContent}
          >
            <Text style={styles.welcomeEmoji}>🎯</Text>
            <Text style={[styles.stepTitle, { color: theme.text }]}>
              The Goal
            </Text>
            <View style={styles.goalList}>
              <View style={styles.goalItem}>
                <View style={[styles.goalNumber, { backgroundColor: theme.primary }]}>
                  <Text style={styles.goalNumberText}>1</Text>
                </View>
                <Text style={[styles.goalText, { color: theme.textSecondary }]}>
                  Draw a path by connecting adjacent cells
                </Text>
              </View>
              <View style={styles.goalItem}>
                <View style={[styles.goalNumber, { backgroundColor: theme.primary }]}>
                  <Text style={styles.goalNumberText}>2</Text>
                </View>
                <Text style={[styles.goalText, { color: theme.textSecondary }]}>
                  Make the sum of cells equal the target number
                </Text>
              </View>
              <View style={styles.goalItem}>
                <View style={[styles.goalNumber, { backgroundColor: theme.primary }]}>
                  <Text style={styles.goalNumberText}>3</Text>
                </View>
                <Text style={[styles.goalText, { color: theme.textSecondary }]}>
                  Clear all cells from the board to win!
                </Text>
              </View>
            </View>
          </Animated.View>
        );
      
      case 'demo':
        return (
          <Animated.View 
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(200)}
            style={styles.stepContent}
          >
            <Text style={[styles.stepTitle, { color: theme.text }]}>
              Watch How It Works
            </Text>
            {renderDemoGrid(false)}
            <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
              See how the path adds up to {DEMO_TARGET}!
            </Text>
            
            {/* Animated hand */}
            <Animated.View style={[styles.handContainer, handStyle]}>
              <Text style={styles.handEmoji}>👆</Text>
            </Animated.View>
          </Animated.View>
        );
      
      case 'practice':
        return (
          <Animated.View 
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(200)}
            style={styles.stepContent}
          >
            <Text style={[styles.stepTitle, { color: theme.text }]}>
              {practiceComplete ? '🎉 Perfect!' : 'Your Turn!'}
            </Text>
            {renderDemoGrid(true)}
            <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
              {practiceComplete 
                ? 'You got it! You\'re ready to play!'
                : 'Drag through cells to draw a path that adds up to 12'}
            </Text>
            {!practiceComplete && practicePath.length === 0 && (
              <Text style={[styles.stepHint, { color: theme.primary }]}>
                Start from the highlighted cell and drag!
              </Text>
            )}
          </Animated.View>
        );
      
      case 'complete':
        return (
          <Animated.View 
            entering={SlideInRight.duration(300)}
            exiting={SlideOutLeft.duration(200)}
            style={styles.stepContent}
          >
            <Text style={styles.welcomeEmoji}>🚀</Text>
            <Text style={[styles.stepTitle, { color: theme.text }]}>
              You're All Set!
            </Text>
            <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
              New puzzles appear daily. Challenge yourself to find all the lines and clear the board!
            </Text>
            <View style={styles.tipContainer}>
              <Text style={[styles.tipTitle, { color: theme.primary }]}>💡 Pro Tips</Text>
              <Text style={[styles.tipText, { color: theme.textMuted }]}>
                • Swipe to backtrack your path{'\n'}
                • Stuck? Try a different starting cell{'\n'}
              </Text>
            </View>
          </Animated.View>
        );
    }
  };

  const canProceed = currentStep !== 'practice' || practiceComplete;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onSkip}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.85)' }]}>
          <View style={[styles.modal, { backgroundColor: theme.cardBackground }]}>
            {/* Step indicators */}
            <View style={styles.stepIndicators}>
              {STEPS.map((step, index) => (
                <View
                  key={step}
                  style={[
                    styles.stepDot,
                    {
                      backgroundColor: index <= stepIndex 
                        ? theme.primary 
                        : theme.buttonSecondary,
                    },
                  ]}
                />
              ))}
            </View>
            
            {/* Content */}
            <View style={styles.contentContainer}>
              {renderStepContent()}
            </View>
            
            {/* Navigation */}
            <View style={styles.navigation}>
              {stepIndex > 0 && currentStep !== 'complete' && (
                <Pressable
                  style={[styles.navButton, styles.backButton, { borderColor: theme.border }]}
                  onPress={goToPrevStep}
                >
                  <Text style={[styles.backButtonText, { color: theme.textSecondary }]}>
                    Back
                  </Text>
                </Pressable>
              )}
              
              <Pressable
                style={[
                  styles.navButton,
                  styles.nextButton,
                  { 
                    backgroundColor: canProceed ? theme.primary : theme.buttonSecondary,
                    opacity: canProceed ? 1 : 0.5,
                  },
                  stepIndex === 0 && styles.fullWidthButton,
                ]}
                onPress={goToNextStep}
                disabled={!canProceed}
              >
                <Text style={[
                  styles.nextButtonText,
                  { color: canProceed ? '#ffffff' : theme.textMuted }
                ]}>
                  {currentStep === 'complete' ? 'Start Playing' : 'Continue'}
                </Text>
              </Pressable>
            </View>
            
            {/* Skip button */}
            {currentStep !== 'complete' && (
              <Pressable style={styles.skipButton} onPress={onSkip}>
                <Text style={[styles.skipButtonText, { color: theme.textMuted }]}>
                  Skip Tutorial
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  stepIndicators: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  contentContainer: {
    width: '100%',
    minHeight: 320,
    justifyContent: 'center',
  },
  stepContent: {
    alignItems: 'center',
    width: '100%',
  },
  welcomeEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  stepDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  stepHint: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  goalList: {
    width: '100%',
    gap: 16,
    marginTop: 8,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalNumberText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  goalText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  demoGridContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  targetBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  targetText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  demoGrid: {
    gap: 4,
  },
  demoRow: {
    flexDirection: 'row',
    gap: 4,
  },
  demoCell: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  demoCellText: {
    fontSize: 22,
    fontWeight: '700',
  },
  sumIndicator: {
    marginTop: 12,
  },
  sumText: {
    fontSize: 18,
    fontWeight: '600',
  },
  handContainer: {
    position: 'absolute',
    left: '30%',
    top: '35%',
  },
  handEmoji: {
    fontSize: 32,
  },
  tipContainer: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    width: '100%',
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 22,
  },
  navigation: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 24,
  },
  navButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  fullWidthButton: {
    flex: 1,
  },
  backButton: {
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {},
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  skipButton: {
    marginTop: 16,
    padding: 8,
  },
  skipButtonText: {
    fontSize: 14,
  },
});
