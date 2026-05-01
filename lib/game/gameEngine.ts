import { GameState, GameAction, Tower, Enemy, Projectile, LevelConfig, EnemyType, Position, VisualEffect } from './types';
import { TOWER_CONFIGS, getTowerStats, getUpgradeCost, getSellValue } from './towers';
import { ENEMY_CONFIGS, createEnemy } from './enemies';
import {
  STARTING_LIVES,
  PROJECTILE_SPEED,
  ICE_SLOW_AMOUNT,
  ICE_SLOW_DURATION,
  ICE_AOE_RADIUS,
  CANNON_AOE_RADIUS,
  LIGHTNING_CHAIN_COUNT,
  LIGHTNING_CHAIN_RANGE,
  CELL_SIZE,
} from './constants';

let enemyIdCounter = 0;
let projectileIdCounter = 0;
let towerIdCounter = 0;
let effectIdCounter = 0;

export function createInitialGameState(levelConfig: LevelConfig, bonusGold = 0): GameState {
  enemyIdCounter = 0;
  projectileIdCounter = 0;
  towerIdCounter = 0;
  effectIdCounter = 0;

  return {
    level: levelConfig.id,
    wave: 0,
    gold: levelConfig.startingGold + bonusGold,
    lives: STARTING_LIVES,
    maxLives: STARTING_LIVES,
    score: 0,
    towers: [],
    enemies: [],
    projectiles: [],
    isPlaying: false,
    isPaused: false,
    waveInProgress: false,
    gameSpeed: 1,
    selectedTower: null,
    selectedPlacedTower: null,
    gameOver: false,
    victory: false,
    currentWaveEnemies: [],
    spawnTimer: 0,
    effects: [],
    isEndless: levelConfig.forceEndless || false,
  };
}

export function generateEndlessWave(index: number) {
  // index 0 is the first endless wave
  const baseCount = 10 + Math.floor(index * 2);
  
  const enemies: { type: EnemyType; count: number; delay: number }[] = [];
  
  if (index % 5 === 4) {
    // Boss wave every 5 endless waves
    enemies.push({ type: 'boss', count: 1 + Math.floor(index / 10), delay: 100 });
    enemies.push({ type: 'dragon', count: 2 + Math.floor(index / 5), delay: 50 });
  } else {
    // Normal wave mix
    enemies.push({ type: 'scout', count: Math.floor(baseCount * 0.5), delay: Math.max(10, 40 - index) });
    enemies.push({ type: 'soldier', count: Math.floor(baseCount * 0.3), delay: Math.max(15, 50 - index) });
    enemies.push({ type: 'knight', count: Math.floor(baseCount * 0.2), delay: 60 });
    
    if (index >= 2) {
      enemies.push({ type: 'mage', count: Math.floor(baseCount * 0.15), delay: 55 });
    }
    if (index >= 5) {
      enemies.push({ type: 'ogre', count: Math.floor(baseCount * 0.1), delay: 80 });
    }
  }

  return { enemies };
}

function generateId(prefix: string): string {
  if (prefix === 'enemy') return `enemy_${++enemyIdCounter}`;
  if (prefix === 'projectile') return `projectile_${++projectileIdCounter}`;
  if (prefix === 'effect') return `effect_${++effectIdCounter}`;
  return `tower_${++towerIdCounter}`;
}

function distance(a: Position, b: Position): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function moveTowards(from: Position, to: Position, speed: number): Position {
  const dist = distance(from, to);
  if (dist <= speed) return { ...to };
  const ratio = speed / dist;
  return {
    x: from.x + (to.x - from.x) * ratio,
    y: from.y + (to.y - from.y) * ratio,
  };
}

