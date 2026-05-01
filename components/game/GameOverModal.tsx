'use client';

import { GameState } from '@/lib/game/types';
import { calculateStars, calculateBonus } from '@/lib/game/gameEngine';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Trophy, Coins, RotateCcw, Home, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GameOverModalProps {
  state: GameState;
  onRestart: () => void;
  onMenu: () => void;
  onNextLevel: () => void;
  onEndless: () => void;
  hasNextLevel: boolean;
}

export function GameOverModal({
  state,
  onRestart,
  onMenu,
  onNextLevel,
  onEndless,
  hasNextLevel,
}: GameOverModalProps) {
  const isVictory = state.victory;
  const isEndless = state.isEndless;
  const livesLost = state.maxLives - state.lives;
  const stars = isVictory && !isEndless ? calculateStars(livesLost) : 0;
  const bonus = isVictory && !isEndless ? calculateBonus(stars) : 0;
  const finalScore = state.score + bonus * 10;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 border border-border/50">
        <CardHeader className="text-center pb-2">
          <CardTitle
            className={cn(
              'text-3xl font-bold',
              isVictory ? 'text-[#22C55E]' : 'text-[#EF4444]'
            )}
          >
            {isEndless && !isVictory ? 'Endless Over!' : isVictory ? 'Victory!' : 'Defeat'}
          </CardTitle>
          <p className="text-muted-foreground">
            {isEndless && !isVictory
              ? `You survived ${state.wave} waves!`
              : isVictory
              ? `Level ${state.level} completed!`
              : 'Your base was destroyed'}
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {/* Stars (normal victory only) */}
          {isVictory && !isEndless && (
            <div className="flex items-center justify-center gap-2 py-4">
              {[1, 2, 3].map((i) => (
                <Star
                  key={i}
                  className={cn(
                    'w-12 h-12 transition-all',
                    i <= stars
                      ? 'text-[#F59E0B] fill-[#F59E0B] scale-110'
                      : 'text-muted-foreground/30'
                  )}
                />
              ))}
            </div>
          )}

          {/* Endless summary */}
          {isEndless && (
            <div className="flex flex-col items-center gap-1 py-4">
              <span className="text-sm text-muted-foreground font-mono tracking-widest">WAVES SURVIVED</span>
              <span className="text-5xl font-black text-purple-500">{state.wave}</span>
            </div>
          )}

          {/* Stats */}
          <div className="bg-muted rounded-lg p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Lives Remaining</span>
              <span className="font-mono font-bold">
                {state.lives}/{state.maxLives}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Waves Cleared</span>
              <span className="font-mono font-bold">{state.wave}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Gold Remaining</span>
              <span className="font-mono font-bold flex items-center gap-1">
                <Coins className="w-4 h-4 text-[#F59E0B]" />
                {state.gold}
              </span>
            </div>
            {isVictory && !isEndless && (
              <div className="flex items-center justify-between text-[#22C55E]">
                <span className="text-sm">→ Carries to next level</span>
                <span className="font-mono font-bold text-sm">+{state.gold}G</span>
              </div>
            )}
            {isVictory && (
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-muted-foreground">Bonus</span>
                <span className="font-mono font-bold text-[#22C55E] flex items-center gap-1">
                  +{bonus}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="font-medium">Final Score</span>
              <span className="font-mono font-bold text-lg flex items-center gap-1">
                <Trophy className="w-5 h-5 text-[#29ABE2]" />
                {finalScore.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Rating */}
          {isVictory && (
            <p className="text-center text-sm text-muted-foreground">
              {stars === 3
                ? 'Perfect! Not a single enemy got through!'
                : stars === 2
                ? 'Great job! Only a few enemies escaped.'
                : 'Level completed. Try again for more stars!'}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {isVictory && hasNextLevel && (
              <Button
                onClick={onNextLevel}
                className="bg-[#29ABE2] hover:bg-[#29ABE2]/90 text-white"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Next Level
              </Button>
            )}
            {isVictory && (
              <Button
                onClick={onEndless}
                className="bg-purple-600 hover:bg-purple-500 text-white"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Continue in Endless
              </Button>
            )}
            <div className="flex gap-2">
              <Button onClick={onRestart} variant="outline" className="flex-1">
                <RotateCcw className="w-4 h-4 mr-2" />
                Retry
              </Button>
              <Button onClick={onMenu} variant="outline" className="flex-1">
                <Home className="w-4 h-4 mr-2" />
                Menu
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
