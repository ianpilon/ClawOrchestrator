import { useState, useMemo } from 'react';
import { NetworkCanvas } from '@/components/NetworkCanvas';
import { ProfileCard } from '@/components/ProfileCard';
import { TwitterDropdown } from '@/components/TwitterDropdown';
import { generateGraphData, NodeData } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnimatePresence } from 'framer-motion';
import { Crosshair, ShieldAlert, Target, Share2, Search } from 'lucide-react';
import { VoiceAI } from '@/components/VoiceAI';

// Generate data once (total ~27,500 nodes across all organizations)
const graphData = generateGraphData();

export default function Home() {
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [filter, setFilter] = useState<'all' | 'exceptional'>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isTwitterOpen, setIsTwitterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);

  // Stats
  const totalNodes = graphData.nodes.length;
  const exceptionalCount = graphData.nodes.filter(n => n.exceptional).length;

  // Search results - limit to 8 for dropdown
  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) return [];
    const query = searchQuery.toLowerCase();
    return graphData.nodes
      .filter(n => n.name.toLowerCase().includes(query))
      .slice(0, 8);
  }, [searchQuery]);

  const handleSearchSelect = (node: NodeData) => {
    setSearchQuery('');
    setFocusNodeId(node.id);
    // Reset focus after a moment so it can be triggered again for same node
    setTimeout(() => setFocusNodeId(null), 100);
  };

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden font-sans selection:bg-primary/20">
      
      {/* Background Graph */}
      <NetworkCanvas 
        data={graphData} 
        onNodeClick={setSelectedNode} 
        filter={filter}
        onZoomChange={setZoomLevel}
        selectedNodeId={selectedNode?.id || null}
        focusNodeId={focusNodeId}
      />

      {/* Header / Nav Overlay */}
      <div className="absolute top-0 left-0 right-0 p-6 pointer-events-none flex justify-between items-start z-10 h-32">
        <div className="pointer-events-auto flex items-start gap-6">
          <div className="flex flex-col gap-3">
            <div className="hud-panel p-4 w-72 hud-corner-tl">
               <div className="flex items-center gap-3 mb-2">
                  <div className="status-indicator" />
                  <span className="hud-text text-primary font-bold">Global Situational Awareness System</span>
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
            
            <VoiceAI />
          </div>
          
          <div className="hud-panel p-3 flex gap-6 items-center">
             <div className="text-center px-2">
                <span className="block text-xl font-mono text-foreground">{totalNodes}</span>
                <span className="hud-text">People</span>
             </div>
             <div className="w-px h-8 bg-white/5" />
             <div className="text-center px-2">
                <span className="block text-xl font-mono text-secondary">{exceptionalCount}</span>
                <span className="hud-text text-secondary/70">Exceptional Talent</span>
             </div>
             <div className="w-px h-8 bg-white/5" />
             <div className="text-center px-2">
                <span className="block text-xl font-mono text-primary">{zoomLevel.toFixed(1)}x</span>
                <span className="hud-text text-primary/70">Zoom</span>
             </div>
          </div>
        </div>

        <div className="pointer-events-auto flex gap-3 relative">
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
          
          {/* Search Input */}
          <div className="relative px-1 pb-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name..."
                data-testid="input-search"
                className="w-full h-8 pl-8 pr-3 bg-black/30 border border-white/10 rounded-none text-xs text-white placeholder:text-muted-foreground font-mono focus:outline-none focus:border-primary/50 focus:bg-black/40"
              />
            </div>
            
            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute left-1 right-1 top-full mt-1 bg-background/95 border border-white/10 backdrop-blur-sm z-50 max-h-64 overflow-y-auto">
                {searchResults.map((node) => (
                  <button
                    key={node.id}
                    onClick={() => handleSearchSelect(node)}
                    data-testid={`search-result-${node.id}`}
                    className="w-full px-3 py-2 flex items-center gap-3 text-left hover:bg-white/5 border-b border-white/5 last:border-b-0 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                      {node.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white font-medium truncate">{node.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{node.role} • {node.company}</div>
                    </div>
                    {node.exceptional && (
                      <div className="w-2 h-2 rounded-full bg-secondary flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex gap-1 bg-black/20 p-1">
            <Button 
              variant="ghost"
              onClick={() => setFilter('all')}
              className={`flex-1 rounded-none font-mono text-[10px] uppercase h-8 ${filter === 'all' ? 'bg-white/10 text-white' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}
            >
              All People
            </Button>
            <Button 
              variant="ghost"
              onClick={() => setFilter('exceptional')}
              className={`flex-1 rounded-none font-mono text-[10px] uppercase h-8 ${filter === 'exceptional' ? 'bg-secondary/10 text-secondary border border-secondary/20' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}
            >
              Exceptional Only
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
            graphData={graphData}
            onNodeSelect={(node) => {
              setSelectedNode(node);
              setFocusNodeId(node.id);
              setTimeout(() => setFocusNodeId(null), 100);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
