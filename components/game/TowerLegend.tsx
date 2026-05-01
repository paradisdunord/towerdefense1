'use client';

import { TowerType, Tower, LevelConfig, EnemyType } from '@/lib/game/types';
import { TOWER_CONFIGS, getTowerStats, getUpgradeCost, getSellValue } from '@/lib/game/towers';
import { ENEMY_CONFIGS } from '@/lib/game/enemies';
import { Button } from '@/components/ui/button';
import { ArrowUp, Trash2 } from 'lucide-react';

interface TowerLegendProps {
  gold: number;
  unlockedTowers: TowerType[];
  selectedNewTower?: TowerType | null;
  onSelectNewTower?: (type: TowerType | null) => void;
  levelConfig?: LevelConfig | null;
}

const TOWER_ICONS: Record<TowerType, string> = {
  arrow: '↑',
  cannon: '●',
  ice: '❄',
  lightning: '⚡',
};

const ALL_TOWERS: TowerType[] = ['arrow', 'cannon', 'ice', 'lightning'];

export function TowerLegend({
  gold,
  unlockedTowers,
  selectedNewTower,
  onSelectNewTower,
  levelConfig,
}: TowerLegendProps) {
  const uniqueEnemies = Array.from(new Set(
    levelConfig?.waves.flatMap(w => w.enemies.map(e => e.type)) || []
  ));

  return (
    <div className="w-[200px] bg-background/50 backdrop-blur-sm border border-border flex flex-col h-[500px]">
      {/* Header */}
      <div className="p-3 border-b border-border/50">
        <h3 className="font-mono text-xs tracking-widest text-muted-foreground">TOWERS</h3>
      </div>

      {/* Lists Container */}
      <div className="flex-1 p-2 overflow-y-auto">
        <div className="mb-4">
          {ALL_TOWERS.map(type => {
            const config = TOWER_CONFIGS[type];
            const isUnlocked = unlockedTowers.includes(type);
            const stats = getTowerStats(type, 1);
            const isSelected = selectedNewTower === type;

            return (
              <div
                key={type}
                onClick={() => isUnlocked && onSelectNewTower?.(isSelected ? null : type)}
                className={`
                  flex items-center gap-3 p-2 mb-1 transition-all border cursor-pointer
                  ${isUnlocked ? 'hover:bg-muted/50' : 'border-transparent opacity-30 cursor-not-allowed'}
                  ${isSelected ? 'bg-muted/50 border-primary shadow-[0_0_10px_rgba(var(--primary),0.2)]' : 'border-transparent'}
                `}
              >
                {/* Icon */}
                <div
                  className="w-8 h-8 flex items-center justify-center text-sm border flex-shrink-0"
                  style={{
                    borderColor: isUnlocked ? config.color : 'transparent',
                    color: isUnlocked ? config.color : 'var(--color-muted-foreground)',
                    backgroundColor: isUnlocked ? 'transparent' : 'var(--color-muted)',
                  }}
                >
                  {isUnlocked ? TOWER_ICONS[type] : '?'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-sans font-medium truncate" style={{ color: isSelected ? 'var(--primary)' : 'inherit' }}>
                    {isUnlocked ? config.name.split(' ')[0].toUpperCase() : 'LOCKED'}
                  </div>
                  {isUnlocked && (
                    <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      {config.cost}G | {stats.damage}DMG
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Level Enemies */}
        {levelConfig && uniqueEnemies.length > 0 && (
          <>
            <div className="px-1 mb-2 pt-2 border-t border-border/50">
              <h3 className="font-mono text-[10px] tracking-widest text-muted-foreground">LEVEL THREATS</h3>
            </div>
            {uniqueEnemies.map(enemyType => {
              const config = ENEMY_CONFIGS[enemyType as EnemyType];
              const isBoss = enemyType === 'boss';
              return (
                <div key={enemyType} className="flex items-center gap-3 p-2 mb-1 border border-transparent">
                  <div 
                    className={`w-5 h-5 flex-shrink-0 ${isBoss ? 'border border-foreground' : 'rounded-full border border-foreground'}`}
                    style={{ backgroundColor: config.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-sans font-medium truncate">
                      {config.name.toUpperCase()}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      {config.hp} HP
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>




    </div>
  );
}
