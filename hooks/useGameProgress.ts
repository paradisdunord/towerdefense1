'use client';

import { useState, useEffect, useCallback } from 'react';
import { GameProgress, LevelProgress, TowerType } from '@/lib/game/types';
import { STORAGE_KEY } from '@/lib/game/constants';
import { INITIAL_UNLOCKED_TOWERS, TOWER_UNLOCK_LEVELS } from '@/lib/game/towers';

const DEFAULT_PROGRESS: GameProgress = {
  levels: {},
  totalStars: 0,
  totalGold: 0,
  unlockedTowers: [...INITIAL_UNLOCKED_TOWERS],
};

export function useGameProgress() {
  const [progress, setProgress] = useState<GameProgress>(DEFAULT_PROGRESS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as GameProgress;
        setProgress(parsed);
      }
    } catch (e) {
      console.error('Failed to load game progress:', e);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage
  const saveProgress = useCallback((newProgress: GameProgress) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress));
      setProgress(newProgress);
    } catch (e) {
      console.error('Failed to save game progress:', e);
    }
  }, []);

  const completeLevel = useCallback(
    (levelId: number, stars: number, score: number) => {
      setProgress((prev) => {
        const existingLevel = prev.levels[levelId];
        const newStars = existingLevel ? Math.max(existingLevel.stars, stars) : stars;
        const newScore = existingLevel ? Math.max(existingLevel.bestScore, score) : score;

        // Check for tower unlocks
        const newUnlocks: TowerType[] = [];
        for (const [tower, unlockLevel] of Object.entries(TOWER_UNLOCK_LEVELS)) {
          if (
            levelId >= unlockLevel &&
            !prev.unlockedTowers.includes(tower as TowerType)
          ) {
            newUnlocks.push(tower as TowerType);
          }
        }

        const newProgress: GameProgress = {
          ...prev,
          levels: {
            ...prev.levels,
            [levelId]: {
              completed: true,
              stars: newStars,
              bestScore: newScore,
            },
          },
          totalStars:
            prev.totalStars +
            (existingLevel ? Math.max(0, stars - existingLevel.stars) : stars),
          unlockedTowers: [...prev.unlockedTowers, ...newUnlocks],
        };

        saveProgress(newProgress);
        return newProgress;
      });
    },
    [saveProgress]
  );

  const isLevelUnlocked = useCallback(
    (levelId: number): boolean => {
      if (levelId === 1) return true;
      return progress.levels[levelId - 1]?.completed ?? false;
    },
    [progress]
  );

  const getLevelProgress = useCallback(
    (levelId: number): LevelProgress | undefined => {
      return progress.levels[levelId];
    },
    [progress]
  );

  const isTowerUnlocked = useCallback(
    (towerType: TowerType): boolean => {
      return progress.unlockedTowers.includes(towerType);
    },
    [progress]
  );

  const resetProgress = useCallback(() => {
    saveProgress(DEFAULT_PROGRESS);
  }, [saveProgress]);

  return {
    progress,
    isLoaded,
    completeLevel,
    isLevelUnlocked,
    getLevelProgress,
    isTowerUnlocked,
    resetProgress,
  };
}
