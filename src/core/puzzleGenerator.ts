/**
 * Puzzle generator for SumTrails
 * Uses constructive generation to guarantee solvable puzzles
 * Supports seeded generation for daily puzzles
 *
 * All puzzles are 7x7 with fixed config for consistent gameplay.
 */

import seedrandom from 'seedrandom';
import { generateSolvablePuzzle } from './constructiveGenerator';
import { countAvailableCells, createGrid } from './grid';
import { DifficultyConfig, GameMode, GameState } from './types';

/** Single config for all puzzles (7x7 daily format) */
const DAILY_CONFIG: DifficultyConfig = {
  gridSize: 7,
  minLineLength: 3,
  targetSum: 18,
  valueRange: { min: 1, max: 8 },
};

/** Generate a seeded random number generator */
function createRng(seed: string): () => number {
  return seedrandom(seed);
}

/**
 * Get the puzzle date based on 8am Eastern Time reset
 * The puzzle changes at 8am ET every day, same for everyone worldwide
 *
 * @param date - Current date/time
 * @returns The puzzle date string (YYYY-MM-DD)
 */
function getPuzzleDateString(date: Date = new Date()): string {
  // Convert to Eastern Time manually
  // Eastern Time is UTC-5 (EST) or UTC-4 (EDT during daylight saving)
  // We'll calculate based on UTC and apply the offset

  const utcTime = date.getTime();

  // Determine if we're in EDT (Daylight Saving Time)
  // EDT is from second Sunday of March to first Sunday of November
  const year = date.getUTCFullYear();
  const dstStart = getNthSundayOfMonth(year, 2, 2); // 2nd Sunday of March
  const dstEnd = getNthSundayOfMonth(year, 10, 1); // 1st Sunday of November

  // DST transitions at 2am local time, but we'll use a simplified check
  const isDST = utcTime >= dstStart.getTime() && utcTime < dstEnd.getTime();

  // Eastern offset: -4 hours during EDT, -5 hours during EST
  const offsetHours = isDST ? -4 : -5;
  const easternTime = new Date(utcTime + offsetHours * 60 * 60 * 1000);

  // Get the Eastern date components (using UTC methods since we already applied offset)
  let etYear = easternTime.getUTCFullYear();
  let etMonth = easternTime.getUTCMonth();
  let etDay = easternTime.getUTCDate();
  const etHour = easternTime.getUTCHours();

  // If it's before 8am Eastern, use yesterday's puzzle
  if (etHour < 8) {
    // Go back one day
    const yesterday = new Date(Date.UTC(etYear, etMonth, etDay - 1));
    etYear = yesterday.getUTCFullYear();
    etMonth = yesterday.getUTCMonth();
    etDay = yesterday.getUTCDate();
  }

  const monthStr = String(etMonth + 1).padStart(2, '0');
  const dayStr = String(etDay).padStart(2, '0');

  return `${etYear}-${monthStr}-${dayStr}`;
}

/**
 * Get the nth Sunday of a given month
 * Used for DST calculation
 */
function getNthSundayOfMonth(year: number, month: number, n: number): Date {
  // Start at the first day of the month
  const date = new Date(Date.UTC(year, month, 1, 7, 0, 0)); // 7am UTC ~= 2-3am ET

  // Find first Sunday
  const dayOfWeek = date.getUTCDay();
  const daysUntilSunday = (7 - dayOfWeek) % 7;
  date.setUTCDate(date.getUTCDate() + daysUntilSunday);

  // Add (n-1) weeks to get nth Sunday
  date.setUTCDate(date.getUTCDate() + (n - 1) * 7);

  return date;
}

/** Generate a puzzle ID from date (resets at 8am Eastern Time daily) */
export function getDailyPuzzleId(date: Date = new Date()): string {
  const dateStr = getPuzzleDateString(date);
  return `daily-${dateStr}`;
}

/** Generate a unique ID for practice puzzles */
export function getPracticePuzzleId(): string {
  return `practice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/** Generate a daily puzzle (same for everyone on the same day) */
export function generateDailyPuzzle(date: Date = new Date()): GameState {
  const puzzleId = getDailyPuzzleId(date);
  const seed = `sumtrails-${puzzleId}`;
  return generatePuzzleWithSeed(seed, puzzleId, 'daily');
}

/** Generate a practice puzzle (random) */
export function generatePracticePuzzle(): GameState {
  const puzzleId = getPracticePuzzleId();
  const seed = puzzleId; // Use the unique ID as seed
  return generatePuzzleWithSeed(seed, puzzleId, 'practice');
}

/** Generate a puzzle with a specific seed */
function generatePuzzleWithSeed(
  seed: string,
  puzzleId: string,
  mode: GameMode
): GameState {
  const config = DAILY_CONFIG;
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
