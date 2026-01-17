import ForceGraph2D from 'react-force-graph-2d';
import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import avatarMale from '@assets/generated_images/cyberpunk_tech_professional_avatar_male.png';
import avatarFemale from '@assets/generated_images/cyberpunk_tech_professional_avatar_female.png';
import avatarAndro from '@assets/generated_images/cyberpunk_tech_professional_avatar_androgynous.png';

interface NetworkCanvasProps {
  data: any;
  onNodeClick: (node: any) => void;
  filter: 'all' | 'exceptional';
  onZoomChange?: (zoom: number) => void;
  selectedNodeId?: string | null;
  focusNodeId?: string | null;
}

export function NetworkCanvas({ data, onNodeClick, filter, onZoomChange, selectedNodeId, focusNodeId }: NetworkCanvasProps) {
  const graphRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ w: window.innerWidth, h: window.innerHeight });
  
  // Build set of neighbor IDs for the selected node
  const neighborIds = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    
    const neighbors = new Set<string>();
    neighbors.add(selectedNodeId);
    
    data.links.forEach((link: any) => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      
      if (sourceId === selectedNodeId) neighbors.add(targetId);
      if (targetId === selectedNodeId) neighbors.add(sourceId);
    });
    
    return neighbors;
  }, [selectedNodeId, data.links]);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ w: window.innerWidth, h: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter links when in HVT mode - only show connections between exceptional nodes
  const filteredData = useMemo(() => {
    if (filter !== 'exceptional') return data;
    
    const exceptionalIds = new Set(
      data.nodes.filter((n: any) => n.exceptional).map((n: any) => n.id)
    );
    
    const filteredLinks = data.links.filter((link: any) => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      return exceptionalIds.has(sourceId) && exceptionalIds.has(targetId);
    });
    
    return { nodes: data.nodes, links: filteredLinks };
  }, [data, filter]);

  // Preload images
  const images = useRef<Record<string, HTMLImageElement>>({});
  useEffect(() => {
    [avatarMale, avatarFemale, avatarAndro].forEach(src => {
      const img = new Image();
      img.src = src;
      images.current[src] = img;
    });
  }, []);

  const clusterCenters: Record<number, {x: number, y: number, label: string}> = {
    0: { x: 0, y: 0, label: 'UWaterloo Software Engineering' },
  };

  // Configure Forces for "Cluster" layout - optimized for large datasets
  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.d3Force('charge').strength(-30).distanceMax(300);
      graphRef.current.d3Force('link').distance(20);
      graphRef.current.d3Force('collide', d3.forceCollide(3));
      graphRef.current.d3Force('center').strength(0.02);
      
      const clusterForce = (alpha: number) => {
        data.nodes.forEach((node: any) => {
          const clusterId = node.clusterGroup || 0;
          const target = clusterCenters[clusterId] || { x: 0, y: 0 };
          
          node.vx += (target.x - node.x) * 1 * alpha;
          node.vy += (target.y - node.y) * 1 * alpha;
        });
      };
      
      graphRef.current.d3Force('cluster', clusterForce);
      graphRef.current.d3ReheatSimulation();
    }
  }, [graphRef.current, data]);

  // Handle focus/zoom to a specific node from search
  useEffect(() => {
    if (focusNodeId && graphRef.current) {
      const node = data.nodes.find((n: any) => n.id === focusNodeId);
      if (node) {
        // Lock all nodes to prevent jiggle
        data.nodes.forEach((n: any) => {
          n.fx = n.x;
          n.fy = n.y;
        });
        
        // Zoom to the node
        graphRef.current.centerAt(node.x, node.y, 1000);
        graphRef.current.zoom(2.4, 2000);
        
        // Trigger node click to open profile
        onNodeClick(node);
      }
    }
  }, [focusNodeId]);

  const drawClusterLabels = useCallback((ctx: CanvasRenderingContext2D, globalScale: number) => {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Dynamic font size - bigger when zoomed out, smaller when zoomed in
    const baseFontSize = 14;
    const fontSize = Math.min(24, Math.max(8, baseFontSize / globalScale));
    const labelOffset = 85 / globalScale;
    const padding = 6 / globalScale;
    const rectHeight = 18 / globalScale;
    
    Object.values(clusterCenters).forEach(center => {
      // Draw Grid Marker - Subtle Circle (also scale with zoom)
      const markerSize = 80 / globalScale;
      const crosshairSize = 10 / globalScale;
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1 / globalScale;
      
      ctx.beginPath();
      ctx.arc(center.x, center.y, markerSize, 0, 2 * Math.PI);
      ctx.stroke();

      // Crosshair center
      ctx.beginPath();
      ctx.moveTo(center.x - crosshairSize, center.y);
      ctx.lineTo(center.x + crosshairSize, center.y);
      ctx.moveTo(center.x, center.y - crosshairSize);
      ctx.lineTo(center.x, center.y + crosshairSize);
      ctx.stroke();

      // Label background for visibility
      ctx.font = `bold ${fontSize}px "Share Tech Mono"`;
      const textWidth = ctx.measureText(center.label).width;
      ctx.fillStyle = 'rgba(22, 24, 29, 0.85)';
      ctx.fillRect(center.x - textWidth/2 - padding, center.y + labelOffset, textWidth + padding * 2, rectHeight);
      
      // Label border
      ctx.strokeStyle = 'rgba(130, 207, 255, 0.3)';
      ctx.lineWidth = 1 / globalScale;
      ctx.strokeRect(center.x - textWidth/2 - padding, center.y + labelOffset, textWidth + padding * 2, rectHeight);

      // Label text
      ctx.fillStyle = '#82cfff';
      ctx.fillText(center.label, center.x, center.y + labelOffset + rectHeight / 2);
    });
    
    ctx.restore();
  }, []);

  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isExceptional = node.exceptional;
    const isFilteredOut = filter === 'exceptional' && !isExceptional;
    const isSelected = node.id === selectedNodeId;
    const isNeighbor = neighborIds.has(node.id);
    const hasSelection = selectedNodeId !== null && selectedNodeId !== undefined;
    
    // Opacity: faded if filtered, or if there's a selection and this node isn't connected
    let opacity = 1;
    if (isFilteredOut) {
      opacity = 0.02;
    } else if (hasSelection && !isNeighbor) {
      opacity = 0.15; // Fade non-connected nodes when something is selected
    }
    
    // Draw glow for exceptional nodes (brighter if selected/neighbor)
    if (isExceptional && !isFilteredOut) {
      ctx.beginPath();
      const glowSize = isSelected ? 10 : (isNeighbor && hasSelection ? 8 : 6);
      ctx.arc(node.x, node.y, glowSize, 0, 2 * Math.PI, false);
      ctx.fillStyle = isSelected ? 'rgba(252, 165, 165, 0.35)' : 'rgba(252, 165, 165, 0.15)';
      ctx.globalAlpha = hasSelection && !isNeighbor ? 0.15 : 1;
      ctx.fill();
      
      // Target ring
      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth = isSelected ? 0.8 : 0.3;
      ctx.beginPath();
      ctx.arc(node.x, node.y, glowSize - 1, 0, 2 * Math.PI, false);
      ctx.stroke();
    }

    // Node Body - larger if selected
    const baseSize = isExceptional ? 3 : 1.5;
    const size = isSelected ? baseSize * 2 : (isNeighbor && hasSelection ? baseSize * 1.3 : baseSize);
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
    
    // COLORS: Highlight connected nodes
    if (isSelected) {
      ctx.fillStyle = '#82cfff'; // Bright blue for selected
    } else if (isExceptional) {
      ctx.fillStyle = '#fca5a5'; // Pastel Red
    } else if (isNeighbor && hasSelection) {
      ctx.fillStyle = '#94a3b8'; // Brighter slate for neighbors
    } else {
      ctx.fillStyle = '#475569'; // Slate-600
    }
    
    ctx.globalAlpha = opacity;
    ctx.fill();

    // Reset alpha
    ctx.globalAlpha = 1;

    // Draw label for selected node or neighbors, or at high zoom
    const showLabel = isSelected || (isNeighbor && hasSelection) || (globalScale > 2.5 && !isFilteredOut);
    if (showLabel && !isFilteredOut) {
       ctx.font = isSelected ? 'bold 5px "Share Tech Mono"' : '400 4px "Share Tech Mono"';
       ctx.textAlign = 'left';
       ctx.textBaseline = 'middle';
       ctx.fillStyle = isSelected ? '#82cfff' : (isExceptional ? '#fca5a5' : 'rgba(255,255,255,0.5)');
       ctx.globalAlpha = hasSelection && !isNeighbor ? 0.15 : 1;
       ctx.fillText(`${node.name}`, node.x + size + 4, node.y);
       ctx.globalAlpha = 1;
    }
  }, [filter, selectedNodeId, neighborIds]);

  return (
    <div className="absolute inset-0 bg-background overflow-hidden cursor-grab active:cursor-grabbing">
      <ForceGraph2D
        ref={graphRef}
        width={dimensions.w}
        height={dimensions.h}
        graphData={filteredData}
        nodeLabel="name"
        backgroundColor="#00000000" // Transparent
        nodeRelSize={4}
        linkColor={(link: any) => {
          if (!selectedNodeId) return 'rgba(100, 116, 139, 0.6)';
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          const isConnected = sourceId === selectedNodeId || targetId === selectedNodeId;
          return isConnected ? 'rgba(130, 207, 255, 0.9)' : 'rgba(100, 116, 139, 0.1)';
        }}
        linkWidth={(link: any) => {
          if (!selectedNodeId) return 0.8;
          const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
          const targetId = typeof link.target === 'object' ? link.target.id : link.target;
          const isConnected = sourceId === selectedNodeId || targetId === selectedNodeId;
          return isConnected ? 1.5 : 0.3;
        }}
        minZoom={0.5}
        maxZoom={2.4}
        onNodeClick={(node: any) => {
            // NUCLEAR OPTION: Lock all nodes in place to absolutely prevent jiggle
            data.nodes.forEach((n: any) => {
               n.fx = n.x;
               n.fy = n.y;
            });
            
            // Zoom to node (capped at max zoom)
            graphRef.current?.centerAt(node.x, node.y, 1000);
            graphRef.current?.zoom(2.4, 2000);
            
            onNodeClick(node);
        }}
        nodeCanvasObject={paintNode}
        onRenderFramePost={drawClusterLabels}
        cooldownTicks={50} 
        d3AlphaDecay={0.05}
        d3VelocityDecay={0.7}
        warmupTicks={50}
        enableNodeDrag={true}
        onNodeDrag={(node: any) => {
          // During drag, update fixed position to follow cursor smoothly
          node.fx = node.x;
          node.fy = node.y;
        }}
        onNodeDragEnd={(node: any) => {
          // Keep node fixed where user dropped it
          node.fx = node.x;
          node.fy = node.y;
        }}
        onEngineStop={() => {
           // Engine stopped
        }}
        onZoom={(transform: { k: number }) => {
          onZoomChange?.(transform.k);
        }}
      />
    </div>
  );
}
