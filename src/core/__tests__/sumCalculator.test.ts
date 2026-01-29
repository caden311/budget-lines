/**
 * Tests for sumCalculator.ts
 */

import {
  calculatePathSum,
  isSumCorrect,
  meetsMinLength,
  getCurrentSum,
  getSumDifference,
  wouldExceedTarget,
  calculateRemainingSum,
} from '../sumCalculator';
import { createGrid, updateCellsState } from '../grid';
import { Cell } from '../types';

// Create a grid with known values for testing
function createTestGrid(): Cell[][] {
  const values = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ];
  return createGrid(3, values);
}

describe('calculatePathSum', () => {
  const grid = createTestGrid();

  it('should return 0 for empty path', () => {
    expect(calculatePathSum(grid, [])).toBe(0);
  });

  it('should calculate sum for single cell', () => {
    expect(calculatePathSum(grid, ['0-0'])).toBe(1);
    expect(calculatePathSum(grid, ['1-1'])).toBe(5);
  });

  it('should calculate sum for multiple cells', () => {
    // 1 + 2 + 3 = 6
    expect(calculatePathSum(grid, ['0-0', '0-1', '0-2'])).toBe(6);
  });

  it('should calculate sum for diagonal path (values)', () => {
    // 1 + 5 + 9 = 15
    expect(calculatePathSum(grid, ['0-0', '1-1', '2-2'])).toBe(15);
  });

  it('should handle non-existent cell IDs gracefully', () => {
    // Non-existent cell should contribute 0
    expect(calculatePathSum(grid, ['0-0', '9-9'])).toBe(1);
  });
});

describe('isSumCorrect', () => {
  const grid = createTestGrid();

  it('should return true when sum matches target', () => {
    // 1 + 2 + 3 = 6
    expect(isSumCorrect(grid, ['0-0', '0-1', '0-2'], 6)).toBe(true);
  });

  it('should return false when sum is below target', () => {
    expect(isSumCorrect(grid, ['0-0', '0-1', '0-2'], 10)).toBe(false);
  });

  it('should return false when sum exceeds target', () => {
    expect(isSumCorrect(grid, ['0-0', '0-1', '0-2'], 5)).toBe(false);
  });

  it('should return true for empty path with target 0', () => {
    expect(isSumCorrect(grid, [], 0)).toBe(true);
  });
});

describe('meetsMinLength', () => {
  it('should return true when path meets minimum length', () => {
    expect(meetsMinLength(['0-0', '0-1', '0-2'], 3)).toBe(true);
  });

  it('should return true when path exceeds minimum length', () => {
    expect(meetsMinLength(['0-0', '0-1', '0-2', '1-2'], 3)).toBe(true);
  });

  it('should return false when path is shorter than minimum', () => {
    expect(meetsMinLength(['0-0', '0-1'], 3)).toBe(false);
  });

  it('should return false for empty path with min length > 0', () => {
    expect(meetsMinLength([], 1)).toBe(false);
  });

  it('should return true for empty path with min length 0', () => {
    expect(meetsMinLength([], 0)).toBe(true);
  });
});

describe('getCurrentSum', () => {
  const grid = createTestGrid();

  it('should return current running sum', () => {
    expect(getCurrentSum(grid, ['0-0'])).toBe(1);
    expect(getCurrentSum(grid, ['0-0', '0-1'])).toBe(3);
    expect(getCurrentSum(grid, ['0-0', '0-1', '0-2'])).toBe(6);
  });

  it('should be equivalent to calculatePathSum', () => {
    const path = ['1-0', '1-1', '1-2'];
    expect(getCurrentSum(grid, path)).toBe(calculatePathSum(grid, path));
  });
});

describe('getSumDifference', () => {
  const grid = createTestGrid();

  it('should return 0 when sum equals target', () => {
    expect(getSumDifference(grid, ['0-0', '0-1', '0-2'], 6)).toBe(0);
  });

  it('should return positive when sum exceeds target', () => {
    // Sum is 6, target is 4, difference is 2
    expect(getSumDifference(grid, ['0-0', '0-1', '0-2'], 4)).toBe(2);
  });

  it('should return negative when sum is below target', () => {
    // Sum is 6, target is 10, difference is -4
    expect(getSumDifference(grid, ['0-0', '0-1', '0-2'], 10)).toBe(-4);
  });
});

describe('wouldExceedTarget', () => {
  const grid = createTestGrid();

  it('should return true if adding cell would exceed target', () => {
    // Current sum: 1 + 2 = 3, adding 3 would make 6, target is 5
    expect(wouldExceedTarget(grid, ['0-0', '0-1'], '0-2', 5)).toBe(true);
  });

  it('should return false if adding cell would not exceed target', () => {
    // Current sum: 1 + 2 = 3, adding 3 would make 6, target is 10
    expect(wouldExceedTarget(grid, ['0-0', '0-1'], '0-2', 10)).toBe(false);
  });

  it('should return false if adding cell would exactly match target', () => {
    // Current sum: 1 + 2 = 3, adding 3 would make 6, target is 6
    expect(wouldExceedTarget(grid, ['0-0', '0-1'], '0-2', 6)).toBe(false);
  });

  it('should return false for non-existent cell', () => {
    expect(wouldExceedTarget(grid, ['0-0'], '9-9', 1)).toBe(false);
  });

  it('should handle empty current path', () => {
    // Adding cell with value 5 to empty path, target is 3
    expect(wouldExceedTarget(grid, [], '1-1', 3)).toBe(true);
  });
});

describe('calculateRemainingSum', () => {
  it('should sum all available cells in fresh grid', () => {
    const grid = createTestGrid();
    // Sum of 1-9 = 45
    expect(calculateRemainingSum(grid)).toBe(45);
  });

  it('should exclude spent cells', () => {
    const grid = updateCellsState(createTestGrid(), ['0-0', '0-1', '0-2'], 'spent');
    // Total 45 - (1 + 2 + 3) = 39
    expect(calculateRemainingSum(grid)).toBe(39);
  });

  it('should exclude in-path cells', () => {
    const grid = updateCellsState(createTestGrid(), ['1-1'], 'in-path');
    // Total 45 - 5 = 40
    expect(calculateRemainingSum(grid)).toBe(40);
  });

  it('should return 0 when all cells are spent', () => {
    const allCellIds = [
      '0-0', '0-1', '0-2',
      '1-0', '1-1', '1-2',
      '2-0', '2-1', '2-2',
    ];
    const grid = updateCellsState(createTestGrid(), allCellIds, 'spent');
    expect(calculateRemainingSum(grid)).toBe(0);
  });
});
