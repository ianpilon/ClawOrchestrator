// Loom: Infrastructure Orchestrator for Ralph Loops
// Agents-first, humans-second paradigm

export type LoopMode = 'forward' | 'reverse' | 'system';
export type LoopStatus = 'spinning' | 'paused' | 'completed' | 'failed' | 'intervention_required';
export type RefinementLevel = 'raw' | 'shaped' | 'refined' | 'polished';

// Weaver = The agent itself (CLI tool running on remote infrastructure)
export interface Weaver {
  id: string;
  name: string;
  avatar: string;
  status: 'active' | 'idle' | 'terminated';
  isolationLevel: 'wireguard' | 'ebpf' | 'full';
  uptime: string;
  loopsCompleted: number;
  currentLoopId: string | null;
}

// Thread = Audit trail of everything an agent does
export interface Thread {
  id: string;
  weaverId: string;
  weaverName: string;
  mode: LoopMode;
  status: LoopStatus;
  startTime: string;
  endTime?: string;
  goal: string;
  decisions: ThreadDecision[];
  forkPoints: ForkPoint[];
  parentThreadId: string | null;
  childThreadIds: string[];
  refinementCount: number;
  refinementLevel: RefinementLevel;
  safeguards: Safeguard[];
  failureDomains: FailureDomain[];
}

export interface ThreadDecision {
  id: string;
  timestamp: string;
  action: string;
  reasoning: string;
  outcome: 'success' | 'failure' | 'pending';
  filesAffected: string[];
  canFork: boolean;
}

export interface ForkPoint {
  id: string;
  decisionId: string;
  timestamp: string;
  description: string;
  forked: boolean;
  forkThreadId?: string;
}

// Ralph Loop = Simple iterative AI agent loop with one task, one goal
export interface RalphLoop {
  id: string;
  mode: LoopMode;
  status: LoopStatus;
  goal: string;
  spec?: string; // For forward mode
  targetSystem?: string; // For reverse mode (cloning)
  weaverId: string;
  weaverName: string;
  threadId: string;
  wheelSpeed: number; // 0-100, visual iteration speed
  iterationCount: number;
  startTime: string;
  lastIterationTime: string;
  refinementLevel: RefinementLevel;
  pushedToMain: boolean;
  rollbackAvailable: boolean;
  interventionRequired: boolean;
  interventionReason?: string;
}

// Failure Domain = Areas where agents need human guidance
export interface FailureDomain {
  id: string;
  loopId: string;
  category: 'security' | 'architecture' | 'business_logic' | 'external_api' | 'data_integrity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  engineeredAway: boolean;
  safeguardId?: string;
  timestamp: string;
}

// Safeguard = Engineering solutions to failure domains
export interface Safeguard {
  id: string;
  name: string;
  type: 'automatic_rollback' | 'feature_flag' | 'canary_deploy' | 'test_suite' | 'health_check' | 'circuit_breaker';
  status: 'active' | 'triggered' | 'disabled';
  coverage: number; // 0-100%
  lastTriggered?: string;
  failureDomainsAddressed: string[];
}

// Convoy = Group of parallel loops working together
export interface Convoy {
  id: string;
  name: string;
  loops: string[]; // Loop IDs
  priority: 'low' | 'medium' | 'high' | 'critical';
  wheelSpeedAggregate: number;
  completedLoops: number;
  totalLoops: number;
}

// System Health for push-to-main confidence
export interface SystemHealth {
  overallScore: number; // 0-100
  deploymentStatus: 'healthy' | 'degraded' | 'failing';
  lastDeploy: string;
  rollbacksLast24h: number;
  activeLoops: number;
  interventionsRequired: number;
  safeguardsActive: number;
  safeguardsTriggered: number;
}

// Color system for Loom
export const loopModeColors: Record<LoopMode, string> = {
  forward: '#22c55e', // Green - building
  reverse: '#8b5cf6', // Purple - cloning/analyzing
  system: '#f59e0b', // Amber - testing/maintaining
};

export const loopStatusColors: Record<LoopStatus, string> = {
  spinning: '#22c55e',
  paused: '#6b7280',
  completed: '#3b82f6',
  failed: '#ef4444',
  intervention_required: '#f59e0b',
};

export const refinementColors: Record<RefinementLevel, string> = {
  raw: '#6b7280',
  shaped: '#f59e0b',
  refined: '#8b5cf6',
  polished: '#22c55e',
};

export const severityColors: Record<FailureDomain['severity'], string> = {
  low: '#6b7280',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#dc2626',
};

// Avatar generation for weavers
const weaverAvatars = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=weaver1&backgroundColor=1a1c23',
  'https://api.dicebear.com/7.x/bottts/svg?seed=weaver2&backgroundColor=1a1c23',
  'https://api.dicebear.com/7.x/bottts/svg?seed=weaver3&backgroundColor=1a1c23',
  'https://api.dicebear.com/7.x/bottts/svg?seed=weaver4&backgroundColor=1a1c23',
  'https://api.dicebear.com/7.x/bottts/svg?seed=weaver5&backgroundColor=1a1c23',
];

