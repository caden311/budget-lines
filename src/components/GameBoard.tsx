/**
 * GameBoard component for SumTrails
 * Combines Grid and PathOverlay with gesture handling
 */

import React, { useCallback } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useSharedValue } from 'react-native-reanimated';
import { Grid } from './Grid';
import { PathOverlay } from './PathOverlay';
import { Cell as CellType } from '../core/types';
import { lightTap } from '../utils/haptics';

interface GameBoardProps {
  grid: CellType[][];
  currentPathCellIds: string[];
  currentSum: number;
  targetSum: number;
  onStartPath: (cellId: string) => void;
  onAddToPath: (cellId: string) => void;
  onEndPath: () => void;
  hintCellIds?: string[] | null;
}

export function GameBoard({
  grid,
  currentPathCellIds,
  currentSum,
  targetSum,
  onStartPath,
  onAddToPath,
  onEndPath,
  hintCellIds,
}: GameBoardProps) {
  const { width: screenWidth } = useWindowDimensions();
  const lastCellId = useSharedValue<string | null>(null);
  
  const gridSize = grid.length;
  const padding = 20;
  const gridPadding = 8;
  const cellGap = 6;
  const availableWidth = screenWidth - padding * 2;
  const cellSize = Math.floor((availableWidth - cellGap * gridSize) / gridSize);
  const totalGridSize = cellSize * gridSize + cellGap * gridSize + gridPadding * 2;
  
  // Convert touch position to cell ID (worklet-compatible version)
  const getCellIdFromPosition = (x: number, y: number): string | null => {
    'worklet';
    // Account for grid padding
    const adjustedX = x - gridPadding;
    const adjustedY = y - gridPadding;
    
    // Calculate cell indices
    const col = Math.floor(adjustedX / (cellSize + cellGap));
    const row = Math.floor(adjustedY / (cellSize + cellGap));
    
    // Bounds check
    if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) {
      return null;
    }
    
    return `${row}-${col}`;
  };
  
  // JS thread handlers
  const handleStartPath = useCallback((cellId: string) => {
    onStartPath(cellId);
    lightTap();
  }, [onStartPath]);
  
  const handleAddToPath = useCallback((cellId: string) => {
    onAddToPath(cellId);
    lightTap();
  }, [onAddToPath]);
  
  const handleEndPath = useCallback(() => {
    onEndPath();
  }, [onEndPath]);
  
  const gesture = Gesture.Pan()
    .onStart((event) => {
      'worklet';
      const cellId = getCellIdFromPosition(event.x, event.y);
      if (cellId) {
        lastCellId.value = cellId;
        runOnJS(handleStartPath)(cellId);
      }
    })
    .onUpdate((event) => {
      'worklet';
      const cellId = getCellIdFromPosition(event.x, event.y);
      if (cellId && cellId !== lastCellId.value) {
        lastCellId.value = cellId;
        runOnJS(handleAddToPath)(cellId);
      }
    })
    .onEnd(() => {
      'worklet';
      lastCellId.value = null;
      runOnJS(handleEndPath)();
    })
    .onFinalize(() => {
      'worklet';
      lastCellId.value = null;
    });
  
  return (
    <View style={styles.container}>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.board, { width: totalGridSize, height: totalGridSize }]}>
          <Grid
            grid={grid}
            currentSum={currentSum}
            targetSum={targetSum}
            hintCellIds={hintCellIds}
          />
          <PathOverlay
            cellIds={currentPathCellIds}
            gridSize={gridSize}
            isOverTarget={currentSum > targetSum}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  board: {
    position: 'relative',
  },
});
