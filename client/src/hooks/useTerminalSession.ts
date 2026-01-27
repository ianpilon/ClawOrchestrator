import { useState, useCallback, useRef } from 'react';

export interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'system';
  content: string;
  timestamp: Date;
}

export interface TerminalSession {
  lines: TerminalLine[];
  isProcessing: boolean;
  commandHistory: string[];
  historyIndex: number;
}

interface UseTerminalSessionOptions {
  loopId?: string;
  onCommand?: (command: string) => Promise<string | void>;
  initialLines?: TerminalLine[];
}

export function useTerminalSession(options: UseTerminalSessionOptions = {}) {
  const { loopId, onCommand, initialLines = [] } = options;
  
  const [lines, setLines] = useState<TerminalLine[]>(initialLines);
  const [isProcessing, setIsProcessing] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const lineIdCounter = useRef(0);

  const generateLineId = useCallback(() => {
    lineIdCounter.current += 1;
    return `line-${loopId || 'global'}-${lineIdCounter.current}-${Date.now()}`;
  }, [loopId]);

  const addLine = useCallback((type: TerminalLine['type'], content: string) => {
    const newLine: TerminalLine = {
      id: generateLineId(),
      type,
      content,
      timestamp: new Date(),
    };
    setLines(prev => [...prev, newLine]);
    return newLine;
  }, [generateLineId]);

  const executeCommand = useCallback(async (command: string) => {
    if (!command.trim()) return;

    addLine('input', command);
    setCommandHistory(prev => [...prev, command]);
    setHistoryIndex(-1);
    setIsProcessing(true);

    try {
      if (onCommand) {
        const response = await onCommand(command);
        if (response) {
          addLine('output', response);
        }
      } else {
        await simulateAgentResponse(command, addLine);
      }
    } catch (error) {
      addLine('error', error instanceof Error ? error.message : 'Command failed');
    } finally {
      setIsProcessing(false);
    }
  }, [onCommand, addLine]);

  const navigateHistory = useCallback((direction: 'up' | 'down') => {
    if (commandHistory.length === 0) return '';

    let newIndex: number;
    if (direction === 'up') {
      newIndex = historyIndex === -1 
        ? commandHistory.length - 1 
        : Math.max(0, historyIndex - 1);
    } else {
      newIndex = historyIndex === -1 
        ? -1 
        : Math.min(commandHistory.length - 1, historyIndex + 1);
    }

    setHistoryIndex(newIndex);
    return newIndex === -1 ? '' : commandHistory[newIndex];
  }, [commandHistory, historyIndex]);

  const clearTerminal = useCallback(() => {
    setLines([]);
  }, []);

  const addSystemMessage = useCallback((message: string) => {
    addLine('system', message);
  }, [addLine]);

  return {
    lines,
    isProcessing,
    commandHistory,
    executeCommand,
    navigateHistory,
    clearTerminal,
    addSystemMessage,
    addLine,
  };
}

async function simulateAgentResponse(
  command: string, 
  addLine: (type: TerminalLine['type'], content: string) => void
) {
  await new Promise(r => setTimeout(r, 300 + Math.random() * 500));

  const cmd = command.toLowerCase().trim();
  
  if (cmd.startsWith('help')) {
    addLine('output', `Available commands:
  help          Show this help message
  status        Show current loop status
  guide <msg>   Provide guidance to the agent
  retry         Retry the failed operation
  skip          Skip current task and continue
  pause         Pause the current loop
  resume        Resume a paused loop
  context       Show current context
  clear         Clear terminal`);
  } else if (cmd === 'status') {
    addLine('output', `Loop Status: SPINNING
Mode: FORWARD
Wheel Speed: 78%
Refinement Level: 2/5
Current Task: Implementing feature X
Uptime: 2h 34m`);
  } else if (cmd.startsWith('guide ')) {
    const guidance = command.slice(6);
    addLine('system', `Guidance received: "${guidance}"`);
    addLine('output', `Agent acknowledged. Incorporating guidance into next iteration...`);
  } else if (cmd === 'retry') {
    addLine('system', 'Retrying failed operation...');
    await new Promise(r => setTimeout(r, 800));
    addLine('output', 'Operation restarted successfully.');
  } else if (cmd === 'skip') {
    addLine('system', 'Skipping current task...');
    addLine('output', 'Task skipped. Moving to next item in queue.');
  } else if (cmd === 'pause') {
    addLine('system', 'Pausing loop...');
    addLine('output', 'Loop paused. Use "resume" to continue.');
  } else if (cmd === 'resume') {
    addLine('system', 'Resuming loop...');
    addLine('output', 'Loop resumed. Continuing from last checkpoint.');
  } else if (cmd === 'context') {
    addLine('output', `Current Context:
  Project: loom-orchestrator
  Branch: main
  Last Commit: "Add terminal integration"
  Files Modified: 3
  Tests Passing: 47/52`);
  } else if (cmd === 'clear') {
    return;
  } else {
    addLine('output', `Sending to agent: "${command}"
Agent is processing your request...`);
    await new Promise(r => setTimeout(r, 500));
    addLine('output', `Agent response: Command acknowledged. Integrating into current loop context.`);
  }
}
