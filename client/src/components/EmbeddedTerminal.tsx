import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useTerminalSession, TerminalLine } from '@/hooks/useTerminalSession';
import { Terminal, ChevronRight, Loader2, X, Maximize2, Minimize2 } from 'lucide-react';

interface EmbeddedTerminalProps {
  loopId?: string;
  loopName?: string;
  mode?: 'full' | 'compact' | 'inline';
  initialLines?: TerminalLine[];
  onCommand?: (command: string) => Promise<string | void>;
  onClose?: () => void;
  className?: string;
  showHeader?: boolean;
  maxHeight?: string;
}

export function EmbeddedTerminal({
  loopId,
  loopName,
  mode = 'full',
  initialLines,
  onCommand,
  onClose,
  className = '',
  showHeader = true,
  maxHeight = '300px',
}: EmbeddedTerminalProps) {
  const [input, setInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(mode !== 'compact');
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const {
    lines,
    isProcessing,
    executeCommand,
    navigateHistory,
    clearTerminal,
  } = useTerminalSession({ loopId, onCommand, initialLines });

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isProcessing) {
      if (input.toLowerCase().trim() === 'clear') {
        clearTerminal();
        setInput('');
      } else {
        executeCommand(input);
        setInput('');
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevCommand = navigateHistory('up');
      setInput(prevCommand);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextCommand = navigateHistory('down');
      setInput(nextCommand);
    }
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'input': return 'text-emerald-400';
      case 'output': return 'text-gray-300';
      case 'error': return 'text-red-400';
      case 'system': return 'text-amber-400';
      default: return 'text-gray-400';
    }
  };

  const getLinePrefix = (type: TerminalLine['type']) => {
    switch (type) {
      case 'input': return '$ ';
      case 'output': return '';
      case 'error': return 'ERROR: ';
      case 'system': return '> ';
      default: return '';
    }
  };

  if (mode === 'compact' && !isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={`terminal-compact flex items-center gap-2 px-3 py-1.5 text-xs ${className}`}
        data-testid={`terminal-expand-${loopId || 'global'}`}
      >
        <Terminal className="w-3 h-3 text-emerald-400" />
        <span className="text-muted-foreground">Terminal</span>
        {lines.length > 0 && (
          <span className="text-emerald-400 font-mono">{lines.length}</span>
        )}
      </button>
    );
  }

  return (
    <div 
      className={`terminal-container flex flex-col ${className}`}
      onClick={focusInput}
      data-testid={`terminal-${loopId || 'global'}`}
    >
      {showHeader && (
        <div className="terminal-header flex items-center justify-between px-3 py-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono text-muted-foreground">
              {loopName || loopId || 'claude-code'}
            </span>
            {isProcessing && (
              <Loader2 className="w-3 h-3 text-emerald-400 animate-spin" />
            )}
          </div>
          <div className="flex items-center gap-1">
            {mode === 'compact' && (
              <button
                onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                className="p-1 hover:bg-white/5 rounded"
                data-testid={`terminal-minimize-${loopId || 'global'}`}
              >
                <Minimize2 className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
            {onClose && (
              <button
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="p-1 hover:bg-white/5 rounded"
                data-testid={`terminal-close-${loopId || 'global'}`}
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      )}

      <div 
        ref={outputRef}
        className="terminal-output flex-1 overflow-y-auto px-3 py-2 font-mono text-xs leading-relaxed"
        style={{ maxHeight: maxHeight }}
      >
        {lines.length === 0 && (
          <div className="text-muted-foreground/50 italic">
            Type 'help' for available commands...
          </div>
        )}
        {lines.map((line) => (
          <div 
            key={line.id} 
            className={`terminal-line ${getLineColor(line.type)} whitespace-pre-wrap break-words`}
          >
            <span className="opacity-60">{getLinePrefix(line.type)}</span>
            {line.content}
          </div>
        ))}
        {isProcessing && (
          <div className="text-emerald-400/50 flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Processing...</span>
          </div>
        )}
      </div>

      <div className="terminal-input-container flex items-center gap-2 px-3 py-2 border-t border-white/5">
        <ChevronRight className="w-3 h-3 text-emerald-400 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isProcessing}
          placeholder={isProcessing ? 'Processing...' : 'Enter command...'}
          className="terminal-input flex-1 bg-transparent border-none outline-none text-xs font-mono text-gray-200 placeholder:text-muted-foreground/30"
          autoComplete="off"
          spellCheck={false}
          data-testid={`terminal-input-${loopId || 'global'}`}
        />
      </div>
    </div>
  );
}
