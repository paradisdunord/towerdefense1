'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { LevelConfig, Position, TowerType } from '@/lib/game/types';
import { getLevelConfig, TOTAL_LEVELS } from '@/lib/game/levels';
import { CELL_SIZE } from '@/lib/game/constants';
import { useGameState } from '@/hooks/useGameState';
import { useGameLoop } from '@/hooks/useGameLoop';
import { useGameProgress } from '@/hooks/useGameProgress';
import { calculateStars } from '@/lib/game/gameEngine';
import { soundEngine } from '@/lib/game/sounds';
import { GameCanvas } from './GameCanvas';
import { GameUI } from './GameUI';
import { TowerLegend } from './TowerLegend';
import { TowerPlacementPopup } from './TowerPlacementPopup';
import { LevelSelect } from './LevelSelect';
import { GameOverModal } from './GameOverModal';
import { CustomMapBuilder } from './CustomMapBuilder';
import { GameControls } from './GameControls';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react';

export function TowerDefenseGame() {
  const [currentLevelId, setCurrentLevelId] = useState<number | null>(null);
  const [levelConfig, setLevelConfig] = useState<LevelConfig | null>(null);
  const [isBuildingMap, setIsBuildingMap] = useState(false);
  const [carryOverGold, setCarryOverGold] = useState(0);

  const {
    progress,
    isLoaded,
    completeLevel,
    isLevelUnlocked,
  } = useGameProgress();

  const selectLevel = useCallback((levelId: number) => {
    const config = getLevelConfig(levelId);
    if (config) {
      setCurrentLevelId(levelId);
      setLevelConfig(config);
    }
  }, []);

  const returnToMenu = useCallback(() => {
    setCurrentLevelId(null);
    setLevelConfig(null);
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#29ABE2] border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-industrial text-sm text-muted-foreground">LOADING...</p>
        </div>
      </div>
    );
  }


  if (isBuildingMap) {
    return (
      <CustomMapBuilder
        onBack={() => setIsBuildingMap(false)}
        onPlay={(config) => {
          setLevelConfig(config);
          setCurrentLevelId(999);
          setIsBuildingMap(false);
        }}
      />
    );
  }

  if (!currentLevelId || !levelConfig) {
    return (
      <LevelSelect
        progress={progress}
        isLevelUnlocked={isLevelUnlocked}
        onSelectLevel={selectLevel}
        onCreateCustomMap={() => setIsBuildingMap(true)}
      />
    );
  }

  return (
    <GameScreen
      key={`${levelConfig.id}-${carryOverGold}`}
      levelConfig={levelConfig}
      progress={progress}
      completeLevel={completeLevel}
      onReturnToMenu={returnToMenu}
      onNextLevel={(leftoverGold) => {
        const nextLevelId = currentLevelId + 1;
        if (nextLevelId <= TOTAL_LEVELS) {
          setCarryOverGold(leftoverGold);
          selectLevel(nextLevelId);
        }
      }}
      onRestartLevel={() => { setCarryOverGold(0); selectLevel(currentLevelId); }}
      hasNextLevel={currentLevelId < TOTAL_LEVELS}
      bonusGold={carryOverGold}
    />
  );
}

interface GameScreenProps {
  levelConfig: LevelConfig;
  progress: ReturnType<typeof useGameProgress>['progress'];
  completeLevel: (levelId: number, stars: number, score: number) => void;
  onReturnToMenu: () => void;
  onNextLevel: (leftoverGold: number) => void;
  onRestartLevel: () => void;
  hasNextLevel: boolean;
  bonusGold: number;
}

