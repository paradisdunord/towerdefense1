'use client';

import { useCallback, useReducer } from 'react';
import { GameState, GameAction, LevelConfig, TowerType, Position } from '@/lib/game/types';
import { gameReducer, createInitialGameState } from '@/lib/game/gameEngine';

export function useGameState(levelConfig: LevelConfig, bonusGold = 0) {
  const [state, dispatchRaw] = useReducer(
    (state: GameState, action: GameAction) => gameReducer(state, action, levelConfig),
    levelConfig,
    (config) => createInitialGameState(config, bonusGold)
  );

  const dispatch = useCallback((action: GameAction) => {
    dispatchRaw(action);
  }, []);

  const startWave = useCallback(() => {
    dispatch({ type: 'START_WAVE' });
  }, [dispatch]);

  const startEndlessMode = useCallback(() => {
    dispatch({ type: 'START_ENDLESS_MODE' });
  }, [dispatch]);

  const pause = useCallback(() => {
    dispatch({ type: 'PAUSE' });
  }, [dispatch]);

  const resume = useCallback(() => {
    dispatch({ type: 'RESUME' });
  }, [dispatch]);

  const setSpeed = useCallback((speed: 1 | 2) => {
    dispatch({ type: 'SET_SPEED', speed });
  }, [dispatch]);

  const selectTower = useCallback((towerType: TowerType | null) => {
    dispatch({ type: 'SELECT_TOWER', towerType });
  }, [dispatch]);

  const placeTower = useCallback((position: Position) => {
    dispatch({ type: 'PLACE_TOWER', position });
  }, [dispatch]);

  const selectPlacedTower = useCallback((towerId: string | null) => {
    dispatch({ type: 'SELECT_PLACED_TOWER', towerId });
  }, [dispatch]);

  const upgradeTower = useCallback((towerId: string) => {
    dispatch({ type: 'UPGRADE_TOWER', towerId });
  }, [dispatch]);

  const sellTower = useCallback((towerId: string) => {
    dispatch({ type: 'SELL_TOWER', towerId });
  }, [dispatch]);

  const tick = useCallback((deltaTime: number) => {
    dispatch({ type: 'TICK', deltaTime });
  }, [dispatch]);

  const resetLevel = useCallback((newConfig: LevelConfig) => {
    dispatch({ type: 'RESET_LEVEL', levelConfig: newConfig });
  }, [dispatch]);

  return {
    state,
    dispatch,
    startWave,
    startEndlessMode,
    pause,
    resume,
    setSpeed,
    selectTower,
    placeTower,
    selectPlacedTower,
    upgradeTower,
    sellTower,
    tick,
    resetLevel,
  };
}
