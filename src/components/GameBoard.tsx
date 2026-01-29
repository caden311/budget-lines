/**
 * GameBoard component for Budget Lines
 * Combines Grid and PathOverlay with gesture handling
 */

import React, { useRef, useCallback } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { Grid } from './Grid';
import { PathOverlay } from './PathOverlay';
import { Cell as CellType, positionFromCellId, cellIdFromPosition } from '../core/types';
import { lightTap, mediumTap, heavyTap, error as hapticError } from '../utils/haptics';

interface GameBoardProps {
  grid: CellType[][];
  currentPathCellIds: string[];
  currentSum: number;
  targetSum: number;
  onStartPath: (cellId: string) => void;
  onAddToPath: (cellId: string) => void;
  onEndPath: () => void;
  hintCellId?: string | null;
}

export function GameBoard({
  grid,
  currentPathCellIds,
  currentSum,
  targetSum,
  onStartPath,
  onAddToPath,
  onEndPath,
  hintCellId,
}: GameBoardProps) {
  const { width: screenWidth } = useWindowDimensions();
  const lastCellRef = useRef<string | null>(null);
  
  const gridSize = grid.length;
  const padding = 20;
  const gridPadding = 8;
  const cellGap = 6;
  const availableWidth = screenWidth - padding * 2;
  const cellSize = Math.floor((availableWidth - cellGap * gridSize) / gridSize);
  const totalGridSize = cellSize * gridSize + cellGap * gridSize + gridPadding * 2;
  
  // Convert touch position to cell ID
  const getCellIdFromPosition = useCallback((x: number, y: number): string | null => {
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
    
    return cellIdFromPosition({ row, col });
  }, [gridSize, cellSize, cellGap, gridPadding]);
  
  const gesture = Gesture.Pan()
    .onStart((event) => {
      const cellId = getCellIdFromPosition(event.x, event.y);
      if (cellId) {
        lastCellRef.current = cellId;
        onStartPath(cellId);
        lightTap();
      }
    })
    .onUpdate((event) => {
      const cellId = getCellIdFromPosition(event.x, event.y);
      if (cellId && cellId !== lastCellRef.current) {
        lastCellRef.current = cellId;
        onAddToPath(cellId);
        lightTap();
      }
    })
    .onEnd(() => {
      lastCellRef.current = null;
      onEndPath();
    })
    .onFinalize(() => {
      lastCellRef.current = null;
    });
  
  return (
    <View style={styles.container}>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.board, { width: totalGridSize, height: totalGridSize }]}>
          <Grid
            grid={grid}
            currentSum={currentSum}
            targetSum={targetSum}
            hintCellId={hintCellId}
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
