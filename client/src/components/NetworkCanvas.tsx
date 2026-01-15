import ForceGraph2D from 'react-force-graph-2d';
import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import avatarMale from '@assets/generated_images/cyberpunk_tech_professional_avatar_male.png';
import avatarFemale from '@assets/generated_images/cyberpunk_tech_professional_avatar_female.png';
import avatarAndro from '@assets/generated_images/cyberpunk_tech_professional_avatar_androgynous.png';

interface NetworkCanvasProps {
  data: any;
  onNodeClick: (node: any) => void;
  filter: 'all' | 'exceptional';
}

export function NetworkCanvas({ data, onNodeClick, filter }: NetworkCanvasProps) {
  const graphRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ w: window.innerWidth, h: window.innerHeight });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ w: window.innerWidth, h: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Preload images
  const images = useRef<Record<string, HTMLImageElement>>({});
  useEffect(() => {
    [avatarMale, avatarFemale, avatarAndro].forEach(src => {
      const img = new Image();
      img.src = src;
      images.current[src] = img;
    });
  }, []);

  // Configure Forces for "Cluster" layout
  useEffect(() => {
    if (graphRef.current) {
      // 1. Charge: Repulsion. Negative value pushes nodes apart.
      // Stronger repulsion (-80) prevents the tight ball.
      graphRef.current.d3Force('charge').strength(-200).distanceMax(600);

      // 2. Link: Connection stiffness/length.
      // Longer distance allows clusters to separate.
      graphRef.current.d3Force('link').distance(70);

      // 3. Collide: Prevent overlap
      graphRef.current.d3Force('collide', d3.forceCollide(12));

      // 4. Center: Keep it visible in viewport, but don't crush it
      graphRef.current.d3Force('center').strength(0.01);
      
      // 5. Custom Cluster Force: Pull nodes towards distinct focal points based on their group
      // This forces the "geographic" separation
      const clusterForce = (alpha: number) => {
        data.nodes.forEach((node: any) => {
          // Define explicit centers for clusters (8 clusters total in mockData)
          // We distribute them in a ring or varied positions
          const clusterId = node.clusterGroup || 0;
          
          // SF (0) - Center Left (Large)
          // NY (1) - Top Right
          // London (2) - Far Right
          // Waterloo (3) - Top Left
          // Remote (4) - Bottom Center (Scattered)
          // Tokyo (5) - Bottom Right
          // Berlin (6) - Top Center
          // Singapore (7) - Bottom Left
          
          const centers: Record<number, {x: number, y: number}> = {
            0: { x: -300, y: 0 },    // SF
            1: { x: 300, y: -200 },  // NY
            2: { x: 500, y: -50 },   // London
            3: { x: -200, y: -300 }, // Waterloo
            4: { x: 0, y: 400 },     // Remote
            5: { x: 400, y: 300 },   // Tokyo
            6: { x: 100, y: -400 },  // Berlin
            7: { x: -400, y: 200 },  // Singapore
          };
          
          const target = centers[clusterId] || { x: 0, y: 0 };
          
          // Move towards target
          node.vx += (target.x - node.x) * 1 * alpha;
          node.vy += (target.y - node.y) * 1 * alpha;
        });
      };
      
      // Register custom force
      graphRef.current.d3Force('cluster', clusterForce);

      // Re-heat simulation
      graphRef.current.d3ReheatSimulation();
    }
  }, [graphRef.current, data]);

  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isExceptional = node.exceptional;
    const isFilteredOut = filter === 'exceptional' && !isExceptional;
    
    // Dim nodes if filtered out
    const opacity = isFilteredOut ? 0.05 : 1;
    
    // Base size
    const size = isExceptional ? 6 : 4;
    
    // Glow for exceptional nodes
    if (isExceptional && !isFilteredOut) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, size + 4, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'rgba(124, 58, 237, 0.2)'; // Primary purple glow (outer)
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(node.x, node.y, size + 2, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'rgba(124, 58, 237, 0.4)'; // Primary purple glow (inner)
      ctx.fill();
    }

    // Draw circle background
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
    // Use color to distinguish clusters slightly? No, stick to design system for now.
    // Maybe use location mapping if requested later.
    ctx.fillStyle = isExceptional ? '#7c3aed' : '#2dd4bf'; // Purple or Teal
    ctx.globalAlpha = opacity;
    ctx.fill();

    // Draw Image (if scale is large enough to matter)
    if (globalScale > 1.2 && !isFilteredOut) {
      const img = images.current[node.img];
      if (img) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
        ctx.clip();
        ctx.drawImage(img, node.x - size, node.y - size, size * 2, size * 2);
        ctx.restore();
      }
    }
    
    // Reset alpha
    ctx.globalAlpha = 1;

    // Draw label on hover or high scale
    if (globalScale > 2.5 && !isFilteredOut) {
       ctx.font = `${isExceptional ? '600' : '400'} 4px Sans-Serif`;
       ctx.textAlign = 'center';
       ctx.textBaseline = 'top';
       ctx.fillStyle = isExceptional ? '#fff' : 'rgba(255,255,255,0.7)';
       ctx.fillText(node.name, node.x, node.y + size + 2);
    }
  }, [filter]);

  return (
    <div className="absolute inset-0 bg-background overflow-hidden cursor-crosshair">
      <ForceGraph2D
        ref={graphRef}
        width={dimensions.w}
        height={dimensions.h}
        graphData={data}
        nodeLabel="name"
        backgroundColor="#050505" // dark bg
        nodeRelSize={6}
        linkColor={() => '#3f3f46'} // zinc-700
        linkWidth={1}
        onNodeClick={(node: any) => {
            // Zoom to node
            graphRef.current?.centerAt(node.x, node.y, 1000);
            graphRef.current?.zoom(5, 2000);
            onNodeClick(node);
        }}
        nodeCanvasObject={paintNode}
        cooldownTicks={200} // Longer cooldown to let it settle
        d3AlphaDecay={0.01} // Slower decay for better settling
        d3VelocityDecay={0.4} // More friction to stop jitter
        warmupTicks={100} // Compute layout before showing
      />
    </div>
  );
}
