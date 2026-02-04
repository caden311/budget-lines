/**
 * Constructive Puzzle Generator for SumTrails
 *
 * Generates puzzles that are guaranteed to be solvable by building them
 * backwards from valid solutions using a center-out algorithm:
 * 1. Start at center (3,3) of the 7x7 grid
 * 2. Place a "seed shape" from predefined templates (L, S, Z, spiral, snake, etc.)
 * 3. Tile outward with turn-preferring random walks
 * 4. Assign values to each path so they sum to targetSum
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

/** Shape template for center shapes */
interface ShapeTemplate {
  name: string;
  path: [number, number][]; // Relative positions from origin
}

/** Predefined shape templates for center shapes */
const SHAPE_TEMPLATES: ShapeTemplate[] = [
  // L-shapes (4-5 cells)
  { name: 'L-right', path: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]] },
  { name: 'L-left', path: [[0, 0], [1, 0], [2, 0], [2, -1], [2, -2]] },

  // S/Z-shapes (4-5 cells)
  { name: 'S-shape', path: [[0, 0], [0, 1], [1, 1], [1, 2], [1, 3]] },
  { name: 'Z-shape', path: [[0, 0], [0, 1], [1, 1], [2, 1], [2, 2]] },

  // Snake shapes (5-6 cells)
  { name: 'snake-v', path: [[0, 0], [1, 0], [1, 1], [2, 1], [2, 0], [3, 0]] },
  { name: 'snake-h', path: [[0, 0], [0, 1], [1, 1], [1, 2], [0, 2], [0, 3]] },

  // Spiral (5-6 cells)
  { name: 'spiral', path: [[0, 0], [0, 1], [0, 2], [1, 2], [1, 1], [2, 1]] },

  // T-shape
  { name: 'T-down', path: [[0, 0], [0, 1], [0, 2], [1, 1], [2, 1]] },

  // Staircase
  { name: 'stair', path: [[0, 0], [0, 1], [1, 1], [1, 2], [2, 2]] },
];

/**
 * Rotate a shape 90 degrees clockwise n times
 */
function rotateShape(path: [number, number][], times: number): [number, number][] {
  let result = path;
  for (let i = 0; i < (times % 4); i++) {
    result = result.map(([r, c]) => [c, -r] as [number, number]);
  }
  return result;
}

/**
 * Reflect a shape horizontally, vertically, or not at all
 */
function reflectShape(
  path: [number, number][],
  axis: 'h' | 'v' | 'none'
): [number, number][] {
  if (axis === 'none') return path;
  if (axis === 'h') {
    return path.map(([r, c]) => [r, -c] as [number, number]);
  }
  // axis === 'v'
  return path.map(([r, c]) => [-r, c] as [number, number]);
}

/**
 * Try to place a shape template at a position
 * Returns the cell IDs if successful, null otherwise
 */
function tryPlaceShape(
  gridSize: number,
  uncovered: Set<string>,
  centerPos: Position,
  template: ShapeTemplate,
  rotation: number,
  reflection: 'h' | 'v' | 'none'
): string[] | null {
  // Apply transformations
  let transformedPath = rotateShape(template.path, rotation);
  transformedPath = reflectShape(transformedPath, reflection);

  // Convert to absolute positions
  const cellIds: string[] = [];
  for (const [dr, dc] of transformedPath) {
    const row = centerPos.row + dr;
    const col = centerPos.col + dc;

    // Check bounds
    if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) {
      return null;
    }

    const id = cellIdFromPosition({ row, col });

    // Check if cell is available
    if (!uncovered.has(id)) {
      return null;
    }

    cellIds.push(id);
  }

  // Verify the path is connected (adjacent cells)
  for (let i = 1; i < cellIds.length; i++) {
    const prevPos = positionFromCellId(cellIds[i - 1]);
    const currPos = positionFromCellId(cellIds[i]);
    const isAdjacent =
      Math.abs(prevPos.row - currPos.row) + Math.abs(prevPos.col - currPos.col) === 1;
    if (!isAdjacent) {
      return null;
    }
  }

  return cellIds;
}

/**
 * Generate the center shape with random template/rotation/reflection
 */
function generateCenterShape(
  gridSize: number,
  uncovered: Set<string>,
  centerPos: Position,
  rng: () => number
): string[] | null {
  // Shuffle templates for variety
  const shuffledTemplates = shuffleArray([...SHAPE_TEMPLATES], rng);
  const rotations = [0, 1, 2, 3];
  const reflections: ('h' | 'v' | 'none')[] = ['none', 'h', 'v'];

  // Try different combinations until one fits
  for (const template of shuffledTemplates) {
    const shuffledRotations = shuffleArray([...rotations], rng);
    const shuffledReflections = shuffleArray([...reflections], rng);

    for (const rotation of shuffledRotations) {
      for (const reflection of shuffledReflections) {
        const result = tryPlaceShape(
          gridSize,
          uncovered,
          centerPos,
          template,
          rotation,
          reflection
        );
        if (result) {
          return result;
        }
      }
    }
  }

  return null;
}

