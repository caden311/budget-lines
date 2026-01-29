/**
 * Grid component for Budget Lines
 * Displays the game grid and handles layout
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Cell } from './Cell';
import { Cell as CellType } from '../core/types';

interface GridProps {
  grid: CellType[][];
  currentSum: number;
  targetSum: number;
}

export function Grid({ grid, currentSum, targetSum }: GridProps) {
  const { width: screenWidth } = useWindowDimensions();
  
  const gridSize = grid.length;
  const padding = 20;
  const cellGap = 6; // margin * 2
  const availableWidth = screenWidth - padding * 2;
  const cellSize = Math.floor((availableWidth - cellGap * gridSize) / gridSize);
  
  const isOverTarget = currentSum > targetSum;
  
  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {grid.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((cell) => (
              <Cell
                key={cell.id}
                cell={cell}
                size={cellSize}
                isOverTarget={isOverTarget}
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
    backgroundColor: '#16162a',
    borderRadius: 16,
  },
  row: {
    flexDirection: 'row',
  },
});
