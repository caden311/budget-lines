/**
 * Stuck detection for Budget Lines
 * Determines if the player can no longer complete the puzzle
 */

import { Cell, Position, positionFromCellId, areAdjacent } from './types';
import { getCell, getAvailableCells } from './grid';

interface PathSearchState {
  path: string[];
  sum: number;
  visited: Set<string>;
}

/**
 * Check if the game is stuck (no valid lines can be formed)
 * Uses DFS to find if any valid path exists
 */
export function isGameStuck(
  grid: Cell[][],
  targetSum: number,
  minLineLength: number
): boolean {
  const availableCells = getAvailableCells(grid);
  
  // If no cells available, game is stuck (but might also be won)
  if (availableCells.length === 0) {
    return false; // Will be handled as win condition
  }
  
  // If fewer cells than min length, definitely stuck
  if (availableCells.length < minLineLength) {
    return true;
  }
  
  // Try to find at least one valid path from any starting cell
  for (const startCell of availableCells) {
    if (canFindValidPath(grid, startCell, targetSum, minLineLength)) {
      return false; // Found a valid path, not stuck
    }
  }
  
  return true; // No valid paths found
}

/**
 * DFS to check if a valid path can be formed starting from a cell
 */
function canFindValidPath(
  grid: Cell[][],
  startCell: Cell,
  targetSum: number,
  minLineLength: number
): boolean {
  const stack: PathSearchState[] = [{
    path: [startCell.id],
    sum: startCell.value,
    visited: new Set([startCell.id]),
  }];
  
  while (stack.length > 0) {
    const current = stack.pop()!;
    
    // Check if current path is valid
    if (
      current.sum === targetSum &&
      current.path.length >= minLineLength
    ) {
      return true;
    }
    
    // If sum already exceeds target, prune this branch
    if (current.sum > targetSum) {
      continue;
    }
    
    // Get adjacent available cells
    const lastCellId = current.path[current.path.length - 1];
    const lastPos = positionFromCellId(lastCellId);
    const neighbors = getAdjacentCells(grid, lastPos);
    
    for (const neighbor of neighbors) {
      if (
        neighbor.state === 'available' &&
        !current.visited.has(neighbor.id)
      ) {
        const newVisited = new Set(current.visited);
        newVisited.add(neighbor.id);
        
        stack.push({
          path: [...current.path, neighbor.id],
          sum: current.sum + neighbor.value,
          visited: newVisited,
        });
      }
    }
  }
  
  return false;
}

/**
 * Get all adjacent cells (regardless of state)
 */
function getAdjacentCells(grid: Cell[][], pos: Position): Cell[] {
  const directions: Position[] = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
  ];
  
  const adjacent: Cell[] = [];
  
  for (const dir of directions) {
    const newPos = { row: pos.row + dir.row, col: pos.col + dir.col };
    const cell = getCell(grid, newPos);
    if (cell) {
      adjacent.push(cell);
    }
  }
  
  return adjacent;
}

/**
 * Count how many valid paths exist (for difficulty estimation)
 * Limited search to avoid performance issues
 */
export function countValidPaths(
  grid: Cell[][],
  targetSum: number,
  minLineLength: number,
  maxPaths: number = 100
): number {
  const availableCells = getAvailableCells(grid);
  let pathCount = 0;
  
  for (const startCell of availableCells) {
    pathCount += countPathsFromCell(
      grid,
      startCell,
      targetSum,
      minLineLength,
      maxPaths - pathCount
    );
    
    if (pathCount >= maxPaths) break;
  }
  
  return pathCount;
}

function countPathsFromCell(
  grid: Cell[][],
  startCell: Cell,
  targetSum: number,
  minLineLength: number,
  maxPaths: number
): number {
  let count = 0;
  
  const stack: PathSearchState[] = [{
    path: [startCell.id],
    sum: startCell.value,
    visited: new Set([startCell.id]),
  }];
  
  while (stack.length > 0 && count < maxPaths) {
    const current = stack.pop()!;
    
    if (
      current.sum === targetSum &&
      current.path.length >= minLineLength
    ) {
      count++;
      continue;
    }
    
    if (current.sum >= targetSum) {
      continue;
    }
    
    const lastCellId = current.path[current.path.length - 1];
    const lastPos = positionFromCellId(lastCellId);
    const neighbors = getAdjacentCells(grid, lastPos);
    
    for (const neighbor of neighbors) {
      if (
        neighbor.state === 'available' &&
        !current.visited.has(neighbor.id)
      ) {
        const newVisited = new Set(current.visited);
        newVisited.add(neighbor.id);
        
        stack.push({
          path: [...current.path, neighbor.id],
          sum: current.sum + neighbor.value,
          visited: newVisited,
        });
      }
    }
  }
  
  return count;
}