const weaverNames = [
  'Loom-Alpha', 'Loom-Beta', 'Loom-Gamma', 'Loom-Delta', 'Loom-Epsilon',
  'Thread-Prime', 'Thread-Nova', 'Thread-Apex', 'Thread-Core', 'Thread-Flux',
  'Weave-One', 'Weave-Two', 'Weave-Three', 'Weave-Four', 'Weave-Five',
];

const loopGoals = [
  'Implement user authentication flow',
  'Build real-time notification system',
  'Refactor database connection pooling',
  'Add rate limiting middleware',
  'Create dashboard analytics component',
  'Implement webhook handlers',
  'Optimize image processing pipeline',
  'Build payment integration',
  'Add caching layer',
  'Implement search functionality',
  'Clone legacy auth system',
  'Analyze competitor API structure',
  'Test deployment pipeline',
  'Verify database migrations',
  'Health check all endpoints',
];

const interventionReasons = [
  'Requires API key for external service',
  'Architectural decision needed: monolith vs microservices',
  'Security review required for auth implementation',
  'Business logic clarification needed',
  'Data migration strategy needs approval',
];

const safeguardTypes: Safeguard['type'][] = [
  'automatic_rollback', 'feature_flag', 'canary_deploy', 
  'test_suite', 'health_check', 'circuit_breaker'
];

const safeguardNames: Record<Safeguard['type'], string[]> = {
  automatic_rollback: ['Auto-Rollback v1', 'Quick Revert', 'State Restore'],
  feature_flag: ['Auth Flag', 'Beta Features', 'Gradual Rollout'],
  canary_deploy: ['Canary-5%', 'Canary-25%', 'Canary-50%'],
  test_suite: ['Unit Tests', 'E2E Tests', 'Integration Suite'],
  health_check: ['API Health', 'DB Health', 'Service Mesh'],
  circuit_breaker: ['API Circuit', 'DB Circuit', 'External Services'],
};

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function generateWeaver(): Weaver {
  const name = randomItem(weaverNames);
  return {
    id: `weaver-${generateId()}`,
    name,
    avatar: randomItem(weaverAvatars),
    status: randomItem(['active', 'active', 'active', 'idle']),
    isolationLevel: randomItem(['wireguard', 'ebpf', 'full']),
    uptime: `${randomInt(1, 72)}h`,
    loopsCompleted: randomInt(5, 100),
    currentLoopId: null,
  };
}

function generateSafeguard(): Safeguard {
  const type = randomItem(safeguardTypes);
  return {
    id: `safeguard-${generateId()}`,
    name: randomItem(safeguardNames[type]),
    type,
    status: randomItem(['active', 'active', 'active', 'triggered', 'disabled']),
    coverage: randomInt(60, 100),
    lastTriggered: Math.random() > 0.7 ? `${randomInt(1, 24)}h ago` : undefined,
    failureDomainsAddressed: [],
  };
}

function generateFailureDomain(loopId: string): FailureDomain {
  return {
    id: `failure-${generateId()}`,
    loopId,
    category: randomItem(['security', 'architecture', 'business_logic', 'external_api', 'data_integrity']),
    severity: randomItem(['low', 'medium', 'high', 'critical']),
    description: randomItem([
      'Potential SQL injection vector',
      'Missing input validation',
      'Unclear business requirement',
      'External API rate limit concern',
      'Data consistency issue',
    ]),
    engineeredAway: Math.random() > 0.4,
    timestamp: `${randomInt(1, 60)}m ago`,
  };
}

function generateThreadDecision(): ThreadDecision {
  return {
    id: `decision-${generateId()}`,
    timestamp: `${randomInt(1, 60)}m ago`,
    action: randomItem([
      'Created new component',
      'Refactored function',
      'Added test case',
      'Fixed bug',
      'Updated dependency',
      'Modified API endpoint',
    ]),
    reasoning: randomItem([
      'Improves code maintainability',
      'Fixes edge case handling',
      'Better separation of concerns',
      'Performance optimization',
      'Security hardening',
    ]),
    outcome: randomItem(['success', 'success', 'success', 'pending', 'failure']),
    filesAffected: [
      `src/${randomItem(['components', 'services', 'utils', 'hooks'])}/${randomItem(['Auth', 'User', 'Dashboard', 'Api', 'Config'])}.${randomItem(['ts', 'tsx'])}`,
    ],
    canFork: Math.random() > 0.7,
  };
}

function generateThread(weaver: Weaver, mode: LoopMode, loop?: RalphLoop): Thread {
  const decisions = Array.from({ length: randomInt(3, 8) }, generateThreadDecision);
  const status: LoopStatus = loop?.status || randomItem(['spinning', 'spinning', 'completed', 'paused']);
  
  return {
    id: `thread-${generateId()}`,
    weaverId: weaver.id,
    weaverName: weaver.name,
    mode,
    status,
    startTime: `${randomInt(1, 24)}h ago`,
    endTime: status === 'completed' ? `${randomInt(1, 30)}m ago` : undefined,
    goal: loop?.goal || randomItem(loopGoals),
    decisions,
    forkPoints: decisions.filter(d => d.canFork).map(d => ({
      id: `fork-${generateId()}`,
      decisionId: d.id,
      timestamp: d.timestamp,
      description: `Fork from: ${d.action}`,
      forked: Math.random() > 0.8,
    })),
    parentThreadId: null,
    childThreadIds: [],
    refinementCount: randomInt(1, 15),
    refinementLevel: randomItem(['raw', 'shaped', 'refined', 'polished']),
    safeguards: Array.from({ length: randomInt(1, 4) }, generateSafeguard),
    failureDomains: [],
  };
}

