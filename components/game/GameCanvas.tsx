'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { GameState, LevelConfig, Position, TowerType } from '@/lib/game/types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, CELL_SIZE, COLORS, HOVER_PERSIST_DISTANCE, CANNON_AOE_RADIUS, ICE_AOE_RADIUS } from '@/lib/game/constants';
import { TOWER_CONFIGS, getTowerStats } from '@/lib/game/towers';
import { ENEMY_CONFIGS } from '@/lib/game/enemies';

interface GameCanvasProps {
  state: GameState;
  levelConfig: LevelConfig;
  onCellClick: (gridX: number, gridY: number, pixelPos: Position) => void;
  hoveredCell: { gx: number; gy: number } | null;
  setHoveredCell: (cell: { gx: number; gy: number } | null) => void;
  onSetCanvasRect?: (rect: DOMRect) => void;
  hoveredPopupTower?: TowerType | null;
  popupGridPos?: { x: number; y: number } | null;
}

export function GameCanvas({
  state,
  levelConfig,
  onCellClick,
  hoveredCell,
  setHoveredCell,
  onSetCanvasRect,
  hoveredPopupTower,
  popupGridPos,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<Position | null>(null);
  const lastHoveredCellRef = useRef<{ gx: number; gy: number } | null>(null);
  const hoverPersistRef = useRef<boolean>(false);
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);

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
    return state.towers.some(
      t => Math.abs(t.position.x - centerX) < CELL_SIZE / 2 && 
           Math.abs(t.position.y - centerY) < CELL_SIZE / 2
    );
  }, [state.towers]);

  // Update static background cache when level or tower count changes
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!bgCanvasRef.current) {
      bgCanvasRef.current = document.createElement('canvas');
      bgCanvasRef.current.width = CANVAS_WIDTH;
      bgCanvasRef.current.height = CANVAS_HEIGHT;
    }
    const bgCtx = bgCanvasRef.current.getContext('2d', { alpha: false });
    if (!bgCtx) return;

    // Clear with background
    bgCtx.fillStyle = COLORS.background;
    bgCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Grid
    const cols = Math.ceil(CANVAS_WIDTH / CELL_SIZE);
    const rows = Math.ceil(CANVAS_HEIGHT / CELL_SIZE);

    for (let gx = 0; gx < cols; gx++) {
      for (let gy = 0; gy < rows; gy++) {
        const x = gx * CELL_SIZE;
        const y = gy * CELL_SIZE;
        
        const buildable = isBuildable(gx, gy);
        const hasTowerHere = hasTower(gx, gy);

        if (buildable && !hasTowerHere) {
          bgCtx.fillStyle = COLORS.buildable;
          bgCtx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        } else {
          bgCtx.fillStyle = COLORS.nonBuildable;
          bgCtx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        }

        // Grid lines
        bgCtx.strokeStyle = COLORS.gridLine;
        bgCtx.lineWidth = 1;
        bgCtx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
      }
    }

    // Draw Path
    const path = levelConfig.path;
    if (path.length >= 2) {
      bgCtx.strokeStyle = COLORS.path;
      bgCtx.lineWidth = CELL_SIZE - 4;
      bgCtx.lineCap = 'square';
      bgCtx.lineJoin = 'miter';
      bgCtx.beginPath();
      bgCtx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) bgCtx.lineTo(path[i].x, path[i].y);
      bgCtx.stroke();

      bgCtx.strokeStyle = COLORS.pathBorder;
      bgCtx.lineWidth = CELL_SIZE - 2;
      bgCtx.lineCap = 'square';
      bgCtx.lineJoin = 'miter';
      bgCtx.beginPath();
      bgCtx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) bgCtx.lineTo(path[i].x, path[i].y);
      bgCtx.stroke();

      bgCtx.strokeStyle = COLORS.path;
      bgCtx.lineWidth = CELL_SIZE - 6;
      bgCtx.beginPath();
      bgCtx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) bgCtx.lineTo(path[i].x, path[i].y);
      bgCtx.stroke();

      bgCtx.fillStyle = COLORS.primary;
      bgCtx.font = 'bold 12px "Geist Mono", monospace';
      bgCtx.textAlign = 'center';
      bgCtx.textBaseline = 'middle';
      bgCtx.fillText('START', path[0].x, path[0].y - 25);
      bgCtx.fillText('END', path[path.length - 1].x, path[path.length - 1].y - 25);
    }
  }, [levelConfig, state.towers.length, isBuildable, hasTower]);

  // Draw dynamic hover effect
  const drawHover = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!hoveredCell) return;
    const { gx, gy } = hoveredCell;
    const x = gx * CELL_SIZE;
    const y = gy * CELL_SIZE;
    
    if (isBuildable(gx, gy) && !hasTower(gx, gy)) {
      ctx.fillStyle = COLORS.buildableHover;
      ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
      
      ctx.shadowColor = COLORS.primary;
      ctx.shadowBlur = 15;
      ctx.fillStyle = COLORS.hoverGlow;
      ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);
      ctx.shadowBlur = 0;
    }
  }, [hoveredCell, isBuildable, hasTower]);

  // Draw towers with industrial style
  const drawTowers = useCallback((ctx: CanvasRenderingContext2D) => {
    for (const tower of state.towers) {
      const config = TOWER_CONFIGS[tower.type];
      const stats = getTowerStats(tower.type, tower.level);
      const isSelected = state.selectedPlacedTower === tower.id;

      // Draw range circle if selected
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(tower.position.x, tower.position.y, stats.range, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(41, 171, 226, 0.1)';
        ctx.fill();
        ctx.strokeStyle = COLORS.primary;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Tower base - square industrial style
      const size = CELL_SIZE - 8;
      const x = tower.position.x - size / 2;
      const y = tower.position.y - size / 2;

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(x + 2, y + 2, size, size);

      // Base
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(x, y, size, size);

      // Border
      ctx.strokeStyle = config.color;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, size, size);

      // Inner icon
      ctx.fillStyle = config.color;
      ctx.font = 'bold 16px "Geist", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const icons: Record<TowerType, string> = {
        arrow: '↑',
        cannon: '●',
        ice: '❄',
        lightning: '⚡',
      };

      ctx.fillText(icons[tower.type], tower.position.x, tower.position.y);

      // Level indicator
      if (tower.level > 1) {
        ctx.fillStyle = COLORS.foreground;
        ctx.font = 'bold 10px "Geist Mono", monospace';
        ctx.fillText(`L${tower.level}`, tower.position.x, tower.position.y + size / 2 + 8);
      }

      // Selection indicator
      if (isSelected) {
        ctx.strokeStyle = COLORS.primary;
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 3, y - 3, size + 6, size + 6);
      }
    }
  }, [state.towers, state.selectedPlacedTower]);

  // Draw enemies
  const drawEnemies = useCallback((ctx: CanvasRenderingContext2D) => {
    for (const enemy of state.enemies) {
      const config = ENEMY_CONFIGS[enemy.type];
      const size = enemy.type === 'boss' ? 24 : enemy.type === 'dragon' ? 18 : enemy.type === 'ogre' ? 14 : 10;
      const isBoss = enemy.type === 'boss';

      // Enemy shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      if (isBoss) {
        ctx.rect(enemy.position.x - size / 2 + 2, enemy.position.y - size / 2 + 2, size, size);
      } else {
        ctx.arc(enemy.position.x + 2, enemy.position.y + 2, size, 0, Math.PI * 2);
      }
      ctx.fill();

      // Enemy body
      ctx.fillStyle = config.color;
      ctx.beginPath();
      if (isBoss) {
        ctx.rect(enemy.position.x - size / 2, enemy.position.y - size / 2, size, size);
      } else {
        ctx.arc(enemy.position.x, enemy.position.y, size, 0, Math.PI * 2);
      }
      ctx.fill();



      // Health Text Inside Enemy
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${Math.max(10, size - 4)}px "Geist Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(Math.ceil(enemy.hp).toString(), enemy.position.x, enemy.position.y);

      // Slow effect
      if (enemy.slowDuration > 0) {
        ctx.strokeStyle = 'rgba(125, 211, 252, 0.8)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        if (isBoss) {
          ctx.rect(enemy.position.x - size / 2 - 4, enemy.position.y - size / 2 - 4, size + 8, size + 8);
        } else {
          ctx.arc(enemy.position.x, enemy.position.y, size + 4, 0, Math.PI * 2);
        }
        ctx.stroke();
      }
    }
  }, [state.enemies]);

  // Draw projectiles
  const drawProjectiles = useCallback((ctx: CanvasRenderingContext2D) => {
    for (const projectile of state.projectiles) {
      const config = TOWER_CONFIGS[projectile.type];

      if (projectile.type === 'lightning') {
        // Distorted jagged electric line from tower to target
        const sx = projectile.position.x;
        const sy = projectile.position.y;
        const tx = projectile.targetPosition.x;
        const ty = projectile.targetPosition.y;
        const dx = tx - sx;
        const dy = ty - sy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const segments = Math.max(4, Math.floor(dist / 20));

        // Draw multiple overlapping bolts for thickness
        for (let bolt = 0; bolt < 2; bolt++) {
          ctx.strokeStyle = bolt === 0 ? '#FBBF24' : '#FDE047';
          ctx.lineWidth = bolt === 0 ? 3 : 1.5;
          ctx.shadowColor = '#FBBF24';
          ctx.shadowBlur = bolt === 0 ? 12 : 6;

          ctx.beginPath();
          ctx.moveTo(sx, sy);
          for (let i = 1; i < segments; i++) {
            const t = i / segments;
            const baseX = sx + dx * t;
            const baseY = sy + dy * t;
            // Perpendicular jitter
            const perpX = -dy / dist;
            const perpY = dx / dist;
            const jitter = (Math.random() - 0.5) * 18;
            ctx.lineTo(baseX + perpX * jitter, baseY + perpY * jitter);
          }
          ctx.lineTo(tx, ty);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      } else {
        ctx.fillStyle = config.color;
        ctx.beginPath();
        const radius = projectile.type === 'cannon' ? 5 : 3;
        ctx.arc(projectile.position.x, projectile.position.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = COLORS.foreground;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }, [state.projectiles]);

  // Draw ghost tower from popup hover
  const drawGhostTower = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!hoveredPopupTower || !popupGridPos) return;

    const config = TOWER_CONFIGS[hoveredPopupTower];
    const stats = getTowerStats(hoveredPopupTower, 1);
    
    const centerX = popupGridPos.x * CELL_SIZE + CELL_SIZE / 2;
    const centerY = popupGridPos.y * CELL_SIZE + CELL_SIZE / 2;

    // Draw range circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, stats.range, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(41, 171, 226, 0.15)';
    ctx.fill();
    ctx.strokeStyle = COLORS.primary;
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Ghost Tower Base
    const size = CELL_SIZE - 8;
    const x = centerX - size / 2;
    const y = centerY - size / 2;

    ctx.globalAlpha = 0.5; // Semi-transparent

    // Base
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x, y, size, size);

    // Border
    ctx.strokeStyle = config.color;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, size, size);

    // Inner icon
    ctx.fillStyle = config.color;
    ctx.font = 'bold 16px "Geist", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const icons: Record<TowerType, string> = {
      arrow: '↑',
      cannon: '●',
      ice: '❄',
      lightning: '⚡',
    };

    ctx.fillText(icons[hoveredPopupTower], centerX, centerY);
    
    ctx.globalAlpha = 1.0; // Reset alpha

  }, [hoveredPopupTower, popupGridPos]);

  // Draw visual effects
  const drawEffects = useCallback((ctx: CanvasRenderingContext2D) => {
    for (const effect of state.effects) {
      const progress = 1 - effect.duration / effect.maxDuration; // 0 to 1
      const alpha = effect.duration / effect.maxDuration; // 1 to 0

      ctx.save();
      ctx.globalAlpha = alpha;

      if (effect.type === 'cannon_boom') {
        // Particle explosion — scattered embers and debris
        const maxRadius = CANNON_AOE_RADIUS * progress;
        const particleCount = 12;
        // Use effect id as seed for consistent particles per explosion
        const seed = parseInt(effect.id.replace(/\D/g, '')) || 0;
        
        for (let i = 0; i < particleCount; i++) {
          const angle = (seed + i) * 2.618 + i * 0.5; // Golden angle spread
          const dist = maxRadius * (0.3 + ((seed * (i + 1)) % 7) / 10);
          const px = effect.position.x + Math.cos(angle) * dist;
          const py = effect.position.y + Math.sin(angle) * dist;
          const particleSize = 2 + (i % 3) * 1.5;

          // Ember particle
          ctx.fillStyle = i % 3 === 0 ? '#FF5F1F' : i % 3 === 1 ? '#FBBF24' : '#EF4444';
          ctx.beginPath();
          ctx.arc(px, py, particleSize * (1 - progress * 0.5), 0, Math.PI * 2);
          ctx.fill();

          // Ember trail
          ctx.strokeStyle = 'rgba(255, 95, 31, 0.4)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(effect.position.x, effect.position.y);
          ctx.lineTo(px, py);
          ctx.stroke();
        }

        // Central flash
        const flashRadius = 8 * (1 - progress);
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(effect.position.x, effect.position.y, flashRadius, 0, Math.PI * 2);
        ctx.fill();

      } else if (effect.type === 'ice_nova') {
        const radius = ICE_AOE_RADIUS * progress;
        ctx.beginPath();
        ctx.arc(effect.position.x, effect.position.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(125, 211, 252, 0.4)';
        ctx.fill();
        ctx.strokeStyle = '#7DD3FC';
        ctx.lineWidth = 4 * (1 - progress);
        ctx.setLineDash([5, 10]);
        ctx.stroke();
      } else if (effect.type === 'lightning_strike') {
        // Electric burst at impact point — crackling circle
        const burstRadius = 25 * progress;
        const boltCount = 6;
        
        for (let i = 0; i < boltCount; i++) {
          const angle = (i / boltCount) * Math.PI * 2 + Math.random() * 0.3;
          const endX = effect.position.x + Math.cos(angle) * burstRadius;
          const endY = effect.position.y + Math.sin(angle) * burstRadius;
          const midX = effect.position.x + Math.cos(angle) * burstRadius * 0.5 + (Math.random() - 0.5) * 10;
          const midY = effect.position.y + Math.sin(angle) * burstRadius * 0.5 + (Math.random() - 0.5) * 10;

          ctx.strokeStyle = i % 2 === 0 ? '#FBBF24' : '#FDE047';
          ctx.lineWidth = 2 * alpha;
          ctx.shadowColor = '#FBBF24';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.moveTo(effect.position.x, effect.position.y);
          ctx.lineTo(midX, midY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Bright core
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(effect.position.x, effect.position.y, 5 * (1 - progress), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }, [state.effects]);

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Draw cached background
    if (bgCanvasRef.current) {
      ctx.drawImage(bgCanvasRef.current, 0, 0);
    } else {
      ctx.fillStyle = COLORS.background;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // Draw layers
    drawHover(ctx);
    drawTowers(ctx);
    drawGhostTower(ctx);
    drawEnemies(ctx);
    drawProjectiles(ctx);
    drawEffects(ctx);

    // Draw canvas border
    ctx.strokeStyle = COLORS.foreground;
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }, [state, drawHover, drawTowers, drawGhostTower, drawEnemies, drawProjectiles, drawEffects]);

  // Handle mouse move with heavy/resistant hover feel
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    const pixelX = (e.clientX - rect.left) * scaleX;
    const pixelY = (e.clientY - rect.top) * scaleY;

    mouseRef.current = { x: pixelX, y: pixelY };

    const gx = Math.floor(pixelX / CELL_SIZE);
    const gy = Math.floor(pixelY / CELL_SIZE);

    // Calculate distance from cell edge for persistence
    const cellCenterX = gx * CELL_SIZE + CELL_SIZE / 2;
    const cellCenterY = gy * CELL_SIZE + CELL_SIZE / 2;
    const distFromCenterX = Math.abs(pixelX - cellCenterX);
    const distFromCenterY = Math.abs(pixelY - cellCenterY);
    const nearEdge = distFromCenterX > CELL_SIZE / 2 - HOVER_PERSIST_DISTANCE || 
                     distFromCenterY > CELL_SIZE / 2 - HOVER_PERSIST_DISTANCE;

    // Only update hover if we've moved significantly into a new cell
    if (lastHoveredCellRef.current?.gx !== gx || lastHoveredCellRef.current?.gy !== gy) {
      if (!nearEdge || !hoverPersistRef.current) {
        lastHoveredCellRef.current = { gx, gy };
        setHoveredCell({ gx, gy });
        hoverPersistRef.current = true;
      }
    } else if (!nearEdge) {
      hoverPersistRef.current = false;
    }
  };

  const handleMouseLeave = () => {
    mouseRef.current = null;
    // Delay clearing hover for persistence effect
    setTimeout(() => {
      if (!mouseRef.current) {
        lastHoveredCellRef.current = null;
        setHoveredCell(null);
        hoverPersistRef.current = false;
      }
    }, 50);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    const pixelX = (e.clientX - rect.left) * scaleX;
    const pixelY = (e.clientY - rect.top) * scaleY;

    const gx = Math.floor(pixelX / CELL_SIZE);
    const gy = Math.floor(pixelY / CELL_SIZE);

    const centerX = gx * CELL_SIZE + CELL_SIZE / 2;
    const centerY = gy * CELL_SIZE + CELL_SIZE / 2;

    onCellClick(gx, gy, { x: centerX, y: centerY });
  };

  return (
    <div className="relative w-full max-w-[800px]" style={{ aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}` }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="w-full h-full cursor-default transition-shadow duration-200 hover:shadow-[0_0_20px_rgba(var(--primary),0.15)] block"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
}
