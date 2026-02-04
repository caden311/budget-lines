/**
 * SumTrails - Core Game Types
 * 
 * A puzzle game where players draw lines through numbered cells
 * to reach a target sum with a minimum line length.
 */

/** Position on the grid */
export interface Position {
  row: number;
  col: number;
}

/** Cell state on the grid */
export type CellState = 'available' | 'spent' | 'in-path';

/** A single cell in the game grid */
export interface Cell {
  id: string;
  position: Position;
  value: number;
  state: CellState;
}

/** A completed line of cells */
export interface Line {
  id: string;
  cellIds: string[];
  sum: number;
}

/** Game difficulty settings */
export interface DifficultyConfig {
  gridSize: number;
  minLineLength: number;
  targetSum: number;
  valueRange: { min: number; max: number };
}

/** Game mode - daily (shared puzzle) or practice (random) */
export type GameMode = 'daily' | 'practice';

/** The current state of a path being drawn */
export interface CurrentPath {
  cellIds: string[];
  sum: number;
}

/** Core game state */
export interface GameState {
  /** Unique identifier for this puzzle */
  puzzleId: string;
  /** Game mode */
  mode: GameMode;
  /** Grid of cells */
  grid: Cell[][];
  /** Target sum to reach for each line */
  targetSum: number;
  /** Minimum cells required per line */
  minLineLength: number;
  /** Completed lines */
  lines: Line[];
  /** Current path being drawn (null when not drawing) */
  currentPath: CurrentPath | null;
  /** Whether the game has been won */
  isWon: boolean;
  /** Whether the player is stuck (no valid moves) */
  isStuck: boolean;
  /** Timestamp when puzzle was started */
  startedAt: number;
  /** Timestamp when puzzle was completed (null if not completed) */
  completedAt: number | null;
  /** Number of cells remaining */
  remainingCells: number;
  /** Whether the hint has been used for this puzzle */
  hintUsed: boolean;
  /** Original solution paths from puzzle generation (for hints) */
  solutionPaths: string[][];
  /** Locked-in hint cell IDs (persists across resets) */
  hintCellIds?: string[];
}

/** Saved game progress for persistence */
export interface SavedGameProgress {
  puzzleId: string;
  mode: GameMode;
  /** Grid values (just the numbers, state can be reconstructed) */
  gridValues: number[][];
  /** Target sum */
  targetSum: number;
  /** Min line length */
  minLineLength: number;
  /** Completed line cell IDs */
  completedLinesCellIds: string[][];
  /** Timestamp when saved */
  savedAt: number;
  /** Timestamp when started */
  startedAt: number;
  /** Original solution paths (for hints) */
  solutionPaths?: string[][];
  /** Whether a hint was used for this puzzle */
  hintUsed?: boolean;
  /** Locked-in hint cell IDs (persists across resets) */
  hintCellIds?: string[];
}

/** User statistics */
export interface UserStats {
  dailyStreak: number;
  lastDailyDate: string | null;
  lastCompletedPuzzleId: string | null;
  totalPuzzlesCompleted: number;
  totalLinesDrawn: number;
  bestTime: number | null;
  averageTime: number | null;
  /** Whether user has seen the notification permission prompt */
  hasSeenNotificationPrompt?: boolean;
  /** Whether user has seen the app rating prompt */
  hasSeenRatingPrompt?: boolean;
}

/** Premium/subscription status */
export interface PremiumStatus {
  isPremium: boolean;
  purchaseDate: string | null;
  productId: string | null;
}

/** Hint types available */
export type HintType = 'full-line';

/** Hint result from hint system */
export interface HintResult {
  type: HintType;
  /** Cell IDs for the complete line suggested by the hint */
  cellIds: string[];
  /** Optional message to show */
  message?: string;
}

/** Result of attempting to add a cell to the current path */
export type PathAddResult =
  | { success: true; action: 'added' }
  | { success: true; action: 'backtracked' }
  | { success: false; reason: 'not-adjacent' | 'already-in-path' | 'spent' | 'no-path' };

/** Result of attempting to commit a line */
export type CommitResult =
  | { success: true; isWin: boolean; isStuck: boolean }
  | { success: false; reason: 'wrong-sum' | 'too-short' | 'no-path' };

/** Utility type to create cell ID from position */
export function cellIdFromPosition(pos: Position): string {
  return `${pos.row}-${pos.col}`;
}

/** Utility type to get position from cell ID */
export function positionFromCellId(id: string): Position {
  const [row, col] = id.split('-').map(Number);
  return { row, col };
}

/** Check if two positions are adjacent (4-directional) */
export function areAdjacent(a: Position, b: Position): boolean {
  const rowDiff = Math.abs(a.row - b.row);
  const colDiff = Math.abs(a.col - b.col);
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

/** Score rank for medal system */
export type ScoreRank = 'gold' | 'silver' | 'bronze';

/** Score result after game completion */
export interface ScoreResult {
  rank: ScoreRank;
  linesFound: number;
  totalPossibleLines: number;
  percentage: number;
  isPerfect: boolean;
}
