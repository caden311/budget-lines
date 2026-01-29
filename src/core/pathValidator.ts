/**
 * Path validation for Budget Lines
 * Handles checking if moves are valid during line drawing
 */

import {
  Cell,
  Position,
  PathAddResult,
  areAdjacent,
  positionFromCellId,
} from './types';
import { getCell, getCellById } from './grid';

/** Check if a cell can be added to the current path */
export function canAddToPath(
  grid: Cell[][],
  currentPath: string[],
  cellId: string
): PathAddResult {
  const cell = getCellById(grid, cellId);
  
  // Cell doesn't exist
  if (!cell) {
    return { success: false, reason: 'not-adjacent' };
  }
  
  // If path is empty, cell must be available
  if (currentPath.length === 0) {
    if (cell.state === 'spent') {
      return { success: false, reason: 'spent' };
    }
    return { success: true, action: 'added' };
  }
  
  // Check if this is a backtrack (going back to previous cell)
  if (currentPath.length >= 2) {
    const secondToLast = currentPath[currentPath.length - 2];
    if (secondToLast === cellId) {
      return { success: true, action: 'backtracked' };
    }
  }
  
  // Cell is already in path (and not a backtrack)
  if (currentPath.includes(cellId)) {
    return { success: false, reason: 'already-in-path' };
  }
  
  // Cell is spent
  if (cell.state === 'spent') {
    return { success: false, reason: 'spent' };
  }
  
  // Check adjacency to last cell in path
  const lastCellId = currentPath[currentPath.length - 1];
  const lastPos = positionFromCellId(lastCellId);
  const newPos = positionFromCellId(cellId);
  
  if (!areAdjacent(lastPos, newPos)) {
    return { success: false, reason: 'not-adjacent' };
  }
  
  return { success: true, action: 'added' };
}

/** Check if a path can be started from a cell */
export function canStartPath(grid: Cell[][], cellId: string): boolean {
  const cell = getCellById(grid, cellId);
  return cell !== null && cell.state === 'available';
}

/** Get the next valid cells that can be added to the path */
export function getValidNextCells(
  grid: Cell[][],
  currentPath: string[]
): Cell[] {
  if (currentPath.length === 0) {
    // Any available cell can start a path
    return grid.flat().filter(cell => cell.state === 'available');
  }
  
  const lastCellId = currentPath[currentPath.length - 1];
  const lastPos = positionFromCellId(lastCellId);
  
  const directions: Position[] = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
  ];
  
  const validCells: Cell[] = [];
  
  for (const dir of directions) {
    const newPos = { row: lastPos.row + dir.row, col: lastPos.col + dir.col };
    const cell = getCell(grid, newPos);
    
    if (cell && cell.state === 'available' && !currentPath.includes(cell.id)) {
      validCells.push(cell);
    }
  }
  
  return validCells;
}

/** Validate an entire path (for restoring saved games) */
export function validatePath(grid: Cell[][], path: string[]): boolean {
  if (path.length === 0) return true;
  
  // Check first cell is valid
  const firstCell = getCellById(grid, path[0]);
  if (!firstCell || firstCell.state === 'spent') return false;
  
  // Check each subsequent cell is adjacent and valid
  for (let i = 1; i < path.length; i++) {
    const prevPos = positionFromCellId(path[i - 1]);
    const currPos = positionFromCellId(path[i]);
    
    if (!areAdjacent(prevPos, currPos)) return false;
    
    const cell = getCellById(grid, path[i]);
    if (!cell || cell.state === 'spent') return false;
  }
  
  return true;
}