export function gameReducer(state: GameState, action: GameAction, levelConfig: LevelConfig): GameState {
  switch (action.type) {
    case 'START_WAVE': {
      if (state.waveInProgress) return state;
      
      const nextWave = state.wave;
      let waveConfig;

      if (nextWave < levelConfig.waves.length) {
        waveConfig = levelConfig.waves[nextWave];
      } else if (state.isEndless) {
        const endlessIndex = nextWave - levelConfig.waves.length;
        waveConfig = generateEndlessWave(endlessIndex);
      } else {
        return state;
      }

      const enemyQueue: { type: EnemyType; spawned: boolean; delay: number }[] = [];
      
      let accumulatedDelay = 0;
      for (const group of waveConfig.enemies) {
        for (let i = 0; i < group.count; i++) {
          enemyQueue.push({
            type: group.type,
            spawned: false,
            delay: accumulatedDelay + i * group.delay,
          });
        }
        accumulatedDelay += group.count * group.delay;
      }

      return {
        ...state,
        wave: nextWave + 1,
        waveInProgress: true,
        isPlaying: true,
        currentWaveEnemies: enemyQueue,
        spawnTimer: 0,
      };
    }

    case 'START_ENDLESS_MODE': {
      const nextWave = Math.max(state.wave, levelConfig.waves.length);
      const endlessIndex = nextWave - levelConfig.waves.length;
      const waveConfig = generateEndlessWave(endlessIndex >= 0 ? endlessIndex : 0);

      const enemyQueue: { type: EnemyType; spawned: boolean; delay: number }[] = [];
      
      let accumulatedDelay = 0;
      for (const group of waveConfig.enemies) {
        for (let i = 0; i < group.count; i++) {
          enemyQueue.push({
            type: group.type,
            spawned: false,
            delay: accumulatedDelay + i * group.delay,
          });
        }
        accumulatedDelay += group.count * group.delay;
      }

      return {
        ...state,
        isEndless: true,
        victory: false,
        gameOver: false,
        wave: nextWave + 1,
        waveInProgress: true,
        isPlaying: true,
        currentWaveEnemies: enemyQueue,
        spawnTimer: 0,
      };
    }

    case 'PAUSE':
      return { ...state, isPaused: true };

    case 'RESUME':
      return { ...state, isPaused: false };

    case 'SET_SPEED':
      return { ...state, gameSpeed: action.speed };

    case 'SELECT_TOWER':
      return { ...state, selectedTower: action.towerType, selectedPlacedTower: null };

    case 'SELECT_PLACED_TOWER':
      return { ...state, selectedPlacedTower: action.towerId, selectedTower: null };

    case 'PLACE_TOWER': {
      if (!state.selectedTower) return state;
      const config = TOWER_CONFIGS[state.selectedTower];
      if (state.gold < config.cost) return state;

      // Check if position is valid (within buildable area and not overlapping)
      const isValidPosition = levelConfig.buildableAreas.some(
        (area) =>
          action.position.x >= area.x &&
          action.position.x < area.x + area.width &&
          action.position.y >= area.y &&
          action.position.y < area.y + area.height
      );

      if (!isValidPosition) return state;

      // Check for overlapping towers
      const hasOverlap = state.towers.some(
        (t) => distance(t.position, action.position) < CELL_SIZE
      );

      if (hasOverlap) return state;

      const newTower: Tower = {
        id: generateId('tower'),
        type: state.selectedTower,
        position: action.position,
        level: 1,
        cooldown: 0,
        target: null,
      };

      return {
        ...state,
        gold: state.gold - config.cost,
        towers: [...state.towers, newTower],
        selectedTower: null,
      };
    }

    case 'UPGRADE_TOWER': {
      const tower = state.towers.find((t) => t.id === action.towerId);
      if (!tower || tower.level >= 3) return state;

      const cost = getUpgradeCost(tower.type, tower.level);
      if (state.gold < cost) return state;

      return {
        ...state,
        gold: state.gold - cost,
        towers: state.towers.map((t) =>
          t.id === action.towerId ? { ...t, level: t.level + 1 } : t
        ),
      };
    }

    case 'SELL_TOWER': {
      const tower = state.towers.find((t) => t.id === action.towerId);
      if (!tower) return state;

      const value = getSellValue(tower.type, tower.level);

      return {
        ...state,
        gold: state.gold + value,
        towers: state.towers.filter((t) => t.id !== action.towerId),
        selectedPlacedTower: null,
      };
    }

    case 'SPAWN_ENEMY': {
      const startPos = levelConfig.path[0];
      const newEnemy = createEnemy(action.enemyType, generateId('enemy'), startPos);

      return {
        ...state,
        enemies: [...state.enemies, newEnemy],
      };
    }

    case 'DAMAGE_ENEMY': {
      const enemy = state.enemies.find((e) => e.id === action.enemyId);
      if (!enemy) return state;

      const newHp = enemy.hp - action.damage;
      if (newHp <= 0) {
        const config = ENEMY_CONFIGS[enemy.type];
        return {
          ...state,
          enemies: state.enemies.filter((e) => e.id !== action.enemyId),
          gold: state.gold + config.reward,
          score: state.score + config.reward * 10,
        };
      }

      return {
        ...state,
        enemies: state.enemies.map((e) =>
          e.id === action.enemyId
            ? {
                ...e,
                hp: newHp,
                slowEffect: action.slow ? action.slow.amount : e.slowEffect,
                slowDuration: action.slow ? action.slow.duration : e.slowDuration,
              }
            : e
        ),
      };
    }

    case 'REMOVE_ENEMY': {
      const enemy = state.enemies.find((e) => e.id === action.enemyId);
      if (!enemy) return state;

      if (action.escaped) {
        const config = ENEMY_CONFIGS[enemy.type];
        const newLives = state.lives - config.livesLost;

        if (newLives <= 0) {
          return {
            ...state,
            enemies: state.enemies.filter((e) => e.id !== action.enemyId),
            lives: 0,
            gameOver: true,
            isPlaying: false,
          };
        }

        return {
          ...state,
          enemies: state.enemies.filter((e) => e.id !== action.enemyId),
          lives: newLives,
        };
      }

      return {
        ...state,
        enemies: state.enemies.filter((e) => e.id !== action.enemyId),
      };
    }

    case 'ADD_PROJECTILE':
      return {
        ...state,
        projectiles: [...state.projectiles, action.projectile],
      };

    case 'REMOVE_PROJECTILE':
      return {
        ...state,
        projectiles: state.projectiles.filter((p) => p.id !== action.projectileId),
      };

    case 'WAVE_COMPLETE': {
      const isLastWave = state.wave >= levelConfig.waves.length && !state.isEndless;

      if (isLastWave) {
        return {
          ...state,
          waveInProgress: false,
          victory: true,
          isPlaying: false,
        };
      }

      return {
        ...state,
        waveInProgress: false,
      };
    }

    case 'LEVEL_COMPLETE':
      return {
        ...state,
        victory: true,
        isPlaying: false,
      };

    case 'GAME_OVER':
      return {
        ...state,
        gameOver: true,
        isPlaying: false,
      };

    case 'RESET_LEVEL':
      return createInitialGameState(action.levelConfig);

    case 'TICK': {
      if (!state.isPlaying || state.isPaused || state.gameOver || state.victory) {
        return state;
      }

      let newState = { ...state };

      // Spawn enemies
      if (state.waveInProgress) {
        const newSpawnTimer = state.spawnTimer + 1;
        const updatedEnemyQueue = state.currentWaveEnemies.map((e) => {
          if (!e.spawned && newSpawnTimer >= e.delay) {
            const startPos = levelConfig.path[0];
            const newEnemy = createEnemy(e.type, generateId('enemy'), startPos);
            
            // Apply endless HP scaling (capped at 5×)
            if (state.isEndless) {
              const endlessIndex = state.wave - 1 - levelConfig.waves.length;
              if (endlessIndex >= 0) {
                const multiplier = Math.min(5, 1 + (endlessIndex * 0.2)); // +20% HP per wave, max 5×
                newEnemy.hp *= multiplier;
                newEnemy.maxHp *= multiplier;
              }
            }

            newState.enemies = [...newState.enemies, newEnemy];
            return { ...e, spawned: true };
          }
          return e;
        });

        newState.currentWaveEnemies = updatedEnemyQueue;
        newState.spawnTimer = newSpawnTimer;

        // Check if all enemies spawned and defeated
        const allSpawned = updatedEnemyQueue.every((e) => e.spawned);
        if (allSpawned && newState.enemies.length === 0) {
          // Wave-clear gold bonus
          newState.gold += 20;

          const isLastWave = state.wave >= levelConfig.waves.length && !state.isEndless;
          if (isLastWave) {
            return {
              ...newState,
              waveInProgress: false,
              victory: true,
              isPlaying: false,
            };
          } else {
            return {
              ...newState,
              waveInProgress: false,
            };
          }
        }
      }

      // Move enemies along path
      newState.enemies = newState.enemies.map((enemy) => {
        const config = ENEMY_CONFIGS[enemy.type];
        let speed = config.speed;

        // Apply slow effect
        if (enemy.slowDuration > 0) {
          speed *= 1 - enemy.slowEffect;
        }

        const targetPoint = levelConfig.path[enemy.pathIndex + 1];
        if (!targetPoint) {
          return enemy; // Will be removed as escaped
        }

        const newPos = moveTowards(enemy.position, targetPoint, speed);
        let newPathIndex = enemy.pathIndex;

        if (distance(newPos, targetPoint) < 1) {
          newPathIndex = enemy.pathIndex + 1;
        }

        return {
          ...enemy,
          position: newPos,
          pathIndex: newPathIndex,
          slowDuration: Math.max(0, enemy.slowDuration - 1),
        };
      });

      // Check for enemies that reached the end — process ALL before game-over
      const escapedEnemies = newState.enemies.filter(
        (e) => e.pathIndex >= levelConfig.path.length - 1
      );

      for (const escaped of escapedEnemies) {
        const config = ENEMY_CONFIGS[escaped.type];
        newState.lives -= config.livesLost;
      }

      // Remove all escaped enemies
      newState.enemies = newState.enemies.filter(
        (e) => e.pathIndex < levelConfig.path.length - 1
      );

      // Check game over after processing all escapes
      if (newState.lives <= 0) {
        return {
          ...newState,
          lives: 0,
          gameOver: true,
          isPlaying: false,
        };
      }

      // Tower targeting and shooting
      newState.towers = newState.towers.map((tower) => {
        const stats = getTowerStats(tower.type, tower.level);
        const cooldownFrames = 60 / stats.attackSpeed;

        if (tower.cooldown > 0) {
          return { ...tower, cooldown: tower.cooldown - 1 };
        }

        // Find target
        const enemiesInRange = newState.enemies.filter(
          (e) => distance(tower.position, e.position) <= stats.range
        );

        if (enemiesInRange.length === 0) {
          return { ...tower, target: null };
        }

        // Target the enemy furthest along the path
        const target = enemiesInRange.reduce((a, b) =>
          a.pathIndex > b.pathIndex ? a : b
        );

        // Create projectile
        const projectile: Projectile = {
          id: generateId('projectile'),
          fromTower: tower.id,
          toEnemy: target.id,
          position: { ...tower.position },
          targetPosition: { ...target.position },
          damage: stats.damage,
          type: tower.type,
        };

        newState.projectiles = [...newState.projectiles, projectile];

        return { ...tower, target: target.id, cooldown: cooldownFrames };
      });

      // Move projectiles
      newState.projectiles = newState.projectiles
        .map((projectile) => {
          const target = newState.enemies.find((e) => e.id === projectile.toEnemy);
          if (!target) {
            return null; // Remove if target is gone
          }

          const newPos = moveTowards(
            projectile.position,
            target.position,
            PROJECTILE_SPEED
          );

          // Check hit
          if (distance(newPos, target.position) < 10) {
            // Apply damage
            let damage = projectile.damage;

            if (projectile.type === 'cannon') {
              // AOE damage
              newState.effects.push({
                id: generateId('effect'),
                type: 'cannon_boom',
                position: target.position,
                duration: 15,
                maxDuration: 15,
              });

              newState.enemies = newState.enemies.map((e) => {
                if (distance(e.position, target.position) <= CANNON_AOE_RADIUS) {
                  const newHp = e.hp - damage;
                  if (newHp <= 0) {
                    const config = ENEMY_CONFIGS[e.type];
                    newState.gold += config.reward;
                    newState.score += config.reward * 10;
                    return null as unknown as Enemy;
                  }
                  return { ...e, hp: newHp };
                }
                return e;
              }).filter(Boolean) as Enemy[];
            } else if (projectile.type === 'ice') {
              // AOE damage and slow
              newState.effects.push({
                id: generateId('effect'),
                type: 'ice_nova',
                position: target.position,
                duration: 20,
                maxDuration: 20,
              });

              newState.enemies = newState.enemies.map((e) => {
                if (distance(e.position, target.position) <= ICE_AOE_RADIUS) {
                  const newHp = e.hp - damage;
                  if (newHp <= 0) {
                    const config = ENEMY_CONFIGS[e.type];
                    newState.gold += config.reward;
                    newState.score += config.reward * 10;
                    return null as unknown as Enemy;
                  }
                  return {
                    ...e,
                    hp: newHp,
                    slowEffect: ICE_SLOW_AMOUNT,
                    slowDuration: ICE_SLOW_DURATION,
                  };
                }
                return e;
              }).filter(Boolean) as Enemy[];
            } else if (projectile.type === 'lightning') {
              // Lightning - primary target + chain to nearby enemies
              newState.effects.push({
                id: generateId('effect'),
                type: 'lightning_strike',
                position: target.position,
                duration: 10,
                maxDuration: 10,
              });

              // Hit primary target
              const chainedIds = new Set<string>([target.id]);
              newState.enemies = newState.enemies.map((e) => {
                if (e.id === target.id) {
                  const newHp = e.hp - damage;
                  if (newHp <= 0) {
                    const config = ENEMY_CONFIGS[e.type];
                    newState.gold += config.reward;
                    newState.score += config.reward * 10;
                    return null as unknown as Enemy;
                  }
                  return { ...e, hp: newHp };
                }
                return e;
              }).filter(Boolean) as Enemy[];

              // Chain to nearby enemies
              let lastPos = target.position;
              for (let c = 0; c < LIGHTNING_CHAIN_COUNT; c++) {
                // Damage reduces with each bounce: 75% -> 50% -> 25%
                const chainMultiplier = 1 - (c + 1) * 0.25;
                const chainDamage = Math.round(damage * chainMultiplier);
                const chainTarget = newState.enemies
                  .filter((e) => !chainedIds.has(e.id) && distance(e.position, lastPos) <= LIGHTNING_CHAIN_RANGE)
                  .sort((a, b) => distance(a.position, lastPos) - distance(b.position, lastPos))[0];
                if (!chainTarget) break;

                chainedIds.add(chainTarget.id);
                lastPos = chainTarget.position;

                newState.effects.push({
                  id: generateId('effect'),
                  type: 'lightning_strike',
                  position: chainTarget.position,
                  duration: 8,
                  maxDuration: 8,
                });

                newState.enemies = newState.enemies.map((e) => {
                  if (e.id === chainTarget.id) {
                    const newHp = e.hp - chainDamage;
                    if (newHp <= 0) {
                      const config = ENEMY_CONFIGS[e.type];
                      newState.gold += config.reward;
                      newState.score += config.reward * 10;
                      return null as unknown as Enemy;
                    }
                    return { ...e, hp: newHp };
                  }
                  return e;
                }).filter(Boolean) as Enemy[];
              }
            } else {
              // Arrow - single target
              newState.enemies = newState.enemies.map((e) => {
                if (e.id === target.id) {
                  const newHp = e.hp - damage;
                  if (newHp <= 0) {
                    const config = ENEMY_CONFIGS[e.type];
                    newState.gold += config.reward;
                    newState.score += config.reward * 10;
                    return null as unknown as Enemy;
                  }
                  return { ...e, hp: newHp };
                }
                return e;
              }).filter(Boolean) as Enemy[];
            }

            return null; // Remove projectile
          }

          return { ...projectile, position: newPos, targetPosition: target.position };
        })
        .filter(Boolean) as Projectile[];

      // Decay effects
      newState.effects = newState.effects
        .map((effect) => ({ ...effect, duration: effect.duration - 1 }))
        .filter((effect) => effect.duration > 0);

      return newState;
    }

    default:
      return state;
  }
}

export function calculateStars(livesLost: number): number {
  if (livesLost === 0) return 3;
  if (livesLost <= 5) return 2;
  return 1;
}

export function calculateBonus(stars: number): number {
  if (stars === 3) return 100;
  if (stars === 2) return 50;
  return 25;
}
