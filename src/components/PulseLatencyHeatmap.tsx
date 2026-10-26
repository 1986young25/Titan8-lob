import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Activity, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

interface HeatmapCell {
  channelIndex: number;
  channelName: string;
  epochIndex: number;
  epochTime: number;
  measuredCycleMs: number;
  jitterMs: number;
  isAnomaly: boolean;
}

interface PulseLatencyHeatmapProps {
  metronomeHz: number;
  tickCounter: number;
  onAnomalyDetected?: (msg: string) => void;
}

const CHANNELS = [
  { id: 0, code: 'CTRL-09', name: 'CONTROL BUS' },
  { id: 1, code: 'TELEM-UDP', name: 'MAVLINK STREAM' },
  { id: 2, code: 'QASM-VEC', name: '3.69Hz CLOCK' },
  { id: 3, code: 'WAL-SEAL', name: 'ENCLAVE WAL' },
];

const EPOCH_COUNT = 10;
const ANOMALY_THRESHOLD_MS = 14.5;

export const PulseLatencyHeatmap: React.FC<PulseLatencyHeatmapProps> = ({
  metronomeHz,
  tickCounter,
  onAnomalyDetected,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const lastTickTimeRef = useRef<number>(performance.now());
  const lastAlertTimeRef = useRef<number>(0);
  const onAnomalyRef = useRef(onAnomalyDetected);
  onAnomalyRef.current = onAnomalyDetected;

  const [isInjectingJitter, setIsInjectingJitter] = useState<boolean>(false);
  const [activeCell, setActiveCell] = useState<HeatmapCell | null>(null);

  const nominalPeriodMs = useMemo(() => {
    return Math.round((1000 / (metronomeHz || 3.69)) * 100) / 100;
  }, [metronomeHz]);

  // Initial matrix: 4 channels x 10 epochs
  const [matrix, setMatrix] = useState<HeatmapCell[][]>(() => {
    const initial: HeatmapCell[][] = [];
    const now = Date.now();
    for (let c = 0; c < CHANNELS.length; c++) {
      const row: HeatmapCell[] = [];
      for (let e = 0; e < EPOCH_COUNT; e++) {
        row.push({
          channelIndex: c,
          channelName: CHANNELS[c].code,
          epochIndex: e,
          epochTime: now - (EPOCH_COUNT - e) * 271,
          measuredCycleMs: 271.0 + (Math.random() - 0.5) * 3,
          jitterMs: (Math.random() - 0.5) * 3,
          isAnomaly: false,
        });
      }
      initial.push(row);
    }
    return initial;
  });

  // Track tick jitter on each tick
  useEffect(() => {
    if (tickCounter === 0) return;

    const now = performance.now();
    const elapsed = now - lastTickTimeRef.current;
    lastTickTimeRef.current = now;

    // Measured jitter from nominal cadence
    let baseJitter = elapsed - nominalPeriodMs;

    // If injecting simulated test jitter
    if (isInjectingJitter) {
      baseJitter += (Math.random() > 0.5 ? 1 : -1) * (18 + Math.random() * 22);
    }

    let detectedAnomaly = false;

    setMatrix((prevMatrix) => {
      const updated = prevMatrix.map((row, cIdx) => {
        // Channel-specific jitter variance
        const channelNoise = (Math.sin(tickCounter + cIdx * 1.5) * 2.2) + (Math.random() - 0.5) * 4;
        const measuredJitter = Number((baseJitter + channelNoise).toFixed(2));
        const measuredCycle = Number((nominalPeriodMs + measuredJitter).toFixed(2));
        const isAnomaly = Math.abs(measuredJitter) >= ANOMALY_THRESHOLD_MS;

        if (isAnomaly) {
          detectedAnomaly = true;
        }

        const newCell: HeatmapCell = {
          channelIndex: cIdx,
          channelName: CHANNELS[cIdx].code,
          epochIndex: EPOCH_COUNT - 1,
          epochTime: Date.now(),
          measuredCycleMs: measuredCycle,
          jitterMs: measuredJitter,
          isAnomaly,
        };

        // Shift left, append new cell
        return [...row.slice(1), newCell].map((cell, idx) => ({
          ...cell,
          epochIndex: idx,
        }));
      });

      return updated;
    });

    // Handle side-effect notification OUTSIDE setMatrix and throttled to prevent render loops
    if (detectedAnomaly) {
      const nowTs = Date.now();
      if (nowTs - lastAlertTimeRef.current > 3500) {
        lastAlertTimeRef.current = nowTs;
        onAnomalyRef.current?.(`Jitter spike detected: |Δt| > ${ANOMALY_THRESHOLD_MS}ms at cycle #${tickCounter}`);
      }
    }
  }, [tickCounter, nominalPeriodMs, isInjectingJitter]);

  // D3 Rendering of Heat-Map
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const width = 296;
    const height = 110;
    const margin = { top: 18, right: 8, bottom: 20, left: 68 };

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand<number>()
      .range([0, innerWidth])
      .domain(d3.range(EPOCH_COUNT))
      .padding(0.12);

    const y = d3
      .scaleBand<string>()
      .range([0, innerHeight])
      .domain(CHANNELS.map((c) => c.code))
      .padding(0.12);

    // Color Scale: Deep Dark Cyan/Navy -> Neon Cyan (Nominal) -> Gold (Warning) -> Crimson (Anomaly)
    const colorScale = (jitter: number) => {
      const absJitter = Math.abs(jitter);
      if (absJitter >= ANOMALY_THRESHOLD_MS) {
        return '#ff1744'; // Anomaly crimson
      }
      if (absJitter >= 8.0) {
        return '#ffd700'; // Warning gold
      }
      if (absJitter >= 4.0) {
        return '#00e5ff'; // Minor variance cyan
      }
      return '#004d5a'; // Baseline nominal deep teal
    };

    // Flatten cells for D3 data bind
    const flatCells = matrix.flat();

    // Render Heatmap Rectangles
    g.selectAll('rect.heatmap-cell')
      .data(flatCells)
      .enter()
      .append('rect')
      .attr('class', 'heatmap-cell')
      .attr('x', (d) => x(d.epochIndex) || 0)
      .attr('y', (d) => y(d.channelName) || 0)
      .attr('width', x.bandwidth())
      .attr('height', y.bandwidth())
      .attr('rx', 2)
      .attr('ry', 2)
      .attr('fill', (d) => colorScale(d.jitterMs))
      .attr('stroke', (d) => (d.isAnomaly ? '#ff1744' : 'rgba(0, 229, 255, 0.25)'))
      .attr('stroke-width', (d) => (d.isAnomaly ? 1.5 : 0.8))
      .attr('cursor', 'crosshair')
      .style('transition', 'fill 0.15s ease')
      .on('mouseenter', function (_event, d) {
        d3.select(this)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 2);
        setActiveCell(d);
      })
      .on('mouseleave', function () {
        d3.select(this)
          .attr('stroke', (d: any) => (d.isAnomaly ? '#ff1744' : 'rgba(0, 229, 255, 0.25)'))
          .attr('stroke-width', (d: any) => (d.isAnomaly ? 1.5 : 0.8));
        setActiveCell(null);
      });

    // Left Y Axis: Channel labels
    const yAxis = d3.axisLeft(y).tickSize(0);
    g.append('g')
      .call(yAxis)
      .call((axis) => axis.select('.domain').remove())
      .selectAll('text')
      .attr('fill', '#00e5ff')
      .attr('font-size', '8px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('dx', '-3px');

    // Bottom X Axis: Time Epochs
    const xAxis = d3
      .axisBottom(x)
      .tickFormat((d) => (d === EPOCH_COUNT - 1 ? 'T₀' : `-${EPOCH_COUNT - 1 - d}`))
      .tickSize(2);

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .call((axis) => axis.select('.domain').attr('stroke', 'rgba(0,229,255,0.3)'))
      .selectAll('text')
      .attr('fill', '#78909c')
      .attr('font-size', '8px')
      .attr('font-family', 'JetBrains Mono, monospace');

    // Top Label
    svg
      .append('text')
      .attr('x', margin.left)
      .attr('y', 11)
      .attr('fill', '#78909c')
      .attr('font-size', '8px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .text(`NOMINAL: ${nominalPeriodMs}ms (3.69Hz) | WINDOW: -9..T₀ CYCLES`);
  }, [matrix, nominalPeriodMs]);

  // Compute latest jitter stats
  const latestCells = matrix.map((r) => r[r.length - 1]);
  const avgJitter = latestCells.reduce((acc, c) => acc + Math.abs(c.jitterMs), 0) / latestCells.length;
  const maxJitter = Math.max(...latestCells.map((c) => Math.abs(c.jitterMs)));
  const isCurrentlyAnomalous = maxJitter >= ANOMALY_THRESHOLD_MS;

  return (
    <div className="bg-black/60 border border-[#00e5ff]/30 rounded p-2 text-xs font-mono">
      {/* Title & Status Indicator */}
      <div className="flex items-center justify-between pb-1.5 border-b border-[#00e5ff]/20">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-[#00e5ff]" />
          <span className="text-[10px] font-bold text-[#00e5ff] tracking-wider">
            3.69Hz PULSE JITTER HEAT-MAP
          </span>
        </div>
        <div className="flex items-center gap-1">
          {isCurrentlyAnomalous ? (
            <span className="px-1 py-0.5 rounded text-[8px] bg-[#ff1744]/20 border border-[#ff1744]/60 text-[#ff1744] font-bold flex items-center gap-0.5">
              <AlertTriangle className="w-2.5 h-2.5" /> JITTER SPIKE
            </span>
          ) : (
            <span className="px-1 py-0.5 rounded text-[8px] bg-[#00ff7f]/15 border border-[#00ff7f]/40 text-[#00ff7f] flex items-center gap-0.5">
              <ShieldCheck className="w-2.5 h-2.5" /> RES-LOCKED
            </span>
          )}
        </div>
      </div>

      {/* D3 SVG Canvas */}
      <div className="relative mt-1 flex justify-center">
        <svg
          ref={svgRef}
          viewBox="0 0 296 110"
          className="w-full h-[110px] overflow-visible"
        />
      </div>

      {/* Inspector / Tooltip Readout */}
      <div className="mt-1 px-1.5 py-1 bg-black/80 border border-white/10 rounded text-[9px] flex items-center justify-between">
        {activeCell ? (
          <>
            <span className="text-[#00e5ff]">
              [{activeCell.channelName}] E-{EPOCH_COUNT - 1 - activeCell.epochIndex}:
            </span>
            <span className="text-white">
              {activeCell.measuredCycleMs.toFixed(1)}ms
            </span>
            <span
              className={`font-bold ${
                Math.abs(activeCell.jitterMs) >= ANOMALY_THRESHOLD_MS
                  ? 'text-[#ff1744]'
                  : Math.abs(activeCell.jitterMs) >= 8.0
                  ? 'text-[#ffd700]'
                  : 'text-[#00ff7f]'
              }`}
            >
              Δ {activeCell.jitterMs > 0 ? '+' : ''}{activeCell.jitterMs.toFixed(2)}ms
            </span>
          </>
        ) : (
          <>
            <span className="text-[#78909c]">REALTIME JITTER:</span>
            <span className="text-white">AVG ±{avgJitter.toFixed(2)}ms</span>
            <span className={maxJitter >= ANOMALY_THRESHOLD_MS ? 'text-[#ff1744] font-bold' : 'text-[#ffd700]'}>
              PEAK ±{maxJitter.toFixed(2)}ms
            </span>
          </>
        )}
      </div>

      {/* Heatmap Legend & Test Trigger */}
      <div className="mt-1.5 flex items-center justify-between text-[8px] text-[#78909c] pt-1 border-t border-white/10">
        <div className="flex items-center gap-1.5">
          <span>LEGEND:</span>
          <span className="flex items-center gap-0.5">
            <span className="w-2 h-2 rounded-[1px] bg-[#004d5a]" /> &lt;4ms
          </span>
          <span className="flex items-center gap-0.5">
            <span className="w-2 h-2 rounded-[1px] bg-[#00e5ff]" /> 4-8ms
          </span>
          <span className="flex items-center gap-0.5">
            <span className="w-2 h-2 rounded-[1px] bg-[#ffd700]" /> 8-14ms
          </span>
          <span className="flex items-center gap-0.5">
            <span className="w-2 h-2 rounded-[1px] bg-[#ff1744]" /> &gt;14ms
          </span>
        </div>

        <button
          onClick={() => {
            setIsInjectingJitter(true);
            setTimeout(() => setIsInjectingJitter(false), 2400);
          }}
          disabled={isInjectingJitter}
          title="Simulate network packet jitter burst across telemetry planes"
          className={`px-1.5 py-0.5 rounded border text-[8px] flex items-center gap-1 transition ${
            isInjectingJitter
              ? 'bg-[#ff1744]/20 border-[#ff1744] text-[#ff1744]'
              : 'border-[#00e5ff]/30 text-[#00e5ff] hover:bg-[#00e5ff]/10 hover:border-[#00e5ff]'
          }`}
        >
          <Zap className="w-2.5 h-2.5" />
          <span>{isInjectingJitter ? 'JITTER ACTIVE' : 'INJECT JITTER'}</span>
        </button>
      </div>
    </div>
  );
};
