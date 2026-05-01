'use client';

import { GameProgress } from '@/lib/game/types';
import { LEVELS, TOTAL_LEVELS } from '@/lib/game/levels';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Lock, Trophy, Coins, Map } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LevelSelectProps {
  progress: GameProgress;
  isLevelUnlocked: (levelId: number) => boolean;
  onSelectLevel: (levelId: number) => void;
  onCreateCustomMap: () => void;
}

export function LevelSelect({ progress, isLevelUnlocked, onSelectLevel, onCreateCustomMap }: LevelSelectProps) {
  const maxStars = TOTAL_LEVELS * 3;
  const nextUnlockedLevel = LEVELS.find(
    (l) => isLevelUnlocked(l.id) && !progress.levels[l.id]?.completed
  )?.id ?? 1;

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-3xl flex flex-col items-center gap-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-2">Tower Defense</h1>
          <p className="text-muted-foreground">Select a level to begin</p>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-8 bg-background border border-border/50 rounded-xl px-6 py-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-[#29ABE2]" />
            <span className="font-mono text-lg font-bold">
              {progress.totalStars}/{maxStars}
            </span>
            <span className="text-sm text-muted-foreground">Stars</span>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex items-center gap-2">
            <Coins className="w-6 h-6 text-[#F59E0B]" />
            <span className="font-mono text-lg font-bold">{progress.totalGold}</span>
            <span className="text-sm text-muted-foreground">Total Gold</span>
          </div>
        </div>

        {/* Level Grid */}
        <div className="grid grid-cols-5 gap-4 w-full">
          {LEVELS.map((level) => {
            const isUnlocked = isLevelUnlocked(level.id);
            const levelProgress = progress.levels[level.id];
            const stars = levelProgress?.stars ?? 0;

            return (
              <Card
                key={level.id}
                className={cn(
                  'relative transition-all cursor-pointer hover:scale-105',
                  isUnlocked
                    ? 'border-border hover:border-[#29ABE2]'
                    : 'border-border opacity-60 cursor-not-allowed'
                )}
                onClick={() => isUnlocked && onSelectLevel(level.id)}
              >
                <CardContent className="p-4 flex flex-col items-center gap-2">
                  {isUnlocked ? (
                    <>
                      <div className="w-12 h-12 rounded-full bg-[#29ABE2]/10 border border-[#29ABE2]/50 flex items-center justify-center">
                        <span className="text-xl font-bold text-[#29ABE2]">{level.id}</span>
                      </div>
                      <span className="text-xs font-medium text-center truncate w-full">
                        {level.name}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3].map((i) => (
                          <Star
                            key={i}
                            className={cn(
                              'w-4 h-4',
                              i <= stars
                                ? 'text-[#F59E0B] fill-[#F59E0B]'
                                : 'text-muted-foreground/30'
                            )}
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-muted border border-border/50 flex items-center justify-center">
                        <Lock className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">Locked</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3].map((i) => (
                          <Star key={i} className="w-4 h-4 text-muted-foreground/20" />
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Continue & Custom Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={() => onSelectLevel(nextUnlockedLevel)}
            size="lg"
            className="bg-[#29ABE2] hover:bg-[#29ABE2]/90 text-white font-semibold px-8 border border-foreground/50"
          >
            Continue Level {nextUnlockedLevel}
          </Button>
          <Button
            onClick={onCreateCustomMap}
            size="lg"
            variant="outline"
            className="border border-foreground/50 bg-background text-foreground font-semibold px-8"
          >
            <Map className="w-5 h-5 mr-2" />
            Create Custom Map
          </Button>
        </div>

        {/* Milestone Progress */}
        <div className="w-full bg-background border border-border/50 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Milestones</h3>
          <div className="flex items-center justify-between gap-4">
            <MilestoneItem
              stars={15}
              currentStars={progress.totalStars}
              reward="+50 Starting Gold"
            />
            <MilestoneItem
              stars={25}
              currentStars={progress.totalStars}
              reward="25% Upgrade Discount"
            />
            <MilestoneItem
              stars={30}
              currentStars={progress.totalStars}
              reward="Endless Mode"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface MilestoneItemProps {
  stars: number;
  currentStars: number;
  reward: string;
}

function MilestoneItem({ stars, currentStars, reward }: MilestoneItemProps) {
  const isUnlocked = currentStars >= stars;
  const progress = Math.min(100, (currentStars / stars) * 100);

  return (
    <div className="flex-1 flex flex-col items-center gap-2">
      <div className="flex items-center gap-1">
        <Star className={cn('w-4 h-4', isUnlocked ? 'text-[#F59E0B] fill-[#F59E0B]' : 'text-muted-foreground')} />
        <span className={cn('font-mono text-sm font-bold', isUnlocked ? 'text-foreground' : 'text-muted-foreground')}>
          {stars}
        </span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full transition-all', isUnlocked ? 'bg-[#22C55E]' : 'bg-[#29ABE2]')}
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className={cn('text-xs text-center', isUnlocked ? 'text-[#22C55E] font-medium' : 'text-muted-foreground')}>
        {reward}
      </span>
    </div>
  );
}
