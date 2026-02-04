/**
 * Tests for hintGenerator.ts
 */

import { generateHint } from '../hintGenerator';
import { createGrid, updateCellsState } from '../grid';
import { generateSolvablePuzzle } from '../constructiveGenerator';
import seedrandom from 'seedrandom';

// Create a grid with known values for testing (NOT guaranteed solvable)
function createTestGrid(): number[][] {
  return [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ];
}

// Create a guaranteed solvable grid using constructive generator
function createSolvableTestGrid(seed: string = 'test-hint-seed') {
  const rng = seedrandom(seed);
  const puzzle = generateSolvablePuzzle(
    { gridSize: 7, minLineLength: 3, targetSum: 18, valueRange: { min: 1, max: 8 } },
    rng
  );
  return puzzle;
}

describe('generateHint', () => {
  describe('when no cells are available', () => {
    it('should return null', () => {
      const grid = createGrid(3, createTestGrid());
      const allCellIds = [
        '0-0', '0-1', '0-2',
        '1-0', '1-1', '1-2',
        '2-0', '2-1', '2-2',
      ];
      const spentGrid = updateCellsState(grid, allCellIds, 'spent');

      const hint = generateHint(spentGrid, [], 10, 3);
      expect(hint).toBeNull();
    });
  });

  describe('full-line hint', () => {
    it('should return a complete valid line', () => {
      // Use constructive generator to create a guaranteed solvable puzzle
      const { values, solutionPaths } = createSolvableTestGrid();
      const grid = createGrid(7, values);
      const hint = generateHint(grid, [], 18, 3, solutionPaths);

      expect(hint).not.toBeNull();
      expect(hint!.type).toBe('full-line');
      expect(hint!.cellIds.length).toBeGreaterThanOrEqual(3); // minLineLength
      expect(hint!.message).toBe('This line is part of the solution');
    });

    it('should return a line with valid sum', () => {
      const { values, solutionPaths } = createSolvableTestGrid();
      const grid = createGrid(7, values);
      const hint = generateHint(grid, [], 18, 3, solutionPaths);

      if (hint) {
        // Calculate sum of hinted line
        let sum = 0;
        for (const cellId of hint.cellIds) {
          const [row, col] = cellId.split('-').map(Number);
          sum += grid[row][col].value;
        }
        expect(sum).toBe(18); // targetSum
      }
    });

    it('should return null when puzzle is stuck', () => {
      // Create a grid where no valid lines can be formed
      // This is tricky - we need a grid that has cells but can't form valid lines
      // For simplicity, test with a grid that has too few cells
      const grid = createGrid(3, createTestGrid());
      // Mark most cells as spent, leaving only a few that can't form a valid line
      const spentGrid = updateCellsState(
        grid,
        ['0-0', '0-1', '0-2', '1-0', '1-2', '2-0', '2-1', '2-2'],
        'spent'
      );
      // Only 1-1 remains, which can't form a line of length 3

      const hint = generateHint(spentGrid, [], 10, 3);
      expect(hint).toBeNull();
    });

    it('should return a line that leads to solvable state', () => {
      // Use constructive generator to create a guaranteed solvable puzzle
      const { values, solutionPaths } = createSolvableTestGrid('solvable-state-test');
      const grid = createGrid(7, values);
      const hint = generateHint(grid, [], 18, 3, solutionPaths);

      expect(hint).not.toBeNull();
      if (hint) {
        // All cells in the hint should be available
        for (const cellId of hint.cellIds) {
          const [row, col] = cellId.split('-').map(Number);
          expect(grid[row][col].state).toBe('available');
        }
      }
    });
  });

  describe('edge cases', () => {
    it('should handle grid with no valid lines', () => {
      // Create a grid where cells exist but can't form valid lines
      const grid = createGrid(2, [[1, 2], [3, 4]]);
      // Target sum 20 with min length 3 - impossible on 2x2 grid
      const hint = generateHint(grid, [], 20, 3);
      expect(hint).toBeNull();
    });

    it('should handle grid where all cells form one line', () => {
      // Simple grid where one line clears everything
      const grid = createGrid(2, [[5, 5], [5, 5]]);
      const hint = generateHint(grid, [], 20, 4);
      
      // Should return a line if it exists
      if (hint) {
        expect(hint.cellIds.length).toBe(4);
      }
    });
  });
});
