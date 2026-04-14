import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { TrieNodeData } from '../types';
import { TrieStep } from '../lib/RadixTrie';
import { Play, Pause, SkipBack, SkipForward, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TrieVisualizerProps {
  data: TrieNodeData;
  steps?: TrieStep[];
  onAnimationComplete?: () => void;
}

const TrieVisualizer: React.FC<TrieVisualizerProps> = ({ data, steps, onAnimationComplete }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [visibleNodeIds, setVisibleNodeIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!steps || steps.length === 0) {
      setCurrentStepIndex(0);
      setIsPlaying(false);
      setVisibleNodeIds(new Set());
      return;
    }
    setCurrentStepIndex(0);
    setIsPlaying(true);
  }, [steps]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && steps && steps.length > 0) {
      if (currentStepIndex < steps.length) {
        timer = setTimeout(() => {
          setCurrentStepIndex(prev => prev + 1);
        }, 1000);
      } else {
        setIsPlaying(false);
      }
    }
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, steps]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (steps && steps.length > 0 && currentStepIndex >= steps.length) {
      timer = setTimeout(() => {
        if (onAnimationComplete) onAnimationComplete();
      }, 800);
    }
    return () => clearTimeout(timer);
  }, [currentStepIndex, steps, onAnimationComplete]);

  const activeStep = steps && currentStepIndex < steps.length ? steps[currentStepIndex] : (steps && steps.length > 0 ? steps[steps.length - 1] : null);
  const activeNodeId = activeStep?.nodeId || null;
  const highlightType = activeStep?.type || null;
  const isAnimating = steps && steps.length > 0;

  const displayData = activeStep?.treeSnapshot || data;

  useEffect(() => {
    if (!steps) return;
    const newVisibleIds = new Set<string>();
    for (let i = 0; i <= Math.min(currentStepIndex, steps.length - 1); i++) {
      const step = steps[i];
      if (step.type === 'add' || step.type === 'split' || step.type === 'visit' || step.type === 'mark') {
        newVisibleIds.add(step.nodeId);
      }
    }
    setVisibleNodeIds(newVisibleIds);
  }, [currentStepIndex, steps]);

  useEffect(() => {
    if (!svgRef.current || !displayData) return;

    const width = 1000;
    const height = 600;
    const margin = { top: 60, right: 40, bottom: 40, left: 40 };

    const svg = d3.select(svgRef.current);

    // Initialize SVG structure only once
    if (svg.select('defs').empty()) {
      const defs = svg.append('defs');
      
      const createGlow = (id: string, color: string) => {
        const filter = defs.append('filter')
          .attr('id', id)
          .attr('x', '-50%')
          .attr('y', '-50%')
          .attr('width', '200%')
          .attr('height', '200%');
        
        filter.append('feGaussianBlur')
          .attr('stdDeviation', '4')
          .attr('result', 'coloredBlur');
        
        const feMerge = filter.append('feMerge');
        feMerge.append('feMergeNode').attr('in', 'coloredBlur');
        feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
      };

      createGlow('glow-blue', '#3b82f6');
      createGlow('glow-amber', '#f59e0b');
      createGlow('glow-emerald', '#10b981');
      createGlow('glow-red', '#ef4444');
      createGlow('glow-violet', '#8b5cf6');

      const g = svg.append('g').attr('class', 'main-group')
        .attr('transform', `translate(${margin.left},${margin.top})`);
        
      g.append('g').attr('class', 'links-group');
      g.append('g').attr('class', 'nodes-group');

      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 3])
        .on('zoom', (event) => {
          svg.select('.main-group').attr('transform', event.transform);
        });

      svg.call(zoom as any);
    }

    const g = svg.select('.main-group');
    const linksGroup = g.select('.links-group');
    const nodesGroup = g.select('.nodes-group');

    const treeLayout = d3.tree<TrieNodeData>().size([width - margin.left - margin.right, height - margin.top - margin.bottom]);
    const root = d3.hierarchy(displayData, d => Object.values(d.children));
    const treeData = treeLayout(root);

    const t = d3.transition().duration(500).ease(d3.easeCubicInOut);

    const linkGenerator = d3.linkVertical<any, any>()
      .x(d => d.x)
      .y(d => d.y);

    // Draw links
    const links = linksGroup.selectAll('.link')
      .data(treeData.links(), (d: any) => d.target.data.id);

    links.exit()
      .transition(t as any)
      .attr('d', (d: any) => {
        const o = { x: d.source.x, y: d.source.y };
        return linkGenerator({ source: o, target: o } as any);
      })
      .style('opacity', 0)
      .remove();

    const linksEnter = links.enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', (d: any) => {
        const o = { x: d.source.x, y: d.source.y };
        return linkGenerator({ source: o, target: o } as any);
      })
      .attr('fill', 'none')
      .attr('stroke', '#334155')
      .attr('stroke-width', 2)
      .style('opacity', 0);

    links.merge(linksEnter as any)
      .transition(t as any)
      .attr('d', linkGenerator as any)
      .style('opacity', (d: any) => {
        if (!isAnimating) return 0.6;
        return visibleNodeIds.has(d.target.data.id) ? 0.8 : 0.2;
      })
      .attr('stroke', (d: any) => {
        if (d.target.data.id === activeNodeId) {
          switch (highlightType) {
            case 'add': return '#3b82f6';
            case 'remove': return '#ef4444';
            case 'visit': return '#3b82f6';
            default: return '#3b82f6';
          }
        }
        return visibleNodeIds.has(d.target.data.id) ? '#475569' : '#334155';
      })
      .attr('stroke-width', (d: any) => d.target.data.id === activeNodeId ? 3 : 2);

    // Draw nodes
    const nodes = nodesGroup.selectAll('.node')
      .data(treeData.descendants(), (d: any) => d.data.id);

    nodes.exit()
      .transition(t as any)
      .style('opacity', 0)
      .attr('transform', (d: any) => {
        const parent = d.parent || d;
        return `translate(${parent.x},${parent.y}) scale(0)`;
      })
      .remove();

    const nodesEnter = nodes.enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d: any) => {
        const parent = d.parent;
        if (parent) {
          return `translate(${parent.x},${parent.y}) scale(0)`;
        }
        return `translate(${d.x},${d.y}) scale(0)`;
      })
      .style('opacity', 0);

    nodesEnter.append('circle')
      .attr('r', 22);

    nodesEnter.append('text')
      .attr('dy', '.35em')
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', '700')
      .style('pointer-events', 'none');

    const nodesMerge = nodes.merge(nodesEnter as any);

    nodesMerge.transition(t as any)
      .attr('transform', (d: any) => `translate(${d.x},${d.y}) scale(1)`)
      .style('opacity', (d: any) => {
        if (!isAnimating) return 1;
        return visibleNodeIds.has(d.data.id) ? 1 : 0.4;
      });

    nodesMerge.select('circle')
      .transition(t as any)
      .attr('fill', (d: any) => {
        if (d.data.id === activeNodeId) {
          switch (highlightType) {
            case 'split': return '#f59e0b';
            case 'add': return '#3b82f6';
            case 'remove': return '#ef4444';
            case 'merge': return '#8b5cf6';
            case 'mark': return '#10b981';
            default: return '#3b82f6';
          }
        }
        return d.data.isEndOfWord ? '#10b981' : '#1e293b';
      })
      .attr('stroke', (d: any) => d.data.id === activeNodeId ? '#fff' : (d.data.isEndOfWord ? '#10b981' : '#475569'))
      .attr('stroke-width', (d: any) => d.data.id === activeNodeId ? 3 : 2);

    nodesMerge.select('circle').attr('filter', (d: any) => {
      if (d.data.id !== activeNodeId) return null;
      switch (highlightType) {
        case 'split': return 'url(#glow-amber)';
        case 'add': return 'url(#glow-blue)';
        case 'remove': return 'url(#glow-red)';
        case 'merge': return 'url(#glow-violet)';
        case 'mark': return 'url(#glow-emerald)';
        default: return 'url(#glow-blue)';
      }
    });

    nodesMerge.select('text')
      .text((d: any) => d.data.label)
      .transition(t as any)
      .attr('fill', (d: any) => (d.data.isEndOfWord || d.data.id === activeNodeId) ? '#fff' : '#94a3b8');

  }, [displayData, activeNodeId, highlightType, visibleNodeIds, isAnimating]);

  return (
    <div className="w-full h-full bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden relative shadow-2xl">
      {/* Legend & Status */}
      <div className="absolute top-6 left-6 flex flex-col gap-4 z-10">
        <div className="flex items-center gap-6 bg-slate-800/50 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-white border border-slate-400"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Intermediate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Word End</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#3b82f6] shadow-[0_0_8px_#3b82f6]"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Path</span>
          </div>
        </div>
      </div>

      {/* Mini Log Bar Overlay */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <AnimatePresence mode="wait">
          {activeStep && (
            <motion.div
              key={`${activeStep.nodeId}-${currentStepIndex}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="bg-slate-800/80 backdrop-blur-md border border-slate-700/50 text-slate-200 px-5 py-2.5 rounded-2xl shadow-lg flex items-center gap-3 min-w-[250px] justify-center"
            >
              <div className={`w-2 h-2 rounded-full ${
                activeStep.type === 'remove' ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 
                activeStep.type === 'merge' ? 'bg-violet-500 shadow-[0_0_8px_#8b5cf6]' : 
                activeStep.type === 'split' ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' :
                activeStep.type === 'mark' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' :
                'bg-blue-500 shadow-[0_0_8px_#3b82f6]'
              }`}></div>
              <span className="text-sm font-medium">{activeStep.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Playback Controls */}
      <div className={`absolute bottom-6 right-6 flex items-center gap-2 bg-slate-800/80 backdrop-blur-md p-2 rounded-xl border border-slate-700 z-20 shadow-xl transition-opacity duration-300 ${steps && steps.length > 0 ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        <button 
          onClick={() => { setIsPlaying(false); setCurrentStepIndex(Math.max(0, currentStepIndex - 1)); }} 
          disabled={!steps || currentStepIndex === 0} 
          className="p-2 text-white hover:bg-slate-700 rounded-lg disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
        >
          <SkipBack size={18} />
        </button>
        <button 
          onClick={() => {
            if (steps && currentStepIndex >= steps.length) {
              setCurrentStepIndex(0);
              setIsPlaying(true);
            } else {
              setIsPlaying(!isPlaying);
            }
          }} 
          disabled={!steps || steps.length === 0}
          className="p-2 text-white hover:bg-slate-700 rounded-lg disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button 
          onClick={() => { setIsPlaying(false); setCurrentStepIndex(Math.min((steps?.length || 0), currentStepIndex + 1)); }} 
          disabled={!steps || currentStepIndex >= (steps?.length || 0)} 
          className="p-2 text-white hover:bg-slate-700 rounded-lg disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
        >
          <SkipForward size={18} />
        </button>
      </div>

      <svg
        ref={svgRef}
        className="w-full h-full cursor-move"
        viewBox="0 0 1000 600"
        preserveAspectRatio="xMidYMid meet"
      />
    </div>
  );
};

export default TrieVisualizer;

