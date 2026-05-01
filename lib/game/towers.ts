import { TowerConfig, TowerType } from './types';

export const TOWER_CONFIGS: Record<TowerType, TowerConfig> = {
  arrow: {
    type: 'arrow',
    name: 'Arrow Tower',
    cost: 60,
    damage: 10,
    range: 120,
    attackSpeed: 1.5,
    special: 'Fast single target',
    color: '#29ABE2',
  },
  cannon: {
    type: 'cannon',
    name: 'Cannon Tower',
    cost: 120,
    damage: 22,
    range: 90,
    attackSpeed: 0.6,
    special: 'Area damage',
    color: '#1a1a1a',
  },
  ice: {
    type: 'ice',
    name: 'Ice Tower',
    cost: 85,
    damage: 5,
    range: 110,
    attackSpeed: 1.0,
    special: 'Slows 30%',
    color: '#7DD3FC',
  },
  lightning: {
    type: 'lightning',
    name: 'Lightning Tower',
    cost: 180,
    damage: 90,
    range: 280,
    attackSpeed: 0.25,
    special: 'Extreme range sniper',
    color: '#FBBF24',
  },
};

export const UPGRADE_COSTS = [0, 1.2, 1.5]; // multiplier of base cost for level 1->2, 2->3

export function getTowerStats(type: TowerType, level: number) {
  const config = TOWER_CONFIGS[type];
  const multiplier = Math.pow(1.6, level - 1); // 1x, 1.6x, 2.56x (less explosive scaling)

  return {
    damage: Math.round(config.damage * multiplier),
    range: config.range,
    attackSpeed: config.attackSpeed * multiplier,
  };
}

export function getUpgradeCost(type: TowerType, currentLevel: number): number {
  if (currentLevel >= 3) return 0;
  const config = TOWER_CONFIGS[type];
  return Math.round(config.cost * UPGRADE_COSTS[currentLevel]);
}

export function getSellValue(type: TowerType, level: number): number {
  const config = TOWER_CONFIGS[type];
  let totalInvested = config.cost;
  for (let i = 1; i < level; i++) {
    totalInvested += Math.round(config.cost * UPGRADE_COSTS[i]);
  }
  return Math.round(totalInvested * 0.6); // 60% refund
}

export const INITIAL_UNLOCKED_TOWERS: TowerType[] = ['arrow', 'cannon'];
export const TOWER_UNLOCK_LEVELS: Record<TowerType, number> = {
  arrow: 1,
  cannon: 1,
  ice: 3,
  lightning: 5,
};
