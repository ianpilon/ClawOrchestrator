import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Thread, ThreadDecision, ForkPoint, 
  loopModeColors, loopStatusColors, refinementColors 
} from '@/lib/loomData';
import { 
  GitBranch, Clock, CheckCircle, XCircle, AlertCircle, 
  Share2, Download, ChevronDown, ChevronRight, Maximize2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AIHelpTooltip, ComponentContext } from './AIHelpTooltip';

interface ThreadTimelineProps {
  threads: Thread[];
  selectedThreadId: string | null;
  onThreadSelect: (thread: Thread) => void;
  onFork: (thread: Thread, forkPoint: ForkPoint) => void;
  onLoadAsContext: (thread: Thread) => void;
}

export function ThreadTimeline({
  threads,
  selectedThreadId,
  onThreadSelect,
  onFork,
  onLoadAsContext,
}: ThreadTimelineProps) {
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleThread = (threadId: string) => {
    const newExpanded = new Set(expandedThreads);
    if (newExpanded.has(threadId)) {
      newExpanded.delete(threadId);
    } else {
      newExpanded.add(threadId);
    }
    setExpandedThreads(newExpanded);
  };

  const getOutcomeIcon = (outcome: ThreadDecision['outcome']) => {
    switch (outcome) {
      case 'success': return <CheckCircle className="w-3 h-3 text-emerald-500" />;
      case 'failure': return <XCircle className="w-3 h-3 text-red-500" />;
      case 'pending': return <Clock className="w-3 h-3 text-amber-500" />;
    }
  };

  const sortedThreads = [...threads].sort((a, b) => {
    const statusOrder = { spinning: 0, intervention_required: 1, paused: 2, completed: 3, failed: 4 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  const spinningThreads = threads.filter(t => t.status === 'spinning').length;
  const completedThreads = threads.filter(t => t.status === 'completed').length;
  const totalDecisions = threads.reduce((sum, t) => sum + t.decisions.length, 0);
  const totalForkPoints = threads.reduce((sum, t) => sum + t.forkPoints.length, 0);

  const aiHelpContext: ComponentContext = useMemo(() => ({
    componentName: 'Thread Timeline',
    purpose: 'Threads are the audit trail of everything AI agents do. Each thread records decisions made during a loop, allowing you to track history, share context, and fork from any decision point.',
    currentState: `Showing ${threads.length} threads: ${spinningThreads} active, ${completedThreads} completed. Total: ${totalDecisions} decisions recorded, ${totalForkPoints} fork points available.`,
    availableActions: [
      'Click a thread to expand and see its decision history',
      'Use "Load as Context" to give a thread\'s history to a new loop',
      'Fork from any decision point to try a different approach',
      'Share threads with team members',
    ],
    loomConcepts: [
      'Thread - A complete audit trail of a loop\'s execution',
      'Decision - A choice made by the agent during execution',
      'Fork Point - A location where you can branch off and try alternatives',
      'Load as Context - Feed a thread\'s history to inform a new loop',
    ],
  }), [threads.length, spinningThreads, completedThreads, totalDecisions, totalForkPoints]);

  if (isCollapsed) {
    return (
      <motion.div 
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        className="absolute left-6 top-44 z-20"
      >
        <Button
          variant="ghost"
          onClick={() => setIsCollapsed(false)}
          className="hud-panel p-3 hover:bg-white/5"
          data-testid="expand-thread-timeline"
        >
          <GitBranch className="w-4 h-4 mr-2" />
          <span className="font-mono text-xs uppercase">Threads ({threads.length})</span>
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      exit={{ x: -300 }}
      className="absolute left-6 top-44 z-20 w-80 max-h-[calc(100vh-250px)] flex flex-col"
    >
      <div className="hud-panel hud-corner-tl flex flex-col overflow-hidden relative">
        <AIHelpTooltip context={aiHelpContext} position="top-right" />
        <div className="p-3 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-primary" />
            <span className="font-mono text-xs uppercase tracking-wider text-primary">
              Thread Timeline
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(true)}
            className="h-6 w-6 p-0"
            data-testid="collapse-thread-timeline"
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>

        <div className="overflow-y-auto flex-1 p-2 space-y-2">
          {sortedThreads.map((thread) => {
            const isExpanded = expandedThreads.has(thread.id);
            const isSelected = selectedThreadId === thread.id;
            
            return (
              <motion.div
                key={thread.id}
                layout
                className={`rounded border transition-all ${
                  isSelected 
                    ? 'border-primary/50 bg-primary/5' 
                    : 'border-white/5 bg-black/20 hover:border-white/10'
                }`}
              >
                <div
                  className="p-2 cursor-pointer"
                  onClick={() => onThreadSelect(thread)}
                  data-testid={`thread-${thread.id}`}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                      style={{ background: loopStatusColors[thread.status] }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground truncate">
                          {thread.weaverName}
                        </span>
                        <Badge 
                          variant="outline" 
                          className="text-[8px] px-1 py-0"
                          style={{ 
                            borderColor: loopModeColors[thread.mode],
                            color: loopModeColors[thread.mode],
                          }}
                        >
                          {thread.mode}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                        {thread.goal}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[8px] text-muted-foreground">
                          {thread.decisions.length} decisions
                        </span>
                        <span className="text-[8px] text-muted-foreground">•</span>
                        <span className="text-[8px] text-muted-foreground">
                          {thread.forkPoints.length} forks
                        </span>
                        <span className="text-[8px] text-muted-foreground">•</span>
                        <span 
                          className="text-[8px]"
                          style={{ color: refinementColors[thread.refinementLevel] }}
                        >
                          {thread.refinementLevel}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleThread(thread.id);
                      }}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-2 pb-2 space-y-1">
                        <div className="relative ml-3 border-l border-white/10 pl-3 space-y-2">
                          {thread.decisions.slice(-5).map((decision, i) => {
                            const forkPoint = thread.forkPoints.find(
                              fp => fp.decisionId === decision.id
                            );
                            
                            return (
                              <div key={decision.id} className="relative">
                                <div className="absolute -left-[13px] top-1 w-2 h-2 rounded-full bg-white/10 border border-white/20" />
                                
                                <div className="text-[9px]">
                                  <div className="flex items-center gap-1">
                                    {getOutcomeIcon(decision.outcome)}
                                    <span className="text-foreground">{decision.action}</span>
                                    <span className="text-muted-foreground">{decision.timestamp}</span>
                                  </div>
                                  <p className="text-muted-foreground mt-0.5 leading-relaxed">
                                    {decision.reasoning}
                                  </p>
                                  
                                  {forkPoint && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-4 px-1 mt-1 text-[8px] text-purple-400 hover:text-purple-300"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onFork(thread, forkPoint);
                                      }}
                                      data-testid={`fork-${forkPoint.id}`}
                                    >
                                      <GitBranch className="w-2 h-2 mr-1" />
                                      Fork from here
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex gap-1 pt-2 border-t border-white/5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[9px] flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              onLoadAsContext(thread);
                            }}
                            data-testid={`load-context-${thread.id}`}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Load as Context
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[9px]"
                            data-testid={`share-${thread.id}`}
                          >
                            <Share2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
