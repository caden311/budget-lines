/**
 * Tests for grid.ts operations
 */

import {
  createGrid,
  getCell,
  getCellById,
  updateCellState,
  updateCellsState,
  getAvailableCells,
  getAdjacentAvailableCells,
  countAvailableCells,
  extractGridValues,
  markCellsAsSpent,
  markCellsInPath,
  clearPathCells,
  resetGrid,
  restoreGridFromProgress,
} from '../grid';
import { Cell, CellState } from '../types';

// Helper to create a simple test grid
function createTestGrid(size: number = 3): Cell[][] {
  const values = Array(size)
    .fill(null)
    .map((_, row) =>
      Array(size)
        .fill(null)
        .map((_, col) => row * size + col + 1)
    );
  return createGrid(size, values);
}

describe('createGrid', () => {
  it('should create a grid with correct dimensions', () => {
    const values = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ];
    const grid = createGrid(3, values);

    expect(grid.length).toBe(3);
    expect(grid[0].length).toBe(3);
  });

  it('should create cells with correct values', () => {
    const values = [
      [1, 2],
      [3, 4],
    ];
    const grid = createGrid(2, values);

    expect(grid[0][0].value).toBe(1);
    expect(grid[0][1].value).toBe(2);
    expect(grid[1][0].value).toBe(3);
    expect(grid[1][1].value).toBe(4);
  });

  it('should create cells with correct IDs', () => {
    const grid = createTestGrid(3);

    expect(grid[0][0].id).toBe('0-0');
    expect(grid[0][2].id).toBe('0-2');
    expect(grid[2][1].id).toBe('2-1');
  });

  it('should create cells with correct positions', () => {
    const grid = createTestGrid(3);

    expect(grid[1][2].position).toEqual({ row: 1, col: 2 });
  });

  it('should create cells with available state', () => {
    const grid = createTestGrid(3);

    grid.forEach((row) =>
      row.forEach((cell) => {
        expect(cell.state).toBe('available');
      })
    );
  });
});

describe('getCell', () => {
  const grid = createTestGrid(3);

  it('should return the correct cell for valid position', () => {
    const cell = getCell(grid, { row: 1, col: 2 });
    expect(cell).not.toBeNull();
    expect(cell!.id).toBe('1-2');
  });

  it('should return null for negative row', () => {
    expect(getCell(grid, { row: -1, col: 0 })).toBeNull();
  });

  it('should return null for negative column', () => {
    expect(getCell(grid, { row: 0, col: -1 })).toBeNull();
  });

  it('should return null for row out of bounds', () => {
    expect(getCell(grid, { row: 3, col: 0 })).toBeNull();
  });

  it('should return null for column out of bounds', () => {
    expect(getCell(grid, { row: 0, col: 3 })).toBeNull();
  });
});

describe('getCellById', () => {
  const grid = createTestGrid(3);

  it('should return the correct cell for valid ID', () => {
    const cell = getCellById(grid, '1-2');
    expect(cell).not.toBeNull();
    expect(cell!.position).toEqual({ row: 1, col: 2 });
  });

  it('should return null for out of bounds ID', () => {
    expect(getCellById(grid, '5-5')).toBeNull();
  });
});

describe('updateCellState', () => {
  it('should update a single cell state', () => {
    const grid = createTestGrid(3);
    const newGrid = updateCellState(grid, '1-1', 'spent');

    expect(newGrid[1][1].state).toBe('spent');
  });

  it('should not modify the original grid (immutable)', () => {
    const grid = createTestGrid(3);
    updateCellState(grid, '1-1', 'spent');

    expect(grid[1][1].state).toBe('available');
  });

  it('should leave other cells unchanged', () => {
    const grid = createTestGrid(3);
    const newGrid = updateCellState(grid, '1-1', 'spent');

    expect(newGrid[0][0].state).toBe('available');
    expect(newGrid[2][2].state).toBe('available');
  });
});

describe('updateCellsState', () => {
  it('should update multiple cells', () => {
    const grid = createTestGrid(3);
    const newGrid = updateCellsState(grid, ['0-0', '1-1', '2-2'], 'in-path');

    expect(newGrid[0][0].state).toBe('in-path');
    expect(newGrid[1][1].state).toBe('in-path');
    expect(newGrid[2][2].state).toBe('in-path');
  });

  it('should not modify unspecified cells', () => {
    const grid = createTestGrid(3);
    const newGrid = updateCellsState(grid, ['0-0', '2-2'], 'in-path');

    expect(newGrid[1][1].state).toBe('available');
    expect(newGrid[0][1].state).toBe('available');
  });
});

describe('getAvailableCells', () => {
  it('should return all cells for fresh grid', () => {
    const grid = createTestGrid(3);
    const available = getAvailableCells(grid);

    expect(available.length).toBe(9);
  });

  it('should exclude spent cells', () => {
    const grid = createTestGrid(3);
    const newGrid = updateCellsState(grid, ['0-0', '1-1'], 'spent');
    const available = getAvailableCells(newGrid);

    expect(available.length).toBe(7);
    expect(available.find((c) => c.id === '0-0')).toBeUndefined();
    expect(available.find((c) => c.id === '1-1')).toBeUndefined();
  });

  it('should exclude in-path cells', () => {
    const grid = createTestGrid(3);
    const newGrid = updateCellsState(grid, ['0-0'], 'in-path');
    const available = getAvailableCells(newGrid);

    expect(available.length).toBe(8);
  });
});

