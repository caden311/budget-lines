/**
 * Stuck detection for Budget Lines
 * Determines if the player can no longer complete the puzzle
 */

import { getAvailableCells, getCell } from './grid';
import { Cell, Position, positionFromCellId } from './types';

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
 * Check if a puzzle can be fully solved (all cells cleared)
 * Uses recursive backtracking to find a complete solution
 * 
 * WARNING: This function has exponential complexity and can hang on larger grids.
 * Use hasReasonableSolvability() for puzzle generation instead.
 */
export function canFullySolve(
  grid: Cell[][],
  targetSum: number,
  minLineLength: number
): boolean {
  const availableCells = getAvailableCells(grid);
  
  // Base case: no cells left = solved!
  if (availableCells.length === 0) {
    return true;
  }
  
  // If fewer cells than min length, can't make another line
  if (availableCells.length < minLineLength) {
    return false;
  }
  
  // Find all valid lines from current state
  const validLines = findAllValidLines(grid, targetSum, minLineLength);
  
  // If no valid lines, puzzle is stuck
  if (validLines.length === 0) {
    return false;
  }
  
  // Try each valid line and recursively check if remaining can be solved
  for (const line of validLines) {
    // Create a new grid with this line's cells marked as spent
    const newGrid = markCellsSpent(grid, line);
    
    // Recursively check if the rest can be solved
    if (canFullySolve(newGrid, targetSum, minLineLength)) {
      return true;
    }
  }
  
  // No solution found with any line choice
  return false;
}

/**
 * Bounded solvability check for puzzle generation
 * Uses iteration limits to prevent hanging while still filtering out obviously bad puzzles
 * 
 * Strategy:
 * - Verify multiple valid lines exist (not just one)
 * - Do a shallow depth search (2-3 lines deep) with iteration limits
 * - If we find a promising path or hit the limit, assume "probably solvable"
 */
export function hasReasonableSolvability(
  grid: Cell[][],
  targetSum: number,
  minLineLength: number
): boolean {
  const availableCells = getAvailableCells(grid);
  
  // Must have enough cells
  if (availableCells.length < minLineLength) {
    return false;
  }
  
  // Find valid lines with a limit on search iterations
  const validLines = findValidLinesLimited(grid, targetSum, minLineLength, 1000);
  
  // Need at least 2 valid lines for a reasonable puzzle
  if (validLines.length < 2) {
    return false;
  }
  
  // Do a shallow depth check: try a few lines and see if we can continue
  let successfulPaths = 0;
  const maxLinesToTry = Math.min(validLines.length, 5);
  
  for (let i = 0; i < maxLinesToTry; i++) {
    const line = validLines[i];
    const newGrid = markCellsSpent(grid, line);
    const remainingCells = getAvailableCells(newGrid);
    
    // If this line clears all cells, great!
    if (remainingCells.length === 0) {
      return true;
    }
    
    // If remaining cells can't form a line, this path is bad
    if (remainingCells.length < minLineLength) {
      continue;
    }
    
    // Check if at least one more valid line exists after this one
    const nextLines = findValidLinesLimited(newGrid, targetSum, minLineLength, 200);
    if (nextLines.length > 0) {
      successfulPaths++;
    }
  }
  
  // If at least one line leads to more valid lines, puzzle is likely solvable
  return successfulPaths > 0;
}

/**
 * Find valid lines with an iteration limit to prevent hanging
 */
function findValidLinesLimited(
  grid: Cell[][],
  targetSum: number,
  minLineLength: number,
  maxIterations: number
): string[][] {
  const validLines: string[][] = [];
  const availableCells = getAvailableCells(grid);
  let iterations = 0;
  
  for (const startCell of availableCells) {
    if (iterations >= maxIterations) break;
    
    const stack: PathSearchState[] = [{
      path: [startCell.id],
      sum: startCell.value,
      visited: new Set([startCell.id]),
    }];
    
    while (stack.length > 0 && iterations < maxIterations) {
      iterations++;
      const current = stack.pop()!;
      
      // Check if current path is valid
      if (
        current.sum === targetSum &&
        current.path.length >= minLineLength
      ) {
        validLines.push([...current.path]);
        // Don't stop - continue finding more lines but respect iteration limit
      }
      
      // If sum already exceeds target, prune this branch
      if (current.sum >= targetSum) {
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
  }
  
  // Remove duplicates
  return removeDuplicateLines(validLines);
}

/**
 * Find all valid lines (paths that hit target sum with min length)
 */
function findAllValidLines(
  grid: Cell[][],
  targetSum: number,
  minLineLength: number
): string[][] {
  const validLines: string[][] = [];
  const availableCells = getAvailableCells(grid);
  
  for (const startCell of availableCells) {
    const linesFromCell = findValidLinesFromCell(
      grid,
      startCell,
      targetSum,
      minLineLength
    );
    validLines.push(...linesFromCell);
  }
  
  // Remove duplicates (same line found from different starting points)
  const uniqueLines = removeDuplicateLines(validLines);
  
  return uniqueLines;
}

/**
 * Find all valid lines starting from a specific cell
 */
function findValidLinesFromCell(
  grid: Cell[][],
  startCell: Cell,
  targetSum: number,
  minLineLength: number
): string[][] {
  const validLines: string[][] = [];
  
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
      validLines.push([...current.path]);
    }
    
    // If sum already exceeds target, prune this branch
    if (current.sum >= targetSum) {
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
  
  return validLines;
}

/**
 * Remove duplicate lines (same cells, different order of discovery)
 */
function removeDuplicateLines(lines: string[][]): string[][] {
  const seen = new Set<string>();
  const unique: string[][] = [];
  
  for (const line of lines) {
    // Create a canonical key by sorting cell IDs
    const key = [...line].sort().join(',');
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(line);
    }
  }
  
  return unique;
}

/**
 * Create a new grid with specified cells marked as spent
 */
function markCellsSpent(grid: Cell[][], cellIds: string[]): Cell[][] {
  const cellIdSet = new Set(cellIds);
  
  return grid.map(row =>
    row.map(cell => {
      if (cellIdSet.has(cell.id)) {
        return { ...cell, state: 'spent' as const };
      }
      return cell;
    })
  );
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
