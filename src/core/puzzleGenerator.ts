/**
 * Puzzle generator for SumTrails
 * Uses constructive generation to guarantee solvable puzzles
 * Supports seeded generation for daily puzzles
 */

import seedrandom from 'seedrandom';
import { generateSolvablePuzzle } from './constructiveGenerator';
import { countAvailableCells, createGrid } from './grid';
import { Difficulty, DifficultyConfig, GameMode, GameState } from './types';

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


/** Generate a daily puzzle (same for everyone on the same day) */
export function generateDailyPuzzle(
  date: Date = new Date(),
  difficulty: Difficulty = 'medium'
): GameState {
  const puzzleId = getDailyPuzzleId(date);
  const seed = `sumtrails-${puzzleId}`;
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
  
  // Use constructive generation - builds puzzle from valid solution paths
  // This guarantees the puzzle is always 100% solvable
  const { values, solutionPaths } = generateSolvablePuzzle(
    {
      gridSize: config.gridSize,
      minLineLength: config.minLineLength,
      targetSum: config.targetSum,
      valueRange: config.valueRange,
    },
    rng
  );
  
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
    hintUsed: false,
    solutionPaths,
  };
}

/** Restore a puzzle from saved grid values */
export function restorePuzzleFromValues(
  puzzleId: string,
  mode: GameMode,
  gridValues: number[][],
  targetSum: number,
  minLineLength: number,
  startedAt: number,
  solutionPaths: string[][] = []
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
    hintUsed: false,
    solutionPaths,
  };
}

/** Get difficulty config */
export function getDifficultyConfig(difficulty: Difficulty): DifficultyConfig {
  return DIFFICULTY_CONFIGS[difficulty];
}
