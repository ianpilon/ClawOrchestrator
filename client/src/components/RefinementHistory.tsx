import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { RalphLoop, refinementColors, RefinementLevel } from '@/lib/loomData';
import { Layers, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AIHelpTooltip, ComponentContext } from './AIHelpTooltip';

interface RefinementHistoryProps {
  loops: RalphLoop[];
  onRunAnotherLoop: (loopId: string) => void;
}

interface ClayTexture {
  level: RefinementLevel;
  gradient: string;
  pattern: string;
  description: string;
}

const clayTextures: Record<RefinementLevel, ClayTexture> = {
  raw: {
    level: 'raw',
    gradient: 'linear-gradient(135deg, #374151 0%, #1f2937 50%, #374151 100%)',
    pattern: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
    description: 'Rough, unformed - first iteration',
  },
  shaped: {
    level: 'shaped',
    gradient: 'linear-gradient(135deg, #78716c 0%, #57534e 50%, #78716c 100%)',
    pattern: 'repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(255,255,255,0.05) 3px, rgba(255,255,255,0.05) 6px)',
    description: 'Taking form - 3-5 iterations',
  },
  refined: {
    level: 'refined',
    gradient: 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 50%, #a78bfa 100%)',
    pattern: 'repeating-radial-gradient(circle at 50% 50%, transparent, transparent 2px, rgba(255,255,255,0.08) 2px, rgba(255,255,255,0.08) 3px)',
    description: 'Polishing edges - 6-10 iterations',
  },
  polished: {
    level: 'polished',
    gradient: 'linear-gradient(135deg, #4ade80 0%, #22c55e 50%, #4ade80 100%)',
    pattern: 'none',
    description: 'Mirror finish - 10+ iterations',
  },
};

export function RefinementHistory({ loops, onRunAnotherLoop }: RefinementHistoryProps) {
  const refinementCounts = {
    raw: loops.filter(l => l.refinementLevel === 'raw').length,
    shaped: loops.filter(l => l.refinementLevel === 'shaped').length,
    refined: loops.filter(l => l.refinementLevel === 'refined').length,
    polished: loops.filter(l => l.refinementLevel === 'polished').length,
  };

  const totalIterations = loops.reduce((sum, l) => sum + l.iterationCount, 0);
  const avgIterations = loops.length > 0 ? Math.round(totalIterations / loops.length) : 0;

  const roughLoops = loops.filter(l => l.refinementLevel === 'raw' || l.refinementLevel === 'shaped');

  const aiHelpContext: ComponentContext = useMemo(() => ({
    componentName: 'Software is Clay',
    purpose: 'Visualizes the "Software is Clay" philosophy - code starts rough and gets refined through iterations. Each loop polishes the code further, like shaping clay into a finished piece.',
    currentState: `${loops.length} total loops. Refinement distribution: ${refinementCounts.raw} raw, ${refinementCounts.shaped} shaped, ${refinementCounts.refined} refined, ${refinementCounts.polished} polished. Average ${avgIterations} iterations per loop.`,
    availableActions: [
      'View how many loops are at each refinement level',
      'Click "Run Another Loop" on rough loops to refine them further',
      'Track overall iteration progress across all loops',
    ],
    loomConcepts: [
      'Raw - First iteration, rough and unformed (1-2 iterations)',
      'Shaped - Taking form (3-5 iterations)',
      'Refined - Polishing edges (6-10 iterations)',
      'Polished - Mirror finish, production-ready (10+ iterations)',
      'Software is Clay - Philosophy that code is continuously moldable',
    ],
  }), [loops.length, refinementCounts, avgIterations]);

  return (
    <div className="hud-panel p-4 w-72 relative">
      <AIHelpTooltip context={aiHelpContext} position="top-right" />
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-4 h-4 text-primary" />
        <span className="font-mono text-xs uppercase tracking-wider text-primary">
          Software is Clay
        </span>
      </div>

      <div className="space-y-3 mb-4">
        {(['raw', 'shaped', 'refined', 'polished'] as RefinementLevel[]).map((level) => {
          const texture = clayTextures[level];
          const count = refinementCounts[level];
          const percentage = loops.length > 0 ? (count / loops.length) * 100 : 0;

          return (
            <div key={level} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <motion.div
                    className="w-4 h-4 rounded"
                    style={{
                      background: texture.gradient,
                      backgroundImage: texture.pattern !== 'none' ? texture.pattern : undefined,
                    }}
                    animate={level === 'polished' ? { 
                      boxShadow: ['0 0 0 rgba(74,222,128,0)', '0 0 10px rgba(74,222,128,0.5)', '0 0 0 rgba(74,222,128,0)']
                    } : undefined}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {level}
                  </span>
                </div>
                <span className="text-xs font-mono text-foreground">
                  {count}
                </span>
              </div>
              
              <div className="h-1 bg-white/5 rounded overflow-hidden">
                <motion.div
                  className="h-full rounded"
                  style={{ background: refinementColors[level] }}
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                />
              </div>
              
              <p className="text-[8px] text-muted-foreground">
                {texture.description}
              </p>
            </div>
          );
        })}
      </div>

      <div className="border-t border-white/5 pt-3 space-y-2">
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground">Total Iterations</span>
          <span className="font-mono text-foreground">{totalIterations}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground">Avg per Loop</span>
          <span className="font-mono text-foreground">{avgIterations}</span>
        </div>
      </div>

      {roughLoops.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/5">
          <p className="text-[9px] text-muted-foreground mb-2">
            {roughLoops.length} loops need more refinement
          </p>
          <div className="space-y-1">
            {roughLoops.slice(0, 3).map((loop) => (
              <div 
                key={loop.id}
                className="flex items-center justify-between p-2 rounded bg-black/20 border border-white/5"
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded"
                    style={{ background: refinementColors[loop.refinementLevel] }}
                  />
                  <span className="text-[9px] text-foreground truncate max-w-[120px]">
                    {loop.goal.slice(0, 25)}...
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={() => onRunAnotherLoop(loop.id)}
                  data-testid={`refine-${loop.id}`}
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
