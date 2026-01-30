/**
 * Grid operations for SumTrails
 */

import {
  Cell,
  Position,
  CellState,
  cellIdFromPosition,
  positionFromCellId,
} from './types';

/** Create an empty grid of the specified size */
export function createGrid(size: number, values: number[][]): Cell[][] {
  const grid: Cell[][] = [];
  
  for (let row = 0; row < size; row++) {
    const rowCells: Cell[] = [];
    for (let col = 0; col < size; col++) {
      rowCells.push({
        id: cellIdFromPosition({ row, col }),
        position: { row, col },
        value: values[row][col],
        state: 'available',
      });
    }
    grid.push(rowCells);
  }
  
  return grid;
}

/** Get a cell from the grid by position */
export function getCell(grid: Cell[][], pos: Position): Cell | null {
  if (pos.row < 0 || pos.row >= grid.length) return null;
  if (pos.col < 0 || pos.col >= grid[0].length) return null;
  return grid[pos.row][pos.col];
}

/** Get a cell from the grid by ID */
export function getCellById(grid: Cell[][], id: string): Cell | null {
  const pos = positionFromCellId(id);
  return getCell(grid, pos);
}

/** Update a cell's state in the grid (immutably) */
export function updateCellState(
  grid: Cell[][],
  cellId: string,
  newState: CellState
): Cell[][] {
  const pos = positionFromCellId(cellId);
  return grid.map((row, rowIdx) =>
    row.map((cell, colIdx) =>
      rowIdx === pos.row && colIdx === pos.col
        ? { ...cell, state: newState }
        : cell
    )
  );
}

/** Update multiple cells' states (immutably) */
export function updateCellsState(
  grid: Cell[][],
  cellIds: string[],
  newState: CellState
): Cell[][] {
  const idSet = new Set(cellIds);
  return grid.map(row =>
    row.map(cell =>
      idSet.has(cell.id) ? { ...cell, state: newState } : cell
    )
  );
}

/** Get all available cells from the grid */
export function getAvailableCells(grid: Cell[][]): Cell[] {
  return grid.flat().filter(cell => cell.state === 'available');
}

/** Get adjacent available cells for a given position */
export function getAdjacentAvailableCells(
  grid: Cell[][],
  pos: Position
): Cell[] {
  const directions: Position[] = [
    { row: -1, col: 0 }, // up
    { row: 1, col: 0 },  // down
    { row: 0, col: -1 }, // left
    { row: 0, col: 1 },  // right
  ];
  
  const adjacent: Cell[] = [];
  
  for (const dir of directions) {
    const newPos = { row: pos.row + dir.row, col: pos.col + dir.col };
    const cell = getCell(grid, newPos);
    if (cell && cell.state === 'available') {
      adjacent.push(cell);
    }
  }
  
  return adjacent;
}

/** Count remaining available cells */
export function countAvailableCells(grid: Cell[][]): number {
  return grid.flat().filter(cell => cell.state === 'available').length;
}

/** Extract grid values (for saving) */
export function extractGridValues(grid: Cell[][]): number[][] {
  return grid.map(row => row.map(cell => cell.value));
}

/** Mark cells as spent (after line completion) */
export function markCellsAsSpent(grid: Cell[][], cellIds: string[]): Cell[][] {
  return updateCellsState(grid, cellIds, 'spent');
}

/** Mark cells as in-path (while drawing) */
export function markCellsInPath(grid: Cell[][], cellIds: string[]): Cell[][] {
  return updateCellsState(grid, cellIds, 'in-path');
}

/** Reset path cells back to available */
export function clearPathCells(grid: Cell[][], cellIds: string[]): Cell[][] {
  return updateCellsState(grid, cellIds, 'available');
}

/** Reset entire grid to available state (keeping values) */
export function resetGrid(grid: Cell[][]): Cell[][] {
  return grid.map(row =>
    row.map(cell => ({ ...cell, state: 'available' as CellState }))
  );
}

/** Restore grid state from saved progress */
export function restoreGridFromProgress(
  grid: Cell[][],
  completedLinesCellIds: string[][]
): Cell[][] {
  const spentCellIds = new Set(completedLinesCellIds.flat());
  return grid.map(row =>
    row.map(cell =>
      spentCellIds.has(cell.id)
        ? { ...cell, state: 'spent' as CellState }
        : { ...cell, state: 'available' as CellState }
    )
  );
}
