import { GameState, LevelConfig } from '@/lib/game/types';
import { Button } from '@/components/ui/button';
import { Play, Pause, FastForward, RefreshCw } from 'lucide-react';
import { soundEngine } from '@/lib/game/sounds';
import { memo } from 'react';

interface GameControlsProps {
  state: GameState;
  levelConfig: LevelConfig;
  onPause: () => void;
  onResume: () => void;
  onSetSpeed: (speed: 1 | 2) => void;
  onStartWave: () => void;
  autoNextWave: boolean;
  setAutoNextWave: (auto: boolean) => void;
}

export const GameControls = memo(function GameControls({
  state,
  levelConfig,
  onPause,
  onResume,
  onSetSpeed,
  onStartWave,
  autoNextWave,
  setAutoNextWave,
}: GameControlsProps) {
  const totalWaves = levelConfig.waves.length;

  return (
    <div className="flex items-center gap-3 bg-muted/20 p-2 rounded-xl border border-border/50 mt-4 w-full justify-center">
      {/* Start wave button */}
      {!state.waveInProgress && !state.gameOver && !state.victory && (state.isEndless || state.wave < totalWaves) && (
        <Button
          onClick={() => { soundEngine.uiClick(); onStartWave(); }}
          className="bg-[#29ABE2] text-white hover:bg-[#29ABE2]/90 border border-foreground/50 text-industrial text-sm font-bold px-6 h-12"
        >
          <Play className="w-5 h-5 mr-2" />
          START WAVE {state.wave + 1}
        </Button>
      )}

      {/* Wave in progress indicator */}
      {state.waveInProgress && (
        <span className="text-industrial text-sm font-bold text-[#29ABE2] animate-pulse px-4">
          WAVE IN PROGRESS...
        </span>
      )}

      <div className="h-8 w-px bg-border mx-2" />

      {/* Pause/Resume */}
      {state.isPlaying && !state.gameOver && !state.victory && (
        <Button
          onClick={() => { soundEngine.pauseToggle(); state.isPaused ? onResume() : onPause(); }}
          variant="outline"
          size="icon"
          className="border border-foreground/50 h-12 w-12"
        >
          {state.isPaused ? (
            <Play className="w-6 h-6" />
          ) : (
            <Pause className="w-6 h-6" />
          )}
        </Button>
      )}

      {/* Speed control */}
      <Button
        onClick={() => { soundEngine.speedToggle(); onSetSpeed(state.gameSpeed === 1 ? 2 : 1); }}
        variant="outline"
        size="icon"
        className={`border border-foreground/50 h-12 w-12 ${state.gameSpeed === 2 ? 'bg-[#29ABE2] text-white border-[#29ABE2]' : ''}`}
      >
        <FastForward className="w-6 h-6" />
      </Button>

      {/* Auto Next Wave */}
      <Button
        onClick={() => { soundEngine.uiClick(); setAutoNextWave(!autoNextWave); }}
        variant="outline"
        size="icon"
        title="Auto-start next wave"
        className={`border border-foreground/50 h-12 w-12 ${autoNextWave ? 'bg-primary text-primary-foreground border-primary' : ''}`}
      >
        <RefreshCw className={`w-6 h-6 ${autoNextWave ? 'animate-[spin_3s_linear_infinite]' : ''}`} />
      </Button>
    </div>
  );
}, (prev, next) => {
  return prev.state.waveInProgress === next.state.waveInProgress &&
         prev.state.gameOver === next.state.gameOver &&
         prev.state.victory === next.state.victory &&
         prev.state.isEndless === next.state.isEndless &&
         prev.state.wave === next.state.wave &&
         prev.state.isPlaying === next.state.isPlaying &&
         prev.state.isPaused === next.state.isPaused &&
         prev.state.gameSpeed === next.state.gameSpeed &&
         prev.autoNextWave === next.autoNextWave &&
         prev.levelConfig.id === next.levelConfig.id;
});

GameControls.displayName = 'GameControls';
