/**
 * Constructive Puzzle Generator for SumTrails
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

/** Generation strategies that create different puzzle patterns */
type GenerationStrategy =
  | 'center-snake'    // Start center, wind outward
  | 'corner-converge'  // Start corners, meet in middle
  | 'long-chains'      // Prefer fewer, longer paths (5-7 cells)
  | 'mixed-lengths'    // High variance in path lengths
  | 'direction-change'; // Force L/S/Z shaped paths

/** Select generation strategies based on seed for day-to-day variety */
function selectStrategies(rng: () => number): GenerationStrategy[] {
  // Always include direction-change to ensure path variety (no pure horizontal/vertical puzzles)
  const strategies: GenerationStrategy[] = ['direction-change'];

  const roll = rng();

  // Add secondary strategies for additional variety
  if (roll < 0.25) {
    strategies.push('center-snake', 'long-chains');
  } else if (roll < 0.5) {
    strategies.push('corner-converge');
  } else if (roll < 0.7) {
    strategies.push('mixed-lengths');
  } else if (roll < 0.85) {
    strategies.push('long-chains');
  } else {
    strategies.push('center-snake', 'mixed-lengths');
  }

  return strategies;
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
  // Select strategies for this puzzle based on seed
  const strategies = selectStrategies(rng);
  
  // Track which cells are still uncovered
  const uncovered = new Set<string>();
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      uncovered.add(cellIdFromPosition({ row, col }));
    }
  }
  
  const paths: string[][] = [];
  const values: number[][] = Array(gridSize).fill(null).map(() => Array(gridSize).fill(0));
  let pathCount = 0; // Track how many paths we've created
  
  // Keep finding paths until all cells are covered
  while (uncovered.size > 0) {
    // Check if remaining cells can form at least one valid path
    if (uncovered.size < minLineLength) {
      // Can't form a valid path with remaining cells
      return null;
    }
    
    // Find a path through uncovered cells using selected strategies
    const path = findRandomPath(gridSize, uncovered, minLineLength, strategies, pathCount, rng);
    
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
    pathCount++;
  }
  
  return { values, solutionPaths: paths };
}

/**
 * Find a random connected path through uncovered cells
 * Uses strategy-aware starting points and DFS with randomization
 */
function findRandomPath(
  gridSize: number,
  uncovered: Set<string>,
  minLineLength: number,
  strategies: GenerationStrategy[],
  pathCount: number,
  rng: () => number
): string[] | null {
  if (uncovered.size === 0) return null;
  
  // Select starting cell based on strategies
  const startCell = selectStrategicStartCell(
    gridSize,
    uncovered,
    strategies,
    pathCount,
    rng
  );
  
  if (!startCell) return null;
  
  // Try to grow path from this starting point
  const path = growPath(gridSize, uncovered, startCell, minLineLength, strategies, rng);
  
  // If path is too short, try starting from a different cell
  if (path.length < minLineLength) {
    const uncoveredArray = Array.from(uncovered);
    // Try a few more starting points
    for (let i = 0; i < Math.min(5, uncoveredArray.length); i++) {
      const altStartIdx = Math.floor(rng() * uncoveredArray.length);
      const altStart = uncoveredArray[altStartIdx];
      const altPath = growPath(gridSize, uncovered, altStart, minLineLength, strategies, rng);
      if (altPath.length >= minLineLength) {
        return altPath;
      }
    }
    return null;
  }
  
  return path;
}

/**
 * Select a strategic starting cell based on generation strategies
 */
