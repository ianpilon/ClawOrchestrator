import { useRef, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RalphLoop, Convoy, loopModeColors, loopStatusColors, refinementColors,
  LoopMode, LoopStatus
} from '@/lib/loomData';

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
  angle: number;
  orbitRadius: number;
  speed: number;
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
  const animationRef = useRef<number | undefined>(undefined);
  const [time, setTime] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let lastTime = performance.now();
    const animate = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      setTime(t => t + delta);
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
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
    
    return filteredLoops.map((loop, index) => {
      const modeIndex = ['forward', 'reverse', 'system'].indexOf(loop.mode);
      const baseOrbit = 150 + modeIndex * 120;
      const angleOffset = (index / filteredLoops.length) * Math.PI * 2;
      const orbitVariance = (index % 3) * 30;
      
      return {
        loop,
        x: centerX,
        y: centerY,
        radius: 20 + (loop.wheelSpeed / 100) * 15,
        angle: angleOffset,
        orbitRadius: baseOrbit + orbitVariance,
        speed: loop.wheelSpeed / 50,
      };
    });
  }, [filteredLoops, dimensions]);

  const getLoopPosition = (circle: LoopCircle) => {
    const angle = circle.angle + time * circle.speed;
    return {
      x: circle.x + Math.cos(angle) * circle.orbitRadius,
      y: circle.y + Math.sin(angle) * circle.orbitRadius,
    };
  };

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

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center, rgba(22,24,29,1) 0%, rgba(10,12,15,1) 100%)' }}
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
          const pos = getLoopPosition(circle);
          const nextCircle = loopCircles[(i + 1) % loopCircles.length];
          const nextPos = getLoopPosition(nextCircle);
          
          if (circle.loop.mode === nextCircle.loop.mode && i < loopCircles.length - 1) {
            return (
              <line
                key={`line-${i}`}
                x1={pos.x}
                y1={pos.y}
                x2={nextPos.x}
                y2={nextPos.y}
                stroke={`${loopModeColors[circle.loop.mode]}33`}
                strokeWidth="1"
              />
            );
          }
          return null;
        })}
      </svg>

      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <motion.div
          className="relative"
          animate={{ rotate: time * 2 }}
          transition={{ duration: 0, ease: 'linear' }}
        >
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
        </motion.div>
      </div>

      <AnimatePresence>
        {loopCircles.map((circle) => {
          const pos = getLoopPosition(circle);
          const isSelected = selectedLoopId === circle.loop.id;
          const isIntervention = circle.loop.interventionRequired;
          
          return (
            <motion.div
              key={circle.loop.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: 1, 
                scale: isSelected ? 1.2 : 1,
                x: pos.x - circle.radius,
                y: pos.y - circle.radius,
              }}
              exit={{ opacity: 0, scale: 0 }}
              className={`absolute pointer-events-auto cursor-pointer transition-all duration-200 ${getStatusGlow(circle.loop.status)}`}
              style={{ 
                width: circle.radius * 2,
                height: circle.radius * 2,
              }}
              onClick={() => onLoopClick(circle.loop)}
              data-testid={`loop-${circle.loop.id}`}
            >
              <div 
                className={`w-full h-full rounded-full flex items-center justify-center relative overflow-hidden
                  ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
                  ${isIntervention ? 'animate-pulse' : ''}`}
                style={{ 
                  background: `linear-gradient(135deg, ${loopModeColors[circle.loop.mode]}33, ${loopModeColors[circle.loop.mode]}11)`,
                  border: `2px solid ${loopModeColors[circle.loop.mode]}`,
                }}
              >
                {circle.loop.status === 'spinning' && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(from 0deg, transparent, ${loopModeColors[circle.loop.mode]}66, transparent)`,
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ 
                      duration: 2 / Math.max(circle.speed, 0.1), 
                      repeat: Infinity, 
                      ease: 'linear' 
                    }}
                  />
                )}
                
                <span 
                  className="text-lg font-bold z-10"
                  style={{ color: loopModeColors[circle.loop.mode] }}
                >
                  {getModeIcon(circle.loop.mode)}
                </span>

                <div 
                  className="absolute bottom-0 left-0 right-0 h-1"
                  style={{ 
                    background: refinementColors[circle.loop.refinementLevel],
                    opacity: 0.8,
                  }}
                />
              </div>

              {circle.loop.wheelSpeed > 70 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center">
                  <span className="text-[6px] font-bold text-white">⚡</span>
                </div>
              )}

              {isIntervention && (
                <div className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center animate-bounce">
                  <span className="text-[8px] font-bold text-black">!</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex gap-6">
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

      <div className="absolute bottom-8 right-8 hud-panel p-4 pointer-events-auto">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
          Wheel Speed Distribution
        </div>
        <div className="flex gap-1 items-end h-12">
          {[0, 20, 40, 60, 80, 100].map((threshold, i) => {
            const count = loops.filter(l => 
              l.wheelSpeed >= threshold && l.wheelSpeed < threshold + 20
            ).length;
            const height = Math.max(4, (count / loops.length) * 48);
            
            return (
              <div
                key={threshold}
                className="w-4 bg-primary/50 rounded-t transition-all"
                style={{ height }}
                title={`${threshold}-${threshold + 20}: ${count} loops`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-[8px] text-muted-foreground mt-1">
          <span>0</span>
          <span>100</span>
        </div>
      </div>
    </div>
  );
}