function GameScreen({
  levelConfig,
  progress,
  completeLevel,
  onReturnToMenu,
  onNextLevel,
  onRestartLevel,
  hasNextLevel,
  bonusGold,
}: GameScreenProps) {
  const {
    state,
    startWave,
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
    startEndlessMode,
  } = useGameState(levelConfig, bonusGold);

  const [showGameOver, setShowGameOver] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{ gx: number; gy: number } | null>(null);
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null);
  const [popupGridPos, setPopupGridPos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredPopupTower, setHoveredPopupTower] = useState<TowerType | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasRect, setCanvasRect] = useState<DOMRect | null>(null);
  const [autoNextWave, setAutoNextWave] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Track previous state for sound triggers
  const prevWaveRef = useRef(state.wave);
  const prevWaveInProgressRef = useRef(state.waveInProgress);
  const prevEnemyMapRef = useRef(new Map<string, string>()); // id -> type
  const prevLivesRef = useRef(state.lives);
  const prevTowerCountRef = useRef(state.towers.length);
  const prevProjectileIdsRef = useRef(new Set<string>());

  // Sound Engine Initialization (prevent browser blocking)
  useEffect(() => {
    const initAudio = () => {
      soundEngine.init();
      window.removeEventListener('click', initAudio);
      window.removeEventListener('touchstart', initAudio);
      window.removeEventListener('keydown', initAudio);
    };
    
    window.addEventListener('click', initAudio);
    window.addEventListener('touchstart', initAudio);
    window.addEventListener('keydown', initAudio);
    
    return () => {
      window.removeEventListener('click', initAudio);
      window.removeEventListener('touchstart', initAudio);
      window.removeEventListener('keydown', initAudio);
    };
  }, []);

  // Sound: wave start, wave complete, enemy killed/escaped, tower shooting
  useEffect(() => {
    // Wave started
    if (state.wave > prevWaveRef.current && state.waveInProgress) {
      soundEngine.waveStart();
    }
    prevWaveRef.current = state.wave;

    // Wave completed
    if (prevWaveInProgressRef.current && !state.waveInProgress && !state.gameOver && !state.victory) {
      soundEngine.waveComplete();
    }
    prevWaveInProgressRef.current = state.waveInProgress;

    // Build current enemy map
    const currentEnemyMap = new Map<string, string>();
    for (const e of state.enemies) {
      currentEnemyMap.set(e.id, e.type);
    }

    // Find enemies that disappeared
    const livesLost = state.lives < prevLivesRef.current;
    for (const [id, type] of prevEnemyMapRef.current) {
      if (!currentEnemyMap.has(id)) {
        if (livesLost) {
          // Enemy escaped — nasty screech
          soundEngine.enemyEscape();
          break; // One screech per frame is enough
        } else {
          // Enemy killed — play type-specific death sound
          soundEngine.enemyKill(type as import('@/lib/game/types').EnemyType);
          break; // One kill sound per frame to avoid cacophony
        }
      }
    }
    prevEnemyMapRef.current = currentEnemyMap;
    prevLivesRef.current = state.lives;

    // Detect new projectiles → play tower shooting sound
    const currentProjectileIds = new Set<string>();
    for (const p of state.projectiles) {
      currentProjectileIds.add(p.id);
      if (!prevProjectileIdsRef.current.has(p.id)) {
        // New projectile — play the shooting sound for its tower type
        soundEngine.towerShoot(p.type);
      }
    }
    prevProjectileIdsRef.current = currentProjectileIds;

    // Tower placed
    if (state.towers.length > prevTowerCountRef.current) {
      soundEngine.towerPlace();
    }
    prevTowerCountRef.current = state.towers.length;
  });

  // Sound: victory / game over (one-shot)
  useEffect(() => {
    if (state.victory) soundEngine.victory();
    if (state.gameOver) soundEngine.gameOver();
  }, [state.victory, state.gameOver]);

  const closePopup = useCallback(() => {
    setPopupPos(null);
    setPopupGridPos(null);
    setHoveredPopupTower(null);
    selectPlacedTower(null);
  }, [selectPlacedTower]);

  // Auto-start next wave
  useEffect(() => {
    const totalWaves = levelConfig.waves.length;
    const canStartNext = state.isEndless || state.wave < totalWaves;
    if (autoNextWave && !state.waveInProgress && !state.gameOver && !state.victory && canStartNext) {
      const timeout = setTimeout(() => {
        startWave();
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [autoNextWave, state.waveInProgress, state.gameOver, state.victory, state.wave, levelConfig.waves.length, state.isEndless, startWave]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showGameOver || popupPos) {
        if (e.key === 'Escape') {
          closePopup();
          selectTower(null);
        }
        return; // Don't trigger other shortcuts if a modal is open
      }
      
      switch (e.key.toLowerCase()) {
        case ' ': // Space
          e.preventDefault();
          if (state.waveInProgress && state.isPlaying && !state.gameOver && !state.victory) {
            state.isPaused ? resume() : pause();
            soundEngine.pauseToggle();
          } else if (!state.waveInProgress && !state.gameOver && !state.victory && (state.isEndless || state.wave < levelConfig.waves.length)) {
            startWave();
          }
          break;
        case 'f': // Fast forward
          setSpeed(state.gameSpeed === 1 ? 2 : 1);
          soundEngine.speedToggle();
          break;
        case 'm': // Mute toggle
          setIsMuted(soundEngine.toggleMute());
          break;
        case 'a': // Auto wave
          setAutoNextWave((prev) => !prev);
          soundEngine.uiClick();
          break;
        case 'escape': // Cancel selection/popup
          closePopup();
          selectTower(null);
          break;
        case '1':
          if (progress.unlockedTowers.includes('arrow')) selectTower('arrow');
          break;
        case '2':
          if (progress.unlockedTowers.includes('cannon')) selectTower('cannon');
          break;
        case '3':
          if (progress.unlockedTowers.includes('ice')) selectTower('ice');
          break;
        case '4':
          if (progress.unlockedTowers.includes('lightning')) selectTower('lightning');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, progress.unlockedTowers, startWave, pause, resume, setSpeed, closePopup, selectTower, showGameOver, popupPos, levelConfig.waves.length]);

  // Update canvas rect on resize
  useEffect(() => {
    const updateRect = () => {
      const canvas = canvasContainerRef.current?.querySelector('canvas');
      if (canvas) {
        setCanvasRect(canvas.getBoundingClientRect());
      }
    };
    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, []);

  // Game loop
  useGameLoop(
    () => tick(16.67),
    state.isPlaying && !state.isPaused,
    state.gameSpeed
  );

  // Handle victory/defeat
  useEffect(() => {
    if (state.victory || state.gameOver) {
      const timeout = setTimeout(() => {
        setShowGameOver(true);
        if (state.victory) {
          const livesLost = state.maxLives - state.lives;
          const stars = calculateStars(livesLost);
          completeLevel(levelConfig.id, stars, state.score);
        }
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [state.victory, state.gameOver, state.lives, state.maxLives, state.score, levelConfig.id, completeLevel]);

  const handleRestart = useCallback(() => {
    setShowGameOver(false);
    setPopupPos(null);
    setPopupGridPos(null);
    resetLevel(levelConfig);
  }, [resetLevel, levelConfig]);

  // Check if a cell is buildable
  const isBuildable = useCallback((gx: number, gy: number) => {
    const pixelX = gx * CELL_SIZE;
    const pixelY = gy * CELL_SIZE;
    return levelConfig.buildableAreas.some(
      area =>
        pixelX >= area.x &&
        pixelX < area.x + area.width &&
        pixelY >= area.y &&
        pixelY < area.y + area.height
    );
  }, [levelConfig.buildableAreas]);

  // Check if cell has a tower
  const hasTower = useCallback((gx: number, gy: number) => {
    const centerX = gx * CELL_SIZE + CELL_SIZE / 2;
    const centerY = gy * CELL_SIZE + CELL_SIZE / 2;
    return state.towers.find(
      t => Math.abs(t.position.x - centerX) < CELL_SIZE / 2 && 
           Math.abs(t.position.y - centerY) < CELL_SIZE / 2
    );
  }, [state.towers]);

  // Handle cell click
  const handleCellClick = useCallback((gx: number, gy: number, pixelPos: Position) => {
    // Close popup if clicking elsewhere
    if (popupPos) {
      setPopupPos(null);
      setPopupGridPos(null);
      return;
    }

    // Check if clicking on existing tower
    const existingTower = hasTower(gx, gy);
    if (existingTower) {
      selectPlacedTower(existingTower.id);
      setPopupPos(pixelPos);
      setPopupGridPos({ x: gx, y: gy });
      return;
    }

    // Check if buildable
    if (isBuildable(gx, gy)) {
      if (state.selectedTower) {
        // Direct place tower from sidebar
        placeTower(pixelPos);
        selectTower(null);
        soundEngine.towerPlace();
      } else {
        // Open tower placement popup
        setPopupPos(pixelPos);
        setPopupGridPos({ x: gx, y: gy });
        selectPlacedTower(null);
      }
    } else {
      selectPlacedTower(null);
      selectTower(null);
    }
  }, [popupPos, hasTower, isBuildable, selectPlacedTower, state.selectedTower, placeTower, selectTower]);

  // Handle tower selection from popup
  const handleSelectTower = useCallback((type: TowerType) => {
    if (popupPos) {
      selectTower(type);
      placeTower(popupPos);
      setPopupPos(null);
      setPopupGridPos(null);
    }
  }, [popupPos, placeTower, selectTower]);

  // Get selected tower object
  const selectedTower = state.selectedPlacedTower
    ? state.towers.find(t => t.id === state.selectedPlacedTower) || null
    : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      {/* Large Scale Top Banner */}
      <header className="border-b-4 border-foreground bg-muted/10 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => { soundEngine.uiClick(); onReturnToMenu(); }} 
            className="gap-2 text-industrial text-xs h-12 border border-transparent hover:border-foreground/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            MENU
          </Button>
          <div>
            <div className="text-sm font-mono tracking-widest text-muted-foreground mb-1">LEVEL {levelConfig.id}</div>
            <div className="text-4xl font-black tracking-tight leading-none">{levelConfig.name.toUpperCase()}</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-mono tracking-widest text-muted-foreground mb-1">RESOURCES</div>
            <div className="text-4xl font-black tracking-tight leading-none text-[#FF5F1F]">{state.gold} G</div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMuted(soundEngine.toggleMute())}
            className="h-10 w-10 border border-transparent hover:border-foreground/50"
            title="Toggle sound (M)"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      {/* Main game area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        {/* Game UI bar */}
        <div className="w-full max-w-[1020px]">
          <GameUI
            state={state}
            levelConfig={levelConfig}
          />
        </div>

        {/* Game area with legend */}
        <div className="flex gap-4 items-start">
          {/* Tower Legend */}
          <TowerLegend
            gold={state.gold}
            unlockedTowers={progress.unlockedTowers}
            selectedNewTower={state.selectedTower}
            onSelectNewTower={selectTower}
            levelConfig={levelConfig}
          />

          {/* Game Canvas */}
          <div ref={canvasContainerRef} className="relative">
            <GameCanvas
              state={state}
              levelConfig={levelConfig}
              onCellClick={handleCellClick}
              hoveredCell={hoveredCell}
              setHoveredCell={setHoveredCell}
              onSetCanvasRect={setCanvasRect}
              hoveredPopupTower={hoveredPopupTower}
              popupGridPos={popupGridPos}
            />
          </div>
        </div>

        {/* Game Controls at bottom */}
        <div className="w-full max-w-[1020px]">
          <GameControls
            state={state}
            levelConfig={levelConfig}
            onPause={pause}
            onResume={resume}
            onSetSpeed={setSpeed}
            onStartWave={startWave}
            autoNextWave={autoNextWave}
            setAutoNextWave={setAutoNextWave}
          />
        </div>

        {/* How to Play Section */}
        <div className="w-full max-w-[1020px] mt-8 bg-muted/10 border border-border/50 p-6 rounded-xl">
          <h2 className="text-xl font-black mb-4 uppercase tracking-wider text-foreground">HOW TO PLAY</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-muted-foreground">
            <div>
              <h3 className="font-bold text-foreground mb-2 tracking-wide">OBJECTIVE</h3>
              <p className="mb-2">Defend your base from incoming enemies. If too many enemies slip past your defenses, you lose lives. Survive all waves to win!</p>
              <p>Build towers by clicking on the highlighted buildable cells. You can click on existing towers to upgrade their power or sell them for gold.</p>
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-3 tracking-wide">KEYBOARD SHORTCUTS</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-3"><kbd className="bg-background text-foreground px-2 py-1 rounded border border-border/50 font-mono text-xs w-16 text-center shadow-sm">SPACE</kbd> <span>Start Wave / Pause / Resume</span></li>
                <li className="flex items-center gap-3"><kbd className="bg-background text-foreground px-2 py-1 rounded border border-border/50 font-mono text-xs w-16 text-center shadow-sm">F</kbd> <span>Toggle Fast-Forward</span></li>
                <li className="flex items-center gap-3"><kbd className="bg-background text-foreground px-2 py-1 rounded border border-border/50 font-mono text-xs w-16 text-center shadow-sm">A</kbd> <span>Toggle Auto Next Wave</span></li>
                <li className="flex items-center gap-3"><kbd className="bg-background text-foreground px-2 py-1 rounded border border-border/50 font-mono text-xs w-16 text-center shadow-sm">M</kbd> <span>Toggle Sound</span></li>
                <li className="flex items-center gap-3"><kbd className="bg-background text-foreground px-2 py-1 rounded border border-border/50 font-mono text-xs w-16 text-center shadow-sm">ESC</kbd> <span>Close Popup / Deselect Tower</span></li>
                <li className="flex items-center gap-3"><kbd className="bg-background text-foreground px-2 py-1 rounded border border-border/50 font-mono text-xs w-16 text-center shadow-sm">1-4</kbd> <span>Quick-select Towers</span></li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Tower Placement / Upgrade Popup */}
      {popupPos && (
        <TowerPlacementPopup
          position={popupPos}
          canvasRect={canvasRect}
          gold={state.gold}
          unlockedTowers={progress.unlockedTowers}
          existingTower={selectedTower}
          onSelectTower={handleSelectTower}
          onUpgradeTower={() => {
            if (selectedTower) {
              upgradeTower(selectedTower.id);
              soundEngine.towerUpgrade();
            }
            closePopup();
          }}
          onSellTower={() => {
            if (selectedTower) {
              sellTower(selectedTower.id);
              soundEngine.towerSell();
            }
            closePopup();
          }}
          onHoverTower={setHoveredPopupTower}
          onClose={closePopup}
        />
      )}

      {/* Game Over Modal */}
      {showGameOver && (
        <GameOverModal
          state={state}
          onRestart={handleRestart}
          onMenu={onReturnToMenu}
          onNextLevel={() => {
            setShowGameOver(false);
            onNextLevel(state.gold);
          }}
          onEndless={() => {
            setShowGameOver(false);
            startEndlessMode();
          }}
          hasNextLevel={hasNextLevel}
        />
      )}
    </div>
  );
}
