import { EnemyConfig, EnemyType } from './types';

export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  scout: {
    type: 'scout',
    name: 'Scout',
    hp: 35,
    speed: 2.6,
    reward: 5,
    livesLost: 1,
    color: '#22C55E',
  },
  soldier: {
    type: 'soldier',
    name: 'Soldier',
    hp: 85,
    speed: 1.9,
    reward: 10,
    livesLost: 1,
    color: '#3B82F6',
  },
  knight: {
    type: 'knight',
    name: 'Knight',
    hp: 180,
    speed: 1.3,
    reward: 18,
    livesLost: 2,
    color: '#6B7280',
  },
  mage: {
    type: 'mage',
    name: 'Mage',
    hp: 75,
    speed: 2.0,
    reward: 14,
    livesLost: 1,
    color: '#A855F7',
  },
  ogre: {
    type: 'ogre',
    name: 'Ogre',
    hp: 450,
    speed: 0.9,
    reward: 40,
    livesLost: 3,
    color: '#78716C',
  },
  dragon: {
    type: 'dragon',
    name: 'Dragon',
    hp: 900,
    speed: 1.1,
    reward: 85,
    livesLost: 5,
    color: '#EF4444',
  },
  boss: {
    type: 'boss',
    name: 'Boss',
    hp: 2000,
    speed: 0.7,
    reward: 400,
    livesLost: 10,
    color: '#000000',
  },
};

export function getEnemyConfig(type: EnemyType): EnemyConfig {
  return ENEMY_CONFIGS[type];
}

export function createEnemy(type: EnemyType, id: string, startPosition: { x: number; y: number }) {
  const config = ENEMY_CONFIGS[type];
  return {
    id,
    type,
    hp: config.hp,
    maxHp: config.hp,
    position: { ...startPosition },
    pathIndex: 0,
    slowEffect: 0,
    slowDuration: 0,
  };
}
