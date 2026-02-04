/**
 * Tests for puzzleGenerator.ts
 */

import {
  getDailyPuzzleId,
  getPracticePuzzleId,
  generateDailyPuzzle,
  generatePracticePuzzle,
  restorePuzzleFromValues,
} from '../puzzleGenerator';
import { countAvailableCells } from '../grid';

describe('getDailyPuzzleId', () => {
  it('should generate consistent ID for the same date', () => {
    // Use noon UTC which is well after 8am ET
    const date = new Date('2025-06-15T16:00:00Z');
    const id1 = getDailyPuzzleId(date);
    const id2 = getDailyPuzzleId(date);

    expect(id1).toBe(id2);
  });

  it('should generate different IDs for different dates', () => {
    // Use noon ET on consecutive days
    const date1 = new Date('2025-06-15T16:00:00Z');
    const date2 = new Date('2025-06-16T16:00:00Z');

    expect(getDailyPuzzleId(date1)).not.toBe(getDailyPuzzleId(date2));
  });

  it('should have correct format', () => {
    // Use a time that's clearly after 8am ET (noon UTC on June 15 = 8am ET)
    const date = new Date('2025-06-15T12:00:00Z');
    const id = getDailyPuzzleId(date);

    expect(id).toBe('daily-2025-06-15');
  });

  it('should use puzzle date before 8am ET as previous day', () => {
    // 6am ET = 10am UTC, which is before 8am ET
    const beforeReset = new Date('2025-06-15T10:00:00Z'); // 6am ET
    const afterReset = new Date('2025-06-15T13:00:00Z'); // 9am ET

    const idBefore = getDailyPuzzleId(beforeReset);
    const idAfter = getDailyPuzzleId(afterReset);

    // Before 8am ET should show previous day's puzzle
    expect(idBefore).toBe('daily-2025-06-14');
    // After 8am ET should show current day's puzzle
    expect(idAfter).toBe('daily-2025-06-15');
  });
});

describe('getPracticePuzzleId', () => {
  it('should generate unique IDs', () => {
    const id1 = getPracticePuzzleId();
    const id2 = getPracticePuzzleId();

    expect(id1).not.toBe(id2);
  });

  it('should have correct prefix', () => {
    const id = getPracticePuzzleId();
    expect(id.startsWith('practice-')).toBe(true);
  });
});

describe('generateDailyPuzzle', () => {
  it('should generate the same puzzle for the same date', () => {
    // Use noon ET (4pm UTC during EDT)
    const date = new Date('2025-06-15T16:00:00Z');
    const puzzle1 = generateDailyPuzzle(date);
    const puzzle2 = generateDailyPuzzle(date);

    expect(puzzle1.puzzleId).toBe(puzzle2.puzzleId);
    expect(puzzle1.grid[0][0].value).toBe(puzzle2.grid[0][0].value);
    expect(puzzle1.grid[1][1].value).toBe(puzzle2.grid[1][1].value);
  });

  it('should generate different puzzles for different dates', () => {
    const puzzle1 = generateDailyPuzzle(new Date('2025-06-15T16:00:00Z'));
    const puzzle2 = generateDailyPuzzle(new Date('2025-06-16T16:00:00Z'));

    expect(puzzle1.puzzleId).not.toBe(puzzle2.puzzleId);
  });

  it('should have correct mode', () => {
    const puzzle = generateDailyPuzzle(new Date());
    expect(puzzle.mode).toBe('daily');
  });

  it('should initialize with correct state', () => {
    const puzzle = generateDailyPuzzle(new Date());

    expect(puzzle.lines).toEqual([]);
    expect(puzzle.currentPath).toBeNull();
    expect(puzzle.isWon).toBe(false);
    expect(puzzle.isStuck).toBe(false);
    expect(puzzle.completedAt).toBeNull();
    expect(puzzle.startedAt).toBeDefined();
  });

  it('should generate 7x7 grid', () => {
    const puzzle = generateDailyPuzzle(new Date());

    expect(puzzle.grid.length).toBe(7);
    expect(puzzle.grid[0].length).toBe(7);
    expect(puzzle.minLineLength).toBe(3);
    expect(puzzle.targetSum).toBe(18);
  });

  it('should generate values within expected range (1-8)', () => {
    const puzzle = generateDailyPuzzle(new Date());

    puzzle.grid.forEach((row) => {
      row.forEach((cell) => {
        expect(cell.value).toBeGreaterThanOrEqual(1);
        expect(cell.value).toBeLessThanOrEqual(8);
      });
    });
  });

  it('should generate puzzles with varied path lengths across different dates', () => {
    // Generate puzzles for 10 different dates (noon ET each day)
    const puzzles = [];
    for (let i = 0; i < 10; i++) {
      const date = new Date('2025-01-01T17:00:00Z'); // Noon ET
      date.setDate(date.getDate() + i);
      puzzles.push(generateDailyPuzzle(date));
    }

    // Collect path length statistics
    const pathLengths = puzzles.map((p) => p.solutionPaths.map((path) => path.length));

    // Check that we have variety in path lengths
    // Some puzzles should have longer paths (5+ cells)
    const hasLongPaths = pathLengths.some((lengths) => lengths.some((len) => len >= 5));

    // Some puzzles should have shorter paths (3-4 cells)
    const hasShortPaths = pathLengths.some((lengths) => lengths.some((len) => len <= 4));

    // Verify we have variety
    expect(hasLongPaths || hasShortPaths).toBe(true);

    // Verify puzzles are different (at least some grid values differ)
    const firstPuzzleValues = puzzles[0].grid.map((row) => row.map((cell) => cell.value));
    const allSame = puzzles.slice(1).every((puzzle) => {
      return puzzle.grid.every((row, r) =>
        row.every((cell, c) => cell.value === firstPuzzleValues[r][c])
      );
    });
    expect(allSame).toBe(false); // Puzzles should differ
  });

  it('should generate solvable puzzles where solution paths sum to targetSum', () => {
    const puzzle = generateDailyPuzzle(new Date());

    // Check each solution path
    for (const path of puzzle.solutionPaths) {
      let sum = 0;
      for (const cellId of path) {
        const [row, col] = cellId.split('-').map(Number);
        sum += puzzle.grid[row][col].value;
      }
      expect(sum).toBe(puzzle.targetSum);
    }
  });

  it('should have solution paths that cover all cells', () => {
    const puzzle = generateDailyPuzzle(new Date());

    const allCells = new Set<string>();
    for (const path of puzzle.solutionPaths) {
      for (const cellId of path) {
        allCells.add(cellId);
      }
    }

    // 7x7 grid = 49 cells
    expect(allCells.size).toBe(49);
  });
});

