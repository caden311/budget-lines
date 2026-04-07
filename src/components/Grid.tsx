/**
 * Grid component for SumTrails
 * Displays the game grid and handles layout
 */

import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Cell } from './Cell';
import { Cell as CellType } from '../core/types';
import { useTheme } from '../theme';

interface GridProps {
  grid: CellType[][];
  currentSum: number;
  targetSum: number;
  hintCellIds?: string[] | null;
}

export function Grid({ grid, currentSum, targetSum, hintCellIds }: GridProps) {
  const { theme } = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const gridSize = grid.length;
  const padding = 20;
  const gridPadding = 8;
  const cellGap = 6; // margin * 2
  const availableWidth = screenWidth - padding * 2;
  const maxBoardHeight = screenHeight - 220;
  const cellSizeFromWidth = Math.floor((availableWidth - cellGap * gridSize) / gridSize);
  const cellSizeFromHeight = Math.floor((maxBoardHeight - cellGap * gridSize - gridPadding * 2) / gridSize);
  const cellSize = Math.min(cellSizeFromWidth, cellSizeFromHeight);
  
  const isOverTarget = currentSum > targetSum;
  
  return (
    <View style={styles.container}>
      <View style={[styles.grid, { backgroundColor: theme.backgroundSecondary }]}>
        {grid.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((cell) => (
              <Cell
                key={cell.id}
                cell={cell}
                size={cellSize}
                isOverTarget={isOverTarget}
                isHinted={hintCellIds ? hintCellIds.includes(cell.id) : false}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    padding: 8,
    borderRadius: 16,
  },
  row: {
    flexDirection: 'row',
  },
});
