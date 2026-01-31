import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClawAgent, Swarm, domainColors, statusColors, integrationIcons,
  AgentDomain, AgentStatus
} from '@/lib/clawData';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import clawAgentImg from '@/assets/images/claw-agent.png';

interface AgentVisualizationProps {
  agents: ClawAgent[];
  swarms: Swarm[];
  onAgentClick: (agent: ClawAgent) => void;
  selectedAgentId?: string | null;
  filter: 'all' | 'active' | 'interventions';
}

interface AgentPosition {
  agent: ClawAgent;
  x: number;
  y: number;
  size: number;
}

export function AgentVisualization({ 
  agents, 
  swarms, 
  onAgentClick, 
  selectedAgentId,
  filter 
}: AgentVisualizationProps) {
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
                          target.closest('[data-testid^="agent-"]');
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

  const filteredAgents = useMemo(() => {
    switch (filter) {
      case 'interventions':
        return agents.filter(a => a.interventionRequired);
      case 'active':
        return agents.filter(a => a.status === 'active');
      default:
        return agents;
    }
  }, [agents, filter]);

  const agentPositions = useMemo<AgentPosition[]>(() => {
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    
    const domains: AgentDomain[] = ['communications', 'productivity', 'research', 'development', 'automation'];
    const orbits = [
      { domain: 'communications', radius: 130 },
      { domain: 'productivity', radius: 220 },
      { domain: 'research', radius: 310 },
      { domain: 'development', radius: 400 },
      { domain: 'automation', radius: 490 },
    ];
    
    const result: AgentPosition[] = [];
    
    orbits.forEach(({ domain, radius }) => {
      const domainAgents = filteredAgents.filter(a => a.domain === domain);
      const count = domainAgents.length;
      if (count === 0) return;
      
      const angleStep = (Math.PI * 2) / Math.max(count, 1);
      const startAngle = -Math.PI / 2;
      
      domainAgents.forEach((agent, index) => {
        const angle = startAngle + index * angleStep;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        result.push({
          agent,
          x,
          y,
          size: 45 + (agent.activityLevel / 100) * 20,
        });
      });
    });
    
    return result;
  }, [filteredAgents, dimensions]);

  const getStatusGlow = (status: AgentStatus) => {
    if (status === 'active') return 'shadow-[0_0_15px_rgba(34,197,94,0.4)]';
    if (status === 'intervention_required') return 'shadow-[0_0_20px_rgba(245,158,11,0.7)] animate-pulse';
    return '';
  };

  const domainLabels: Record<AgentDomain, string> = {
    communications: 'COMMS',
    productivity: 'PRODUCTIVITY', 
    research: 'RESEARCH',
    development: 'DEVELOPMENT',
    automation: 'AUTOMATION',
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
              <stop offset="0%" stopColor="rgba(239,68,68,0.15)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          
          <circle 
            cx={dimensions.width / 2} 
            cy={dimensions.height / 2} 
            r="80"
            fill="url(#centerGlow)"
          />

          {[130, 220, 310, 400, 490].map((orbit, i) => {
            const domains: AgentDomain[] = ['communications', 'productivity', 'research', 'development', 'automation'];
            const domain = domains[i];
            return (
              <g key={i}>
                <circle
                  cx={dimensions.width / 2}
                  cy={dimensions.height / 2}
                  r={orbit}
                  fill="none"
                  stroke={`${domainColors[domain]}55`}
                  strokeWidth="1.5"
                  strokeDasharray="6 10"
                />
                <text
                  x={dimensions.width / 2 + orbit + 15}
                  y={dimensions.height / 2 - 5}
                  fill={`${domainColors[domain]}aa`}
                  fontSize="11"
                  fontFamily="monospace"
                >
                  {domainLabels[domain]}
                </text>
              </g>
            );
          })}

          {swarms.filter(s => s.status === 'active').map(swarm => {
            const swarmAgentPositions = agentPositions.filter(
              ap => swarm.agents.includes(ap.agent.id)
            );
            if (swarmAgentPositions.length < 2) return null;
            
            return swarmAgentPositions.map((pos, i) => {
              const nextPos = swarmAgentPositions[(i + 1) % swarmAgentPositions.length];
              return (
                <line
                  key={`swarm-${swarm.id}-${i}`}
                  x1={pos.x}
                  y1={pos.y}
                  x2={nextPos.x}
                  y2={nextPos.y}
                  stroke="rgba(139,92,246,0.5)"
                  strokeWidth="2"
                  strokeDasharray="5 5"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    from="0"
                    to="20"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                </line>
              );
            });
          })}

          {agentPositions.map((pos) => {
            if (pos.agent.collaboratingWith.length === 0) return null;
            return pos.agent.collaboratingWith.map(partnerId => {
              const partnerPos = agentPositions.find(p => p.agent.id === partnerId);
              if (!partnerPos) return null;
              if (pos.agent.id > partnerId) return null;
              return (
                <line
                  key={`collab-${pos.agent.id}-${partnerId}`}
                  x1={pos.x}
                  y1={pos.y}
                  x2={partnerPos.x}
                  y2={partnerPos.y}
                  stroke="rgba(139,92,246,0.3)"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    from="0"
                    to="12"
                    dur="0.8s"
                    repeatCount="indefinite"
                  />
                </line>
              );
            });
          })}
        </svg>

        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border border-red-500/30 flex items-center justify-center bg-background/50 backdrop-blur-sm">
              <div className="text-center">
                <div className="text-xl font-bold text-red-500 font-mono">
                  {agents.filter(a => a.status === 'active').length}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  ACTIVE
                </div>
              </div>
            </div>
            <div className="absolute -inset-3 rounded-full border border-dashed border-red-500/40 animate-spin" style={{ animationDuration: '15s' }} />
            <div className="absolute -inset-6 rounded-full border border-dotted border-red-500/25 animate-spin" style={{ animationDuration: '25s', animationDirection: 'reverse' }} />
          </div>
        </div>

        <AnimatePresence>
          {agentPositions.map((pos) => {
            const isSelected = selectedAgentId === pos.agent.id;
            const isIntervention = pos.agent.interventionRequired;
            const isActive = pos.agent.status === 'active';
            const isCollaborating = pos.agent.collaboratingWith.length > 0;
            
            return (
              <motion.div
                key={pos.agent.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: 1, 
                  scale: isSelected ? 1.2 : 1,
                  y: isActive ? [0, -6, 0] : 0,
                }}
                exit={{ opacity: 0, scale: 0 }}
                whileHover={{ scale: 1.15 }}
                transition={isActive ? {
                  y: {
                    duration: 0.8 + (1 - pos.agent.activityLevel / 100) * 0.6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                } : undefined}
                className={`absolute pointer-events-auto cursor-pointer ${getStatusGlow(pos.agent.status)}`}
                style={{ 
                  width: pos.size,
                  height: pos.size,
                  left: pos.x - pos.size / 2,
                  top: pos.y - pos.size / 2,
                  filter: isIntervention 
                    ? 'drop-shadow(0 0 12px rgba(245, 158, 11, 0.8))' 
                    : isActive 
                      ? `drop-shadow(0 0 8px ${domainColors[pos.agent.domain]})` 
                      : 'none',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onAgentClick(pos.agent);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                data-testid={`agent-${pos.agent.id}`}
              >
                <div 
                  className={`w-full h-full relative
                    ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-full' : ''}`}
                >
                  <img 
                    src={clawAgentImg} 
                    alt={pos.agent.name} 
                    className="w-full h-full object-contain"
                    style={{
                      filter: pos.agent.status === 'idle' ? 'grayscale(0.5) opacity(0.7)' : 
                              pos.agent.status === 'offline' ? 'grayscale(0.9) opacity(0.4)' :
                              pos.agent.status === 'waiting' ? 'hue-rotate(200deg) brightness(0.9)' : 'none',
                    }}
                  />
                  
                  <div 
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider whitespace-nowrap"
                    style={{ 
                      background: `${domainColors[pos.agent.domain]}cc`,
                      color: 'white',
                      textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                    }}
                  >
                    {pos.agent.domain.slice(0, 4)}
                  </div>

                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {pos.agent.integrations.slice(0, 3).map((int, i) => (
                      <span key={i} className="text-xs" title={int}>
                        {integrationIcons[int]}
                      </span>
                    ))}
                  </div>
                </div>

                {isCollaborating && (
                  <motion.div 
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center z-20"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  >
                    <span className="text-[9px] font-bold text-white">S</span>
                  </motion.div>
                )}

                {isIntervention && (
                  <motion.div 
                    className="absolute -top-2 -left-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center z-20"
                    animate={{ 
                      y: [0, -3, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 0.4, repeat: Infinity }}
                  >
                    <span className="text-xs font-bold text-black">!</span>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex gap-4 pointer-events-none">
        {(['communications', 'productivity', 'research', 'development', 'automation'] as AgentDomain[]).map(domain => {
          const domainAgents = filteredAgents.filter(a => a.domain === domain);
          const active = domainAgents.filter(a => a.status === 'active').length;
          
          return (
            <div key={domain} className="text-center">
              <div 
                className="w-3 h-3 rounded-full mx-auto mb-1"
                style={{ background: domainColors[domain] }}
              />
              <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                {domain.slice(0, 5)}
              </div>
              <div className="text-sm font-bold text-foreground">
                {active}/{domainAgents.length}
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
        <div className="hud-panel px-2 py-1 text-xs text-muted-foreground font-mono text-center" data-testid="zoom-level">
          {Math.round(zoom * 100)}%
        </div>
      </div>
    </div>
  );
}