describe('getAdjacentAvailableCells', () => {
  it('should return 4 neighbors for center cell', () => {
    const grid = createTestGrid(3);
    const adjacent = getAdjacentAvailableCells(grid, { row: 1, col: 1 });

    expect(adjacent.length).toBe(4);
  });

  it('should return 2 neighbors for corner cell', () => {
    const grid = createTestGrid(3);
    const adjacent = getAdjacentAvailableCells(grid, { row: 0, col: 0 });

    expect(adjacent.length).toBe(2);
    expect(adjacent.map((c) => c.id).sort()).toEqual(['0-1', '1-0']);
  });

  it('should return 3 neighbors for edge cell', () => {
    const grid = createTestGrid(3);
    const adjacent = getAdjacentAvailableCells(grid, { row: 0, col: 1 });

    expect(adjacent.length).toBe(3);
  });

  it('should exclude spent neighbors', () => {
    const grid = createTestGrid(3);
    const newGrid = updateCellState(grid, '0-1', 'spent');
    const adjacent = getAdjacentAvailableCells(newGrid, { row: 0, col: 0 });

    expect(adjacent.length).toBe(1);
    expect(adjacent[0].id).toBe('1-0');
  });
});

describe('countAvailableCells', () => {
  it('should count all cells in fresh grid', () => {
    const grid = createTestGrid(4);
    expect(countAvailableCells(grid)).toBe(16);
  });

  it('should exclude spent cells from count', () => {
    const grid = createTestGrid(3);
    const newGrid = updateCellsState(grid, ['0-0', '1-1', '2-2'], 'spent');

    expect(countAvailableCells(newGrid)).toBe(6);
  });
});

describe('extractGridValues', () => {
  it('should extract values correctly', () => {
    const values = [
      [5, 3, 2],
      [1, 4, 6],
      [7, 8, 9],
    ];
    const grid = createGrid(3, values);
    const extracted = extractGridValues(grid);

    expect(extracted).toEqual(values);
  });
});

describe('markCellsAsSpent', () => {
  it('should mark cells as spent', () => {
    const grid = createTestGrid(3);
    const newGrid = markCellsAsSpent(grid, ['0-0', '0-1', '0-2']);

    expect(newGrid[0][0].state).toBe('spent');
    expect(newGrid[0][1].state).toBe('spent');
    expect(newGrid[0][2].state).toBe('spent');
    expect(newGrid[1][0].state).toBe('available');
  });
});

describe('markCellsInPath', () => {
  it('should mark cells as in-path', () => {
    const grid = createTestGrid(3);
    const newGrid = markCellsInPath(grid, ['1-0', '1-1', '1-2']);

    expect(newGrid[1][0].state).toBe('in-path');
    expect(newGrid[1][1].state).toBe('in-path');
    expect(newGrid[1][2].state).toBe('in-path');
  });
});

describe('clearPathCells', () => {
  it('should reset in-path cells to available', () => {
    const grid = createTestGrid(3);
    const pathGrid = markCellsInPath(grid, ['1-0', '1-1']);
    const clearedGrid = clearPathCells(pathGrid, ['1-0', '1-1']);

    expect(clearedGrid[1][0].state).toBe('available');
    expect(clearedGrid[1][1].state).toBe('available');
  });
});

describe('resetGrid', () => {
  it('should reset all cells to available', () => {
    const grid = createTestGrid(3);
    const modifiedGrid = updateCellsState(
      updateCellsState(grid, ['0-0', '0-1'], 'spent'),
      ['1-0', '1-1'],
      'in-path'
    );
    const resetedGrid = resetGrid(modifiedGrid);

    resetedGrid.forEach((row) =>
      row.forEach((cell) => {
        expect(cell.state).toBe('available');
      })
    );
  });

  it('should preserve cell values', () => {
    const values = [
      [5, 3],
      [1, 4],
    ];
    const grid = createGrid(2, values);
    const modifiedGrid = updateCellState(grid, '0-0', 'spent');
    const resetedGrid = resetGrid(modifiedGrid);

    expect(resetedGrid[0][0].value).toBe(5);
    expect(extractGridValues(resetedGrid)).toEqual(values);
  });
});

describe('restoreGridFromProgress', () => {
  it('should restore spent cells from completed lines', () => {
    const grid = createTestGrid(3);
    const completedLines = [
      ['0-0', '0-1', '0-2'],
      ['1-0', '1-1'],
    ];
    const restoredGrid = restoreGridFromProgress(grid, completedLines);

    // First line cells should be spent
    expect(restoredGrid[0][0].state).toBe('spent');
    expect(restoredGrid[0][1].state).toBe('spent');
    expect(restoredGrid[0][2].state).toBe('spent');

    // Second line cells should be spent
    expect(restoredGrid[1][0].state).toBe('spent');
    expect(restoredGrid[1][1].state).toBe('spent');

    // Remaining cells should be available
    expect(restoredGrid[1][2].state).toBe('available');
    expect(restoredGrid[2][0].state).toBe('available');
    expect(restoredGrid[2][1].state).toBe('available');
    expect(restoredGrid[2][2].state).toBe('available');
  });

  it('should reset previous in-path cells to available', () => {
    const grid = createTestGrid(3);
    const pathGrid = markCellsInPath(grid, ['2-0', '2-1']);
    const restoredGrid = restoreGridFromProgress(pathGrid, [['0-0']]);

    expect(restoredGrid[2][0].state).toBe('available');
    expect(restoredGrid[2][1].state).toBe('available');
  });
});
