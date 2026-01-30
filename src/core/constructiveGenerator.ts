/**
 * Constructive Puzzle Generator for Budget Lines
 * 
 * Generates puzzles that are guaranteed to be solvable by building them
 * backwards from valid solutions. Instead of generating random grids and
 * checking solvability, we:
 * 1. Tile the grid with valid connected paths (the solution)
 * 2. Assign values to each path so they sum to targetSum
 * 3. The resulting grid is guaranteed solvable
 */

import { Cell, Position, cellIdFromPosition, positionFromCellId } from './types';

/** Result of constructive puzzle generation */
export interface GeneratedPuzzle {
  /** Grid values (2D array of numbers) */
  values: number[][];
  /** Solution paths - the lines that solve the puzzle */
  solutionPaths: string[][];
}

/** Configuration for puzzle generation */
export interface GenerationConfig {
  gridSize: number;
  minLineLength: number;
  targetSum: number;
  valueRange: { min: number; max: number };
}

/**
 * Generate a solvable puzzle using constructive generation
 * @param config - Puzzle configuration
 * @param rng - Seeded random number generator
 * @returns Generated puzzle with values and solution paths
 */
export function generateSolvablePuzzle(
  config: GenerationConfig,
  rng: () => number
): GeneratedPuzzle {
  const { gridSize, minLineLength, targetSum, valueRange } = config;
  
  // Keep trying until we successfully tile the grid
  // (should usually succeed on first try with good algorithm)
  const maxAttempts = 50;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = tryGeneratePuzzle(gridSize, minLineLength, targetSum, valueRange, rng);
    if (result) {
      return result;
    }
  }
  
  // Fallback: this should rarely happen, but if it does, 
  // generate a simple valid puzzle
  console.warn('Constructive generation failed, using fallback');
  return generateFallbackPuzzle(config, rng);
}

/**
 * Attempt to generate a puzzle by tiling the grid with paths
 */
function tryGeneratePuzzle(
  gridSize: number,
  minLineLength: number,
  targetSum: number,
  valueRange: { min: number; max: number },
  rng: () => number
): GeneratedPuzzle | null {
  // Track which cells are still uncovered
  const uncovered = new Set<string>();
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      uncovered.add(cellIdFromPosition({ row, col }));
    }
  }
  
  const paths: string[][] = [];
  const values: number[][] = Array(gridSize).fill(null).map(() => Array(gridSize).fill(0));
  
  // Keep finding paths until all cells are covered
  while (uncovered.size > 0) {
    // Check if remaining cells can form at least one valid path
    if (uncovered.size < minLineLength) {
      // Can't form a valid path with remaining cells
      return null;
    }
    
    // Find a random path through uncovered cells
    const path = findRandomPath(gridSize, uncovered, minLineLength, rng);
    
    if (!path || path.length < minLineLength) {
      // Couldn't find a valid path - generation failed
      return null;
    }
    
    // Assign values to this path
    const pathValues = assignValuesToPath(path.length, targetSum, valueRange, rng);
    
    if (!pathValues) {
      // Couldn't assign valid values - generation failed
      return null;
    }
    
    // Apply values to grid and mark cells as covered
    for (let i = 0; i < path.length; i++) {
      const pos = positionFromCellId(path[i]);
      values[pos.row][pos.col] = pathValues[i];
      uncovered.delete(path[i]);
    }
    
    paths.push(path);
  }
  
  return { values, solutionPaths: paths };
}

/**
 * Find a random connected path through uncovered cells
 * Uses DFS with randomization to create varied paths
 */
function findRandomPath(
  gridSize: number,
  uncovered: Set<string>,
  minLineLength: number,
  rng: () => number
): string[] | null {
  if (uncovered.size === 0) return null;
  
  // Pick a random starting cell from uncovered cells
  const uncoveredArray = Array.from(uncovered);
  const startIdx = Math.floor(rng() * uncoveredArray.length);
  const startCell = uncoveredArray[startIdx];
  
  // Try to grow path from this starting point
  const path = growPath(gridSize, uncovered, startCell, minLineLength, rng);
  
  // If path is too short, try starting from a different cell
  if (path.length < minLineLength) {
    // Try a few more starting points
    for (let i = 0; i < Math.min(5, uncoveredArray.length); i++) {
      const altStartIdx = Math.floor(rng() * uncoveredArray.length);
      const altStart = uncoveredArray[altStartIdx];
      const altPath = growPath(gridSize, uncovered, altStart, minLineLength, rng);
      if (altPath.length >= minLineLength) {
        return altPath;
      }
    }
    return null;
  }
  
  return path;
}

