import ForceGraph2D from 'react-force-graph-2d';
import { useRef, useEffect, useState, useCallback } from 'react';
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

  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isExceptional = node.exceptional;
    const isFilteredOut = filter === 'exceptional' && !isExceptional;
    
    // Dim nodes if filtered out
    const opacity = isFilteredOut ? 0.1 : 1;
    
    // Base size
    const size = isExceptional ? 6 : 4;
    
    // Glow for exceptional nodes
    if (isExceptional && !isFilteredOut) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, size + 2, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'rgba(124, 58, 237, 0.4)'; // Primary purple glow
      ctx.fill();
    }

    // Draw circle background
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
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
    // (ForceGraph handles label prop separately, but we can custom draw text here too)
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
            graphRef.current?.zoom(4, 2000);
            onNodeClick(node);
        }}
        nodeCanvasObject={paintNode}
        cooldownTicks={100}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
      />
    </div>
  );
}
