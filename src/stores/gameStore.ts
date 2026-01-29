/**
 * Game state store using Zustand
 * Handles all game logic and state management
 */

import { create } from 'zustand';
import {
  GameState,
  Cell,
  Line,
  CurrentPath,
  SavedGameProgress,
  CommitResult,
  PathAddResult,
  GameMode,
  Difficulty,
  HintResult,
  HintType,
} from '../core/types';
import {
  createGrid,
  getCellById,
  updateCellsState,
  markCellsAsSpent,
  countAvailableCells,
  extractGridValues,
  restoreGridFromProgress,
  resetGrid,
} from '../core/grid';
import { canAddToPath } from '../core/pathValidator';
import { calculatePathSum, isSumCorrect, meetsMinLength } from '../core/sumCalculator';
import { isGameStuck } from '../core/stuckDetector';
import {
  generateDailyPuzzle,
  generatePracticePuzzle,
  restorePuzzleFromValues,
} from '../core/puzzleGenerator';
import { generateHint } from '../core/hintGenerator';
import { saveGameProgress, loadGameProgress, clearGameProgress } from '../utils/storage';

interface GameStore {
  // State
  gameState: GameState | null;
  isLoading: boolean;
  currentHint: HintResult | null;
  
  // Actions
  startDailyPuzzle: (date?: Date) => Promise<void>;
  startPracticePuzzle: (difficulty?: Difficulty) => Promise<void>;
  loadSavedGame: (puzzleId: string) => Promise<boolean>;
  
  // Path drawing
  startPath: (cellId: string) => PathAddResult;
  addToPath: (cellId: string) => PathAddResult;
  clearPath: () => void;
  
  // Line commitment
  commitLine: () => CommitResult;
  
  // Game management
  resetPuzzle: () => void;
  saveProgress: () => Promise<void>;
  
  // Hints (Premium)
  requestHint: (type?: HintType) => HintResult | null;
  clearHint: () => void;
  
  // Helpers
  getCurrentSum: () => number;
  getRemainingCells: () => number;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,
  isLoading: false,
  currentHint: null,
  
  startDailyPuzzle: async (date = new Date()) => {
    set({ isLoading: true });
    
    // Check for saved progress first
    const puzzleId = `daily-${date.toISOString().split('T')[0]}`;
    const savedProgress = await loadGameProgress(puzzleId);
    
    if (savedProgress) {
      // Restore from saved progress
      // Ensure startedAt is valid (fallback to saved time or now if missing)
      const validStartedAt = savedProgress.startedAt || savedProgress.savedAt || Date.now();
      const baseState = restorePuzzleFromValues(
        savedProgress.puzzleId,
        savedProgress.mode,
        savedProgress.gridValues,
        savedProgress.targetSum,
        savedProgress.minLineLength,
        validStartedAt
      );
      
      // Apply completed lines
      let grid = baseState.grid;
      const lines: Line[] = [];
      
      for (let i = 0; i < savedProgress.completedLinesCellIds.length; i++) {
        const cellIds = savedProgress.completedLinesCellIds[i];
        const sum = calculatePathSum(grid, cellIds);
        lines.push({
          id: `line-${i}`,
          cellIds,
          sum,
        });
        grid = markCellsAsSpent(grid, cellIds);
      }
      
      const remainingCells = countAvailableCells(grid);
      const isWon = remainingCells === 0;
      const isStuck = !isWon && isGameStuck(grid, savedProgress.targetSum, savedProgress.minLineLength);
      
      set({
        gameState: {
          ...baseState,
          grid,
          lines,
          isWon,
          isStuck,
          remainingCells,
          completedAt: isWon ? Date.now() : null,
        },
        isLoading: false,
      });
    } else {
      // Generate new puzzle
      const gameState = generateDailyPuzzle(date);
      set({ gameState, isLoading: false });
    }
  },
  
  startPracticePuzzle: async (difficulty = 'medium') => {
    set({ isLoading: true });
    const gameState = generatePracticePuzzle(difficulty);
    set({ gameState, isLoading: false });
  },
  
  loadSavedGame: async (puzzleId: string) => {
    set({ isLoading: true });
    
    const savedProgress = await loadGameProgress(puzzleId);
    
    if (!savedProgress) {
      set({ isLoading: false });
      return false;
    }
    
    // Ensure startedAt is valid (fallback to saved time or now if missing)
    const validStartedAt = savedProgress.startedAt || savedProgress.savedAt || Date.now();
    const baseState = restorePuzzleFromValues(
      savedProgress.puzzleId,
      savedProgress.mode,
      savedProgress.gridValues,
      savedProgress.targetSum,
      savedProgress.minLineLength,
      validStartedAt
    );
    
    let grid = baseState.grid;
    const lines: Line[] = [];
    
    for (let i = 0; i < savedProgress.completedLinesCellIds.length; i++) {
      const cellIds = savedProgress.completedLinesCellIds[i];
      const sum = calculatePathSum(grid, cellIds);
      lines.push({
        id: `line-${i}`,
        cellIds,
        sum,
      });
      grid = markCellsAsSpent(grid, cellIds);
    }
    
    const remainingCells = countAvailableCells(grid);
    const isWon = remainingCells === 0;
    const isStuck = !isWon && isGameStuck(grid, savedProgress.targetSum, savedProgress.minLineLength);
    
    set({
      gameState: {
        ...baseState,
        grid,
        lines,
        isWon,
        isStuck,
        remainingCells,
        completedAt: isWon ? Date.now() : null,
      },
      isLoading: false,
    });
    
    return true;
  },
  