function generateRalphLoop(weaver: Weaver): RalphLoop {
  const mode: LoopMode = randomItem(['forward', 'forward', 'forward', 'reverse', 'system']);
  const status: LoopStatus = randomItem(['spinning', 'spinning', 'spinning', 'paused', 'completed', 'intervention_required']);
  const interventionRequired = status === 'intervention_required';
  
  return {
    id: `loop-${generateId()}`,
    mode,
    status,
    goal: randomItem(loopGoals),
    spec: mode === 'forward' ? 'Build according to PRD v2.1' : undefined,
    targetSystem: mode === 'reverse' ? 'legacy-auth-v1' : undefined,
    weaverId: weaver.id,
    weaverName: weaver.name,
    threadId: `thread-${generateId()}`,
    wheelSpeed: status === 'spinning' ? randomInt(40, 100) : status === 'paused' ? 0 : randomInt(0, 20),
    iterationCount: randomInt(1, 50),
    startTime: `${randomInt(1, 24)}h ago`,
    lastIterationTime: `${randomInt(1, 30)}m ago`,
    refinementLevel: randomItem(['raw', 'shaped', 'refined', 'polished']),
    pushedToMain: status === 'completed',
    rollbackAvailable: Math.random() > 0.3,
    interventionRequired,
    interventionReason: interventionRequired ? randomItem(interventionReasons) : undefined,
  };
}

function generateConvoy(loops: RalphLoop[]): Convoy {
  const convoyLoops = loops.slice(0, randomInt(2, 5));
  const completedLoops = convoyLoops.filter(l => l.status === 'completed').length;
  
  return {
    id: `convoy-${generateId()}`,
    name: randomItem([
      'Auth Overhaul', 'Performance Sprint', 'UI Redesign',
      'API Migration', 'Test Coverage', 'Security Hardening',
    ]),
    loops: convoyLoops.map(l => l.id),
    priority: randomItem(['low', 'medium', 'high', 'critical']),
    wheelSpeedAggregate: Math.round(convoyLoops.reduce((sum, l) => sum + l.wheelSpeed, 0) / convoyLoops.length),
    completedLoops,
    totalLoops: convoyLoops.length,
  };
}

export interface LoomData {
  weavers: Weaver[];
  loops: RalphLoop[];
  threads: Thread[];
  convoys: Convoy[];
  failureDomains: FailureDomain[];
  safeguards: Safeguard[];
  systemHealth: SystemHealth;
}

export function generateLoomData(): LoomData {
  // Generate weavers
  const weavers = Array.from({ length: randomInt(8, 12) }, generateWeaver);
  
  // Generate loops for each active weaver
  const loops: RalphLoop[] = [];
  weavers.forEach(weaver => {
    if (weaver.status === 'active') {
      const loop = generateRalphLoop(weaver);
      loops.push(loop);
      weaver.currentLoopId = loop.id;
    }
    // Some weavers have multiple loops in history
    if (Math.random() > 0.5) {
      loops.push(generateRalphLoop(weaver));
    }
  });
  
  // Generate threads for each loop
  const threads = loops.map(loop => {
    const weaver = weavers.find(w => w.id === loop.weaverId)!;
    return generateThread(weaver, loop.mode, loop);
  });
  
  // Generate failure domains
  const failureDomains = loops
    .filter(() => Math.random() > 0.6)
    .flatMap(loop => Array.from({ length: randomInt(1, 3) }, () => generateFailureDomain(loop.id)));
  
  // Generate global safeguards
  const safeguards = Array.from({ length: randomInt(5, 10) }, generateSafeguard);
  
  // Generate convoys
  const convoys = Array.from({ length: 3 }, () => generateConvoy(loops));
  
  // Generate system health
  const interventionsRequired = loops.filter(l => l.interventionRequired).length;
  const systemHealth: SystemHealth = {
    overallScore: interventionsRequired > 2 ? randomInt(60, 80) : randomInt(85, 100),
    deploymentStatus: interventionsRequired > 3 ? 'degraded' : 'healthy',
    lastDeploy: `${randomInt(1, 12)}h ago`,
    rollbacksLast24h: randomInt(0, 3),
    activeLoops: loops.filter(l => l.status === 'spinning').length,
    interventionsRequired,
    safeguardsActive: safeguards.filter(s => s.status === 'active').length,
    safeguardsTriggered: safeguards.filter(s => s.status === 'triggered').length,
  };
  
  return {
    weavers,
    loops,
    threads,
    convoys,
    failureDomains,
    safeguards,
    systemHealth,
  };
}
