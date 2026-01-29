/**
 * Puzzle generator for Budget Lines
 * Supports seeded generation for daily puzzles
 */

import seedrandom from 'seedrandom';
import { Cell, Difficulty, DifficultyConfig, GameState, GameMode } from './types';
import { createGrid, countAvailableCells } from './grid';
import { isGameStuck } from './stuckDetector';

/** Difficulty presets */
const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  easy: {
    gridSize: 5,
    minLineLength: 3,
    targetSum: 10,
    valueRange: { min: 1, max: 5 },
  },
  medium: {
    gridSize: 6,
    minLineLength: 3,
    targetSum: 15,
    valueRange: { min: 1, max: 7 },
  },
  hard: {
    gridSize: 7,
    minLineLength: 4,
    targetSum: 20,
    valueRange: { min: 1, max: 9 },
  },
};

/** Generate a seeded random number generator */
function createRng(seed: string): () => number {
  return seedrandom(seed);
}

/** Generate a puzzle ID from date */
export function getDailyPuzzleId(date: Date = new Date()): string {
  const dateStr = date.toISOString().split('T')[0];
  return `daily-${dateStr}`;
}

/** Generate a unique ID for practice puzzles */
export function getPracticePuzzleId(): string {
  return `practice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/** Generate grid values using the RNG */
function generateGridValues(
  rng: () => number,
  size: number,
  valueRange: { min: number; max: number }
): number[][] {
  const { min, max } = valueRange;
  const range = max - min + 1;
  
  const values: number[][] = [];
  for (let row = 0; row < size; row++) {
    const rowValues: number[] = [];
    for (let col = 0; col < size; col++) {
      rowValues.push(Math.floor(rng() * range) + min);
    }
    values.push(rowValues);
  }
  
  return values;
}

/** Generate a daily puzzle (same for everyone on the same day) */
export function generateDailyPuzzle(
  date: Date = new Date(),
  difficulty: Difficulty = 'medium'
): GameState {
  const puzzleId = getDailyPuzzleId(date);
  const seed = `budgetlines-${puzzleId}`;
  return generatePuzzleWithSeed(seed, puzzleId, 'daily', difficulty);
}

/** Generate a practice puzzle (random) */
export function generatePracticePuzzle(
  difficulty: Difficulty = 'medium'
): GameState {
  const puzzleId = getPracticePuzzleId();
  const seed = puzzleId; // Use the unique ID as seed
  return generatePuzzleWithSeed(seed, puzzleId, 'practice', difficulty);
}

/** Generate a puzzle with a specific seed */
function generatePuzzleWithSeed(
  seed: string,
  puzzleId: string,
  mode: GameMode,
  difficulty: Difficulty
): GameState {
  const config = DIFFICULTY_CONFIGS[difficulty];
  const rng = createRng(seed);
  
  // Try to generate a solvable puzzle (max attempts)
  let attempts = 0;
  const maxAttempts = 50;
  
  while (attempts < maxAttempts) {
    const values = generateGridValues(rng, config.gridSize, config.valueRange);
    const grid = createGrid(config.gridSize, values);
    
    // Check if at least one valid move exists
    if (!isGameStuck(grid, config.targetSum, config.minLineLength)) {
      return {
        puzzleId,
        mode,
        grid,
        targetSum: config.targetSum,
        minLineLength: config.minLineLength,
        lines: [],
        currentPath: null,
        isWon: false,
        isStuck: false,
        startedAt: Date.now(),
        completedAt: null,
        remainingCells: countAvailableCells(grid),
      };
    }
    
    attempts++;
  }
  
  // Fallback: return the last generated puzzle anyway
  const values = generateGridValues(rng, config.gridSize, config.valueRange);
  const grid = createGrid(config.gridSize, values);
  
  return {
    puzzleId,
    mode,
    grid,
    targetSum: config.targetSum,
    minLineLength: config.minLineLength,
    lines: [],
    currentPath: null,
    isWon: false,
    isStuck: false,
    startedAt: Date.now(),
    completedAt: null,
    remainingCells: countAvailableCells(grid),
  };
}

/** Restore a puzzle from saved grid values */
export function restorePuzzleFromValues(
  puzzleId: string,
  mode: GameMode,
  gridValues: number[][],
  targetSum: number,
  minLineLength: number,
  startedAt: number
): GameState {
  const grid = createGrid(gridValues.length, gridValues);
  
  return {
    puzzleId,
    mode,
    grid,
    targetSum,
    minLineLength,
    lines: [],
    currentPath: null,
    isWon: false,
    isStuck: false,
    startedAt,
    completedAt: null,
    remainingCells: countAvailableCells(grid),
  };
}

/** Get difficulty config */
export function getDifficultyConfig(difficulty: Difficulty): DifficultyConfig {
  return DIFFICULTY_CONFIGS[difficulty];
}