function selectStrategicStartCell(
  gridSize: number,
  uncovered: Set<string>,
  strategies: GenerationStrategy[],
  pathCount: number,
  rng: () => number
): string | null {
  const uncoveredArray = Array.from(uncovered);
  if (uncoveredArray.length === 0) return null;
  
  // Center-snake: Start near center for early paths
  if (strategies.includes('center-snake') && pathCount < 3) {
    const centerRow = Math.floor(gridSize / 2);
    const centerCol = Math.floor(gridSize / 2);
    
    // Find uncovered cells near center, sorted by distance
    const centerCells = uncoveredArray
      .map(id => {
        const pos = positionFromCellId(id);
        const dist = Math.abs(pos.row - centerRow) + Math.abs(pos.col - centerCol);
        return { id, dist };
      })
      .sort((a, b) => a.dist - b.dist)
      .slice(0, Math.min(5, uncoveredArray.length));
    
    if (centerCells.length > 0) {
      const pick = Math.floor(rng() * Math.min(3, centerCells.length));
      return centerCells[pick].id;
    }
  }
  
  // Corner-converge: Start from corners for early paths
  if (strategies.includes('corner-converge') && pathCount < 4) {
    const corners = [
      { row: 0, col: 0 },
      { row: 0, col: gridSize - 1 },
      { row: gridSize - 1, col: 0 },
      { row: gridSize - 1, col: gridSize - 1 },
    ];
    
    const cornerCells = corners
      .map(corner => {
        const id = cellIdFromPosition(corner);
        return uncovered.has(id) ? { id, pos: corner } : null;
      })
      .filter((cell): cell is { id: string; pos: Position } => cell !== null);
    
    if (cornerCells.length > 0) {
      const pick = Math.floor(rng() * cornerCells.length);
      return cornerCells[pick].id;
    }
  }
  
  // Edge-weighted: Prefer edge cells for interesting shapes
  if (strategies.includes('direction-change')) {
    const edgeCells = uncoveredArray.filter(id => {
      const pos = positionFromCellId(id);
      return (
        pos.row === 0 ||
        pos.row === gridSize - 1 ||
        pos.col === 0 ||
        pos.col === gridSize - 1
      );
    });
    
    if (edgeCells.length > 0 && rng() < 0.6) {
      return edgeCells[Math.floor(rng() * edgeCells.length)];
    }
  }
  
  // Default: random selection
  return uncoveredArray[Math.floor(rng() * uncoveredArray.length)];
}

/**
 * Grow a path from a starting cell using strategy-aware randomized DFS
 */
