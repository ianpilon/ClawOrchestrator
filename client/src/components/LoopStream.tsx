import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RalphLoop, loopModeColors, loopStatusColors, refinementColors 
} from '@/lib/loomData';
import { 
  Play, Pause, RotateCcw, Zap, AlertTriangle, 
  ChevronUp, ChevronDown, RefreshCw, Terminal
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmbeddedTerminal } from './EmbeddedTerminal';

interface LoopStreamProps {
  loops: RalphLoop[];
  onLoopSelect: (loop: RalphLoop) => void;
  onRunAnotherLoop: (loopId: string) => void;
  selectedLoopId?: string | null;
}

interface StreamItem {
  loop: RalphLoop;
  animatedSpeed: number;
}

export function LoopStream({
  loops,
  onLoopSelect,
  onRunAnotherLoop,
  selectedLoopId,
}: LoopStreamProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [streamItems, setStreamItems] = useState<StreamItem[]>([]);
  const [terminalLoopId, setTerminalLoopId] = useState<string | null>(null);

  useEffect(() => {
    setStreamItems(
      loops.map(loop => ({
        loop,
        animatedSpeed: loop.wheelSpeed,
      }))
    );
  }, [loops]);

  useEffect(() => {
    const interval = setInterval(() => {
      setStreamItems(items =>
        items.map(item => ({
          ...item,
          animatedSpeed: item.loop.status === 'spinning'
            ? item.loop.wheelSpeed + (Math.random() - 0.5) * 10
            : item.animatedSpeed,
        }))
      );
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const sortedItems = useMemo(() => {
    return [...streamItems].sort((a, b) => {
      if (a.loop.interventionRequired && !b.loop.interventionRequired) return -1;
      if (!a.loop.interventionRequired && b.loop.interventionRequired) return 1;
      if (a.loop.status === 'spinning' && b.loop.status !== 'spinning') return -1;
      if (a.loop.status !== 'spinning' && b.loop.status === 'spinning') return 1;
      return b.loop.wheelSpeed - a.loop.wheelSpeed;
    });
  }, [streamItems]);

  const activeCount = loops.filter(l => l.status === 'spinning').length;
  const interventionCount = loops.filter(l => l.interventionRequired).length;

  const getSpeedIndicator = (speed: number) => {
    if (speed >= 80) return { color: '#22c55e', label: 'FAST', bars: 5 };
    if (speed >= 60) return { color: '#84cc16', label: 'GOOD', bars: 4 };
    if (speed >= 40) return { color: '#f59e0b', label: 'SLOW', bars: 3 };
    if (speed >= 20) return { color: '#ef4444', label: 'CRAWL', bars: 2 };
    return { color: '#6b7280', label: 'IDLE', bars: 1 };
  };

  if (!isExpanded) {
    return (
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
      >
        <Button
          onClick={() => setIsExpanded(true)}
          className="hud-panel px-6 py-2 flex items-center gap-3"
          variant="ghost"
          data-testid="expand-loop-stream"
        >
          <RefreshCw className="w-4 h-4 text-primary animate-spin" style={{ animationDuration: '3s' }} />
          <span className="font-mono text-xs uppercase">
            {activeCount} Loops Spinning
          </span>
          {interventionCount > 0 && (
            <Badge variant="outline" className="bg-amber-500/10 border-amber-500/50 text-amber-500">
              {interventionCount} Need Attention
            </Badge>
          )}
          <ChevronUp className="w-4 h-4" />
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ y: 200 }}
      animate={{ y: 0 }}
      exit={{ y: 200 }}
      className="absolute bottom-8 left-8 right-8 z-20"
    >
      <div className="hud-panel hud-corner-bl hud-corner-br">
        <div className="p-3 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-primary animate-spin" style={{ animationDuration: '3s' }} />
              <span className="font-mono text-xs uppercase tracking-wider text-primary">
                Loop Stream
              </span>
            </div>
            <div className="flex gap-3 text-[10px] font-mono">
              <span className="text-emerald-500">{activeCount} SPINNING</span>
              <span className="text-muted-foreground">|</span>
              <span className="text-blue-500">{loops.filter(l => l.status === 'completed').length} COMPLETE</span>
              {interventionCount > 0 && (
                <>
                  <span className="text-muted-foreground">|</span>
                  <span className="text-amber-500 animate-pulse">{interventionCount} INTERVENTION</span>
                </>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="h-6 w-6 p-0"
            data-testid="collapse-loop-stream"
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-3 overflow-x-auto">
          <div className="flex gap-3 min-w-max">
            <AnimatePresence mode="popLayout">
              {sortedItems.slice(0, 12).map((item) => {
                const speed = getSpeedIndicator(item.animatedSpeed);
                const isSelected = selectedLoopId === item.loop.id;
                const isTerminalOpen = terminalLoopId === item.loop.id;
                
                return (
                  <motion.div
                    key={item.loop.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.02 }}
                    className={`w-52 p-3 rounded border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary/50 bg-primary/5'
                        : item.loop.interventionRequired
                        ? 'border-amber-500/50 bg-amber-500/5'
                        : 'border-white/5 bg-black/30 hover:border-white/10'
                    }`}
                    onClick={() => onLoopSelect(item.loop)}
                    data-testid={`stream-loop-${item.loop.id}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge 
                        variant="outline" 
                        className="text-[8px] px-1.5 py-0"
                        style={{ 
                          borderColor: loopModeColors[item.loop.mode],
                          color: loopModeColors[item.loop.mode],
                          background: `${loopModeColors[item.loop.mode]}11`,
                        }}
                      >
                        {item.loop.mode.toUpperCase()}
                      </Badge>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setTerminalLoopId(isTerminalOpen ? null : item.loop.id);
                          }}
                          className={`p-1 rounded hover:bg-white/10 transition-colors ${isTerminalOpen ? 'bg-emerald-500/20' : ''}`}
                          title="Toggle Terminal"
                          data-testid={`stream-terminal-${item.loop.id}`}
                        >
                          <Terminal className={`w-3 h-3 ${isTerminalOpen ? 'text-emerald-400' : 'text-muted-foreground'}`} />
                        </button>
                        
                        {item.loop.interventionRequired ? (
                          <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
                        ) : item.loop.status === 'spinning' ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2 / (item.loop.wheelSpeed / 50), repeat: Infinity, ease: 'linear' }}
                          >
                            <RefreshCw className="w-4 h-4 text-emerald-500" />
                          </motion.div>
                        ) : item.loop.status === 'completed' ? (
                          <Zap className="w-4 h-4 text-blue-500" />
                        ) : (
                          <Pause className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    <div className="text-xs font-medium text-foreground truncate mb-1">
                      {item.loop.weaverName}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate mb-2">
                      {item.loop.goal}
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[8px] text-muted-foreground">WHEEL SPEED</span>
                          <span 
                            className="text-[8px] font-mono"
                            style={{ color: speed.color }}
                          >
                            {speed.label}
                          </span>
                        </div>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(bar => (
                            <div
                              key={bar}
                              className="flex-1 h-1.5 rounded-sm transition-all"
                              style={{
                                background: bar <= speed.bars ? speed.color : 'rgba(255,255,255,0.1)',
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono font-bold" style={{ color: speed.color }}>
                          {Math.round(item.animatedSpeed)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] text-muted-foreground">×{item.loop.iterationCount}</span>
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ background: refinementColors[item.loop.refinementLevel] }}
                          title={item.loop.refinementLevel}
                        />
                      </div>
                      
                      {item.loop.status !== 'spinning' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 px-2 text-[8px]"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRunAnotherLoop(item.loop.id);
                          }}
                          data-testid={`rerun-${item.loop.id}`}
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Loop Again
                        </Button>
                      )}
                    </div>

                    {item.loop.interventionRequired && (
                      <div className="mt-2 pt-2 border-t border-amber-500/20">
                        <div className="text-[9px] text-amber-400 leading-relaxed">
                          {item.loop.interventionReason}
                        </div>
                      </div>
                    )}

                    <AnimatePresence>
                      {isTerminalOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-2 pt-2 border-t border-white/10"
                        >
                          <EmbeddedTerminal
                            loopId={item.loop.id}
                            loopName={item.loop.weaverName}
                            loopContext={{
                              loopId: item.loop.id,
                              loopName: item.loop.weaverName,
                              mode: item.loop.mode,
                              goal: item.loop.goal,
                              status: item.loop.status,
                              iterationCount: item.loop.iterationCount,
                              interventionReason: item.loop.interventionReason,
                            }}
                            mode="inline"
                            maxHeight="120px"
                            showHeader={false}
                            className="rounded"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
