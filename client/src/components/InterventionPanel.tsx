import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RalphLoop, FailureDomain, 
  loopModeColors, severityColors 
} from '@/lib/loomData';
import { 
  AlertTriangle, Shield, CheckCircle, XCircle, 
  ChevronRight, ChevronDown, Zap, Lock, Database, 
  Globe, Code, X, Terminal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmbeddedTerminal } from './EmbeddedTerminal';

interface InterventionPanelProps {
  loops: RalphLoop[];
  failureDomains: FailureDomain[];
  onResolve: (loopId: string, action: 'approve' | 'reject' | 'modify') => void;
  onEngineerAway: (failureDomainId: string) => void;
  onLoopSelect: (loop: RalphLoop) => void;
}

export function InterventionPanel({
  loops,
  failureDomains,
  onResolve,
  onEngineerAway,
  onLoopSelect,
}: InterventionPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedLoops, setExpandedLoops] = useState<Set<string>>(new Set());
  const [terminalLoopId, setTerminalLoopId] = useState<string | null>(null);

  const interventionLoops = loops.filter(l => l.interventionRequired);
  const activeFailures = failureDomains.filter(fd => !fd.engineeredAway);

  const getCategoryIcon = (category: FailureDomain['category']) => {
    switch (category) {
      case 'security': return <Lock className="w-3 h-3" />;
      case 'architecture': return <Code className="w-3 h-3" />;
      case 'business_logic': return <Zap className="w-3 h-3" />;
      case 'external_api': return <Globe className="w-3 h-3" />;
      case 'data_integrity': return <Database className="w-3 h-3" />;
    }
  };

  const toggleLoop = (loopId: string) => {
    const newExpanded = new Set(expandedLoops);
    if (newExpanded.has(loopId)) {
      newExpanded.delete(loopId);
    } else {
      newExpanded.add(loopId);
    }
    setExpandedLoops(newExpanded);
  };

  const openTerminal = (loopId: string | null) => {
    setTerminalLoopId(loopId);
  };

  if (interventionLoops.length === 0 && activeFailures.length === 0) {
    return null;
  }

  if (!isOpen) {
    return (
      <motion.div
        initial={{ x: 100 }}
        animate={{ x: 0 }}
        className="fixed top-44 right-6 z-30"
      >
        <Button
          onClick={() => setIsOpen(true)}
          className="relative hud-panel px-4 py-3 flex items-center gap-2 border-amber-500/30 bg-amber-500/5"
          variant="ghost"
          data-testid="open-intervention-panel"
        >
          <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
          <span className="font-mono text-xs uppercase text-amber-400">
            {interventionLoops.length} Interventions
          </span>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
            <span className="text-[8px] font-bold text-black">{interventionLoops.length}</span>
          </div>
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ x: 400 }}
      animate={{ x: 0 }}
      exit={{ x: 400 }}
      className="fixed top-44 right-6 z-30 w-96 max-h-[calc(100vh-250px)] flex flex-col"
    >
      <div className="hud-panel hud-corner-tr border-amber-500/30 flex flex-col overflow-hidden">
        <div className="p-3 border-b border-amber-500/20 bg-amber-500/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-wider text-amber-400">
              Human Intervention Required
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-6 w-6 p-0 text-amber-500 hover:text-amber-400"
            data-testid="close-intervention-panel"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="overflow-y-auto flex-1">
          {interventionLoops.length > 0 && (
            <div className="p-3 border-b border-white/5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                Loops Awaiting Decision
              </div>
              <div className="space-y-2">
                {interventionLoops.map((loop) => {
                  const isExpanded = expandedLoops.has(loop.id);
                  const isTerminalOpen = terminalLoopId === loop.id;
                  
                  return (
                    <motion.div
                      key={loop.id}
                      layout
                      className="rounded border border-amber-500/20 bg-amber-500/5 overflow-hidden"
                    >
                      <div
                        className="p-2 cursor-pointer"
                        onClick={() => toggleLoop(loop.id)}
                        data-testid={`intervention-loop-${loop.id}`}
                      >
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-foreground">
                                {loop.weaverName}
                              </span>
                              <Badge 
                                variant="outline" 
                                className="text-[8px] px-1 py-0"
                                style={{ 
                                  borderColor: loopModeColors[loop.mode],
                                  color: loopModeColors[loop.mode],
                                }}
                              >
                                {loop.mode}
                              </Badge>
                            </div>
                            <p className="text-[10px] text-amber-400 mt-1">
                              {loop.interventionReason}
                            </p>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-amber-500/20"
                          >
                            <div className="p-3 space-y-2">
                              <div className="text-[10px] text-muted-foreground">
                                <strong>Goal:</strong> {loop.goal}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                <strong>Iterations:</strong> {loop.iterationCount} |{' '}
                                <strong>Speed:</strong> {loop.wheelSpeed}
                              </div>
                              
                              <div className="flex gap-2 pt-2">
                                <Button
                                  size="sm"
                                  className="flex-1 h-7 text-[10px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onResolve(loop.id, 'approve');
                                  }}
                                  data-testid={`approve-${loop.id}`}
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  className="flex-1 h-7 text-[10px] bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onResolve(loop.id, 'modify');
                                  }}
                                  data-testid={`modify-${loop.id}`}
                                >
                                  <Zap className="w-3 h-3 mr-1" />
                                  Modify
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-7 text-[10px] bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onResolve(loop.id, 'reject');
                                  }}
                                  data-testid={`reject-${loop.id}`}
                                >
                                  <XCircle className="w-3 h-3" />
                                </Button>
                              </div>

                              <Button
                                variant="ghost"
                                size="sm"
                                className={`w-full h-7 text-[10px] ${isTerminalOpen ? 'bg-emerald-500/10 text-emerald-400' : 'text-emerald-400/70'}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openTerminal(isTerminalOpen ? null : loop.id);
                                }}
                                data-testid={`terminal-toggle-${loop.id}`}
                              >
                                <Terminal className="w-3 h-3 mr-1" />
                                {isTerminalOpen ? 'Hide Terminal' : 'Open Claude Code Terminal'}
                              </Button>

                              <AnimatePresence>
                                {isTerminalOpen && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                  >
                                    <EmbeddedTerminal
                                      loopId={loop.id}
                                      loopName={loop.weaverName}
                                      loopContext={{
                                        loopId: loop.id,
                                        loopName: loop.weaverName,
                                        mode: loop.mode,
                                        goal: loop.goal,
                                        status: loop.status,
                                        iterationCount: loop.iterationCount,
                                        interventionReason: loop.interventionReason,
                                      }}
                                      mode="full"
                                      maxHeight="200px"
                                      showHeader={true}
                                      onClose={() => setTerminalLoopId(null)}
                                    />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full h-6 text-[9px] text-muted-foreground"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onLoopSelect(loop);
                                }}
                                data-testid={`view-loop-${loop.id}`}
                              >
                                View Full Loop Context →
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {activeFailures.length > 0 && (
            <div className="p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center justify-between">
                <span>Active Failure Domains</span>
                <Badge variant="outline" className="text-[8px]">
                  {activeFailures.length} unresolved
                </Badge>
              </div>
              <div className="space-y-2">
                {activeFailures.map((fd) => (
                  <div
                    key={fd.id}
                    className="p-2 rounded border border-white/5 bg-black/20"
                  >
                    <div className="flex items-start gap-2">
                      <div 
                        className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                        style={{ background: `${severityColors[fd.severity]}22` }}
                      >
                        {getCategoryIcon(fd.category)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant="outline" 
                            className="text-[8px] px-1 py-0"
                            style={{ 
                              borderColor: severityColors[fd.severity],
                              color: severityColors[fd.severity],
                            }}
                          >
                            {fd.severity.toUpperCase()}
                          </Badge>
                          <span className="text-[9px] text-muted-foreground capitalize">
                            {fd.category.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-[10px] text-foreground">
                          {fd.description}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 px-2 mt-1 text-[8px] text-purple-400 hover:text-purple-300"
                          onClick={() => onEngineerAway(fd.id)}
                          data-testid={`engineer-away-${fd.id}`}
                        >
                          <Shield className="w-2 h-2 mr-1" />
                          Engineer Away
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-white/5 bg-black/20">
          <div className="flex items-center justify-between text-[9px]">
            <div className="flex items-center gap-1 text-emerald-500">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              Autonomous
            </div>
            <div className="flex items-center gap-1 text-amber-500">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Needs Oversight
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
