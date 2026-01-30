import { motion, AnimatePresence } from 'framer-motion';
import { Swarm, ClawAgent } from '@/lib/clawData';
import { Users, Target, CheckCircle, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import clawAgentImg from '@/assets/images/claw-agent.png';

interface SwarmDashboardProps {
  swarms: Swarm[];
  agents: ClawAgent[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function SwarmDashboard({ swarms, agents, isCollapsed, onToggleCollapse }: SwarmDashboardProps) {
  const activeSwarms = swarms.filter(s => s.status === 'active' || s.status === 'forming');

  if (activeSwarms.length === 0) {
    return null;
  }

  if (isCollapsed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pointer-events-auto"
      >
        <Button
          onClick={onToggleCollapse}
          className="relative h-12 px-4 rounded-lg bg-purple-500/20 border border-purple-500/50 hover:bg-purple-500/30 flex items-center gap-2"
          data-testid="expand-swarms"
        >
          <Users className="w-5 h-5 text-purple-400" />
          <span className="text-xs font-bold text-purple-300">SWARMS</span>
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold text-white"
          >
            {activeSwarms.length}
          </motion.span>
          <ChevronUp className="w-3.5 h-3.5 text-purple-400 ml-1" />
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="hud-panel p-3 w-72 hud-corner-tl pointer-events-auto"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Active Swarms
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded font-mono font-medium">
            {activeSwarms.length}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0"
            onClick={onToggleCollapse}
            data-testid="collapse-swarms"
          >
            <ChevronDown className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <AnimatePresence>
        <div className="space-y-3">
          {activeSwarms.map((swarm) => {
            const swarmAgents = agents.filter(a => swarm.agents.includes(a.id));
            const leadAgent = agents.find(a => a.id === swarm.leadAgentId);
            
            return (
              <motion.div
                key={swarm.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-2.5 rounded border border-purple-500/30 bg-purple-500/5"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-sm font-medium text-foreground">{swarm.name}</span>
                  </div>
                  {swarm.status === 'forming' ? (
                    <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5 text-purple-400" />
                  )}
                </div>

                <div className="text-xs text-muted-foreground mb-2 line-clamp-2">
                  {swarm.objective}
                </div>

                <div className="flex items-center gap-1 mb-2">
                  {swarmAgents.slice(0, 4).map((agent, i) => (
                    <div 
                      key={agent.id}
                      className="relative"
                      style={{ marginLeft: i > 0 ? '-6px' : 0, zIndex: 4 - i }}
                    >
                      <img 
                        src={clawAgentImg} 
                        alt={agent.name}
                        className="w-7 h-7 object-contain rounded-full border border-purple-500/50"
                        title={agent.name}
                      />
                      {agent.id === swarm.leadAgentId && (
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-500 rounded-full" />
                      )}
                    </div>
                  ))}
                  {swarmAgents.length > 4 && (
                    <span className="text-xs text-muted-foreground ml-1">
                      +{swarmAgents.length - 4}
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">
                      {swarm.tasksCompleted}/{swarm.tasksTotal} tasks
                    </span>
                    <span className="text-xs font-mono text-foreground">{swarm.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-purple-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${swarm.progress}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </AnimatePresence>
    </motion.div>
  );
}
