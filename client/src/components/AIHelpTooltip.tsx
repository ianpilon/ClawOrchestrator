import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ComponentContext {
  componentName: string;
  purpose: string;
  currentState: string;
  availableActions: string[];
  loomConcepts: string[];
}

interface AIHelpTooltipProps {
  context: ComponentContext;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const API_KEY_STORAGE_KEY = 'loom_anthropic_api_key';

export function AIHelpTooltip({ context, position = 'top-right', className = '' }: AIHelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(() => !!localStorage.getItem(API_KEY_STORAGE_KEY));
  const [autoExplained, setAutoExplained] = useState(false);
  const [smartPosition, setSmartPosition] = useState<{ x: 'left' | 'right'; y: 'top' | 'bottom' }>({ x: 'right', y: 'bottom' });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverWidth = 320;
  const popoverHeight = 320;

  useEffect(() => {
    const checkApiKey = () => {
      setHasApiKey(!!localStorage.getItem(API_KEY_STORAGE_KEY));
    };
    window.addEventListener('storage', checkApiKey);
    const interval = setInterval(checkApiKey, 1000);
    return () => {
      window.removeEventListener('storage', checkApiKey);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const contextKey = `${context.componentName}-${context.currentState}`;
  const lastContextKeyRef = useRef<string>('');

  useEffect(() => {
    if (isOpen && hasApiKey) {
      if (!autoExplained || lastContextKeyRef.current !== contextKey) {
        generateAutoExplanation();
        setAutoExplained(true);
        lastContextKeyRef.current = contextKey;
      }
    }
  }, [isOpen, hasApiKey, contextKey]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const calculateSmartPosition = useCallback(() => {
    if (!buttonRef.current) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    const spaceRight = viewportWidth - rect.right;
    const spaceLeft = rect.left;
    const spaceBottom = viewportHeight - rect.bottom;
    const spaceTop = rect.top;
    
    const x: 'left' | 'right' = spaceRight >= popoverWidth ? 'right' : 
                                 spaceLeft >= popoverWidth ? 'left' : 
                                 spaceRight >= spaceLeft ? 'right' : 'left';
    
    const y: 'top' | 'bottom' = spaceBottom >= popoverHeight ? 'bottom' : 
                                 spaceTop >= popoverHeight ? 'top' : 
                                 spaceBottom >= spaceTop ? 'bottom' : 'top';
    
    setSmartPosition({ x, y });
  }, []);

  const handleOpen = () => {
    calculateSmartPosition();
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (!isOpen) return;
    
    const handleResize = () => {
      calculateSmartPosition();
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [isOpen, calculateSmartPosition]);

  const getSystemPrompt = () => {
    return `You are Loom's AI assistant, helping users understand the Loom infrastructure orchestrator.

CONTEXT ABOUT THE COMPONENT THE USER IS VIEWING:
- Component: ${context.componentName}
- Purpose: ${context.purpose}
- Current State: ${context.currentState}
- Available Actions: ${context.availableActions.join(', ')}
- Related Loom Concepts: ${context.loomConcepts.join(', ')}

LOOM PHILOSOPHY:
- "Agents-first, humans-second" - AI agents (Weavers) run autonomously in Ralph loops
- Ralph Loops: Recursive AI coding loops in Forward (building), Reverse (cloning), or System (testing) modes
- Threads: Audit trails of everything agents do, shareable and loadable as context
- "Software is Clay" - get it working, then run more loops to refine
- Humans only intervene when agents encounter failure domains requiring guidance

Be helpful, concise, and explain things in simple terms. Focus on what the user is seeing right now and how it fits into the larger Loom system.`;
  };

  const generateAutoExplanation = useCallback(async () => {
    const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (!apiKey) return;

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/claude/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          messages: [{ role: 'user', content: 'Give me a brief 2-3 sentence explanation of what this component is and what I can do with it right now.' }],
          systemPrompt: getSystemPrompt(),
        }),
      });

      if (!response.ok) throw new Error('Failed to get explanation');

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = '';
      let content = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                content += data.text;
                setMessages([{ role: 'assistant', content }]);
              }
            } catch (e) {}
          }
        }
      }
    } catch (error) {
      setMessages([{ role: 'assistant', content: 'I can help explain this component. What would you like to know?' }]);
    } finally {
      setIsLoading(false);
    }
  }, [context]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const apiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (!apiKey) return;

    const userMessage: ChatMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/claude/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          systemPrompt: getSystemPrompt(),
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = '';
      let content = '';

      setMessages([...newMessages, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                content += data.text;
                setMessages([...newMessages, { role: 'assistant', content }]);
              }
            } catch (e) {}
          }
        }
      }
    } catch (error) {
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) {
      setMessages([]);
      setAutoExplained(false);
    }
  }, [isOpen]);

  const positionClasses = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-10',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2',
  };

  const getPopoverStyle = (): React.CSSProperties => {
    if (!buttonRef.current) {
      return { position: 'fixed', width: popoverWidth, zIndex: 9999 };
    }
    
    const rect = buttonRef.current.getBoundingClientRect();
    const padding = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let left: number;
    let top: number;
    
    if (smartPosition.y === 'bottom') {
      top = rect.bottom + padding;
    } else {
      top = rect.top - popoverHeight - padding;
    }
    
    if (smartPosition.x === 'right') {
      left = rect.left;
    } else {
      left = rect.right - popoverWidth;
    }
    
    if (left + popoverWidth > viewportWidth - padding) {
      left = viewportWidth - popoverWidth - padding;
    }
    if (left < padding) {
      left = padding;
    }
    
    if (top + popoverHeight > viewportHeight - padding) {
      top = viewportHeight - popoverHeight - padding;
    }
    if (top < padding) {
      top = padding;
    }
    
    return {
      position: 'fixed',
      width: popoverWidth,
      maxHeight: popoverHeight,
      zIndex: 9999,
      left,
      top,
    };
  };

  return (
    <div className={`absolute ${positionClasses[position]} z-50 ${className}`}>
      <motion.button
        ref={buttonRef}
        data-testid={`ai-help-${context.componentName.toLowerCase().replace(/\s+/g, '-')}`}
        onClick={handleOpen}
        className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500/80 to-blue-500/80 hover:from-purple-400 hover:to-blue-400 flex items-center justify-center shadow-lg shadow-purple-500/20 border border-white/20 backdrop-blur-sm transition-all"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Sparkles className="w-4 h-4 text-white" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            style={getPopoverStyle()}
            className="bg-slate-900/95 backdrop-blur-xl rounded-lg border border-white/10 shadow-2xl shadow-black/50 overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-white/90">{context.componentName}</span>
              </div>
              <button
                onClick={handleClose}
                className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-white/60" />
              </button>
            </div>

            {!hasApiKey ? (
              <div className="p-4">
                <div className="mb-3 pb-3 border-b border-white/10">
                  <p className="text-sm text-white/80 mb-2 font-medium">About this component:</p>
                  <p className="text-sm text-white/60">{context.purpose}</p>
                </div>
                <div className="text-center bg-purple-500/10 rounded p-3 border border-purple-500/20">
                  <Sparkles className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                  <p className="text-sm text-white/70 mb-1">Want AI-powered explanations?</p>
                  <p className="text-xs text-white/50">Add your Anthropic API key in Settings (gear icon, top-right).</p>
                </div>
              </div>
            ) : (
              <>
                <div className="h-48 overflow-y-auto p-3 space-y-3">
                  {messages.length === 0 && isLoading ? (
                    <div className="flex items-center gap-2 text-white/40">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Analyzing component...</span>
                    </div>
                  ) : (
                    messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`text-sm ${
                          msg.role === 'user'
                            ? 'text-blue-300 pl-4 border-l-2 border-blue-500/50'
                            : 'text-white/80'
                        }`}
                      >
                        {msg.content}
                      </div>
                    ))
                  )}
                  {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                    <div className="flex items-center gap-2 text-white/40">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-2 border-t border-white/10 bg-black/20">
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask about this component..."
                      className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/50"
                      disabled={isLoading}
                    />
                    <Button
                      size="sm"
                      onClick={sendMessage}
                      disabled={!input.trim() || isLoading}
                      className="bg-purple-500/80 hover:bg-purple-500 px-2"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
