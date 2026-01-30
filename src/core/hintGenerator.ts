/**
 * Hint generator for Budget Lines
 * Provides a single-use hint showing a complete valid line that's part of a solvable solution
 */

import { countAvailableCells, getCellById, markCellsAsSpent } from './grid';
import { findValidLinesLimited, hasReasonableSolvability } from './stuckDetector';
import { Cell, HintResult } from './types';

/**
 * Find a solution path where all cells are still available
 * This guarantees the hint is part of a valid solution
 */
function findAvailableSolutionPath(
  grid: Cell[][],
  solutionPaths: string[][]
): string[] | null {
  for (const path of solutionPaths) {
    // Check if all cells in this path are still available
    const allAvailable = path.every(cellId => {
      const cell = getCellById(grid, cellId);
      return cell && cell.state === 'available';
    });
    
    if (allAvailable) {
      return path;
    }
  }
  
  return null;
}

/**
 * Legacy fallback: Find a valid line using search (for saved games without solution paths)
 * Only returns a line if it passes the solvability check - NO unsafe fallback
 */
function findSolvableLineLegacy(
  grid: Cell[][],
  targetSum: number,
  minLineLength: number
): string[] | null {
  const validLines = findValidLinesLimited(grid, targetSum, minLineLength, 500);
  
  if (validLines.length === 0) {
    return null;
  }
  
  const maxLinesToCheck = Math.min(validLines.length, 20);
  
  for (let i = 0; i < maxLinesToCheck; i++) {
    const line = validLines[i];
    const newGrid = markCellsAsSpent(grid, line);
    const remainingCells = countAvailableCells(newGrid);
    
    // If this line clears all cells, it's definitely good
    if (remainingCells === 0) {
      return line;
    }
    
    // Check if remaining puzzle has reasonable solvability
    if (hasReasonableSolvability(newGrid, targetSum, minLineLength)) {
      return line;
    }
  }
  
  // IMPORTANT: Do NOT fall back to validLines[0] - that was the bug!
  // Return null if no line passes the solvability check
  return null;
}

/**
 * Generate a hint showing a complete valid line that's part of a solvable solution
 * Uses the original solution paths from puzzle generation to guarantee correctness
 * Falls back to search-based hints for legacy saved games (without the unsafe fallback)
 * Returns null if no valid line exists or puzzle is stuck
 */
export function generateHint(
  grid: Cell[][],
  currentPathCellIds: string[],
  targetSum: number,
  minLineLength: number,
  solutionPaths: string[][] = []
): HintResult | null {
  const availableCells = countAvailableCells(grid);
  
  if (availableCells === 0) {
    return null;
  }
  
  // Use solution paths if available (guaranteed to be part of a valid solution)
  if (solutionPaths.length > 0) {
    const line = findAvailableSolutionPath(grid, solutionPaths);
    
    if (line && line.length > 0) {
      return {
        type: 'full-line',
        cellIds: line,
        message: 'This line is part of the solution',
      };
    }
  }
  
  // Fallback for legacy saved games without solution paths
  // Uses search-based approach but WITHOUT the dangerous "return first valid line" fallback
  const legacyLine = findSolvableLineLegacy(grid, targetSum, minLineLength);
  
  if (legacyLine && legacyLine.length > 0) {
    return {
      type: 'full-line',
      cellIds: legacyLine,
      message: 'This line leads to a solvable state',
    };
  }
  
  return null;
}
