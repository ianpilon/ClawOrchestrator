import { useState, useMemo } from 'react';
import { NetworkCanvas } from '@/components/NetworkCanvas';
import { ProfileCard } from '@/components/ProfileCard';
import { generateGraphData, NodeData } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnimatePresence } from 'framer-motion';
import { Activity, Users, Filter, Star, Share2 } from 'lucide-react';

// Generate data once
const graphData = generateGraphData(1000);

export default function Home() {
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [filter, setFilter] = useState<'all' | 'exceptional'>('all');

  // Stats
  const totalNodes = graphData.nodes.length;
  const exceptionalCount = graphData.nodes.filter(n => n.exceptional).length;

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden font-sans">
      
      {/* Background Graph */}
      <NetworkCanvas 
        data={graphData} 
        onNodeClick={setSelectedNode} 
        filter={filter}
      />

      {/* Header / Nav Overlay */}
      <div className="absolute top-0 left-0 right-0 p-6 pointer-events-none flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent z-10 h-32">
        <div className="pointer-events-auto flex items-center gap-4">
          <div className="bg-background/50 backdrop-blur-md p-2 rounded-lg border border-white/10">
             <Activity className="text-primary w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display text-white tracking-tight">TalentGraph<span className="text-primary">.ai</span></h1>
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Network Intelligence System v2.4</p>
          </div>
        </div>

        <div className="pointer-events-auto flex gap-3">
          <Button variant="outline" className="border-white/10 bg-black/40 backdrop-blur text-white hover:bg-white/10">
            <Share2 className="w-4 h-4 mr-2" /> Share View
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-white border-0 shadow-lg shadow-primary/20">
            Connect Wallet
          </Button>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-8 left-8 z-10 pointer-events-auto space-y-4">
        
        {/* Stats Card */}
        <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-xl min-w-[240px]">
           <div className="flex justify-between items-center mb-2">
             <span className="text-xs text-muted-foreground uppercase font-mono">Total Talent</span>
             <span className="text-lg font-bold font-mono text-white">{totalNodes}</span>
           </div>
           <div className="flex justify-between items-center">
             <span className="text-xs text-primary uppercase font-mono">Exceptional</span>
             <span className="text-lg font-bold font-mono text-primary">{exceptionalCount}</span>
           </div>
        </div>

        {/* Filter Switch */}
        <div className="bg-black/60 backdrop-blur-md border border-white/10 p-1.5 rounded-lg flex gap-1">
          <Button 
            variant={filter === 'all' ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={() => setFilter('all')}
            className={`flex-1 ${filter === 'all' ? 'bg-white/20 text-white' : 'text-muted-foreground hover:text-white'}`}
          >
            <Users className="w-4 h-4 mr-2" /> All Talent
          </Button>
          <Button 
            variant={filter === 'exceptional' ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={() => setFilter('exceptional')}
            className={`flex-1 ${filter === 'exceptional' ? 'bg-primary/20 text-primary hover:bg-primary/30' : 'text-muted-foreground hover:text-white'}`}
          >
            <Star className="w-4 h-4 mr-2" /> Exceptional Only
          </Button>
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
