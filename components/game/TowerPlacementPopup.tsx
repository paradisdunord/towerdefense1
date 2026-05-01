'use client';

import { TowerType, Tower } from '@/lib/game/types';
import { TOWER_CONFIGS, getTowerStats, getUpgradeCost, getSellValue } from '@/lib/game/towers';
import { CELL_SIZE, COLORS } from '@/lib/game/constants';
import { X, ArrowUp, Trash2 } from 'lucide-react';

interface TowerPlacementPopupProps {
  position: { x: number; y: number }; // pixel position on canvas
  canvasRect: DOMRect | null;
  gold: number;
  unlockedTowers: TowerType[];
  existingTower?: Tower | null;
  onSelectTower: (type: TowerType) => void;
  onUpgradeTower?: () => void;
  onSellTower?: () => void;
  onHoverTower?: (type: TowerType | null) => void;
  onClose: () => void;
}

const TOWER_ICONS: Record<TowerType, string> = {
  arrow: '↑',
  cannon: '●',
  ice: '❄',
  lightning: '⚡',
};

export function TowerPlacementPopup({
  position,
  canvasRect,
  gold,
  unlockedTowers,
  existingTower,
  onSelectTower,
  onUpgradeTower,
  onSellTower,
  onHoverTower,
  onClose,
}: TowerPlacementPopupProps) {
  if (!canvasRect) return null;

  // Calculate popup position relative to viewport
  const scaleX = canvasRect.width / 800;
  const scaleY = canvasRect.height / 500;
  
  const popupX = canvasRect.left + position.x * scaleX;
  const popupY = canvasRect.top + position.y * scaleY;

  // Adjust position to keep popup in view
  const adjustedX = Math.min(popupX, window.innerWidth - 200);
  const adjustedY = Math.min(popupY + 20, window.innerHeight - 280);

  const allTowers: TowerType[] = ['arrow', 'cannon', 'ice', 'lightning'];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Popup */}
      <div
        className="fixed z-50 bg-background/95 backdrop-blur-md border border-border shadow-xl p-4 min-w-[200px] animate-in fade-in zoom-in-95 duration-200"
        style={{
          left: adjustedX,
          top: adjustedY,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/50">
          <span className="font-mono text-xs text-muted-foreground tracking-widest">BUILD</span>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tower options or Upgrade options */}
        {existingTower ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-8 h-8 border flex items-center justify-center text-sm flex-shrink-0"
                style={{
                  borderColor: TOWER_CONFIGS[existingTower.type].color,
                  color: TOWER_CONFIGS[existingTower.type].color,
                }}
              >
                {TOWER_ICONS[existingTower.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-sans font-medium truncate">
                  {TOWER_CONFIGS[existingTower.type].name.toUpperCase()}
                </div>
                <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                  LEVEL {existingTower.level}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="text-[10px] font-mono text-muted-foreground mb-2 space-y-1">
              <div className="flex justify-between"><span>DMG</span><span>{getTowerStats(existingTower.type, existingTower.level).damage}</span></div>
              <div className="flex justify-between"><span>RNG</span><span>{getTowerStats(existingTower.type, existingTower.level).range}</span></div>
              <div className="flex justify-between"><span>SPD</span><span>{Math.round(getTowerStats(existingTower.type, existingTower.level).attackSpeed * 100) / 100}/s</span></div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-1.5">
              {existingTower.level < 3 && (
                <button
                  onClick={() => onUpgradeTower?.()}
                  disabled={gold < getUpgradeCost(existingTower.type, existingTower.level)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs border bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="flex items-center gap-1 font-mono">
                    <ArrowUp className="w-3 h-3" />
                    UPG
                  </span>
                  <span className="font-mono">{getUpgradeCost(existingTower.type, existingTower.level)}G</span>
                </button>
              )}
              <button
                onClick={() => onSellTower?.()}
                className="w-full flex items-center justify-between px-3 py-2 text-xs border border-destructive text-destructive hover:bg-destructive/10 transition-colors"
              >
                <span className="flex items-center gap-1 font-mono">
                  <Trash2 className="w-3 h-3" />
                  SELL (60%)
                </span>
                <span className="font-mono">{getSellValue(existingTower.type, existingTower.level)}G</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {allTowers.map(type => {
              const config = TOWER_CONFIGS[type];
              const stats = getTowerStats(type, 1);
              const isUnlocked = unlockedTowers.includes(type);
              const canAfford = gold >= config.cost;
              const canPlace = isUnlocked && canAfford;

              return (
                <button
                  key={type}
                  onClick={() => canPlace && onSelectTower(type)}
                  onMouseEnter={() => canPlace && onHoverTower?.(type)}
                  onMouseLeave={() => onHoverTower?.(null)}
                  disabled={!canPlace}
                  className={`
                    group flex items-center gap-3 p-2 transition-all text-left border
                    ${canPlace 
                      ? 'border-transparent hover:border-primary/50 hover:bg-primary/5 cursor-pointer' 
                      : 'border-transparent opacity-40 cursor-not-allowed'
                    }
                  `}
                >
                  {/* Tower icon */}
                  <div
                    className="w-10 h-10 border flex items-center justify-center text-lg transition-colors"
                    style={{
                      borderColor: isUnlocked ? (canPlace ? config.color : 'var(--color-border)') : 'transparent',
                      color: isUnlocked ? config.color : 'var(--color-muted-foreground)',
                      backgroundColor: isUnlocked ? 'transparent' : 'var(--color-muted)',
                    }}
                  >
                    {isUnlocked ? TOWER_ICONS[type] : '?'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-sans font-medium text-sm truncate group-hover:text-primary transition-colors">
                        {isUnlocked ? config.name : 'LOCKED'}
                      </span>
                      <span 
                        className={`font-mono text-xs ${canAfford ? 'text-foreground' : 'text-destructive'}`}
                      >
                        {config.cost}G
                      </span>
                    </div>
                    {isUnlocked && (
                      <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        DMG:{stats.damage} RNG:{stats.range}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
