import { useState, useMemo } from 'react';
import { NetworkCanvas } from '@/components/NetworkCanvas';
import { ProfileCard } from '@/components/ProfileCard';
import { TwitterDropdown } from '@/components/TwitterDropdown';
import { generateGraphData, NodeData } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnimatePresence } from 'framer-motion';
import { Crosshair, ShieldAlert, Target, Share2, Terminal } from 'lucide-react';

// Generate data once (total ~27,500 nodes across all organizations)
const graphData = generateGraphData();

export default function Home() {
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [filter, setFilter] = useState<'all' | 'exceptional'>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isTwitterOpen, setIsTwitterOpen] = useState(false);

  // Stats
  const totalNodes = graphData.nodes.length;
  const exceptionalCount = graphData.nodes.filter(n => n.exceptional).length;

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden font-sans selection:bg-primary/20">
      
      {/* Background Graph */}
      <NetworkCanvas 
        data={graphData} 
        onNodeClick={setSelectedNode} 
        filter={filter}
        onZoomChange={setZoomLevel}
        selectedNodeId={selectedNode?.id || null}
      />

      {/* Header / Nav Overlay */}
      <div className="absolute top-0 left-0 right-0 p-6 pointer-events-none flex justify-between items-start z-10 h-32">
        <div className="pointer-events-auto flex items-start gap-6">
          <div className="hud-panel p-4 w-72 hud-corner-tl">
             <div className="flex items-center gap-3 mb-2">
                <div className="status-indicator" />
                <span className="hud-text text-primary font-bold">SENTRIX // RECON</span>
             </div>
             <div className="h-px bg-white/5 w-full mb-3" />
             <h1 className="text-2xl font-bold uppercase tracking-wider text-foreground flex items-center gap-3">
               <img src="/xai-logo.png" alt="xAI" className="h-6 w-auto" />
               Talent Grid <span className="text-white/20">V.01</span>
             </h1>
             <p className="hud-text mt-1">
                Sector: <span className="text-secondary">Global</span> // Status: <span className="text-primary">Online</span>
             </p>
          </div>
          
          <div className="hud-panel p-3 flex gap-6 items-center">
             <div className="text-center px-2">
                <span className="block text-xl font-mono text-foreground">{totalNodes}</span>
                <span className="hud-text">Units</span>
             </div>
             <div className="w-px h-8 bg-white/5" />
             <div className="text-center px-2">
                <span className="block text-xl font-mono text-secondary">{exceptionalCount}</span>
                <span className="hud-text text-secondary/70">HVT</span>
             </div>
             <div className="w-px h-8 bg-white/5" />
             <div className="text-center px-2">
                <span className="block text-xl font-mono text-primary">{zoomLevel.toFixed(1)}x</span>
                <span className="hud-text text-primary/70">Zoom</span>
             </div>
          </div>
        </div>

        <div className="pointer-events-auto flex gap-3 relative">
          <Button variant="outline" className="hud-panel border-white/5 text-xs font-mono uppercase hover:bg-white/5 text-muted-foreground hover:text-foreground rounded-none h-10 px-4">
            <Terminal className="w-3 h-3 mr-2" /> Logs
          </Button>
          <Button 
            onClick={() => setIsTwitterOpen(!isTwitterOpen)}
            className={`bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/50 font-mono uppercase rounded-none h-10 px-6 backdrop-blur-sm transition-all ${isTwitterOpen ? 'bg-primary/20 border-primary/50' : ''}`}
          >
             <img src="/x-logo.png" alt="X" className="w-3 h-3 mr-2" /> Connect
          </Button>
          <TwitterDropdown isOpen={isTwitterOpen} onClose={() => setIsTwitterOpen(false)} />
        </div>
      </div>

      {/* Subtle Map Overlays - Refined */}
      <div className="absolute inset-0 pointer-events-none">
         {/* Large Circle */}
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] border border-white/5 rounded-full" />
         
         {/* Corner Markers */}
         <div className="absolute top-12 left-12 w-4 h-4 border-t border-l border-white/10" />
         <div className="absolute top-12 right-12 w-4 h-4 border-t border-r border-white/10" />
         <div className="absolute bottom-12 left-12 w-4 h-4 border-b border-l border-white/10" />
         <div className="absolute bottom-12 right-12 w-4 h-4 border-b border-r border-white/10" />
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-8 left-8 z-10 pointer-events-auto w-80">
        <div className="hud-panel p-1 hud-corner-bl flex flex-col gap-1">
          <div className="flex items-center justify-between p-2 mb-1">
             <span className="hud-text">Signal Filter</span>
             <Target className="w-3 h-3 text-muted-foreground" />
          </div>
          <div className="flex gap-1 bg-black/20 p-1">
            <Button 
              variant="ghost"
              onClick={() => setFilter('all')}
              className={`flex-1 rounded-none font-mono text-[10px] uppercase h-8 ${filter === 'all' ? 'bg-white/10 text-white' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}
            >
              All Signals
            </Button>
            <Button 
              variant="ghost"
              onClick={() => setFilter('exceptional')}
              className={`flex-1 rounded-none font-mono text-[10px] uppercase h-8 ${filter === 'exceptional' ? 'bg-secondary/10 text-secondary border border-secondary/20' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}
            >
              HVT Only
            </Button>
          </div>
        </div>
      </div>

      {/* Contextual Card Sidebar */}
      <AnimatePresence>
        {selectedNode && (
          <ProfileCard 
            node={selectedNode} 
            onClose={() => setSelectedNode(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
