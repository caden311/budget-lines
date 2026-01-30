/**
 * Main Game Screen for Budget Lines
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Text,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { GameBoard, GameHUD, GameModal } from '../components';
import { PremiumModal } from '../components/PremiumModal';
import { useGameStore } from '../stores/gameStore';
import { useUserStore } from '../stores/userStore';
import { GameMode, Difficulty } from '../core/types';
import { heavyTap, success, warning, lightTap } from '../utils/haptics';
import { useTheme } from '../theme';
import {
  trackPuzzleStarted,
  trackPuzzleCompleted,
  trackLineCommitted,
  trackPuzzleStuck,
  trackPuzzleReset,
  trackHintRequested,
  trackScreenView,
} from '../services/analytics';

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
  
  const { premium, recordLineDrawn, recordPuzzleComplete, updateDailyStreak } = useUserStore();
  
  const [showWinModal, setShowWinModal] = useState(false);
  const [showStuckModal, setShowStuckModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  
  const isPremium = premium.isPremium;
  
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
  
  // Handle win/stuck state changes
  useEffect(() => {
    if (gameState?.isWon && !showWinModal) {
      setShowWinModal(true);
      success();
      
      // Record stats
      if (gameState.completedAt && gameState.startedAt) {
        const timeMs = gameState.completedAt - gameState.startedAt;
        recordPuzzleComplete(timeMs);
        
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
      
      // Track stuck event
      trackPuzzleStuck(mode, gameState.lines.length);
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
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    
    const hint = requestHint('next-move');
    if (hint) {
      lightTap();
      trackHintRequested(mode, 'next-move');
    }
  }, [isPremium, requestHint, mode]);
  
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
  const hintCellId = currentHint?.cellIds?.[0] ?? null;
  
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
            isPremium={isPremium}
            hintCellId={hintCellId}
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
              hintCellId={hintCellId}
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
        
        {/* Premium Modal */}
        <PremiumModal
          visible={showPremiumModal}
          onClose={() => setShowPremiumModal(false)}
          feature="hints"
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
