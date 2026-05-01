import { LevelConfig } from './types';
import { CELL_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';

// Canvas: 800x500 = 20x12 grid (last row partial)
const GRID_COLS = 20;
const GRID_ROWS = 12;

export type Point = [number, number]; // [gridX, gridY]

// Convert grid coordinates to pixel position (center of cell)
export const gridToPixel = (gx: number, gy: number) => ({
  x: gx * CELL_SIZE + CELL_SIZE / 2,
  y: gy * CELL_SIZE + CELL_SIZE / 2,
});

// Create path from grid points
export const createPath = (points: Point[]): { x: number; y: number }[] => {
  return points.map(([gx, gy]) => gridToPixel(gx, gy));
};

// Generate buildable cells adjacent to path (within 1-2 cells)
export const generateBuildableZones = (pathPoints: Point[]): { x: number; y: number; width: number; height: number }[] => {
  const pathCells = new Set<string>();
  const buildableCells = new Set<string>();
  
  // Mark all path cells
  for (let i = 0; i < pathPoints.length - 1; i++) {
    const [x1, y1] = pathPoints[i];
    const [x2, y2] = pathPoints[i + 1];
    
    // Interpolate along path segment
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    for (let s = 0; s <= steps; s++) {
      const t = steps === 0 ? 0 : s / steps;
      const cx = Math.round(x1 + (x2 - x1) * t);
      const cy = Math.round(y1 + (y2 - y1) * t);
      pathCells.add(`${cx},${cy}`);
    }
  }
  
  // Find adjacent buildable cells (1-2 cells away from path)
  pathCells.forEach(cell => {
    const [cx, cy] = cell.split(',').map(Number);
    
    // Check cells within immediate perimeter
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0) continue;
        
        const nx = cx + dx;
        const ny = cy + dy;
        const key = `${nx},${ny}`;
        
        // Must be in bounds and not on path
        if (nx >= 0 && nx < GRID_COLS && ny >= 0 && ny < GRID_ROWS && !pathCells.has(key)) {
          // Immediately surrounding cells (Chebyshev distance 1)
          buildableCells.add(key);
        }
      }
    }
  });
  
  // Convert individual cells to buildable areas
  return Array.from(buildableCells).map(cell => {
    const [gx, gy] = cell.split(',').map(Number);
    return {
      x: gx * CELL_SIZE,
      y: gy * CELL_SIZE,
      width: CELL_SIZE,
      height: CELL_SIZE,
    };
  });
};