/**
 * Fill remaining cells after center shape with turn-preferring walks
 */
function tileRemaining(
  gridSize: number,
  uncovered: Set<string>,
  minLineLength: number,
  rng: () => number
): string[][] | null {
  const paths: string[][] = [];

  while (uncovered.size > 0) {
    // Check if we can form at least one more path
    if (uncovered.size < minLineLength) {
      return null;
    }

    // Find a path through uncovered cells
    const path = findTurnPreferringPath(gridSize, uncovered, minLineLength, rng);

    if (!path || path.length < minLineLength) {
      return null;
    }

    // Remove path cells from uncovered
    for (const id of path) {
      uncovered.delete(id);
    }

    paths.push(path);
  }

  return paths;
}

/**
 * Find a path that prefers turns over straight lines
 */
function findTurnPreferringPath(
  gridSize: number,
  uncovered: Set<string>,
  minLineLength: number,
  rng: () => number
): string[] | null {
  if (uncovered.size === 0) return null;

  // Start from a random uncovered cell, preferring edges for variety
  const startCell = selectStartCell(gridSize, uncovered, rng);
  if (!startCell) return null;

  return growPath(gridSize, uncovered, startCell, minLineLength, rng);
}

/**
 * Select a starting cell, preferring edge cells for variety
 */
function selectStartCell(
  gridSize: number,
  uncovered: Set<string>,
  rng: () => number
): string | null {
  const uncoveredArray = Array.from(uncovered);
  if (uncoveredArray.length === 0) return null;

  // Find edge cells
  const edgeCells = uncoveredArray.filter(id => {
    const pos = positionFromCellId(id);
    return (
      pos.row === 0 ||
      pos.row === gridSize - 1 ||
      pos.col === 0 ||
      pos.col === gridSize - 1
    );
  });

  // 60% chance to start from edge if available
  if (edgeCells.length > 0 && rng() < 0.6) {
    return edgeCells[Math.floor(rng() * edgeCells.length)];
  }

  // Otherwise random cell
  return uncoveredArray[Math.floor(rng() * uncoveredArray.length)];
}

/**
 * Grow a path from a starting cell using turn-preferring randomized DFS
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

  // Target length: vary between minLineLength and gridSize
  const maxPossibleLength = uncovered.size;
  const targetLength = Math.min(
    maxPossibleLength,
    minLineLength + Math.floor(rng() * 4) // Add 0-3 extra cells
  );

  // Track direction for turn-aware selection
  let lastDirection: Position | null = null;
  let consecutiveStraight = 0;

  while (path.length < targetLength) {
    const currentCell = path[path.length - 1];
    const currentPos = positionFromCellId(currentCell);

    // Get valid neighbors (uncovered and not in current path)
    const neighbors = getNeighbors(currentPos, gridSize).filter(pos => {
      const id = cellIdFromPosition(pos);
      return uncovered.has(id) && !inPath.has(id);
    });

    if (neighbors.length === 0) {
      break;
    }

    // Score neighbors with turn-preference
    const scoredNeighbors = neighbors.map(pos => {
      const id = cellIdFromPosition(pos);

      // Base score: how many uncovered neighbors this cell has
      const futureNeighbors = getNeighbors(pos, gridSize).filter(p => {
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

        // Prefer turns to create interesting paths
        if (isTurn) {
          score += 1.5;
        }

        // After 3+ consecutive cells, encourage a turn
        if (consecutiveStraight >= 3 && isTurn) {
          score += 1.0;
        }
      }

      return { pos, score };
    });

    // Sort by score with randomness
    const scoredWithRandom = scoredNeighbors.map(n => ({
      ...n,
      finalScore: n.score + rng() * 0.5,
    }));
    scoredWithRandom.sort((a, b) => b.finalScore - a.finalScore);

    // Pick one of the top choices
    const pickIdx = Math.floor(rng() * Math.min(2, scoredWithRandom.length));
    const chosen = scoredWithRandom[pickIdx];

    // Update direction tracking
    const newDirection = {
      row: chosen.pos.row - currentPos.row,
      col: chosen.pos.col - currentPos.col,
    };

    if (
      lastDirection &&
      newDirection.row === lastDirection.row &&
      newDirection.col === lastDirection.col
    ) {
      consecutiveStraight++;
    } else {
      consecutiveStraight = 0;
    }

    lastDirection = newDirection;

    const nextId = cellIdFromPosition(chosen.pos);
    path.push(nextId);
    inPath.add(nextId);
  }

  // Check if this path would leave isolated cells
  const wouldLeaveIsolated = checkForIsolation(gridSize, uncovered, inPath, minLineLength);

  if (wouldLeaveIsolated && path.length < uncovered.size) {
    // Try to extend path to avoid isolation
    let extended = true;
    while (extended && path.length < uncovered.size) {
      extended = false;
      const currentCell = path[path.length - 1];
      const currentPos = positionFromCellId(currentCell);

      const neighbors = getNeighbors(currentPos, gridSize).filter(pos => {
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
 * Assign values to all paths
 */
