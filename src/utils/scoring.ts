/**
 * Scoring utilities for SumTrails
 * Calculates medal-based scores based on lines found
 */

import { GameState, ScoreRank, ScoreResult } from '../core/types';

/** Calculate score result based on game state */
export function calculateScore(gameState: GameState): ScoreResult {
  const linesFound = gameState.lines.length;
  const totalPossibleLines = gameState.solutionPaths.length;
  const isPerfect = gameState.remainingCells === 0;

  // Calculate percentage of lines found
  const percentage = totalPossibleLines > 0
    ? Math.round((linesFound / totalPossibleLines) * 100)
    : 0;

  // Determine rank
  let rank: ScoreRank;
  if (isPerfect) {
    rank = 'gold';
  } else if (percentage >= 75) {
    rank = 'silver';
  } else {
    rank = 'bronze';
  }

  return {
    rank,
    linesFound,
    totalPossibleLines,
    percentage,
    isPerfect,
  };
}

/** Get emoji for score rank */
export function getRankEmoji(rank: ScoreRank): string {
  switch (rank) {
    case 'gold':
      return '🥇';
    case 'silver':
      return '🥈';
    case 'bronze':
      return '🥉';
  }
}

/** Get display text for score rank */
export function getRankText(rank: ScoreRank): string {
  switch (rank) {
    case 'gold':
      return 'Gold';
    case 'silver':
      return 'Silver';
    case 'bronze':
      return 'Bronze';
  }
}

/** Get title for modal based on rank */
export function getRankTitle(rank: ScoreRank): string {
  switch (rank) {
    case 'gold':
      return 'Perfect!';
    case 'silver':
      return 'Great Job!';
    case 'bronze':
      return 'Nice Try!';
  }
}
