/**
 * Path overlay component for SumTrails
 * Draws SVG lines connecting cells in the current path
 */

import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { positionFromCellId } from '../core/types';
import { useTheme } from '../theme';

interface PathOverlayProps {
  cellIds: string[];
  gridSize: number;
  isOverTarget: boolean;
}

export function PathOverlay({ cellIds, gridSize, isOverTarget }: PathOverlayProps) {
  const { theme } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  
  const padding = 20;
  const gridPadding = 8;
  const cellGap = 6;
  const availableWidth = screenWidth - padding * 2;
  const cellSize = Math.floor((availableWidth - cellGap * gridSize) / gridSize);
  const totalGridSize = cellSize * gridSize + cellGap * gridSize + gridPadding * 2;
  
  if (cellIds.length === 0) {
    return null;
  }
  
  // Calculate center positions of cells
  const getCellCenter = (cellId: string): { x: number; y: number } => {
    const pos = positionFromCellId(cellId);
    const x = gridPadding + pos.col * (cellSize + cellGap) + cellSize / 2 + cellGap / 2;
    const y = gridPadding + pos.row * (cellSize + cellGap) + cellSize / 2 + cellGap / 2;
    return { x, y };
  };
  
  // Generate path data
  const pathData = cellIds.map((id, index) => {
    const { x, y } = getCellCenter(id);
    return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
  }).join(' ');
  
  const strokeColor = isOverTarget ? theme.pathStrokeOver : theme.pathStroke;
  const lastCell = cellIds.length > 0 ? getCellCenter(cellIds[cellIds.length - 1]) : null;
  
  return (
    <Svg
      style={[styles.overlay, { width: totalGridSize, height: totalGridSize }]}
      viewBox={`0 0 ${totalGridSize} ${totalGridSize}`}
    >
      {/* Main path line */}
      <Path
        d={pathData}
        stroke={strokeColor}
        strokeWidth={6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity={0.8}
      />
      
      {/* Circle at end of path */}
      {lastCell && (
        <Circle
          cx={lastCell.x}
          cy={lastCell.y}
          r={12}
          fill={strokeColor}
          opacity={0.5}
        />
      )}
    </Svg>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    pointerEvents: 'none',
  },
});
