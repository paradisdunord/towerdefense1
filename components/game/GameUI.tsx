'use client';

import { GameState, LevelConfig } from '@/lib/game/types';
import { Heart, Zap, Trophy, Infinity } from 'lucide-react';
import { memo } from 'react';

interface GameUIProps {
  state: GameState;
  levelConfig: LevelConfig;
}

export const GameUI = memo(function GameUI({
  state,
  levelConfig,
}: GameUIProps) {
  const totalWaves = levelConfig.waves.length;
  const currentWave = state.wave;
  const isEndless = state.isEndless;

  return (
    <div className="w-full flex items-center justify-between mb-3 px-1">
      {/* Left - Score */}
      <div className="flex items-center gap-2 px-4 py-2 border border-foreground/50 bg-background">
        <Trophy className="w-5 h-5" style={{ color: '#29ABE2' }} />
        <span className="text-industrial text-lg font-bold tracking-tight">
          {state.score.toLocaleString()}
        </span>
      </div>

      {/* Center - Wave counter */}
      <div className="flex items-center gap-3">
        {isEndless && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-xs font-mono font-bold tracking-widest rounded-sm">
            <Infinity className="w-4 h-4" />
            ENDLESS
          </div>
        )}
        <div className="flex items-center gap-2 px-4 py-2 border border-foreground/50 bg-background">
          <Zap className="w-5 h-5" style={{ color: '#29ABE2' }} />
          <span className="text-industrial text-lg font-bold tracking-tight">
            WAVE {currentWave}{isEndless ? '' : `/${totalWaves}`}
          </span>
        </div>
      </div>

      {/* Right side - Lives */}
      <div className="flex items-center gap-2 px-4 py-2 border border-foreground/50 bg-background">
        <Heart
          className={`w-5 h-5 ${state.lives < state.maxLives ? 'animate-pulse' : ''}`}
          style={{ color: '#EF4444' }}
          fill="#EF4444"
        />
        <span className="text-industrial text-lg font-bold tracking-tight">
          {state.lives}/{state.maxLives}
        </span>
      </div>
    </div>
  );
}, (prev, next) => {
  return prev.state.score === next.state.score &&
         prev.state.wave === next.state.wave &&
         prev.state.lives === next.state.lives &&
         prev.state.maxLives === next.state.maxLives &&
         prev.state.isEndless === next.state.isEndless &&
         prev.levelConfig.id === next.levelConfig.id;
});

GameUI.displayName = 'GameUI';
