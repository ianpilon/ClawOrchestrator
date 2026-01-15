import { Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function VoiceAI() {
  return (
    <div className="hud-panel p-3 w-72 relative">
      <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-primary/50" />
      <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-primary/50" />
      <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-primary/50" />
      <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-primary/50" />
      
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Mic className="w-3 h-3 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <img src="/xai-logo.png" alt="xAI" className="h-3 w-auto opacity-70" />
              <span className="text-xs font-mono text-foreground uppercase tracking-wide">Voice AI</span>
            </div>
          </div>
        </div>
        <Button 
          size="sm"
          className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 hover:border-primary/50 font-mono uppercase text-[10px] rounded-none h-6 px-3"
          data-testid="button-voice-start"
        >
          Start
        </Button>
      </div>
      
      <div className="flex items-center gap-2 py-2 px-2 bg-black/30 border border-white/5">
        <div className="w-2 h-2 bg-emerald-500/80 animate-pulse" />
        <span className="text-[11px] font-mono text-muted-foreground">Ready - tap to start</span>
      </div>
      
      <div className="mt-2 text-center">
        <span className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-widest">
          Powered by Grok Voice AI
        </span>
      </div>
    </div>
  );
}
