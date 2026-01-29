/**
 * Tests for stuckDetector.ts
 */

import { isGameStuck, countValidPaths } from '../stuckDetector';
import { createGrid, updateCellsState } from '../grid';
import { Cell } from '../types';

describe('isGameStuck', () => {
  describe('basic scenarios', () => {
    it('should return false when no cells are available (win condition)', () => {
      const values = [[1, 2], [3, 4]];
      let grid = createGrid(2, values);
      grid = updateCellsState(grid, ['0-0', '0-1', '1-0', '1-1'], 'spent');

      expect(isGameStuck(grid, 10, 3)).toBe(false);
    });

    it('should return true when fewer cells than min length', () => {
      const values = [[5, 5], [5, 5]];
      let grid = createGrid(2, values);
      // Leave only 2 cells, but min length is 3
      grid = updateCellsState(grid, ['0-0', '0-1'], 'spent');

      expect(isGameStuck(grid, 10, 3)).toBe(true);
    });

    it('should return false when a valid path exists', () => {
      // Grid where 1+2+3 = 6 = target
      const values = [
        [1, 2, 3],
        [9, 9, 9],
        [9, 9, 9],
      ];
      const grid = createGrid(3, values);

      expect(isGameStuck(grid, 6, 3)).toBe(false);
    });

    it('should return true when no valid path can be formed', () => {
      // All values are 9, target is 10, min length is 3
      // 3 cells of value 9 = 27, way over target
      const values = [
        [9, 9, 9],
        [9, 9, 9],
        [9, 9, 9],
      ];
      const grid = createGrid(3, values);

      expect(isGameStuck(grid, 10, 3)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should find valid path when exactly matches target', () => {
      // Grid: 2+3+5 = 10 = target
      const values = [
        [2, 3, 5],
        [9, 9, 9],
        [9, 9, 9],
      ];
      const grid = createGrid(3, values);

      expect(isGameStuck(grid, 10, 3)).toBe(false);
    });

    it('should handle single cell remaining that matches target and min length 1', () => {
      const values = [[5]];
      const grid = createGrid(1, values);

      expect(isGameStuck(grid, 5, 1)).toBe(false);
    });

    it('should handle disconnected available cells', () => {
      // Checkerboard pattern where only diagonal cells are available
      // Cannot form adjacent path
      const values = [
        [1, 2, 1],
        [2, 1, 2],
        [1, 2, 1],
      ];
      let grid = createGrid(3, values);
      // Make it so only corners are available (not connected)
      grid = updateCellsState(
        grid,
        ['0-1', '1-0', '1-1', '1-2', '2-1'],
        'spent'
      );

      // Only cells 0-0, 0-2, 2-0, 2-2 remain, but they're not connected
      expect(isGameStuck(grid, 2, 2)).toBe(true);
    });
  });

  describe('various path configurations', () => {
    it('should find L-shaped paths', () => {
      const values = [
        [1, 2, 9],
        [7, 9, 9],
        [9, 9, 9],
      ];
      const grid = createGrid(3, values);
      // Path: 0-0 -> 0-1 -> ... but we need 1+2+7 = 10
      // Path: 0-0 (1) -> 1-0 (7) -> ... need to find if path works

      expect(isGameStuck(grid, 10, 3)).toBe(false);
    });

    it('should handle grids with various values', () => {
      const values = [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1],
      ];
      const grid = createGrid(3, values);
      // Can always form paths with sum of N (number of cells)

      expect(isGameStuck(grid, 4, 4)).toBe(false);
    });
  });
});

describe('countValidPaths', () => {
  it('should count valid paths correctly', () => {
    // Simple grid where multiple paths sum to target
    const values = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ];
    const grid = createGrid(3, values);

    // Count paths that sum to 6 with min length 3
    // 1+2+3 = 6 is one valid path
    const count = countValidPaths(grid, 6, 3);
    expect(count).toBeGreaterThan(0);
  });

  it('should return 0 when no valid paths exist', () => {
    const values = [
      [9, 9, 9],
      [9, 9, 9],
      [9, 9, 9],
    ];
    const grid = createGrid(3, values);

    const count = countValidPaths(grid, 5, 3);
    expect(count).toBe(0);
  });

  it('should respect maxPaths limit', () => {
    const values = [
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
      [1, 1, 1, 1],
    ];
    const grid = createGrid(4, values);

    // Many paths will sum to 3 with min length 3
    const count = countValidPaths(grid, 3, 3, 5);
    expect(count).toBeLessThanOrEqual(5);
  });

  it('should count multiple starting points', () => {
    const values = [
      [1, 2],
      [3, 4],
    ];
    const grid = createGrid(2, values);

    // Paths summing to 6 with min length 2:
    // 2+4 = 6 (0-1 -> 1-1)
    // 3+... need adjacent cells summing to 6
    const count = countValidPaths(grid, 6, 2);
    expect(count).toBeGreaterThan(0);
  });
});
