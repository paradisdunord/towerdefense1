'use client';

import { GameState, Tower, TowerType } from '@/lib/game/types';
import { TOWER_CONFIGS, getTowerStats, getUpgradeCost, getSellValue } from '@/lib/game/towers';
import { Button } from '@/components/ui/button';
import { Coins, ArrowUp, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { memo } from 'react';

interface TowerPanelProps {
  state: GameState;
  unlockedTowers: TowerType[];
  onSelectTower: (type: TowerType | null) => void;
  onUpgradeTower: (towerId: string) => void;
  onSellTower: (towerId: string) => void;
}

const TOWER_ICONS: Record<TowerType, string> = {
  arrow: '↑',
  cannon: '●',
  ice: '❄',
  lightning: '⚡',
};

export const TowerPanel = memo(function TowerPanel({
  state,
  unlockedTowers,
  onSelectTower,
  onUpgradeTower,
  onSellTower,
}: TowerPanelProps) {
  const selectedPlacedTower = state.selectedPlacedTower
    ? state.towers.find((t) => t.id === state.selectedPlacedTower)
    : null;

  return (
    <div className="w-full max-w-[800px] bg-background border border-border/50 rounded-lg p-3">
      {selectedPlacedTower ? (
        <TowerDetails
          tower={selectedPlacedTower}
          gold={state.gold}
          onUpgrade={() => onUpgradeTower(selectedPlacedTower.id)}
          onSell={() => onSellTower(selectedPlacedTower.id)}
          onDeselect={() => onSelectTower(null)}
        />
      ) : (
        <TowerSelector
          gold={state.gold}
          selectedTower={state.selectedTower}
          unlockedTowers={unlockedTowers}
          onSelectTower={onSelectTower}
        />
      )}
    </div>
  );
}, (prev, next) => {
  // Only re-render if gold, selection, or selected tower level changes
  if (prev.state.gold !== next.state.gold) return false;
  if (prev.state.selectedTower !== next.state.selectedTower) return false;
  if (prev.state.selectedPlacedTower !== next.state.selectedPlacedTower) return false;
  if (prev.unlockedTowers.length !== next.unlockedTowers.length) return false;
  
  if (prev.state.selectedPlacedTower) {
    const prevTower = prev.state.towers.find(t => t.id === prev.state.selectedPlacedTower);
    const nextTower = next.state.towers.find(t => t.id === next.state.selectedPlacedTower);
    if (prevTower?.level !== nextTower?.level) return false;
  }
  
  return true;
});

TowerPanel.displayName = 'TowerPanel';

interface TowerSelectorProps {
  gold: number;
  selectedTower: TowerType | null;
  unlockedTowers: TowerType[];
  onSelectTower: (type: TowerType | null) => void;
}

function TowerSelector({ gold, selectedTower, unlockedTowers, onSelectTower }: TowerSelectorProps) {
  const allTowers: TowerType[] = ['arrow', 'cannon', 'ice', 'lightning'];

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-muted-foreground mr-2">Towers:</span>
      {allTowers.map((type) => {
        const config = TOWER_CONFIGS[type];
        const isUnlocked = unlockedTowers.includes(type);
        const canAfford = gold >= config.cost;
        const isSelected = selectedTower === type;

        return (
          <button
            key={type}
            onClick={() => onSelectTower(isSelected ? null : type)}
            disabled={!isUnlocked}
            className={cn(
              'flex flex-col items-center gap-1 p-2 rounded-lg border transition-all min-w-[80px]',
              isSelected
                ? 'border-[#29ABE2] bg-[#29ABE2]/10'
                : 'border-border hover:border-[#29ABE2]/50',
              !isUnlocked && 'opacity-50 cursor-not-allowed',
              !canAfford && isUnlocked && 'opacity-70'
            )}
          >
            <div
              className="w-10 h-10 rounded-full border flex items-center justify-center text-lg"
              style={{
                borderColor: isUnlocked ? config.color : '#9CA3AF',
                backgroundColor: isUnlocked ? '#FFFFFF' : '#F3F4F6',
                color: isUnlocked ? config.color : '#9CA3AF',
              }}
            >
              {isUnlocked ? TOWER_ICONS[type] : '🔒'}
            </div>
            <span className="text-xs font-medium">{config.name.split(' ')[0]}</span>
            <div className="flex items-center gap-1 text-xs">
              <Coins className="w-3 h-3 text-[#F59E0B]" />
              <span className={cn(canAfford ? 'text-foreground' : 'text-[#EF4444]')}>
                {config.cost}
              </span>
            </div>
          </button>
        );
      })}

      <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
        <span>Click on the map to place</span>
      </div>
    </div>
  );
}

interface TowerDetailsProps {
  tower: Tower;
  gold: number;
  onUpgrade: () => void;
  onSell: () => void;
  onDeselect: () => void;
}

function TowerDetails({ tower, gold, onUpgrade, onSell, onDeselect }: TowerDetailsProps) {
  const config = TOWER_CONFIGS[tower.type];
  const stats = getTowerStats(tower.type, tower.level);
  const upgradeCost = getUpgradeCost(tower.type, tower.level);
  const sellValue = getSellValue(tower.type, tower.level);
  const canUpgrade = tower.level < 3 && gold >= upgradeCost;

  return (
    <div className="flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-full border-3 flex items-center justify-center text-xl"
        style={{ borderColor: config.color, color: config.color }}
      >
        {TOWER_ICONS[tower.type]}
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{config.name}</span>
          <span className="text-xs bg-[#29ABE2] text-white px-1.5 py-0.5 rounded">
            Lv.{tower.level}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Damage: {stats.damage}</span>
          <span>Range: {stats.range}</span>
          <span>Speed: {Math.round(stats.attackSpeed * 100) / 100}/s</span>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {tower.level < 3 && (
          <Button
            onClick={onUpgrade}
            disabled={!canUpgrade}
            variant="outline"
            size="sm"
            className="gap-1"
          >
            <ArrowUp className="w-4 h-4" />
            Upgrade
            <span className="flex items-center gap-0.5 ml-1">
              <Coins className="w-3 h-3 text-[#F59E0B]" />
              {upgradeCost}
            </span>
          </Button>
        )}
        <Button onClick={onSell} variant="outline" size="sm" className="gap-1 text-[#EF4444] border-[#EF4444]/30 hover:bg-[#EF4444]/10">
          <Trash2 className="w-4 h-4" />
          Sell
          <span className="flex items-center gap-0.5 ml-1">
            <Coins className="w-3 h-3 text-[#F59E0B]" />
            {sellValue}
          </span>
        </Button>
        <Button onClick={onDeselect} variant="ghost" size="sm">
          Cancel
        </Button>
      </div>
    </div>
  );
}
