/**
 * Main Game Screen for SumTrails
 */

import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { GameBoard, GameHUD, GameModal, LineCelebration } from '../components';
import { getDailyPuzzleId } from '../core/puzzleGenerator';
import { Difficulty, GameMode } from '../core/types';
import {
  trackHintRequested,
  trackLineCommitted,
  trackPuzzleCompleted,
  trackPuzzleReset,
  trackPuzzleStarted,
  trackScreenView,
} from '../services/analytics';
import { useGameStore } from '../stores/gameStore';
import { useUserStore } from '../stores/userStore';
import { useTheme } from '../theme';
import { heavyTap, lightTap, success, warning } from '../utils/haptics';

interface GameScreenProps {
  mode: GameMode;
  difficulty?: Difficulty;
}

export function GameScreen({ mode, difficulty = 'medium' }: GameScreenProps) {
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
    resetPuzzle,
    saveProgress,
    requestHint,
    clearHint,
  } = useGameStore();
  
  const { recordLineDrawn, recordPuzzleComplete, updateDailyStreak } = useUserStore();
  
  const [showWinModal, setShowWinModal] = useState(false);
  const [showStuckModal, setShowStuckModal] = useState(false);
  const [showLineCelebration, setShowLineCelebration] = useState(false);
  
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
        await startPracticePuzzle(difficulty);
      }
      // Track puzzle start
      trackPuzzleStarted(mode, difficulty);
    };
    
    initGame();
    
    // Save progress when leaving
    return () => {
      saveProgress();
    };
  }, [mode, difficulty]);
  
  // For daily mode: check if day has changed when screen comes into focus
  // If the puzzle is from a previous day, force load the new daily puzzle
  useFocusEffect(
    useCallback(() => {
      if (mode === 'daily' && gameState) {
        const todaysPuzzleId = getDailyPuzzleId(new Date());
        console.log('[DEBUG] useFocusEffect - checking day change');
        console.log('[DEBUG] Current gameState.puzzleId:', gameState.puzzleId);
        console.log('[DEBUG] Today\'s puzzleId:', todaysPuzzleId);
        console.log('[DEBUG] Day changed?', gameState.puzzleId !== todaysPuzzleId);
        
        if (gameState.puzzleId !== todaysPuzzleId) {
          // Day has changed - load the new daily puzzle
          console.log('[DEBUG] Loading new daily puzzle!');
          startDailyPuzzle();
          trackPuzzleStarted(mode, difficulty);
          // Reset modal states for fresh puzzle
          setShowWinModal(false);
          setShowStuckModal(false);
        }
      }
    }, [mode, gameState?.puzzleId, startDailyPuzzle, difficulty])
  );
  
  // Handle win/stuck state changes
  useEffect(() => {
    if (gameState?.isWon && !showWinModal) {
      setShowWinModal(true);
      success();
      
      // Record stats
      if (gameState.completedAt && gameState.startedAt) {
        const timeMs = gameState.completedAt - gameState.startedAt;
        recordPuzzleComplete(timeMs, gameState.puzzleId);
        
        // Track analytics
        trackPuzzleCompleted(mode, timeMs, gameState.lines.length, difficulty);
      }
      if (mode === 'daily') {
        updateDailyStreak();
      }
    }
    
    if (gameState?.isStuck && !showStuckModal && !gameState.isWon) {
      setShowStuckModal(true);
      warning();
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
    setShowWinModal(false);
    setShowStuckModal(false);
    
    // Track reset
    trackPuzzleReset(mode);
  }, [resetPuzzle, clearHint, mode]);
  
  const handleNewPuzzle = useCallback(() => {
    if (mode === 'practice') {
      startPracticePuzzle(difficulty);
      trackPuzzleStarted(mode, difficulty);
    } else {
      startDailyPuzzle();
      trackPuzzleStarted(mode);
    }
    clearHint();
    setShowWinModal(false);
    setShowStuckModal(false);
  }, [mode, difficulty, startPracticePuzzle, startDailyPuzzle, clearHint]);
  
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
  const hintUsed = gameState.hintUsed;
  
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
            remainingCells={gameState.remainingCells}
            onReset={handleReset}
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
        
        {/* Win Modal */}
        <GameModal
          visible={showWinModal}
          type="win"
          gameState={gameState}
          gameMode={mode}
          onClose={() => setShowWinModal(false)}
          onReset={handleReset}
          onNewPuzzle={mode === 'practice' ? handleNewPuzzle : undefined}
        />
        
        {/* Stuck Modal */}
        <GameModal
          visible={showStuckModal}
          type="stuck"
          gameState={gameState}
          gameMode={mode}
          onClose={() => setShowStuckModal(false)}
          onReset={handleReset}
          onNewPuzzle={mode === 'practice' ? handleNewPuzzle : undefined}
        />
        
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
