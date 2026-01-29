/**
 * Tests for types.ts utility functions
 */

import {
  cellIdFromPosition,
  positionFromCellId,
  areAdjacent,
  Position,
} from '../types';

describe('cellIdFromPosition', () => {
  it('should create cell ID from position (0,0)', () => {
    expect(cellIdFromPosition({ row: 0, col: 0 })).toBe('0-0');
  });

  it('should create cell ID from position (2,3)', () => {
    expect(cellIdFromPosition({ row: 2, col: 3 })).toBe('2-3');
  });

  it('should create cell ID from large positions', () => {
    expect(cellIdFromPosition({ row: 10, col: 15 })).toBe('10-15');
  });
});

describe('positionFromCellId', () => {
  it('should parse cell ID "0-0"', () => {
    expect(positionFromCellId('0-0')).toEqual({ row: 0, col: 0 });
  });

  it('should parse cell ID "2-3"', () => {
    expect(positionFromCellId('2-3')).toEqual({ row: 2, col: 3 });
  });

  it('should parse cell ID with double digits', () => {
    expect(positionFromCellId('10-15')).toEqual({ row: 10, col: 15 });
  });

  it('should be inverse of cellIdFromPosition', () => {
    const original: Position = { row: 5, col: 7 };
    const id = cellIdFromPosition(original);
    const result = positionFromCellId(id);
    expect(result).toEqual(original);
  });
});

describe('areAdjacent', () => {
  const center: Position = { row: 2, col: 2 };

  it('should return true for vertically adjacent cells (above)', () => {
    expect(areAdjacent(center, { row: 1, col: 2 })).toBe(true);
  });

  it('should return true for vertically adjacent cells (below)', () => {
    expect(areAdjacent(center, { row: 3, col: 2 })).toBe(true);
  });

  it('should return true for horizontally adjacent cells (left)', () => {
    expect(areAdjacent(center, { row: 2, col: 1 })).toBe(true);
  });

  it('should return true for horizontally adjacent cells (right)', () => {
    expect(areAdjacent(center, { row: 2, col: 3 })).toBe(true);
  });

  it('should return false for diagonally adjacent cells', () => {
    expect(areAdjacent(center, { row: 1, col: 1 })).toBe(false);
    expect(areAdjacent(center, { row: 1, col: 3 })).toBe(false);
    expect(areAdjacent(center, { row: 3, col: 1 })).toBe(false);
    expect(areAdjacent(center, { row: 3, col: 3 })).toBe(false);
  });

  it('should return false for cells two steps away', () => {
    expect(areAdjacent(center, { row: 0, col: 2 })).toBe(false);
    expect(areAdjacent(center, { row: 4, col: 2 })).toBe(false);
    expect(areAdjacent(center, { row: 2, col: 0 })).toBe(false);
    expect(areAdjacent(center, { row: 2, col: 4 })).toBe(false);
  });

  it('should return false for the same cell', () => {
    expect(areAdjacent(center, center)).toBe(false);
  });

  it('should be symmetric', () => {
    const a: Position = { row: 2, col: 2 };
    const b: Position = { row: 2, col: 3 };
    expect(areAdjacent(a, b)).toBe(areAdjacent(b, a));
  });
});
