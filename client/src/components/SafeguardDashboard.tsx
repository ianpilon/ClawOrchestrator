import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SystemHealth, Safeguard, 
  loopStatusColors 
} from '@/lib/loomData';
import { 
  Shield, CheckCircle, AlertTriangle, XCircle, 
  RotateCcw, Zap, Target, Activity, TrendingUp,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SafeguardDashboardProps {
  systemHealth: SystemHealth;
  safeguards: Safeguard[];
}

export function SafeguardDashboard({ systemHealth, safeguards }: SafeguardDashboardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getHealthColor = (score: number) => {
    if (score >= 90) return '#22c55e';
    if (score >= 70) return '#84cc16';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const getStatusIcon = (status: SystemHealth['deploymentStatus']) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'degraded': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'failing': return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getSafeguardIcon = (type: Safeguard['type']) => {
    switch (type) {
      case 'automatic_rollback': return <RotateCcw className="w-3 h-3" />;
      case 'feature_flag': return <Zap className="w-3 h-3" />;
      case 'canary_deploy': return <Target className="w-3 h-3" />;
      case 'test_suite': return <CheckCircle className="w-3 h-3" />;
      case 'health_check': return <Activity className="w-3 h-3" />;
      case 'circuit_breaker': return <Shield className="w-3 h-3" />;
    }
  };

  const activeSafeguards = safeguards.filter(s => s.status === 'active');
  const triggeredSafeguards = safeguards.filter(s => s.status === 'triggered');

  return (
    <div className="hud-panel w-80 hud-corner-br">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
        data-testid="toggle-safeguard-dashboard"
      >
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="font-mono text-xs uppercase tracking-wider text-primary">
            Push-to-Main Confidence
          </span>
        </div>
        <div className="flex items-center gap-2">
          {getStatusIcon(systemHealth.deploymentStatus)}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <div className="relative mb-4">
                <div className="flex items-center justify-center">
                  <div className="relative w-24 h-24">
                    <svg className="w-full h-full -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        fill="none"
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="8"
                      />
                      <motion.circle
                        cx="48"
                        cy="48"
                        r="40"
                        fill="none"
                        stroke={getHealthColor(systemHealth.overallScore)}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                        animate={{ 
                          strokeDashoffset: 2 * Math.PI * 40 * (1 - systemHealth.overallScore / 100) 
                        }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span 
                        className="text-2xl font-mono font-bold"
                        style={{ color: getHealthColor(systemHealth.overallScore) }}
                      >
                        {systemHealth.overallScore}
                      </span>
                      <span className="text-[8px] text-muted-foreground uppercase">
                        Health
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="p-2 rounded bg-black/20 border border-white/5 text-center">
                  <div className="text-lg font-mono font-bold text-emerald-500">
                    {systemHealth.activeLoops}
                  </div>
                  <div className="text-[8px] text-muted-foreground uppercase">
                    Active Loops
                  </div>
                </div>
                <div className="p-2 rounded bg-black/20 border border-white/5 text-center">
                  <div className="text-lg font-mono font-bold text-amber-500">
                    {systemHealth.interventionsRequired}
                  </div>
                  <div className="text-[8px] text-muted-foreground uppercase">
                    Interventions
                  </div>
                </div>
                <div className="p-2 rounded bg-black/20 border border-white/5 text-center">
                  <div className="text-lg font-mono font-bold text-blue-500">
                    {systemHealth.safeguardsActive}
                  </div>
                  <div className="text-[8px] text-muted-foreground uppercase">
                    Safeguards On
                  </div>
                </div>
                <div className="p-2 rounded bg-black/20 border border-white/5 text-center">
                  <div className="text-lg font-mono font-bold text-red-500">
                    {systemHealth.rollbacksLast24h}
                  </div>
                  <div className="text-[8px] text-muted-foreground uppercase">
                    Rollbacks 24h
                  </div>
                </div>
              </div>

              <div className="border-t border-white/5 pt-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 flex items-center justify-between">
                  <span>Safeguard Status</span>
                  <Badge variant="outline" className="text-[8px]">
                    {activeSafeguards.length}/{safeguards.length} active
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  {safeguards.slice(0, 6).map((safeguard) => (
                    <div
                      key={safeguard.id}
                      className="flex items-center justify-between p-1.5 rounded bg-black/20"
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className={`w-5 h-5 rounded flex items-center justify-center ${
                            safeguard.status === 'active' ? 'bg-emerald-500/20 text-emerald-500' :
                            safeguard.status === 'triggered' ? 'bg-amber-500/20 text-amber-500' :
                            'bg-white/5 text-muted-foreground'
                          }`}
                        >
                          {getSafeguardIcon(safeguard.type)}
                        </div>
                        <span className="text-[10px] text-foreground">
                          {safeguard.name}
                        </span>
                      </div>
                      <div 
                        className={`w-2 h-2 rounded-full ${
                          safeguard.status === 'active' ? 'bg-emerald-500' :
                          safeguard.status === 'triggered' ? 'bg-amber-500 animate-pulse' :
                          'bg-muted-foreground'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[9px]">
                <span className="text-muted-foreground">
                  Last deploy: {systemHealth.lastDeploy}
                </span>
                <div className="flex items-center gap-1 text-emerald-500">
                  <TrendingUp className="w-3 h-3" />
                  <span>Stable</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