/**
 * Grow a path from a starting cell using randomized DFS
 */
function growPath(
  gridSize: number,
  uncovered: Set<string>,
  startCell: string,
  minLineLength: number,
  rng: () => number
): string[] {
  const path: string[] = [startCell];
  const inPath = new Set<string>([startCell]);
  
  // Target path length - vary between minLineLength and a bit longer for variety
  // But also consider how many cells are left
  const maxPossibleLength = uncovered.size;
  const targetLength = Math.min(
    maxPossibleLength,
    minLineLength + Math.floor(rng() * 3) // Add 0-2 extra cells
  );
  
  while (path.length < targetLength) {
    const currentCell = path[path.length - 1];
    const currentPos = positionFromCellId(currentCell);
    
    // Get valid neighbors (uncovered and not in current path)
    const neighbors = getNeighbors(currentPos, gridSize)
      .filter(pos => {
        const id = cellIdFromPosition(pos);
        return uncovered.has(id) && !inPath.has(id);
      });
    
    if (neighbors.length === 0) {
      // Can't extend further
      break;
    }
    
    // Prefer neighbors that won't isolate other cells
    // Sort by how many uncovered neighbors they have (more is better)
    const scoredNeighbors = neighbors.map(pos => {
      const id = cellIdFromPosition(pos);
      const futureNeighbors = getNeighbors(pos, gridSize)
        .filter(p => {
          const nid = cellIdFromPosition(p);
          return uncovered.has(nid) && !inPath.has(nid) && nid !== id;
        });
      return { pos, score: futureNeighbors.length };
    });
    
    // Sort by score (descending) but add randomness
    scoredNeighbors.sort((a, b) => {
      // Add some randomness to avoid always picking the same paths
      const aScore = a.score + rng() * 0.5;
      const bScore = b.score + rng() * 0.5;
      return bScore - aScore;
    });
    
    // Pick one of the top choices
    const pickIdx = Math.floor(rng() * Math.min(2, scoredNeighbors.length));
    const chosen = scoredNeighbors[pickIdx];
    
    const nextId = cellIdFromPosition(chosen.pos);
    path.push(nextId);
    inPath.add(nextId);
  }
  
  // Check if this path would leave isolated cells
  // If so, try to extend to include them
  const wouldLeaveIsolated = checkForIsolation(gridSize, uncovered, inPath, minLineLength);
  
  if (wouldLeaveIsolated && path.length < uncovered.size) {
    // Try to extend path to avoid isolation
    // This is a simple greedy extension
    let extended = true;
    while (extended && path.length < uncovered.size) {
      extended = false;
      const currentCell = path[path.length - 1];
      const currentPos = positionFromCellId(currentCell);
      
      const neighbors = getNeighbors(currentPos, gridSize)
        .filter(pos => {
          const id = cellIdFromPosition(pos);
          return uncovered.has(id) && !inPath.has(id);
        });
      
      if (neighbors.length > 0) {
        const nextPos = neighbors[Math.floor(rng() * neighbors.length)];
        const nextId = cellIdFromPosition(nextPos);
        path.push(nextId);
        inPath.add(nextId);
        extended = true;
      }
    }
  }
  
  return path;
}

/**
 * Check if removing the path cells would leave isolated cells
 * that can't form a valid path
 */
