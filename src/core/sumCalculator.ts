/**
 * Sum calculation utilities for SumTrails
 */

import { Cell } from './types';
import { getCellById } from './grid';

/** Calculate the sum of values for cells in a path */
export function calculatePathSum(grid: Cell[][], cellIds: string[]): number {
  return cellIds.reduce((sum, id) => {
    const cell = getCellById(grid, id);
    return sum + (cell?.value ?? 0);
  }, 0);
}

/** Check if a path's sum matches the target */
export function isSumCorrect(
  grid: Cell[][],
  cellIds: string[],
  targetSum: number
): boolean {
  return calculatePathSum(grid, cellIds) === targetSum;
}

/** Check if path meets minimum length requirement */
export function meetsMinLength(cellIds: string[], minLength: number): boolean {
  return cellIds.length >= minLength;
}

/** Get the current running sum for display */
export function getCurrentSum(grid: Cell[][], cellIds: string[]): number {
  return calculatePathSum(grid, cellIds);
}

/** Calculate how far over/under the target sum we are */
export function getSumDifference(
  grid: Cell[][],
  cellIds: string[],
  targetSum: number
): number {
  return calculatePathSum(grid, cellIds) - targetSum;
}

/** Check if adding a cell would exceed the target sum */
export function wouldExceedTarget(
  grid: Cell[][],
  currentPath: string[],
  newCellId: string,
  targetSum: number
): boolean {
  const currentSum = calculatePathSum(grid, currentPath);
  const newCell = getCellById(grid, newCellId);
  if (!newCell) return false;
  return currentSum + newCell.value > targetSum;
}

/** Calculate the sum of all remaining available cells */
export function calculateRemainingSum(grid: Cell[][]): number {
  return grid.flat()
    .filter(cell => cell.state === 'available')
    .reduce((sum, cell) => sum + cell.value, 0);
}
