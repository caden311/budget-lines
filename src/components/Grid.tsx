/**
 * Grid component for Budget Lines
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
  hintCellId?: string | null;
}

export function Grid({ grid, currentSum, targetSum, hintCellId }: GridProps) {
  const { theme } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  
  const gridSize = grid.length;
  const padding = 20;
  const cellGap = 6; // margin * 2
  const availableWidth = screenWidth - padding * 2;
  const cellSize = Math.floor((availableWidth - cellGap * gridSize) / gridSize);
  
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
                isHinted={cell.id === hintCellId}
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