export const LEVELS: LevelConfig[] = [
  // Level 1 - Tutorial (Grassland)
  {
    id: 1,
    name: 'THE GRASSLANDS',
    theme: 'grassland',
    startingGold: 150,
    path: createPath([
      [0, 6], [5, 6], [5, 3], [10, 3], [10, 9], [15, 9], [15, 6], [19, 6]
    ]),
    buildableAreas: generateBuildableZones([
      [0, 6], [5, 6], [5, 3], [10, 3], [10, 9], [15, 9], [15, 6], [19, 6]
    ]),
    waves: [
      { enemies: [{ type: 'scout', count: 5, delay: 60 }
    ] },
      { enemies: [{ type: 'scout', count: 3, delay: 50 }, { type: 'soldier', count: 2, delay: 80 }] },
      { enemies: [{ type: 'soldier', count: 5, delay: 60 }] },
    ],
  },
  // Level 2 - Forest Path
  {
    id: 2,
    name: 'FOREST PATH',
    theme: 'forest',
    startingGold: 175,
    path: createPath([
      [0, 2], [4, 2], [4, 10], [9, 10], [9, 5], [14, 5], [14, 10], [17, 10], [17, 6], [19, 6]
    ]),
    buildableAreas: generateBuildableZones([
      [0, 2], [4, 2], [4, 10], [9, 10], [9, 5], [14, 5], [14, 10], [17, 10], [17, 6], [19, 6]
    ]),
    waves: [
      { enemies: [{ type: 'scout', count: 6, delay: 50 }
    ] },
      { enemies: [{ type: 'soldier', count: 4, delay: 60 }] },
      { enemies: [{ type: 'scout', count: 4, delay: 40 }, { type: 'soldier', count: 3, delay: 70 }] },
      { enemies: [{ type: 'soldier', count: 6, delay: 50 }] },
    ],
  },
  // Level 3 - River Crossing (Unlocks Ice Tower)
  {
    id: 3,
    name: 'RIVER CROSSING',
    theme: 'river',
    startingGold: 200,
    path: createPath([
      [0, 6], [3, 6], [3, 2], [8, 2], [8, 10], [13, 10], [13, 2], [17, 2], [17, 6], [19, 6]
    ]),
    buildableAreas: generateBuildableZones([
      [0, 6], [3, 6], [3, 2], [8, 2], [8, 10], [13, 10], [13, 2], [17, 2], [17, 6], [19, 6]
    ]),
    waves: [
      { enemies: [{ type: 'scout', count: 8, delay: 45 }
    ] },
      { enemies: [{ type: 'soldier', count: 5, delay: 55 }] },
      { enemies: [{ type: 'knight', count: 2, delay: 90 }] },
      { enemies: [{ type: 'scout', count: 5, delay: 40 }, { type: 'knight', count: 2, delay: 100 }] },
      { enemies: [{ type: 'soldier', count: 4, delay: 50 }, { type: 'knight', count: 3, delay: 80 }] },
    ],
  },
  // Level 4 - Mountain Pass
  {
    id: 4,
    name: 'MOUNTAIN PASS',
    theme: 'mountain',
    startingGold: 225,
    path: createPath([
      [0, 10], [5, 10], [5, 5], [3, 5], [3, 2], [10, 2], [10, 7], [15, 7], [15, 3], [19, 3]
    ]),
    buildableAreas: generateBuildableZones([
      [0, 10], [5, 10], [5, 5], [3, 5], [3, 2], [10, 2], [10, 7], [15, 7], [15, 3], [19, 3]
    ]),
    waves: [
      { enemies: [{ type: 'soldier', count: 6, delay: 50 }
    ] },
      { enemies: [{ type: 'knight', count: 3, delay: 80 }] },
      { enemies: [{ type: 'mage', count: 4, delay: 60 }] },
      { enemies: [{ type: 'soldier', count: 4, delay: 45 }, { type: 'mage', count: 3, delay: 70 }] },
      { enemies: [{ type: 'knight', count: 3, delay: 70 }, { type: 'mage', count: 3, delay: 60 }] },
      { enemies: [{ type: 'soldier', count: 5, delay: 40 }, { type: 'knight', count: 2, delay: 90 }, { type: 'mage', count: 2, delay: 80 }] },
    ],
  },
  // Level 5 - Castle Gate (Mini Boss + Unlocks Lightning)
  {
    id: 5,
    name: 'CASTLE GATE',
    theme: 'castle',
    startingGold: 250,
    path: createPath([
      [0, 6], [4, 6], [4, 2], [8, 2], [8, 10], [12, 10], [12, 5], [16, 5], [16, 9], [19, 9]
    ]),
    buildableAreas: generateBuildableZones([
      [0, 6], [4, 6], [4, 2], [8, 2], [8, 10], [12, 10], [12, 5], [16, 5], [16, 9], [19, 9]
    ]),
    waves: [
      { enemies: [{ type: 'scout', count: 8, delay: 40 }
    ] },
      { enemies: [{ type: 'soldier', count: 5, delay: 50 }] },
      { enemies: [{ type: 'knight', count: 3, delay: 70 }, { type: 'scout', count: 4, delay: 35 }] },
      { enemies: [{ type: 'soldier', count: 6, delay: 45 }, { type: 'mage', count: 2, delay: 60 }] },
      { enemies: [{ type: 'knight', count: 4, delay: 65 }, { type: 'mage', count: 3, delay: 55 }] },
      { enemies: [{ type: 'soldier', count: 5, delay: 40 }, { type: 'knight', count: 3, delay: 60 }, { type: 'mage', count: 2, delay: 50 }] },
      { enemies: [{ type: 'dragon', count: 1, delay: 0 }, { type: 'soldier', count: 5, delay: 60 }] },
    ],
  },
  // Level 6 - Dark Forest
  {
    id: 6,
    name: 'DARK FOREST',
    theme: 'darkforest',
    startingGold: 275,
    path: createPath([
      [0, 3], [5, 3], [5, 9], [10, 9], [10, 2], [15, 2], [15, 10], [19, 10]
    ]),
    buildableAreas: generateBuildableZones([
      [0, 3], [5, 3], [5, 9], [10, 9], [10, 2], [15, 2], [15, 10], [19, 10]
    ]),
    waves: [
      { enemies: [{ type: 'scout', count: 10, delay: 35 }
    ] },
      { enemies: [{ type: 'soldier', count: 6, delay: 45 }, { type: 'mage', count: 3, delay: 55 }] },
      { enemies: [{ type: 'knight', count: 4, delay: 60 }] },
      { enemies: [{ type: 'ogre', count: 1, delay: 0 }, { type: 'soldier', count: 4, delay: 50 }] },
      { enemies: [{ type: 'mage', count: 5, delay: 45 }, { type: 'knight', count: 3, delay: 65 }] },
      { enemies: [{ type: 'ogre', count: 2, delay: 100 }, { type: 'scout', count: 6, delay: 30 }] },
      { enemies: [{ type: 'knight', count: 4, delay: 55 }, { type: 'mage', count: 4, delay: 50 }, { type: 'ogre', count: 1, delay: 0 }] },
      { enemies: [{ type: 'soldier', count: 8, delay: 35 }, { type: 'ogre', count: 2, delay: 80 }] },
    ],
  },
  // Level 7 - Canyon
  {
    id: 7,
    name: 'THE CANYON',
    theme: 'canyon',
    startingGold: 300,
    path: createPath([
      [0, 6], [3, 6], [3, 2], [7, 2], [7, 10], [11, 10], [11, 3], [14, 3], [14, 9], [17, 9], [17, 5], [19, 5]
    ]),
    buildableAreas: generateBuildableZones([
      [0, 6], [3, 6], [3, 2], [7, 2], [7, 10], [11, 10], [11, 3], [14, 3], [14, 9], [17, 9], [17, 5], [19, 5]
    ]),
    waves: [
      { enemies: [{ type: 'scout', count: 12, delay: 30 }
    ] },
      { enemies: [{ type: 'soldier', count: 8, delay: 40 }] },
      { enemies: [{ type: 'knight', count: 5, delay: 55 }, { type: 'mage', count: 3, delay: 50 }] },
      { enemies: [{ type: 'ogre', count: 2, delay: 90 }, { type: 'soldier', count: 5, delay: 40 }] },
      { enemies: [{ type: 'scout', count: 8, delay: 25 }, { type: 'knight', count: 4, delay: 50 }, { type: 'mage', count: 4, delay: 45 }] },
      { enemies: [{ type: 'soldier', count: 6, delay: 35 }, { type: 'ogre', count: 3, delay: 80 }] },
      { enemies: [{ type: 'knight', count: 5, delay: 50 }, { type: 'mage', count: 5, delay: 45 }] },
      { enemies: [{ type: 'ogre', count: 3, delay: 70 }, { type: 'knight', count: 4, delay: 55 }] },
      { enemies: [{ type: 'scout', count: 10, delay: 20 }, { type: 'soldier', count: 8, delay: 30 }, { type: 'ogre', count: 2, delay: 100 }] },
    ],
  },
  // Level 8 - Frozen Lake
  {
    id: 8,
    name: 'FROZEN LAKE',
    theme: 'frozen',
    startingGold: 325,
    path: createPath([
      [0, 9], [4, 9], [4, 3], [9, 3], [9, 10], [14, 10], [14, 2], [17, 2], [17, 7], [19, 7]
    ]),
    buildableAreas: generateBuildableZones([
      [0, 9], [4, 9], [4, 3], [9, 3], [9, 10], [14, 10], [14, 2], [17, 2], [17, 7], [19, 7]
    ]),
    waves: [
      { enemies: [{ type: 'scout', count: 15, delay: 25 }
    ] },
      { enemies: [{ type: 'soldier', count: 10, delay: 35 }] },
      { enemies: [{ type: 'mage', count: 8, delay: 40 }] },
      { enemies: [{ type: 'scout', count: 10, delay: 20 }, { type: 'soldier', count: 6, delay: 35 }] },
      { enemies: [{ type: 'knight', count: 6, delay: 50 }, { type: 'mage', count: 5, delay: 40 }] },
      { enemies: [{ type: 'ogre', count: 3, delay: 70 }, { type: 'scout', count: 8, delay: 25 }] },
      { enemies: [{ type: 'soldier', count: 8, delay: 30 }, { type: 'knight', count: 5, delay: 45 }, { type: 'mage', count: 4, delay: 40 }] },
      { enemies: [{ type: 'ogre', count: 4, delay: 65 }, { type: 'soldier', count: 6, delay: 35 }] },
      { enemies: [{ type: 'knight', count: 6, delay: 45 }, { type: 'mage', count: 6, delay: 40 }, { type: 'ogre', count: 2, delay: 80 }] },
      { enemies: [{ type: 'scout', count: 12, delay: 18 }, { type: 'soldier', count: 10, delay: 25 }, { type: 'knight', count: 4, delay: 50 }] },
    ],
  },
  // Level 9 - Volcano
  {
    id: 9,
    name: 'THE VOLCANO',
    theme: 'volcano',
    startingGold: 350,
    path: createPath([
      [0, 5], [3, 5], [3, 10], [7, 10], [7, 2], [11, 2], [11, 9], [15, 9], [15, 3], [19, 3]
    ]),
    buildableAreas: generateBuildableZones([
      [0, 5], [3, 5], [3, 10], [7, 10], [7, 2], [11, 2], [11, 9], [15, 9], [15, 3], [19, 3]
    ]),
    waves: [
      { enemies: [{ type: 'soldier', count: 12, delay: 30 }
    ] },
      { enemies: [{ type: 'knight', count: 8, delay: 45 }] },
      { enemies: [{ type: 'mage', count: 8, delay: 35 }, { type: 'knight', count: 4, delay: 50 }] },
      { enemies: [{ type: 'ogre', count: 4, delay: 60 }] },
      { enemies: [{ type: 'soldier', count: 10, delay: 25 }, { type: 'ogre', count: 3, delay: 70 }] },
      { enemies: [{ type: 'knight', count: 6, delay: 40 }, { type: 'mage', count: 6, delay: 35 }, { type: 'ogre', count: 2, delay: 80 }] },
      { enemies: [{ type: 'dragon', count: 1, delay: 0 }, { type: 'knight', count: 5, delay: 50 }] },
      { enemies: [{ type: 'ogre', count: 5, delay: 55 }, { type: 'mage', count: 6, delay: 35 }] },
      { enemies: [{ type: 'soldier', count: 15, delay: 20 }, { type: 'knight', count: 6, delay: 40 }] },
      { enemies: [{ type: 'knight', count: 8, delay: 35 }, { type: 'mage', count: 8, delay: 30 }, { type: 'ogre', count: 4, delay: 60 }] },
      { enemies: [{ type: 'dragon', count: 1, delay: 0 }, { type: 'ogre', count: 4, delay: 70 }, { type: 'knight', count: 6, delay: 45 }] },
    ],
  },
  // Level 10 - Final Fortress
  {
    id: 10,
    name: 'FINAL FORTRESS',
    theme: 'fortress',
    startingGold: 400,
    path: createPath([
      [0, 6], [3, 6], [3, 2], [6, 2], [6, 10], [9, 10], [9, 3], [13, 3], [13, 9], [16, 9], [16, 5], [19, 5]
    ]),
    buildableAreas: generateBuildableZones([
      [0, 6], [3, 6], [3, 2], [6, 2], [6, 10], [9, 10], [9, 3], [13, 3], [13, 9], [16, 9], [16, 5], [19, 5]
    ]),
    waves: [
      { enemies: [{ type: 'soldier', count: 15, delay: 25 }
    ] },
      { enemies: [{ type: 'knight', count: 10, delay: 40 }] },
      { enemies: [{ type: 'mage', count: 10, delay: 30 }, { type: 'soldier', count: 8, delay: 25 }] },
      { enemies: [{ type: 'ogre', count: 5, delay: 55 }] },
      { enemies: [{ type: 'knight', count: 8, delay: 35 }, { type: 'mage', count: 8, delay: 30 }, { type: 'ogre', count: 3, delay: 65 }] },
      { enemies: [{ type: 'dragon', count: 1, delay: 0 }, { type: 'soldier', count: 10, delay: 30 }] },
      { enemies: [{ type: 'ogre', count: 6, delay: 50 }, { type: 'knight', count: 6, delay: 40 }] },
      { enemies: [{ type: 'mage', count: 12, delay: 25 }, { type: 'ogre', count: 4, delay: 55 }] },
      { enemies: [{ type: 'soldier', count: 20, delay: 18 }, { type: 'knight', count: 8, delay: 35 }] },
      { enemies: [{ type: 'dragon', count: 2, delay: 100 }, { type: 'ogre', count: 4, delay: 60 }] },
      { enemies: [{ type: 'knight', count: 10, delay: 30 }, { type: 'mage', count: 10, delay: 25 }, { type: 'ogre', count: 5, delay: 50 }] },
      { enemies: [{ type: 'dragon', count: 3, delay: 80 }, { type: 'ogre', count: 6, delay: 50 }, { type: 'knight', count: 8, delay: 35 }] },
    ],
  },
];

export function getLevelConfig(levelId: number): LevelConfig | undefined {
  return LEVELS.find((l) => l.id === levelId);
}

export const TOTAL_LEVELS = LEVELS.length;
