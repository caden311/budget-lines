/**
 * Hint generator for Budget Lines
 * Provides helpful hints for stuck players (Premium feature)
 */

import { Cell, HintResult, HintType } from './types';
import { countAvailableCells } from './grid';
import { canAddToPath } from './pathValidator';
import { calculatePathSum } from './sumCalculator';

/**
 * Find all valid starting cells that can potentially lead to a solution
 */
function findValidStartCells(
  grid: Cell[][],
  targetSum: number,
  minLineLength: number
): string[] {
  const validStarts: string[] = [];
  
  for (const row of grid) {
    for (const cell of row) {
      if (cell.state === 'available') {
        // Check if this cell has at least one adjacent available cell
        const hasNeighbor = hasAvailableNeighbor(grid, cell);
        if (hasNeighbor) {
          validStarts.push(cell.id);
        }
      }
    }
  }
  
  return validStarts;
}

/**
 * Check if a cell has at least one available neighbor
 */
function hasAvailableNeighbor(grid: Cell[][], cell: Cell): boolean {
  const { row, col } = cell.position;
  const directions = [
    [-1, 0], [1, 0], [0, -1], [0, 1]
  ];
  
  for (const [dr, dc] of directions) {
    const newRow = row + dr;
    const newCol = col + dc;
    
    if (newRow >= 0 && newRow < grid.length && 
        newCol >= 0 && newCol < grid[0].length) {
      if (grid[newRow][newCol].state === 'available') {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Find valid next moves from the current path
 */
function findValidNextMoves(
  grid: Cell[][],
  currentPathCellIds: string[],
  targetSum: number
): string[] {
  const validMoves: string[] = [];
  
  if (currentPathCellIds.length === 0) {
    // No current path, return all available cells
    for (const row of grid) {
      for (const cell of row) {
        if (cell.state === 'available') {
          validMoves.push(cell.id);
        }
      }
    }
    return validMoves;
  }
  
  // Find the last cell in the path
  const lastCellId = currentPathCellIds[currentPathCellIds.length - 1];
  const lastCell = findCellById(grid, lastCellId);
  if (!lastCell) return validMoves;
  
  // Check all adjacent cells
  const { row, col } = lastCell.position;
  const directions = [
    [-1, 0], [1, 0], [0, -1], [0, 1]
  ];
  
  const currentSum = calculatePathSum(grid, currentPathCellIds);
  
  for (const [dr, dc] of directions) {
    const newRow = row + dr;
    const newCol = col + dc;
    
    if (newRow >= 0 && newRow < grid.length && 
        newCol >= 0 && newCol < grid[0].length) {
      const cell = grid[newRow][newCol];
      
      // Check if move is valid
      const result = canAddToPath(grid, currentPathCellIds, cell.id);
      if (result.success && result.action === 'added') {
        // Prefer moves that don't exceed target
        const newSum = currentSum + cell.value;
        if (newSum <= targetSum) {
          validMoves.push(cell.id);
        }
      }
    }
  }
  
  return validMoves;
}

/**
 * Find a cell by ID in the grid
 */
function findCellById(grid: Cell[][], cellId: string): Cell | null {
  for (const row of grid) {
    for (const cell of row) {
      if (cell.id === cellId) return cell;
    }
  }
  return null;
}

/**
 * Generate a hint based on current game state
 */
export function generateHint(
  grid: Cell[][],
  currentPathCellIds: string[],
  targetSum: number,
  minLineLength: number,
  hintType: HintType = 'start-cell'
): HintResult | null {
  const availableCells = countAvailableCells(grid);
  
  if (availableCells === 0) {
    return null;
  }
  
  switch (hintType) {
    case 'start-cell': {
      // Suggest a good starting cell
      const validStarts = findValidStartCells(grid, targetSum, minLineLength);
      if (validStarts.length === 0) return null;
      
      // Pick a random valid start
      const randomStart = validStarts[Math.floor(Math.random() * validStarts.length)];
      
      return {
        type: 'start-cell',
        cellIds: [randomStart],
        message: 'Try starting from this cell',
      };
    }
    
    case 'next-move': {
      // Suggest the next move
      const validMoves = findValidNextMoves(grid, currentPathCellIds, targetSum);
      if (validMoves.length === 0) {
        return {
          type: 'next-move',
          cellIds: [],
          message: 'No valid moves - try backtracking or reset',
        };
      }
      
      // Pick a random valid move
      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      
      return {
        type: 'next-move',
        cellIds: [randomMove],
        message: currentPathCellIds.length === 0 
          ? 'Start here' 
          : 'Try adding this cell',
      };
    }
    
    case 'full-path': {
      // This would be a more complex algorithm to find a complete solution
      // For now, just suggest the next move
      return generateHint(grid, currentPathCellIds, targetSum, minLineLength, 'next-move');
    }
    
    default:
      return null;
  }
}
