/**
 * Tests for pathValidator.ts
 */

import {
  canAddToPath,
  canStartPath,
  getValidNextCells,
  validatePath,
} from '../pathValidator';
import { createGrid, updateCellState, updateCellsState } from '../grid';
import { Cell } from '../types';

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

describe('canAddToPath', () => {
  describe('starting a new path', () => {
    it('should allow starting from an available cell', () => {
      const grid = createTestGrid(3);
      const result = canAddToPath(grid, [], '1-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.action).toBe('added');
      }
    });

    it('should not allow starting from a spent cell', () => {
      const grid = updateCellState(createTestGrid(3), '1-1', 'spent');
      const result = canAddToPath(grid, [], '1-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toBe('spent');
      }
    });
  });

  describe('extending a path', () => {
    it('should allow adding an adjacent available cell', () => {
      const grid = createTestGrid(3);
      const result = canAddToPath(grid, ['1-1'], '1-2');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.action).toBe('added');
      }
    });

    it('should not allow adding a non-adjacent cell', () => {
      const grid = createTestGrid(3);
      const result = canAddToPath(grid, ['0-0'], '2-2');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toBe('not-adjacent');
      }
    });

    it('should not allow adding a spent cell', () => {
      const grid = updateCellState(createTestGrid(3), '1-2', 'spent');
      const result = canAddToPath(grid, ['1-1'], '1-2');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toBe('spent');
      }
    });

    it('should not allow adding a cell already in path', () => {
      const grid = createTestGrid(3);
      const result = canAddToPath(grid, ['0-0', '0-1', '1-1'], '0-0');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toBe('already-in-path');
      }
    });
  });

  describe('backtracking', () => {
    it('should allow backtracking to the previous cell', () => {
      const grid = createTestGrid(3);
      const result = canAddToPath(grid, ['0-0', '0-1', '1-1'], '0-1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.action).toBe('backtracked');
      }
    });

    it('should not allow backtracking to non-previous cells in path', () => {
      const grid = createTestGrid(3);
      // Path: 0-0 -> 0-1 -> 0-2 -> 1-2
      // Trying to go back to 0-0 (not the previous cell 0-2)
      const result = canAddToPath(grid, ['0-0', '0-1', '0-2', '1-2'], '0-0');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toBe('already-in-path');
      }
    });

    it('should not allow backtrack on path of length 1', () => {
      const grid = createTestGrid(3);
      const result = canAddToPath(grid, ['1-1'], '1-1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toBe('already-in-path');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle non-existent cell ID', () => {
      const grid = createTestGrid(3);
      const result = canAddToPath(grid, ['1-1'], '9-9');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toBe('not-adjacent');
      }
    });
  });
});

describe('canStartPath', () => {
  it('should return true for an available cell', () => {
    const grid = createTestGrid(3);
    expect(canStartPath(grid, '1-1')).toBe(true);
  });

  it('should return false for a spent cell', () => {
    const grid = updateCellState(createTestGrid(3), '1-1', 'spent');
    expect(canStartPath(grid, '1-1')).toBe(false);
  });

  it('should return false for an in-path cell', () => {
    const grid = updateCellState(createTestGrid(3), '1-1', 'in-path');
    expect(canStartPath(grid, '1-1')).toBe(false);
  });

  it('should return false for non-existent cell', () => {
    const grid = createTestGrid(3);
    expect(canStartPath(grid, '9-9')).toBe(false);
  });
});

describe('getValidNextCells', () => {
  describe('with empty path', () => {
    it('should return all available cells', () => {
      const grid = createTestGrid(3);
      const validCells = getValidNextCells(grid, []);

      expect(validCells.length).toBe(9);
    });

    it('should exclude spent cells', () => {
      const grid = updateCellsState(createTestGrid(3), ['0-0', '1-1'], 'spent');
      const validCells = getValidNextCells(grid, []);

      expect(validCells.length).toBe(7);
      expect(validCells.find((c) => c.id === '0-0')).toBeUndefined();
      expect(validCells.find((c) => c.id === '1-1')).toBeUndefined();
    });
  });

  describe('with existing path', () => {
    it('should return adjacent available cells', () => {
      const grid = createTestGrid(3);
      // Start from center (1-1), should have 4 neighbors
      const validCells = getValidNextCells(grid, ['1-1']);

      expect(validCells.length).toBe(4);
      expect(validCells.map((c) => c.id).sort()).toEqual([
        '0-1',
        '1-0',
        '1-2',
        '2-1',
      ]);
    });

    it('should exclude cells already in path', () => {
      const grid = createTestGrid(3);
      // Path goes 1-1 -> 1-2
      const validCells = getValidNextCells(grid, ['1-1', '1-2']);

      // 1-2 has neighbors: 0-2, 1-1, 2-2
      // But 1-1 is already in path
      expect(validCells.length).toBe(2);
      expect(validCells.find((c) => c.id === '1-1')).toBeUndefined();
    });

    it('should exclude spent cells', () => {
      const grid = updateCellState(createTestGrid(3), '0-1', 'spent');
      const validCells = getValidNextCells(grid, ['1-1']);

      expect(validCells.length).toBe(3);
      expect(validCells.find((c) => c.id === '0-1')).toBeUndefined();
    });

    it('should return empty array when no valid moves', () => {
      // Create a scenario where all neighbors are either spent or in path
      let grid = createTestGrid(3);
      grid = updateCellsState(grid, ['0-1', '1-0', '1-2', '2-1'], 'spent');

      const validCells = getValidNextCells(grid, ['1-1']);
      expect(validCells.length).toBe(0);
    });
  });

  describe('corner and edge positions', () => {
    it('should handle corner position correctly', () => {
      const grid = createTestGrid(3);
      const validCells = getValidNextCells(grid, ['0-0']);

      expect(validCells.length).toBe(2);
      expect(validCells.map((c) => c.id).sort()).toEqual(['0-1', '1-0']);
    });

    it('should handle edge position correctly', () => {
      const grid = createTestGrid(3);
      const validCells = getValidNextCells(grid, ['0-1']);

      expect(validCells.length).toBe(3);
    });
  });
});

describe('validatePath', () => {
  it('should return true for empty path', () => {
    const grid = createTestGrid(3);
    expect(validatePath(grid, [])).toBe(true);
  });

  it('should return true for valid single-cell path', () => {
    const grid = createTestGrid(3);
    expect(validatePath(grid, ['1-1'])).toBe(true);
  });

  it('should return true for valid multi-cell path', () => {
    const grid = createTestGrid(3);
    expect(validatePath(grid, ['0-0', '0-1', '0-2', '1-2'])).toBe(true);
  });

  it('should return false if first cell is spent', () => {
    const grid = updateCellState(createTestGrid(3), '0-0', 'spent');
    expect(validatePath(grid, ['0-0', '0-1'])).toBe(false);
  });

  it('should return false if any cell in path is spent', () => {
    const grid = updateCellState(createTestGrid(3), '0-1', 'spent');
    expect(validatePath(grid, ['0-0', '0-1', '0-2'])).toBe(false);
  });

  it('should return false for non-adjacent cells in path', () => {
    const grid = createTestGrid(3);
    expect(validatePath(grid, ['0-0', '2-2'])).toBe(false);
  });

  it('should return false for diagonal move', () => {
    const grid = createTestGrid(3);
    expect(validatePath(grid, ['0-0', '1-1'])).toBe(false);
  });
});