function assignAllPathValues(
  paths: string[][],
  targetSum: number,
  valueRange: { min: number; max: number },
  rng: () => number
): number[][] | null {
  const gridSize = 7; // Fixed for this implementation
  const values: number[][] = Array(gridSize)
    .fill(null)
    .map(() => Array(gridSize).fill(0));

  for (const path of paths) {
    const pathValues = assignValuesToPath(path.length, targetSum, valueRange, rng);
    if (!pathValues) {
      return null;
    }

    for (let i = 0; i < path.length; i++) {
      const pos = positionFromCellId(path[i]);
      values[pos.row][pos.col] = pathValues[i];
    }
  }

  return values;
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
    const minVal = Math.max(min, remaining - (cellsLeft - 1) * max);
    const maxVal = Math.min(max, remaining - (cellsLeft - 1) * min);

    if (minVal > maxVal) {
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
 * Initialize the uncovered set with all cells in the grid
 */
function initializeUncoveredSet(gridSize: number): Set<string> {
  const uncovered = new Set<string>();
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      uncovered.add(cellIdFromPosition({ row, col }));
    }
  }
  return uncovered;
}

/**
 * Generate a solvable puzzle using constructive generation with center-out algorithm
 * @param config - Puzzle configuration
 * @param rng - Seeded random number generator
 * @returns Generated puzzle with values and solution paths
 */
export function generateSolvablePuzzle(
  config: GenerationConfig,
  rng: () => number
): GeneratedPuzzle {
  const gridSize = 7; // Fixed for center-out algorithm
  const centerPos = { row: 3, col: 3 };
  const { minLineLength, targetSum, valueRange } = config;

  for (let attempt = 0; attempt < 50; attempt++) {
    const uncovered = initializeUncoveredSet(gridSize);
    const paths: string[][] = [];

    // Phase 1: Try to place center shape (optional - adds variety)
    // Only try center shape on first 30 attempts to ensure fallback to
    // edge-start paths if center shapes consistently fail
    if (attempt < 30) {
      const centerShape = generateCenterShape(gridSize, uncovered, centerPos, rng);
      if (centerShape) {
        paths.push(centerShape);
        for (const id of centerShape) {
          uncovered.delete(id);
        }
      }
    }

    // Phase 2: Tile remaining with turn-preferring walks
    const remainingPaths = tileRemaining(gridSize, uncovered, minLineLength, rng);
    if (!remainingPaths) continue;
    paths.push(...remainingPaths);

    // Phase 3: Assign values to paths
    const values = assignAllPathValues(paths, targetSum, valueRange, rng);
    if (values) {
      return { values, solutionPaths: paths };
    }
  }

  // Fallback: this should rarely happen
  console.warn('Center-out generation failed, using fallback');
  return generateFallbackPuzzle(config, rng);
}

/**
 * Generate a simple fallback puzzle if constructive generation fails
 * Uses simple row-by-row horizontal paths - guaranteed to always work
 */
function generateFallbackPuzzle(
  config: GenerationConfig,
  rng: () => number
): GeneratedPuzzle {
  const gridSize = 7; // Fixed
  const { minLineLength, targetSum, valueRange } = config;

  const values: number[][] = Array(gridSize)
    .fill(null)
    .map(() => Array(gridSize).fill(0));
  const solutionPaths: string[][] = [];

  // Simple row-by-row filling
  for (let row = 0; row < gridSize; row++) {
    let col = 0;
    while (col < gridSize) {
      const remaining = gridSize - col;

      // Determine path length for this segment
      let pathLength: number;
      if (remaining < minLineLength * 2) {
        pathLength = remaining;
      } else {
        const maxLen = Math.floor(remaining / 2);
        pathLength = minLineLength + Math.floor(rng() * (maxLen - minLineLength + 1));
      }

      // Create horizontal path
      const path: string[] = [];
      for (let i = 0; i < pathLength; i++) {
        path.push(cellIdFromPosition({ row, col: col + i }));
      }

      // Assign values that sum to targetSum
      const pathValues = assignValuesToPath(pathLength, targetSum, valueRange, rng);
      if (pathValues) {
        for (let i = 0; i < pathLength; i++) {
          values[row][col + i] = pathValues[i];
        }
      } else {
        // Fallback: use middle values (shouldn't happen with valid config)
        const midValue = Math.floor((valueRange.min + valueRange.max) / 2);
        for (let i = 0; i < pathLength; i++) {
          values[row][col + i] = midValue;
        }
      }

      solutionPaths.push(path);
      col += pathLength;
    }
  }

  return { values, solutionPaths };
}
