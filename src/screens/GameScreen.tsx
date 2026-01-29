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
  
  // Initialize game on mount
  useEffect(() => {
    if (mode === 'daily') {
      startDailyPuzzle();
    } else {
      startPracticePuzzle(difficulty);
    }
    
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
        recordPuzzleComplete(gameState.completedAt - gameState.startedAt);
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
    } else {
      clearPath();
    }
  }, [commitLine, clearPath, recordLineDrawn]);
  
  const handleReset = useCallback(() => {
    resetPuzzle();
    clearHint();
    setShowWinModal(false);
    setShowStuckModal(false);
  }, [resetPuzzle, clearHint]);
  
  const handleNewPuzzle = useCallback(() => {
    if (mode === 'practice') {
      startPracticePuzzle(difficulty);
    } else {
      startDailyPuzzle();
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
    }
  }, [isPremium, requestHint]);
  
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
          onClose={() => setShowWinModal(false)}
          onReset={handleReset}
          onNewPuzzle={mode === 'practice' ? handleNewPuzzle : undefined}
        />
        
        {/* Stuck Modal */}
        <GameModal
          visible={showStuckModal}
          type="stuck"
          gameState={gameState}
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