  startPath: (cellId: string) => {
    const { gameState } = get();
    if (!gameState) {
      return { success: false, reason: 'no-path' } as PathAddResult;
    }
    
    const cell = getCellById(gameState.grid, cellId);
    if (!cell || cell.state !== 'available') {
      return { success: false, reason: 'spent' } as PathAddResult;
    }
    
    // Update cell state to in-path
    const grid = updateCellsState(gameState.grid, [cellId], 'in-path');
    
    set({
      gameState: {
        ...gameState,
        grid,
        currentPath: {
          cellIds: [cellId],
          sum: cell.value,
        },
      },
    });
    
    return { success: true, action: 'added' };
  },
  
  addToPath: (cellId: string) => {
    const { gameState } = get();
    if (!gameState || !gameState.currentPath) {
      return { success: false, reason: 'no-path' } as PathAddResult;
    }
    
    const result = canAddToPath(
      gameState.grid,
      gameState.currentPath.cellIds,
      cellId
    );
    
    if (!result.success) {
      return result;
    }
    
    if (result.action === 'backtracked') {
      // Remove last cell from path
      const newCellIds = gameState.currentPath.cellIds.slice(0, -1);
      const removedCellId = gameState.currentPath.cellIds[gameState.currentPath.cellIds.length - 1];
      
      // Update grid - mark removed cell as available
      let grid = updateCellsState(gameState.grid, [removedCellId], 'available');
      
      if (newCellIds.length === 0) {
        // Path is now empty
        set({
          gameState: {
            ...gameState,
            grid,
            currentPath: null,
          },
        });
      } else {
        const newSum = calculatePathSum(grid, newCellIds);
        set({
          gameState: {
            ...gameState,
            grid,
            currentPath: {
              cellIds: newCellIds,
              sum: newSum,
            },
          },
        });
      }
      
      return result;
    }
    
    // Add cell to path
    const newCellIds = [...gameState.currentPath.cellIds, cellId];
    const grid = updateCellsState(gameState.grid, [cellId], 'in-path');
    const newSum = calculatePathSum(grid, newCellIds);
    
    set({
      gameState: {
        ...gameState,
        grid,
        currentPath: {
          cellIds: newCellIds,
          sum: newSum,
        },
      },
    });
    
    return result;
  },
  
  clearPath: () => {
    const { gameState } = get();
    if (!gameState || !gameState.currentPath) return;
    
    // Reset all path cells to available
    const grid = updateCellsState(
      gameState.grid,
      gameState.currentPath.cellIds,
      'available'
    );
    
    set({
      gameState: {
        ...gameState,
        grid,
        currentPath: null,
      },
    });
  },
  
  commitLine: () => {
    const { gameState, saveProgress } = get();
    if (!gameState || !gameState.currentPath) {
      return { success: false, reason: 'no-path' } as CommitResult;
    }
    
    const { currentPath, targetSum, minLineLength } = gameState;
    
    // Check minimum length
    if (!meetsMinLength(currentPath.cellIds, minLineLength)) {
      return { success: false, reason: 'too-short' };
    }
    
    // Check sum
    if (!isSumCorrect(gameState.grid, currentPath.cellIds, targetSum)) {
      return { success: false, reason: 'wrong-sum' };
    }
    
    // Commit the line
    const newLine: Line = {
      id: `line-${gameState.lines.length}`,
      cellIds: currentPath.cellIds,
      sum: currentPath.sum,
    };
    
    // Mark cells as spent
    const grid = markCellsAsSpent(gameState.grid, currentPath.cellIds);
    const remainingCells = countAvailableCells(grid);
    
    // Check win/stuck conditions
    const isWon = remainingCells === 0;
    const isStuck = !isWon && isGameStuck(grid, targetSum, minLineLength);
    
    set({
      gameState: {
        ...gameState,
        grid,
        lines: [...gameState.lines, newLine],
        currentPath: null,
        isWon,
        isStuck,
        remainingCells,
        completedAt: isWon ? Date.now() : null,
      },
    });
    
    // Auto-save progress
    setTimeout(() => saveProgress(), 0);
    
    return { success: true, isWin: isWon, isStuck };
  },
  
  resetPuzzle: () => {
    const { gameState, saveProgress } = get();
    if (!gameState) return;
    
    // Reset the grid to all available
    const grid = resetGrid(gameState.grid);
    
    set({
      gameState: {
        ...gameState,
        grid,
        lines: [],
        currentPath: null,
        isWon: false,
        isStuck: false,
        remainingCells: countAvailableCells(grid),
        completedAt: null,
      },
    });
    
    // Save the reset state
    setTimeout(() => saveProgress(), 0);
  },
  
  saveProgress: async () => {
    const { gameState } = get();
    if (!gameState) return;
    
    const progress: SavedGameProgress = {
      puzzleId: gameState.puzzleId,
      mode: gameState.mode,
      gridValues: extractGridValues(gameState.grid),
      targetSum: gameState.targetSum,
      minLineLength: gameState.minLineLength,
      completedLinesCellIds: gameState.lines.map(line => line.cellIds),
      savedAt: Date.now(),
      startedAt: gameState.startedAt,
    };
    
    await saveGameProgress(progress);
  },
  
  requestHint: (type: HintType = 'next-move') => {
    const { gameState } = get();
    if (!gameState) return null;
    
    const hint = generateHint(
      gameState.grid,
      gameState.currentPath?.cellIds ?? [],
      gameState.targetSum,
      gameState.minLineLength,
      type
    );
    
    set({ currentHint: hint });
    return hint;
  },
  
  clearHint: () => {
    set({ currentHint: null });
  },
  
  getCurrentSum: () => {
    const { gameState } = get();
    return gameState?.currentPath?.sum ?? 0;
  },
  
  getRemainingCells: () => {
    const { gameState } = get();
    return gameState?.remainingCells ?? 0;
  },
}));
