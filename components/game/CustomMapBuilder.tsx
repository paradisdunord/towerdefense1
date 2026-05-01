'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT, CELL_SIZE, COLORS } from '@/lib/game/constants';
import { Point, createPath, generateBuildableZones } from '@/lib/game/levels';
import { LevelConfig } from '@/lib/game/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Undo } from 'lucide-react';

interface CustomMapBuilderProps {
  onBack: () => void;
  onPlay: (config: LevelConfig) => void;
}

export function CustomMapBuilder({ onBack, onPlay }: CustomMapBuilderProps) {
  const [pathPoints, setPathPoints] = useState<Point[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [hoveredCell, setHoveredCell] = useState<{ gx: number; gy: number } | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const getGridCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const pixelX = (e.clientX - rect.left) * scaleX;
    const pixelY = (e.clientY - rect.top) * scaleY;
    return {
      gx: Math.floor(pixelX / CELL_SIZE),
      gy: Math.floor(pixelY / CELL_SIZE)
    };
  };

  const addPointIfValid = useCallback((gx: number, gy: number) => {
    setPathPoints(prev => {
      if (prev.length === 0) {
        return [[gx, gy]];
      }
      const lastPoint = prev[prev.length - 1];
      const dx = Math.abs(gx - lastPoint[0]);
      const dy = Math.abs(gy - lastPoint[1]);
      
      // Allow only adjacent horizontal or vertical cells
      if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
        // Check if point already exists to prevent crossing over self
        if (!prev.some(p => p[0] === gx && p[1] === gy)) {
          return [...prev, [gx, gy]];
        }
      }
      return prev;
    });
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const coords = getGridCoords(e);
    if (coords) {
      addPointIfValid(coords.gx, coords.gy);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getGridCoords(e);
    if (coords) {
      setHoveredCell(coords);
      if (isDrawing) {
        addPointIfValid(coords.gx, coords.gy);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleMouseLeave = () => {
    setHoveredCell(null);
    setIsDrawing(false);
  };

  const handleUndo = () => {
    setPathPoints(prev => prev.slice(0, -1));
  };

  const handlePlay = () => {
    if (pathPoints.length < 5) return;

    const customLevel: LevelConfig = {
      id: 999, // Custom level ID
      name: 'CUSTOM MAP',
      theme: 'industrial',
      startingGold: 150,
      path: createPath(pathPoints),
      buildableAreas: generateBuildableZones(pathPoints),
      waves: [],
      forceEndless: true,
    };

    onPlay(customLevel);
  };

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    const cols = Math.ceil(CANVAS_WIDTH / CELL_SIZE);
    const rows = Math.ceil(CANVAS_HEIGHT / CELL_SIZE);

    for (let gx = 0; gx < cols; gx++) {
      for (let gy = 0; gy < rows; gy++) {
        const x = gx * CELL_SIZE;
        const y = gy * CELL_SIZE;
        const isHovered = hoveredCell?.gx === gx && hoveredCell?.gy === gy;
        
        if (isHovered) {
          ctx.fillStyle = COLORS.buildableHover;
          ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
          ctx.shadowColor = COLORS.primary;
          ctx.shadowBlur = 15;
          ctx.fillStyle = COLORS.hoverGlow;
          ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = COLORS.buildable;
          ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        }

        ctx.strokeStyle = COLORS.gridLine;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
      }
    }
  }, [hoveredCell]);

  const drawPath = useCallback((ctx: CanvasRenderingContext2D) => {
    if (pathPoints.length === 0) return;

    const pixelPoints = createPath(pathPoints);

    // Draw path fill
    ctx.strokeStyle = COLORS.path;
    ctx.lineWidth = CELL_SIZE - 4;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';

    ctx.beginPath();
    ctx.moveTo(pixelPoints[0].x, pixelPoints[0].y);
    for (let i = 1; i < pixelPoints.length; i++) {
      ctx.lineTo(pixelPoints[i].x, pixelPoints[i].y);
    }
    ctx.stroke();

    // Draw path border
    ctx.strokeStyle = COLORS.foreground;
    ctx.lineWidth = CELL_SIZE - 2;
    
    ctx.beginPath();
    ctx.moveTo(pixelPoints[0].x, pixelPoints[0].y);
    for (let i = 1; i < pixelPoints.length; i++) {
      ctx.lineTo(pixelPoints[i].x, pixelPoints[i].y);
    }
    ctx.stroke();

    // Inner path
    ctx.strokeStyle = COLORS.path;
    ctx.lineWidth = CELL_SIZE - 6;

    ctx.beginPath();
    ctx.moveTo(pixelPoints[0].x, pixelPoints[0].y);
    for (let i = 1; i < pixelPoints.length; i++) {
      ctx.lineTo(pixelPoints[i].x, pixelPoints[i].y);
    }
    ctx.stroke();

    // Start and end markers
    ctx.fillStyle = COLORS.primary;
    ctx.font = 'bold 12px "Geist Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('START', pixelPoints[0].x, pixelPoints[0].y - 25);
    
    if (pixelPoints.length > 1) {
      const last = pixelPoints[pixelPoints.length - 1];
      ctx.fillText('END', last.x, last.y - 25);
    }
  }, [pathPoints]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    drawGrid(ctx);
    drawPath(ctx);

    ctx.strokeStyle = COLORS.foreground;
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }, [drawGrid, drawPath, pathPoints]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-[800px] mb-6 flex items-end justify-between">
        <div>
          <Button variant="ghost" onClick={onBack} className="mb-4 pl-0 hover:bg-transparent hover:text-primary">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <h1 className="text-3xl font-black tracking-tight leading-none uppercase">MAP BUILDER</h1>
          <p className="text-muted-foreground font-mono text-sm mt-2">
            Click and drag to draw the enemy path (horizontal & vertical only). Minimum 5 tiles.
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleUndo} 
            disabled={pathPoints.length === 0}
            className="border border-foreground/50"
          >
            <Undo className="w-4 h-4 mr-2" /> UNDO
          </Button>
          <Button 
            onClick={handlePlay} 
            disabled={pathPoints.length < 5}
            className="bg-primary text-primary-foreground hover:bg-primary/90 border border-primary/50 font-bold"
          >
            <Play className="w-4 h-4 mr-2" /> PLAY CUSTOM MAP
          </Button>
        </div>
      </div>

      <div className="relative w-full max-w-[800px] bg-muted/20" style={{ aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}` }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full cursor-crosshair block shadow-xl transition-shadow hover:shadow-[0_0_20px_rgba(var(--primary),0.15)]"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
    </div>
  );
}
