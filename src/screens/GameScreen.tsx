/**
 * Main Game Screen for SumTrails
 */

import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  AppStateStatus,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as StoreReview from 'expo-store-review';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { GameBoard, GameHUD, GameModal, LineCelebration } from '../components';
import { getDailyPuzzleId } from '../core/puzzleGenerator';
import { GameMode, ScoreResult } from '../core/types';
import {
  trackHintRequested,
  trackLineCommitted,
  trackPuzzleCompleted,
  trackPuzzleReset,
  trackPuzzleStarted,
  trackScreenView,
} from '../services/analytics';
import { UNLIMITED_HINTS_ENABLED } from '../config';
import { useGameStore } from '../stores/gameStore';
import { useUserStore } from '../stores/userStore';
import { useTheme } from '../theme';
import { heavyTap, lightTap, success } from '../utils/haptics';
import { calculateScore } from '../utils/scoring';

interface GameScreenProps {
  mode: GameMode;
}

export function GameScreen({ mode }: GameScreenProps) {
  const { theme } = useTheme();
  const {
    gameState,
    isLoading,
    currentHint,
    startDailyPuzzle,
    startPracticePuzzle,
    startPath,
    addToPath,
    clearPath,
    commitLine,
    undoLine,
    resetPuzzle,
    saveProgress,
    requestHint,
    clearHint,
  } = useGameStore();
  
  const { recordLineDrawn, recordPuzzleComplete, updateDailyStreak, stats, setHasSeenRatingPrompt } = useUserStore();
  
  const [showModal, setShowModal] = useState(false);
  const [showLineCelebration, setShowLineCelebration] = useState(false);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  
  // Track previous app state to detect when app resumes from background
  const appState = useRef(AppState.currentState);
  
  // Track screen view
  useEffect(() => {
    trackScreenView(mode === 'daily' ? 'DailyGame' : 'PracticeGame');
  }, [mode]);
  
  // Initialize game on mount
  useEffect(() => {
    const initGame = async () => {
      if (mode === 'daily') {
        await startDailyPuzzle();
      } else {
        await startPracticePuzzle();
      }
      // Track puzzle start
      trackPuzzleStarted(mode);
    };

    initGame();

    // Save progress when leaving
    return () => {
      saveProgress();
    };
  }, [mode]);
  
  // For daily mode: check if day has changed when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (mode === 'daily' && gameState) {
        const todaysPuzzleId = getDailyPuzzleId(new Date());
        if (gameState.puzzleId !== todaysPuzzleId) {
          startDailyPuzzle();
          trackPuzzleStarted(mode);
          setShowModal(false);
          setScoreResult(null);
        }
      }
    }, [mode, gameState?.puzzleId, startDailyPuzzle])
  );
  
  // For daily mode: check if day has changed when app resumes from background
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        mode === 'daily' &&
        gameState
      ) {
        const todaysPuzzleId = getDailyPuzzleId(new Date());
        if (gameState.puzzleId !== todaysPuzzleId) {
          startDailyPuzzle();
          trackPuzzleStarted(mode);
          setShowModal(false);
          setScoreResult(null);
        }
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [mode, gameState?.puzzleId, startDailyPuzzle]);
  
  // Handle win/stuck state changes - both show the same success modal
  useEffect(() => {
    const gameComplete = gameState?.isWon || gameState?.isStuck;
    if (gameState && gameComplete && !showModal) {
      const result = calculateScore(gameState);
      setScoreResult(result);
      setShowModal(true);
      success();

      // Record stats
      if (gameState.completedAt && gameState.startedAt) {
        const timeMs = gameState.completedAt - gameState.startedAt;
        recordPuzzleComplete(timeMs, gameState.puzzleId);

        // Track analytics
        trackPuzzleCompleted(mode, timeMs, gameState.lines.length);
      }
      if (mode === 'daily') {
        updateDailyStreak();
      }

      // Show rating prompt after 3 completed puzzles (check after stats update)
      setTimeout(() => {
        const currentStats = useUserStore.getState().stats;
        if (currentStats.totalPuzzlesCompleted >= 3 && !currentStats.hasSeenRatingPrompt) {
          setHasSeenRatingPrompt();
          Alert.alert(
            'Enjoying SumTrails?',
            'Would you mind taking a moment to rate us?',
            [
              { text: 'Not Now', style: 'cancel' },
              {
                text: 'Rate App',
                onPress: async () => {
                  if (await StoreReview.hasAction()) {
                    await StoreReview.requestReview();
                  }
                },
              },
            ]
          );
        }
      }, 500);
    }
  }, [gameState?.isWon, gameState?.isStuck]);
  
  // Clear hint when path changes
  useEffect(() => {
    if (currentHint && gameState?.currentPath) {
      clearHint();
    }
  }, [gameState?.currentPath?.cellIds?.length]);
  
  const handleStartPath = useCallback((cellId: string) => {
    clearHint();
    startPath(cellId);
  }, [startPath, clearHint]);
  
  const handleAddToPath = useCallback((cellId: string) => {
    addToPath(cellId);
  }, [addToPath]);
  
  const handleEndPath = useCallback(() => {
    const result = commitLine();
    
    if (result.success) {
      heavyTap();
      recordLineDrawn();
      
      // Trigger celebration animation
      setShowLineCelebration(true);
      
      // Track line committed
      if (gameState) {
        trackLineCommitted(mode, gameState.lines.length + 1);
      }
    } else {
      clearPath();
    }
  }, [commitLine, clearPath, recordLineDrawn, gameState, mode]);
  
  const handleReset = useCallback(() => {
    resetPuzzle();
    clearHint();
    setShowModal(false);
    setScoreResult(null);

    // Track reset
    trackPuzzleReset(mode);
  }, [resetPuzzle, clearHint, mode]);

  const handleUndo = useCallback(() => {
    const success = undoLine();
    if (success) {
      lightTap();
      clearHint();
      // Clear modal if it was showing (game was complete)
      setShowModal(false);
      setScoreResult(null);
    }
  }, [undoLine, clearHint]);

  const handleNewPuzzle = useCallback(() => {
    if (mode === 'practice') {
      startPracticePuzzle();
      trackPuzzleStarted(mode);
    } else {
      startDailyPuzzle();
      trackPuzzleStarted(mode);
    }
    clearHint();
    setShowModal(false);
    setScoreResult(null);
  }, [mode, startPracticePuzzle, startDailyPuzzle, clearHint]);
  
  const handleHint = useCallback(() => {
    const hint = requestHint();
    if (hint) {
      lightTap();
      trackHintRequested(mode, 'full-line');
    }
  }, [requestHint, mode]);
  
  if (isLoading || !gameState) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading puzzle...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  const currentPathCellIds = gameState.currentPath?.cellIds ?? [];
  const currentSum = gameState.currentPath?.sum ?? 0;
  const hintCellIds = currentHint?.cellIds ?? null;
  const hintUsed = UNLIMITED_HINTS_ENABLED ? false : gameState.hintUsed;
  
  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.content}>
          {/* Game HUD */}
          <GameHUD
            targetSum={gameState.targetSum}
            currentSum={currentSum}
            minLineLength={gameState.minLineLength}
            currentPathLength={currentPathCellIds.length}
            linesFound={gameState.lines.length}
            totalPossibleLines={gameState.solutionPaths.length}
            onReset={handleReset}
            onUndo={handleUndo}
            canUndo={gameState.lines.length > 0}
            onHint={handleHint}
            hintUsed={hintUsed}
          />
          
          {/* Game Board */}
          <View style={styles.boardContainer}>
            <GameBoard
              grid={gameState.grid}
              currentPathCellIds={currentPathCellIds}
              currentSum={currentSum}
              targetSum={gameState.targetSum}
              onStartPath={handleStartPath}
              onAddToPath={handleAddToPath}
              onEndPath={handleEndPath}
              hintCellIds={hintCellIds}
            />
          </View>
        </View>
        
        {/* Game Complete Modal */}
        {scoreResult && (
          <GameModal
            visible={showModal}
            scoreResult={scoreResult}
            gameState={gameState}
            gameMode={mode}
            onClose={() => setShowModal(false)}
            onReset={handleReset}
            onNewPuzzle={mode === 'practice' ? handleNewPuzzle : undefined}
          />
        )}
        
        {/* Line Celebration */}
        <LineCelebration
          visible={showLineCelebration}
          onComplete={() => setShowLineCelebration(false)}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  boardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