function growPath(
  gridSize: number,
  uncovered: Set<string>,
  startCell: string,
  minLineLength: number,
  strategies: GenerationStrategy[],
  rng: () => number
): string[] {
  const path: string[] = [startCell];
  const inPath = new Set<string>([startCell]);
  
  // Calculate target path length based on strategies
  const maxPossibleLength = uncovered.size;
  let targetLength: number;
  
  if (strategies.includes('long-chains')) {
    // Prefer longer paths: 5-7 cells or up to gridSize+1
    const longMin = Math.max(minLineLength, 5);
    const longMax = Math.min(maxPossibleLength, gridSize + 1);
    targetLength = longMin + Math.floor(rng() * (longMax - longMin + 1));
  } else if (strategies.includes('mixed-lengths')) {
    // High variance: sometimes short (3-4), sometimes long (6-7)
    if (rng() < 0.4) {
      targetLength = minLineLength + Math.floor(rng() * 2); // 3-4
    } else {
      targetLength = 6 + Math.floor(rng() * 2); // 6-7
    }
    targetLength = Math.min(targetLength, maxPossibleLength);
  } else {
    // Default: wider range than before (3-6 instead of 3-5)
    targetLength = Math.min(
      maxPossibleLength,
      minLineLength + Math.floor(rng() * 4) // Add 0-3 extra cells
    );
  }
  
  // Track direction for turn-aware selection
  let lastDirection: Position | null = null;
  let consecutiveStraight = 0; // Track how many cells in the same direction

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
    
    // Score neighbors with strategy-aware logic
    const scoredNeighbors = neighbors.map(pos => {
      const id = cellIdFromPosition(pos);
      
      // Base score: how many uncovered neighbors this cell has
      const futureNeighbors = getNeighbors(pos, gridSize)
        .filter(p => {
          const nid = cellIdFromPosition(p);
          return uncovered.has(nid) && !inPath.has(nid) && nid !== id;
        });
      let score = futureNeighbors.length;
      
      // Direction-aware scoring
      if (lastDirection) {
        const direction = {
          row: pos.row - currentPos.row,
          col: pos.col - currentPos.col,
        };
        const isSameDirection =
          direction.row === lastDirection.row && direction.col === lastDirection.col;
        const isTurn = !isSameDirection;

        // Always prefer turns to create interesting paths
        if (isTurn) {
          score += 2.0;
        }

        // After 2+ consecutive cells in same direction, strongly prefer a turn
        if (consecutiveStraight >= 2 && isTurn) {
          score += 3.0; // Strong bonus for breaking long straight runs
        }
      }

      return { pos, score };
    });
    
    // Sort by score (descending) with pre-computed randomness
    // IMPORTANT: Don't call rng() inside sort comparator - different JS engines
    // use different sort algorithms which call comparator different # of times
    const scoredWithRandom = scoredNeighbors.map(n => ({
      ...n,
      finalScore: n.score + rng() * 0.5
    }));
    scoredWithRandom.sort((a, b) => b.finalScore - a.finalScore);
    
    // Pick one of the top choices
    const pickIdx = Math.floor(rng() * Math.min(2, scoredWithRandom.length));
    const chosen = scoredWithRandom[pickIdx];
    
    // Update direction tracking
    if (path.length > 0) {
      const prevPos = positionFromCellId(path[path.length - 1]);
      const newDirection = {
        row: chosen.pos.row - prevPos.row,
        col: chosen.pos.col - prevPos.col,
      };

      // Track consecutive straight moves
      if (lastDirection &&
          newDirection.row === lastDirection.row &&
          newDirection.col === lastDirection.col) {
        consecutiveStraight++;
      } else {
        consecutiveStraight = 0;
      }

      lastDirection = newDirection;
    }
    
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
 * Creates a grid with a mix of horizontal, vertical, and L-shaped paths
 */
function generateFallbackPuzzle(
  config: GenerationConfig,
  rng: () => number
): GeneratedPuzzle {
  const { gridSize, minLineLength, targetSum, valueRange } = config;

  const values: number[][] = Array(gridSize).fill(null).map(() => Array(gridSize).fill(0));
  const solutionPaths: string[][] = [];
  const covered = new Set<string>();

  // Helper to check if a cell is available
  const isAvailable = (row: number, col: number) => {
    if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) return false;
    return !covered.has(cellIdFromPosition({ row, col }));
  };

  // Try to create L-shaped or mixed paths instead of only horizontal
  let row = 0;
  let col = 0;

  while (covered.size < gridSize * gridSize) {
    // Find next uncovered cell
    let foundStart = false;
    for (let r = 0; r < gridSize && !foundStart; r++) {
      for (let c = 0; c < gridSize && !foundStart; c++) {
        if (isAvailable(r, c)) {
          row = r;
          col = c;
          foundStart = true;
        }
      }
    }

    if (!foundStart) break;

    // Build a path with turns
    const path: string[] = [];
    let currentRow = row;
    let currentCol = col;
    let lastDir: 'h' | 'v' | null = null;

    // Alternate between horizontal and vertical moves
    while (path.length < gridSize && isAvailable(currentRow, currentCol)) {
      path.push(cellIdFromPosition({ row: currentRow, col: currentCol }));
      covered.add(cellIdFromPosition({ row: currentRow, col: currentCol }));

      if (path.length >= minLineLength && rng() < 0.3) {
        // Sometimes stop early to create varied path lengths
        break;
      }

      // Prefer to turn if we've been going straight
      const preferTurn = lastDir !== null && rng() < 0.6;

      // Try directions in order based on preference
      const directions: Array<{ dr: number; dc: number; dir: 'h' | 'v' }> = [
        { dr: 0, dc: 1, dir: 'h' },   // right
        { dr: 1, dc: 0, dir: 'v' },   // down
        { dr: 0, dc: -1, dir: 'h' },  // left
        { dr: -1, dc: 0, dir: 'v' },  // up
      ];

      // Shuffle directions, but prefer turns
      const shuffled = shuffleArray(directions, rng);
      if (preferTurn && lastDir) {
        // Sort to prefer turns (different direction type)
        shuffled.sort((a, b) => {
          const aTurn = a.dir !== lastDir ? 1 : 0;
          const bTurn = b.dir !== lastDir ? 1 : 0;
          return bTurn - aTurn;
        });
      }

      let moved = false;
      for (const { dr, dc, dir } of shuffled) {
        const newRow = currentRow + dr;
        const newCol = currentCol + dc;
        if (isAvailable(newRow, newCol)) {
          currentRow = newRow;
          currentCol = newCol;
          lastDir = dir;
          moved = true;
          break;
        }
      }

      if (!moved) break;
    }

    // Assign values if path is long enough
    if (path.length >= minLineLength) {
      const pathValues = assignValuesToPath(path.length, targetSum, valueRange, rng);
      if (pathValues) {
        for (let i = 0; i < path.length; i++) {
          const pos = positionFromCellId(path[i]);
          values[pos.row][pos.col] = pathValues[i];
        }
        solutionPaths.push(path);
      } else {
        // Fill with middle values if assignment fails
        for (let i = 0; i < path.length; i++) {
          const pos = positionFromCellId(path[i]);
          values[pos.row][pos.col] = Math.floor((valueRange.min + valueRange.max) / 2);
        }
        solutionPaths.push(path);
      }
    } else {
      // Path too short - mark cells but fill with middle values
      for (let i = 0; i < path.length; i++) {
        const pos = positionFromCellId(path[i]);
        values[pos.row][pos.col] = Math.floor((valueRange.min + valueRange.max) / 2);
      }
      // Still add to solution paths even if short (fallback is best effort)
      if (path.length > 0) {
        solutionPaths.push(path);
      }
    }
  }

  return { values, solutionPaths };
}
