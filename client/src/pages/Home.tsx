import { useState, useMemo, useCallback } from 'react';
import { LoopVisualization } from '@/components/LoopVisualization';
import { ThreadTimeline } from '@/components/ThreadTimeline';
import { LoopStream } from '@/components/LoopStream';
import { InterventionPanel } from '@/components/InterventionPanel';
import { ThreadInspector } from '@/components/ThreadInspector';
import { RefinementHistory } from '@/components/RefinementHistory';
import { SafeguardDashboard } from '@/components/SafeguardDashboard';
import { SettingsPanel } from '@/components/SettingsPanel';
import { 
  generateLoomData, 
  LoomData, 
  RalphLoop, 
  Thread, 
  ForkPoint 
} from '@/lib/loomData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnimatePresence } from 'framer-motion';
import { 
  RefreshCw, Globe, Layers, Shield, 
  Play, Pause, AlertTriangle, Zap, Settings
} from 'lucide-react';

const loomData = generateLoomData();

export default function Home() {
  const [data, setData] = useState<LoomData>(loomData);
  const [selectedLoop, setSelectedLoop] = useState<RalphLoop | null>(null);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [filter, setFilter] = useState<'all' | 'interventions' | 'spinning'>('all');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const spinningCount = useMemo(() => 
    data.loops.filter(l => l.status === 'spinning').length, 
    [data.loops]
  );
  
  const interventionCount = useMemo(() => 
    data.loops.filter(l => l.interventionRequired).length, 
    [data.loops]
  );

  const handleLoopSelect = useCallback((loop: RalphLoop) => {
    setSelectedLoop(loop);
    const thread = data.threads.find(t => t.id === loop.threadId);
    setSelectedThread(thread || null);
  }, [data.threads]);

  const handleThreadSelect = useCallback((thread: Thread) => {
    setSelectedThread(thread);
    const loop = data.loops.find(l => l.threadId === thread.id);
    setSelectedLoop(loop || null);
  }, [data.loops]);

  const handleRunAnotherLoop = useCallback((loopId: string) => {
    setData(prev => ({
      ...prev,
      loops: prev.loops.map(l => 
        l.id === loopId 
          ? { ...l, status: 'spinning' as const, iterationCount: l.iterationCount + 1, wheelSpeed: 60 }
          : l
      ),
    }));
  }, []);

  const handleResolveIntervention = useCallback((loopId: string, action: 'approve' | 'reject' | 'modify') => {
    setData(prev => ({
      ...prev,
      loops: prev.loops.map(l => 
        l.id === loopId 
          ? { 
              ...l, 
              interventionRequired: false, 
              interventionReason: undefined,
              status: action === 'reject' ? 'failed' as const : 'spinning' as const,
            }
          : l
      ),
    }));
  }, []);

  const handleEngineerAway = useCallback((failureDomainId: string) => {
    setData(prev => ({
      ...prev,
      failureDomains: prev.failureDomains.map(fd => 
        fd.id === failureDomainId 
          ? { ...fd, engineeredAway: true }
          : fd
      ),
    }));
  }, []);

  const handleForkThread = useCallback((thread: Thread, forkPoint: ForkPoint) => {
    console.log('Forking thread', thread.id, 'at', forkPoint.id);
  }, []);

  const handleLoadAsContext = useCallback((thread: Thread) => {
    console.log('Loading thread as context', thread.id);
  }, []);

  const handleForkFromInspector = useCallback((threadId: string, decisionId: string) => {
    console.log('Forking from inspector', threadId, decisionId);
  }, []);

  const closeInspector = useCallback(() => {
    setSelectedLoop(null);
    setSelectedThread(null);
  }, []);

  const relevantSafeguards = useMemo(() => {
    if (!selectedThread) return data.safeguards;
    return selectedThread.safeguards.length > 0 ? selectedThread.safeguards : data.safeguards;
  }, [selectedThread, data.safeguards]);

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden font-sans selection:bg-primary/20">
      
      <LoopVisualization
        loops={data.loops}
        convoys={data.convoys}
        onLoopClick={handleLoopSelect}
        selectedLoopId={selectedLoop?.id}
        filter={filter}
      />

      <div className="absolute top-0 left-0 right-0 p-6 pointer-events-none flex justify-between items-start z-10 h-32">
        <div className="pointer-events-auto flex items-start gap-6">
          <div className="hud-panel p-4 w-72 hud-corner-tl">
            <div className="flex items-center gap-3 mb-2">
              <div className="status-indicator" />
              <span className="hud-text text-primary font-bold">agents-first infrastructure</span>
            </div>
            <div className="h-px bg-white/5 w-full mb-3" />
            <h1 className="text-2xl font-bold uppercase tracking-wider text-foreground flex items-center gap-3">
              <Layers className="h-6 w-6 text-primary" />
              Loom <span className="text-white/20">V.01</span>
            </h1>
            <p className="hud-text mt-1">
              Mode: <span className="text-secondary">Ralph Loops</span> // Status: <span className="text-primary">Weaving</span>
            </p>
          </div>
          
          <div className="hud-panel p-3 flex gap-6 items-center">
            <div className="text-center px-2">
              <span className="block text-xl font-mono text-foreground">{data.weavers.length}</span>
              <span className="hud-text">Weavers</span>
            </div>
            <div className="w-px h-8 bg-white/5" />
            <div className="text-center px-2">
              <span className="block text-xl font-mono text-emerald-500">{spinningCount}</span>
              <span className="hud-text text-emerald-500/70">Spinning</span>
            </div>
            <div className="w-px h-8 bg-white/5" />
            <div className="text-center px-2">
              <span className={`block text-xl font-mono ${interventionCount > 0 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                {interventionCount}
              </span>
              <span className={`hud-text ${interventionCount > 0 ? 'text-amber-500/70' : ''}`}>
                Interventions
              </span>
            </div>
          </div>
        </div>

        <div className="pointer-events-auto flex gap-3 items-center">
          <div className="hud-panel p-2 flex gap-1">
            {(['all', 'spinning', 'interventions'] as const).map((f) => (
              <Button
                key={f}
                variant="ghost"
                size="sm"
                onClick={() => setFilter(f)}
                className={`text-[10px] uppercase h-7 px-3 ${
                  filter === f 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid={`filter-${f}`}
              >
                {f === 'all' && <Globe className="w-3 h-3 mr-1" />}
                {f === 'spinning' && <RefreshCw className="w-3 h-3 mr-1" />}
                {f === 'interventions' && <AlertTriangle className="w-3 h-3 mr-1" />}
                {f}
              </Button>
            ))}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSettingsOpen(true)}
            className="hud-panel h-9 w-9 p-0"
            data-testid="open-settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] border border-white/3 rounded-full" />
        
        <div className="absolute top-12 left-12 w-4 h-4 border-t border-l border-white/10" />
        <div className="absolute top-12 right-12 w-4 h-4 border-t border-r border-white/10" />
        <div className="absolute bottom-12 left-12 w-4 h-4 border-b border-l border-white/10" />
        <div className="absolute bottom-12 right-12 w-4 h-4 border-b border-r border-white/10" />
      </div>

      <ThreadTimeline
        threads={data.threads}
        selectedThreadId={selectedThread?.id || null}
        onThreadSelect={handleThreadSelect}
        onFork={handleForkThread}
        onLoadAsContext={handleLoadAsContext}
      />

      <InterventionPanel
        loops={data.loops}
        failureDomains={data.failureDomains}
        onResolve={handleResolveIntervention}
        onEngineerAway={handleEngineerAway}
        onLoopSelect={handleLoopSelect}
      />

      <div className="absolute bottom-32 right-6 z-10 pointer-events-auto space-y-4">
        <SafeguardDashboard 
          systemHealth={data.systemHealth}
          safeguards={data.safeguards}
        />
      </div>

      <div className="absolute bottom-32 left-6 z-10 pointer-events-auto">
        <RefinementHistory 
          loops={data.loops}
          onRunAnotherLoop={handleRunAnotherLoop}
        />
      </div>

      <LoopStream
        loops={data.loops}
        onLoopSelect={handleLoopSelect}
        onRunAnotherLoop={handleRunAnotherLoop}
        selectedLoopId={selectedLoop?.id}
      />

      <AnimatePresence>
        {selectedLoop && (
          <ThreadInspector
            loop={selectedLoop}
            thread={selectedThread}
            safeguards={relevantSafeguards}
            onClose={closeInspector}
            onRunAnotherLoop={handleRunAnotherLoop}
            onForkThread={handleForkFromInspector}
          />
        )}
      </AnimatePresence>

      <SettingsPanel 
        isOpen={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
      />
    </div>
  );
}
