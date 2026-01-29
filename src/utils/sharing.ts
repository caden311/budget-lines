/**
 * Sharing utilities for Budget Lines
 * Generates shareable results like Wordle
 */

import * as Sharing from 'expo-sharing';
import { GameState } from '../core/types';

/** Generate emoji grid for sharing */
export function generateEmojiGrid(gameState: GameState): string {
  const { grid, lines } = gameState;
  const size = grid.length;
  
  // Create a map of cell ID to line index for coloring
  const cellToLine = new Map<string, number>();
  lines.forEach((line, index) => {
    line.cellIds.forEach(id => {
      cellToLine.set(id, index);
    });
  });
  
  // Color palette for lines (cycling through)
  const lineColors = ['🟩', '🟦', '🟨', '🟪', '🟧', '🟫'];
  const emptyCell = '⬜';
  
  let emojiGrid = '';
  
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const cellId = `${row}-${col}`;
      const lineIndex = cellToLine.get(cellId);
      
      if (lineIndex !== undefined) {
        emojiGrid += lineColors[lineIndex % lineColors.length];
      } else {
        emojiGrid += emptyCell;
      }
    }
    if (row < size - 1) {
      emojiGrid += '\n';
    }
  }
  
  return emojiGrid;
}

/** Format time for display */
export function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
}

/** Generate full share text */
export function generateShareText(gameState: GameState): string {
  const date = gameState.puzzleId.replace('daily-', '');
  const emojiGrid = generateEmojiGrid(gameState);
  const lineCount = gameState.lines.length;
  
  const timeText = gameState.completedAt && gameState.startedAt
    ? ` in ${formatTime(gameState.completedAt - gameState.startedAt)}`
    : '';
  
  return `Budget Lines ${date}\n${lineCount} lines${timeText}\n\n${emojiGrid}\n\nPlay at: budgetlines.app`;
}

/** Check if sharing is available */
export async function canShare(): Promise<boolean> {
  return await Sharing.isAvailableAsync();
}

/** Share results */
export async function shareResults(gameState: GameState): Promise<void> {
  const shareText = generateShareText(gameState);
  
  // On mobile, use native share sheet
  // On web, copy to clipboard
  if (await canShare()) {
    // Create a temporary file with the share text
    // For now, we'll just use clipboard
    // In production, you might want to create an image
    try {
      // Expo Sharing requires a file URI, so for text we'd need clipboard
      // This is a simplified version
      console.log('Share text:', shareText);
    } catch (error) {
      console.error('Failed to share:', error);
    }
  }
}

/** Copy results to clipboard */
export function getShareText(gameState: GameState): string {
  return generateShareText(gameState);
}
