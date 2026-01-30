import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RalphLoop, Convoy, loopModeColors, loopStatusColors, refinementColors,
  LoopMode, LoopStatus
} from '@/lib/loomData';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import clawAgentImg from '@/assets/images/claw-agent.png';

interface LoopVisualizationProps {
  loops: RalphLoop[];
  convoys: Convoy[];
  onLoopClick: (loop: RalphLoop) => void;
  selectedLoopId?: string | null;
  filter: 'all' | 'interventions' | 'spinning';
}

interface LoopCircle {
  loop: RalphLoop;
  x: number;
  y: number;
  radius: number;
}

export function LoopVisualization({ 
  loops, 
  convoys, 
  onLoopClick, 
  selectedLoopId,
  filter 
}: LoopVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const MIN_ZOOM = 1;
  const MAX_ZOOM = 1.94;

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * delta)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isInteractive = target.closest('[data-interactive]') || 
                          target.closest('button') || 
                          target.closest('[data-testid^="loop-"]');
    if (e.button === 0 && !isInteractive) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPanning(false);
  }, []);

  const resetView = useCallback(() => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  const zoomIn = useCallback(() => {
    setZoom(z => Math.min(MAX_ZOOM, z * 1.2));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom(z => Math.max(MIN_ZOOM, z * 0.8));
  }, []);

  const filteredLoops = useMemo(() => {
    switch (filter) {
      case 'interventions':
        return loops.filter(l => l.interventionRequired);
      case 'spinning':
        return loops.filter(l => l.status === 'spinning');
      default:
        return loops;
    }
  }, [loops, filter]);

  const loopCircles = useMemo<LoopCircle[]>(() => {
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    
    const forwardLoops = filteredLoops.filter(l => l.mode === 'forward');
    const reverseLoops = filteredLoops.filter(l => l.mode === 'reverse');
    const systemLoops = filteredLoops.filter(l => l.mode === 'system');
    
    const orbits = [
      { loops: forwardLoops, radius: 150 },
      { loops: reverseLoops, radius: 270 },
      { loops: systemLoops, radius: 390 },
    ];
    
    const result: LoopCircle[] = [];
    
    orbits.forEach(({ loops: modeLoops, radius }) => {
      const count = modeLoops.length;
      if (count === 0) return;
      
      const angleStep = (Math.PI * 2) / Math.max(count, 1);
      const startAngle = -Math.PI / 2;
      
      modeLoops.forEach((loop, index) => {
        const angle = startAngle + index * angleStep;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        result.push({
          loop,
          x,
          y,
          radius: 20 + (loop.wheelSpeed / 100) * 15,
        });
      });
    });
    
    return result;
  }, [filteredLoops, dimensions]);

  const getModeIcon = (mode: LoopMode) => {
    switch (mode) {
      case 'forward': return '→';
      case 'reverse': return '←';
      case 'system': return '⟳';
    }
  };

  const getStatusGlow = (status: LoopStatus) => {
    if (status === 'spinning') return 'shadow-[0_0_20px_rgba(34,197,94,0.5)]';
    if (status === 'intervention_required') return 'shadow-[0_0_20px_rgba(245,158,11,0.8)] animate-pulse';
    return '';
  };

  const getSpinDuration = (wheelSpeed: number) => {
    const minDuration = 0.5;
    const maxDuration = 4;
    const normalized = 1 - (wheelSpeed / 100);
    return minDuration + normalized * (maxDuration - minDuration);
  };

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 overflow-hidden loop-canvas-bg"
      style={{ 
        cursor: isPanning ? 'grabbing' : 'grab',
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      data-canvas
    >
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: `${dimensions.width / 2}px ${dimensions.height / 2}px`,
          width: '100%',
          height: '100%',
          position: 'absolute',
        }}
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(130,207,255,0.1)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          
          <circle 
            cx={dimensions.width / 2} 
            cy={dimensions.height / 2} 
            r="400"
            fill="url(#centerGlow)"
          />

          {[150, 270, 390].map((orbit, i) => (
            <g key={i}>
              <circle
                cx={dimensions.width / 2}
                cy={dimensions.height / 2}
                r={orbit}
                fill="none"
                stroke={`rgba(255,255,255,${0.03 + i * 0.01})`}
                strokeWidth="1"
                strokeDasharray="4 8"
              />
              <text
                x={dimensions.width / 2 + orbit + 10}
                y={dimensions.height / 2 - 5}
                fill="rgba(255,255,255,0.2)"
                fontSize="10"
                fontFamily="monospace"
              >
                {['FORWARD', 'REVERSE', 'SYSTEM'][i]}
              </text>
            </g>
          ))}

          {loopCircles.map((circle, i) => {
            const nextCircle = loopCircles.find(
              (c, j) => j > i && c.loop.mode === circle.loop.mode
            );
            
            if (nextCircle) {
              return (
                <line
                  key={`line-${i}`}
                  x1={circle.x}
                  y1={circle.y}
                  x2={nextCircle.x}
                  y2={nextCircle.y}
                  stroke={`${loopModeColors[circle.loop.mode]}22`}
                  strokeWidth="1"
                />
              );
            }
            return null;
          })}
        </svg>

        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full border border-primary/30 flex items-center justify-center bg-background/50 backdrop-blur-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary font-mono">
                  {loops.filter(l => l.status === 'spinning').length}
                </div>
                <div className="text-[8px] uppercase tracking-wider text-muted-foreground">
                  SPINNING
                </div>
              </div>
            </div>
            <div className="absolute -inset-4 rounded-full border border-dashed border-primary/20 animate-spin" style={{ animationDuration: '20s' }} />
            <div className="absolute -inset-8 rounded-full border border-dotted border-primary/10 animate-spin" style={{ animationDuration: '30s', animationDirection: 'reverse' }} />
          </div>
        </div>

        <AnimatePresence>
          {loopCircles.map((circle) => {
            const isSelected = selectedLoopId === circle.loop.id;
            const isIntervention = circle.loop.interventionRequired;
            const isSpinning = circle.loop.status === 'spinning';
            const agentSize = 50 + (circle.loop.wheelSpeed / 100) * 20;
            
            return (
              <motion.div
                key={circle.loop.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: 1, 
                  scale: isSelected ? 1.2 : 1,
                  y: isSpinning ? [0, -8, 0] : 0,
                }}
                exit={{ opacity: 0, scale: 0 }}
                whileHover={{ scale: 1.15 }}
                transition={isSpinning ? {
                  y: {
                    duration: 0.6 + (1 - circle.loop.wheelSpeed / 100) * 0.8,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                } : undefined}
                className={`absolute pointer-events-auto cursor-pointer ${getStatusGlow(circle.loop.status)}`}
                style={{ 
                  width: agentSize,
                  height: agentSize,
                  left: circle.x - agentSize / 2,
                  top: circle.y - agentSize / 2,
                  filter: isIntervention 
                    ? 'drop-shadow(0 0 12px rgba(245, 158, 11, 0.8))' 
                    : isSpinning 
                      ? `drop-shadow(0 0 8px ${loopModeColors[circle.loop.mode]})` 
                      : 'none',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onLoopClick(circle.loop);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                data-testid={`loop-${circle.loop.id}`}
              >
                <div 
                  className={`w-full h-full relative
                    ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-full' : ''}`}
                >
                  <img 
                    src={clawAgentImg} 
                    alt="Claw Agent" 
                    className="w-full h-full object-contain"
                    style={{
                      filter: circle.loop.status === 'paused' ? 'grayscale(0.7) opacity(0.6)' : 
                              circle.loop.status === 'failed' ? 'hue-rotate(180deg) saturate(0.5)' :
                              circle.loop.status === 'completed' ? 'hue-rotate(90deg) brightness(1.1)' : 'none',
                    }}
                  />
                  
                  <div 
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[7px] font-mono uppercase tracking-wider whitespace-nowrap"
                    style={{ 
                      background: `${loopModeColors[circle.loop.mode]}cc`,
                      color: 'white',
                      textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                    }}
                  >
                    {circle.loop.mode === 'forward' ? '→' : circle.loop.mode === 'reverse' ? '←' : '⟳'}
                  </div>

                  <div 
                    className="absolute -top-0.5 left-1/2 -translate-x-1/2 h-1 rounded-full"
                    style={{ 
                      width: '80%',
                      background: refinementColors[circle.loop.refinementLevel],
                      boxShadow: `0 0 4px ${refinementColors[circle.loop.refinementLevel]}`,
                    }}
                  />
                </div>

                {circle.loop.wheelSpeed > 70 && (
                  <motion.div 
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center z-20"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    <span className="text-[8px] font-bold text-white">⚡</span>
                  </motion.div>
                )}

                {isIntervention && (
                  <motion.div 
                    className="absolute -top-2 -left-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center z-20"
                    animate={{ 
                      y: [0, -4, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 0.4, repeat: Infinity }}
                  >
                    <span className="text-[10px] font-bold text-black">!</span>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex gap-6 pointer-events-none">
        {(['forward', 'reverse', 'system'] as LoopMode[]).map(mode => {
          const modeLoops = filteredLoops.filter(l => l.mode === mode);
          const spinning = modeLoops.filter(l => l.status === 'spinning').length;
          
          return (
            <div key={mode} className="text-center">
              <div 
                className="w-3 h-3 rounded-full mx-auto mb-1"
                style={{ background: loopModeColors[mode] }}
              />
              <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                {mode}
              </div>
              <div className="text-sm font-bold text-foreground">
                {spinning}/{modeLoops.length}
              </div>
            </div>
          );
        })}
      </div>


      <div className="absolute bottom-8 left-8 flex flex-row gap-2 pointer-events-auto" data-interactive>
        <button
          onClick={zoomIn}
          className="hud-panel p-2 hover:bg-primary/20 transition-colors"
          title="Zoom in"
          data-testid="zoom-in"
        >
          <ZoomIn className="w-4 h-4 text-muted-foreground" />
        </button>
        <button
          onClick={zoomOut}
          className="hud-panel p-2 hover:bg-primary/20 transition-colors"
          title="Zoom out"
          data-testid="zoom-out"
        >
          <ZoomOut className="w-4 h-4 text-muted-foreground" />
        </button>
        <button
          onClick={resetView}
          className="hud-panel p-2 hover:bg-primary/20 transition-colors"
          title="Reset view"
          data-testid="reset-view"
        >
          <Maximize2 className="w-4 h-4 text-muted-foreground" />
        </button>
        <div className="hud-panel px-2 py-1 text-[10px] text-muted-foreground font-mono text-center" data-testid="zoom-level">
          {Math.round(zoom * 100)}%
        </div>
      </div>
    </div>
  );
}
