// Game Constants - Heavy Industrial Design

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 500;

export const CELL_SIZE = 40; // Grid cell size for tower placement
export const GRID_COLS = CANVAS_WIDTH / CELL_SIZE; // 20 columns
export const GRID_ROWS = CANVAS_HEIGHT / CELL_SIZE; // 12.5 rows (use 12)

export const STARTING_LIVES = 10;

export const PROJECTILE_SPEED = 8;

export const ICE_SLOW_AMOUNT = 0.3; // 30% slow
export const ICE_SLOW_DURATION = 120; // frames (2 seconds at 60fps)
export const ICE_AOE_RADIUS = 60;

export const CANNON_AOE_RADIUS = 60;
export const LIGHTNING_CHAIN_COUNT = 3;
export const LIGHTNING_CHAIN_RANGE = 80;

// Path adjacent zone - how many cells away from path can build
export const BUILD_ZONE_DISTANCE = 1; // 1 cell adjacent to path

// Hover persistence (in pixels from edge)
export const HOVER_PERSIST_DISTANCE = 5;

// Rewards
export const PERFECT_BONUS = 100;
export const GREAT_BONUS = 50;
export const COMPLETE_BONUS = 25;

export const PERFECT_MULTIPLIER = 2.0;
export const GREAT_MULTIPLIER = 1.5;
export const COMPLETE_MULTIPLIER = 1.0;

// Star thresholds (lives lost)
export const PERFECT_THRESHOLD = 0; // No lives lost = 3 stars
export const GREAT_THRESHOLD = 5; // <=5 lives lost = 2 stars

// Milestone rewards
export const MILESTONES = {
  15: { type: 'gold_bonus', value: 50, description: '+50 starting gold all levels' },
  25: { type: 'upgrade_discount', value: 0.25, description: '25% tower upgrade discount' },
  30: { type: 'endless_mode', value: true, description: 'Endless Mode unlocked' },
};

// Colors - Collarwork Design (Sleek, Apple-esque but industrial)
export const COLORS = {
  // Primary palette (Industrial Orange)
  primary: '#FF5F1F',
  background: '#FAFAFA',
  foreground: '#111111',
  
  // UI colors
  secondary: '#F4F4F5',
  border: '#E4E4E7',
  borderLight: '#F4F4F5',
  
  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  
  // Game specific
  path: '#FFFFFF',
  pathBorder: 'transparent',
  
  // Grid and buildable zones
  grid: 'rgba(0, 0, 0, 0.02)',
  gridLine: 'rgba(0, 0, 0, 0.05)',
  buildable: 'rgba(0, 0, 0, 0.02)',
  buildableHover: 'rgba(255, 95, 31, 0.1)',
  buildableGlow: 'rgba(255, 95, 31, 0.2)',
  nonBuildable: 'rgba(0, 0, 0, 0.08)',
  
  // Hover effects (Sticky trail)
  hoverGlow: 'rgba(255, 95, 31, 0.15)',
  hoverGlowStrong: 'rgba(255, 95, 31, 0.3)',
};

// Local storage keys
export const STORAGE_KEY = 'tower_defense_progress';
