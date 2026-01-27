import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  RalphLoop, Thread, Safeguard, 
  loopModeColors, loopStatusColors, refinementColors 
} from '@/lib/loomData';
import { 
  X, GitBranch, Clock, Play, Pause, RotateCcw, 
  Shield, CheckCircle, XCircle, AlertCircle, 
  FileCode, ChevronRight, Zap, Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface ThreadInspectorProps {
  loop: RalphLoop | null;
  thread: Thread | null;
  safeguards: Safeguard[];
  onClose: () => void;
  onRunAnotherLoop: (loopId: string) => void;
  onForkThread: (threadId: string, decisionId: string) => void;
}

type TabType = 'overview' | 'thread' | 'safeguards' | 'files';

export function ThreadInspector({
  loop,
  thread,
  safeguards,
  onClose,
  onRunAnotherLoop,
  onForkThread,
}: ThreadInspectorProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  if (!loop) return null;

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Target className="w-3 h-3" /> },
    { id: 'thread', label: 'Thread', icon: <GitBranch className="w-3 h-3" /> },
    { id: 'safeguards', label: 'Safeguards', icon: <Shield className="w-3 h-3" /> },
    { id: 'files', label: 'Files', icon: <FileCode className="w-3 h-3" /> },
  ];

  const getStatusIcon = () => {
    switch (loop.status) {
      case 'spinning':
        return <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <Play className="w-4 h-4 text-emerald-500" />
        </motion.div>;
      case 'paused':
        return <Pause className="w-4 h-4 text-muted-foreground" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'intervention_required':
        return <AlertCircle className="w-4 h-4 text-amber-500 animate-pulse" />;
    }
  };

  const getSafeguardIcon = (type: Safeguard['type']) => {
    switch (type) {
      case 'automatic_rollback': return <RotateCcw className="w-3 h-3" />;
      case 'feature_flag': return <Zap className="w-3 h-3" />;
      case 'canary_deploy': return <Target className="w-3 h-3" />;
      case 'test_suite': return <CheckCircle className="w-3 h-3" />;
      case 'health_check': return <Shield className="w-3 h-3" />;
      case 'circuit_breaker': return <XCircle className="w-3 h-3" />;
    }
  };

  return (
    <motion.div
      initial={{ x: 500, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 500, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed top-6 right-6 bottom-6 w-[400px] z-40 flex flex-col"
    >
      <div className="hud-panel hud-corner-tr flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ 
                  background: `linear-gradient(135deg, ${loopModeColors[loop.mode]}33, ${loopModeColors[loop.mode]}11)`,
                  border: `1px solid ${loopModeColors[loop.mode]}`,
                }}
              >
                {getStatusIcon()}
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  {loop.weaverName}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge 
                    variant="outline" 
                    className="text-[8px] px-1.5 py-0"
                    style={{ 
                      borderColor: loopModeColors[loop.mode],
                      color: loopModeColors[loop.mode],
                    }}
                  >
                    {loop.mode.toUpperCase()} MODE
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {loop.startTime}
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
              data-testid="close-thread-inspector"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex border-b border-white/5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-3 text-[10px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                  Goal
                </h3>
                <p className="text-sm text-foreground">{loop.goal}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded bg-black/20 border border-white/5">
                  <div className="text-[10px] text-muted-foreground uppercase mb-1">
                    Wheel Speed
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-mono font-bold" style={{ 
                      color: loop.wheelSpeed > 70 ? '#22c55e' : loop.wheelSpeed > 40 ? '#f59e0b' : '#6b7280' 
                    }}>
                      {loop.wheelSpeed}
                    </span>
                    <span className="text-[10px] text-muted-foreground">/100</span>
                  </div>
                </div>
                
                <div className="p-3 rounded bg-black/20 border border-white/5">
                  <div className="text-[10px] text-muted-foreground uppercase mb-1">
                    Iterations
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-mono font-bold text-foreground">
                      {loop.iterationCount}
                    </span>
                    <span className="text-[10px] text-muted-foreground">loops</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                  Refinement Level
                </h3>
                <div className="flex gap-2">
                  {(['raw', 'shaped', 'refined', 'polished'] as const).map((level) => (
                    <div
                      key={level}
                      className={`flex-1 py-2 rounded text-center text-[10px] uppercase ${
                        loop.refinementLevel === level
                          ? 'border-2'
                          : 'border border-white/5 opacity-40'
                      }`}
                      style={{
                        borderColor: loop.refinementLevel === level ? refinementColors[level] : undefined,
                        color: loop.refinementLevel === level ? refinementColors[level] : undefined,
                        background: loop.refinementLevel === level ? `${refinementColors[level]}11` : undefined,
                      }}
                    >
                      {level}
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${loop.pushedToMain ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                  <span className="text-xs text-muted-foreground">
                    {loop.pushedToMain ? 'Pushed to main' : 'Not pushed'}
                  </span>
                </div>
                {loop.rollbackAvailable && (
                  <Badge variant="outline" className="text-[8px]">
                    Rollback Available
                  </Badge>
                )}
              </div>

              {loop.interventionRequired && (
                <div className="p-3 rounded border border-amber-500/30 bg-amber-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-medium text-amber-400">
                      Intervention Required
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-300/80">
                    {loop.interventionReason}
                  </p>
                </div>
              )}

              <Button
                className="w-full"
                onClick={() => onRunAnotherLoop(loop.id)}
                disabled={loop.status === 'spinning'}
                data-testid="run-another-loop"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Run Another Loop
              </Button>
            </div>
          )}

          {activeTab === 'thread' && thread && (
            <div className="space-y-4">
              <div className="text-[10px] text-muted-foreground">
                {thread.decisions.length} decisions • {thread.forkPoints.length} fork points
              </div>

              <div className="relative ml-2 border-l border-white/10 pl-4 space-y-4">
                {thread.decisions.map((decision, i) => {
                  const forkPoint = thread.forkPoints.find(fp => fp.decisionId === decision.id);
                  
                  return (
                    <div key={decision.id} className="relative">
                      <div 
                        className="absolute -left-[18px] top-1 w-3 h-3 rounded-full border-2 flex items-center justify-center"
                        style={{
                          borderColor: decision.outcome === 'success' ? '#22c55e' : 
                                       decision.outcome === 'failure' ? '#ef4444' : '#f59e0b',
                          background: decision.outcome === 'success' ? '#22c55e22' : 
                                      decision.outcome === 'failure' ? '#ef444422' : '#f59e0b22',
                        }}
                      >
                        {decision.outcome === 'success' && <CheckCircle className="w-2 h-2 text-emerald-500" />}
                        {decision.outcome === 'failure' && <XCircle className="w-2 h-2 text-red-500" />}
                        {decision.outcome === 'pending' && <Clock className="w-2 h-2 text-amber-500" />}
                      </div>

                      <div className="pb-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-foreground">
                            {decision.action}
                          </span>
                          <span className="text-[9px] text-muted-foreground">
                            {decision.timestamp}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {decision.reasoning}
                        </p>
                        
                        {decision.filesAffected.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {decision.filesAffected.map((file, fi) => (
                              <Badge 
                                key={fi} 
                                variant="outline" 
                                className="text-[8px] px-1 py-0 font-mono"
                              >
                                {file.split('/').pop()}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {forkPoint && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 px-2 mt-2 text-[9px] text-purple-400 hover:text-purple-300"
                            onClick={() => onForkThread(thread.id, decision.id)}
                            data-testid={`fork-decision-${decision.id}`}
                          >
                            <GitBranch className="w-3 h-3 mr-1" />
                            Fork from this point
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'safeguards' && (
            <div className="space-y-3">
              {safeguards.map((safeguard) => (
                <div
                  key={safeguard.id}
                  className={`p-3 rounded border ${
                    safeguard.status === 'active' 
                      ? 'border-emerald-500/30 bg-emerald-500/5' 
                      : safeguard.status === 'triggered'
                      ? 'border-amber-500/30 bg-amber-500/5'
                      : 'border-white/5 bg-black/20 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getSafeguardIcon(safeguard.type)}
                      <span className="text-xs font-medium text-foreground">
                        {safeguard.name}
                      </span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-[8px] ${
                        safeguard.status === 'active' ? 'text-emerald-500 border-emerald-500/50' :
                        safeguard.status === 'triggered' ? 'text-amber-500 border-amber-500/50' :
                        'text-muted-foreground'
                      }`}
                    >
                      {safeguard.status.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Coverage: {safeguard.coverage}%</span>
                    {safeguard.lastTriggered && (
                      <span>Last triggered: {safeguard.lastTriggered}</span>
                    )}
                  </div>
                  
                  <div className="mt-2 h-1 bg-white/5 rounded overflow-hidden">
                    <div 
                      className="h-full rounded"
                      style={{ 
                        width: `${safeguard.coverage}%`,
                        background: safeguard.status === 'active' ? '#22c55e' : 
                                   safeguard.status === 'triggered' ? '#f59e0b' : '#6b7280',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'files' && thread && (
            <div className="space-y-2">
              {Array.from(new Set(thread.decisions.flatMap(d => d.filesAffected))).map((file, i) => (
                <div
                  key={i}
                  className="p-2 rounded border border-white/5 bg-black/20 flex items-center gap-2"
                >
                  <FileCode className="w-4 h-4 text-primary" />
                  <span className="text-xs font-mono text-foreground flex-1 truncate">
                    {file}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