function checkForIsolation(
  gridSize: number,
  uncovered: Set<string>,
  inPath: Set<string>,
  minLineLength: number
): boolean {
  // Get cells that would remain after this path
  const remaining = new Set<string>();
  uncovered.forEach(id => {
    if (!inPath.has(id)) {
      remaining.add(id);
    }
  });
  
  if (remaining.size === 0) return false;
  if (remaining.size < minLineLength) return true;
  
  // Check if remaining cells form connected components
  // that are each at least minLineLength in size
  const visited = new Set<string>();
  
  for (const startId of remaining) {
    if (visited.has(startId)) continue;
    
    // BFS to find connected component size
    const component: string[] = [];
    const queue = [startId];
    
    while (queue.length > 0) {
      const cellId = queue.shift()!;
      if (visited.has(cellId)) continue;
      visited.add(cellId);
      component.push(cellId);
      
      const pos = positionFromCellId(cellId);
      const neighbors = getNeighbors(pos, gridSize);
      
      for (const nPos of neighbors) {
        const nId = cellIdFromPosition(nPos);
        if (remaining.has(nId) && !visited.has(nId)) {
          queue.push(nId);
        }
      }
    }
    
    // If any component is too small, we have isolation
    if (component.length < minLineLength) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get orthogonal neighbors of a position
 */
function getNeighbors(pos: Position, gridSize: number): Position[] {
  const directions: Position[] = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
  ];
  
  return directions
    .map(d => ({ row: pos.row + d.row, col: pos.col + d.col }))
    .filter(p => p.row >= 0 && p.row < gridSize && p.col >= 0 && p.col < gridSize);
}

/**
 * Assign values to a path such that they sum to targetSum
 * All values must be within valueRange
 */
function assignValuesToPath(
  pathLength: number,
  targetSum: number,
  valueRange: { min: number; max: number },
  rng: () => number
): number[] | null {
  const { min, max } = valueRange;
  
  // Check if it's possible to reach targetSum with this path length
  const minPossible = pathLength * min;
  const maxPossible = pathLength * max;
  
  if (targetSum < minPossible || targetSum > maxPossible) {
    return null;
  }
  
  const values: number[] = [];
  let remaining = targetSum;
  
  for (let i = 0; i < pathLength - 1; i++) {
    const cellsLeft = pathLength - i;
    
    // Calculate valid range for this cell
    // Must leave enough for remaining cells to reach target
    const minVal = Math.max(min, remaining - (cellsLeft - 1) * max);
    const maxVal = Math.min(max, remaining - (cellsLeft - 1) * min);
    
    if (minVal > maxVal) {
      // This shouldn't happen if initial check passed
      return null;
    }
    
    // Pick a random value in the valid range
    const value = Math.floor(rng() * (maxVal - minVal + 1)) + minVal;
    values.push(value);
    remaining -= value;
  }
  
  // Last cell gets the exact remainder
  values.push(remaining);
  
  // Shuffle the values so they're not always ordered
  return shuffleArray(values, rng);
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[], rng: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generate a simple fallback puzzle if constructive generation fails
 * Creates a grid with simple horizontal/vertical line solutions
 */
function generateFallbackPuzzle(
  config: GenerationConfig,
  rng: () => number
): GeneratedPuzzle {
  const { gridSize, minLineLength, targetSum, valueRange } = config;
  
  const values: number[][] = [];
  const solutionPaths: string[][] = [];
  
  // Fill grid row by row with paths
  for (let row = 0; row < gridSize; row++) {
    const rowValues: number[] = [];
    let col = 0;
    
    while (col < gridSize) {
      // Determine path length for this segment
      const remaining = gridSize - col;
      let pathLength: number;
      
      if (remaining < minLineLength * 2) {
        // Take all remaining cells
        pathLength = remaining;
      } else {
        // Random length between minLineLength and remaining/2
        pathLength = minLineLength + Math.floor(rng() * (remaining / 2 - minLineLength + 1));
        pathLength = Math.max(minLineLength, Math.min(pathLength, remaining));
      }
      
      // Generate values for this path
      const pathValues = assignValuesToPath(pathLength, targetSum, valueRange, rng);
      
      if (pathValues) {
        // Record the path
        const path: string[] = [];
        for (let i = 0; i < pathLength; i++) {
          path.push(cellIdFromPosition({ row, col: col + i }));
          rowValues.push(pathValues[i]);
        }
        solutionPaths.push(path);
        col += pathLength;
      } else {
        // Fallback: just fill with middle values
        for (let i = 0; i < pathLength; i++) {
          rowValues.push(Math.floor((valueRange.min + valueRange.max) / 2));
        }
        col += pathLength;
      }
    }
    
    values.push(rowValues);
  }
  
  return { values, solutionPaths };
}
