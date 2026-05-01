// Game Types for Tower Defense

export type TowerType = 'arrow' | 'cannon' | 'ice' | 'lightning';
export type EnemyType = 'scout' | 'soldier' | 'knight' | 'mage' | 'ogre' | 'dragon' | 'boss';

export interface Position {
  x: number;
  y: number;
}

export interface TowerConfig {
  type: TowerType;
  name: string;
  cost: number;
  damage: number;
  range: number;
  attackSpeed: number; // attacks per second
  special: string;
  color: string;
}

export interface Tower {
  id: string;
  type: TowerType;
  position: Position;
  level: number;
  cooldown: number;
  target: string | null;
}

export interface EnemyConfig {
  type: EnemyType;
  name: string;
  hp: number;
  speed: number; // pixels per frame
  reward: number;
  livesLost: number;
  color: string;
}

export interface Enemy {
  id: string;
  type: EnemyType;
  hp: number;
  maxHp: number;
  position: Position;
  pathIndex: number;
  slowEffect: number; // 0-1, percentage of slow
  slowDuration: number;
}

export interface Projectile {
  id: string;
  fromTower: string;
  toEnemy: string;
  position: Position;
  targetPosition: Position;
  damage: number;
  type: TowerType;
  chainTargets?: string[]; // for lightning
}

export type EffectType = 'cannon_boom' | 'ice_nova' | 'lightning_strike';

export interface VisualEffect {
  id: string;
  type: EffectType;
  position: Position;
  duration: number; // current frames left
  maxDuration: number;
}

export interface Wave {
  enemies: { type: EnemyType; count: number; delay: number }[];
}

export interface LevelConfig {
  id: number;
  name: string;
  theme: string;
  waves: Wave[];
  startingGold: number;
  path: Position[];
  buildableAreas: { x: number; y: number; width: number; height: number }[];
  forceEndless?: boolean;
}

export interface LevelProgress {
  completed: boolean;
  stars: number;
  bestScore: number;
}

export interface GameProgress {
  levels: Record<number, LevelProgress>;
  totalStars: number;
  totalGold: number;
  unlockedTowers: TowerType[];
}

export interface GameState {
  level: number;
  wave: number;
  gold: number;
  lives: number;
  maxLives: number;
  score: number;
  towers: Tower[];
  enemies: Enemy[];
  projectiles: Projectile[];
  isPlaying: boolean;
  isPaused: boolean;
  waveInProgress: boolean;
  gameSpeed: 1 | 2;
  selectedTower: TowerType | null;
  selectedPlacedTower: string | null;
  gameOver: boolean;
  victory: boolean;
  currentWaveEnemies: { type: EnemyType; spawned: boolean; delay: number }[];
  spawnTimer: number;
  effects: VisualEffect[];
  isEndless: boolean;
}

export type GameAction =
  | { type: 'START_WAVE' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'SET_SPEED'; speed: 1 | 2 }
  | { type: 'SELECT_TOWER'; towerType: TowerType | null }
  | { type: 'PLACE_TOWER'; position: Position }
  | { type: 'SELECT_PLACED_TOWER'; towerId: string | null }
  | { type: 'UPGRADE_TOWER'; towerId: string }
  | { type: 'SELL_TOWER'; towerId: string }
  | { type: 'TICK'; deltaTime: number }
  | { type: 'SPAWN_ENEMY'; enemyType: EnemyType }
  | { type: 'DAMAGE_ENEMY'; enemyId: string; damage: number; slow?: { amount: number; duration: number } }
  | { type: 'REMOVE_ENEMY'; enemyId: string; escaped: boolean }
  | { type: 'ADD_PROJECTILE'; projectile: Projectile }
  | { type: 'REMOVE_PROJECTILE'; projectileId: string }
  | { type: 'WAVE_COMPLETE' }
  | { type: 'LEVEL_COMPLETE' }
  | { type: 'GAME_OVER' }
  | { type: 'RESET_LEVEL'; levelConfig: LevelConfig }
  | { type: 'START_ENDLESS_MODE' };