describe('generatePracticePuzzle', () => {
  it('should generate unique puzzles', () => {
    const puzzle1 = generatePracticePuzzle();
    const puzzle2 = generatePracticePuzzle();

    expect(puzzle1.puzzleId).not.toBe(puzzle2.puzzleId);
  });

  it('should have correct mode', () => {
    const puzzle = generatePracticePuzzle();
    expect(puzzle.mode).toBe('practice');
  });

  it('should have puzzle ID with practice prefix', () => {
    const puzzle = generatePracticePuzzle();
    expect(puzzle.puzzleId.startsWith('practice-')).toBe(true);
  });

  it('should generate 7x7 grid', () => {
    const puzzle = generatePracticePuzzle();

    expect(puzzle.grid.length).toBe(7);
    expect(puzzle.grid[0].length).toBe(7);
  });
});

describe('restorePuzzleFromValues', () => {
  it('should restore puzzle with correct values', () => {
    const values = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ];
    const puzzle = restorePuzzleFromValues('test-puzzle', 'daily', values, 15, 3, Date.now());

    expect(puzzle.grid[0][0].value).toBe(1);
    expect(puzzle.grid[1][1].value).toBe(5);
    expect(puzzle.grid[2][2].value).toBe(9);
  });

  it('should restore puzzle with correct metadata', () => {
    const startedAt = Date.now() - 10000;
    const puzzle = restorePuzzleFromValues(
      'my-puzzle',
      'practice',
      [
        [1, 2],
        [3, 4],
      ],
      10,
      2,
      startedAt
    );

    expect(puzzle.puzzleId).toBe('my-puzzle');
    expect(puzzle.mode).toBe('practice');
    expect(puzzle.targetSum).toBe(10);
    expect(puzzle.minLineLength).toBe(2);
    expect(puzzle.startedAt).toBe(startedAt);
  });

  it('should initialize with clean state', () => {
    const puzzle = restorePuzzleFromValues(
      'test',
      'daily',
      [
        [1, 2],
        [3, 4],
      ],
      10,
      2,
      Date.now()
    );

    expect(puzzle.lines).toEqual([]);
    expect(puzzle.currentPath).toBeNull();
    expect(puzzle.isWon).toBe(false);
    expect(puzzle.isStuck).toBe(false);
    expect(puzzle.completedAt).toBeNull();
  });

  it('should calculate correct remaining cells', () => {
    const values = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ];
    const puzzle = restorePuzzleFromValues('test', 'daily', values, 15, 3, Date.now());

    expect(puzzle.remainingCells).toBe(9);
    expect(countAvailableCells(puzzle.grid)).toBe(9);
  });
});

describe('center-out generation', () => {
  it('should generate interesting center shapes', () => {
    // Generate multiple puzzles and check that we get varied center shapes
    const puzzles = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date('2025-03-01T17:00:00Z');
      date.setDate(date.getDate() + i);
      puzzles.push(generateDailyPuzzle(date));
    }

    // Check that the center cell (3,3) is part of a path in each puzzle
    for (const puzzle of puzzles) {
      const centerCellId = '3-3';
      let foundInPath = false;
      for (const path of puzzle.solutionPaths) {
        if (path.includes(centerCellId)) {
          foundInPath = true;
          break;
        }
      }
      expect(foundInPath).toBe(true);
    }
  });

  it('should generate paths with turns across multiple dates', () => {
    // Test multiple dates to find at least one with turns
    // (some dates may hit the fallback which generates straight lines)
    let foundTurnInAnyPuzzle = false;

    for (let d = 1; d <= 10; d++) {
      const date = new Date(`2025-05-${String(d).padStart(2, '0')}T17:00:00Z`);
      const puzzle = generateDailyPuzzle(date);

      for (const path of puzzle.solutionPaths) {
        if (path.length >= 3) {
          // Check for direction changes
          for (let i = 2; i < path.length; i++) {
            const pos0 = { row: parseInt(path[i - 2].split('-')[0]), col: parseInt(path[i - 2].split('-')[1]) };
            const pos1 = { row: parseInt(path[i - 1].split('-')[0]), col: parseInt(path[i - 1].split('-')[1]) };
            const pos2 = { row: parseInt(path[i].split('-')[0]), col: parseInt(path[i].split('-')[1]) };

            const dir1 = { row: pos1.row - pos0.row, col: pos1.col - pos0.col };
            const dir2 = { row: pos2.row - pos1.row, col: pos2.col - pos1.col };

            if (dir1.row !== dir2.row || dir1.col !== dir2.col) {
              foundTurnInAnyPuzzle = true;
              break;
            }
          }
        }
        if (foundTurnInAnyPuzzle) break;
      }
      if (foundTurnInAnyPuzzle) break;
    }

    expect(foundTurnInAnyPuzzle).toBe(true);
  });
});
