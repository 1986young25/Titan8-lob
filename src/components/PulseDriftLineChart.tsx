import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { TrendingUp, Clock, AlertCircle, ShieldCheck, Compass } from 'lucide-react';

interface DriftPoint {
  id: number;
  timestamp: number; // millisecond timestamp
  measuredCycleMs: number;
  varianceMs: number; // variance from nominal period (actual - nominal)
  cumulativeDriftMs: number; // rolling sum of drift over the window
}

interface PulseDriftLineChartProps {
  metronomeHz: number;
  tickCounter: number;
}

const WINDOW_MS = 60 * 1000; // 60 seconds window
const ANOMALY_DRIFT_THRESHOLD_MS = 12.0;

export const PulseDriftLineChart: React.FC<PulseDriftLineChartProps> = ({
  metronomeHz,
  tickCounter,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const lastTickTimeRef = useRef<number>(performance.now());
  const cumulativeDriftRef = useRef<number>(0);
  const [hoveredPoint, setHoveredPoint] = useState<DriftPoint | null>(null);
  const [plotMode, setPlotMode] = useState<'VARIANCE' | 'CUMULATIVE'>('VARIANCE');

  const nominalPeriodMs = useMemo(() => {
    return Math.round((1000 / (metronomeHz || 3.69)) * 100) / 100;
  }, [metronomeHz]);

  // Rolling 60-second historical data buffer
  const [history, setHistory] = useState<DriftPoint[]>(() => {
    const initial: DriftPoint[] = [];
    const now = Date.now();
    let driftAccum = 0;
    // Pre-populate with 60 seconds of realistic nominal historical samples (every ~1s or ~4 ticks)
    const count = 50;
    for (let i = count; i >= 0; i--) {
      const t = now - (i * 1200);
      const noise = (Math.sin(i * 0.4) * 1.8) + (Math.cos(i * 0.9) * 0.8) + (Math.random() - 0.5) * 1.2;
      const variance = Number(noise.toFixed(2));
      driftAccum = Number((driftAccum * 0.95 + variance * 0.2).toFixed(2));
      initial.push({
        id: i,
        timestamp: t,
        measuredCycleMs: Number((271.0 + variance).toFixed(2)),
        varianceMs: variance,
        cumulativeDriftMs: driftAccum,
      });
    }
    return initial;
  });

  // Sample on every tick and maintain rolling 60s window
  useEffect(() => {
    if (tickCounter === 0) return;

    const nowPerf = performance.now();
    const elapsed = nowPerf - lastTickTimeRef.current;
    lastTickTimeRef.current = nowPerf;

    const measuredVariance = Number((elapsed - nominalPeriodMs).toFixed(2));
    const nowTs = Date.now();

    // Bound cumulative drift within realistic physical clock bounds
    cumulativeDriftRef.current = Number(
      (cumulativeDriftRef.current * 0.98 + measuredVariance * 0.15).toFixed(2)
    );

    const newPoint: DriftPoint = {
      id: tickCounter,
      timestamp: nowTs,
      measuredCycleMs: Number((nominalPeriodMs + measuredVariance).toFixed(2)),
      varianceMs: measuredVariance,
      cumulativeDriftMs: cumulativeDriftRef.current,
    };

    setHistory((prev) => {
      const cutoff = nowTs - WINDOW_MS;
      // Retain only samples within the last 60 seconds
      const filtered = prev.filter((p) => p.timestamp >= cutoff);
      return [...filtered, newPoint];
    });
  }, [tickCounter, nominalPeriodMs]);

  // D3 Rendering of 60s Line Chart
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 296;
    const height = 120;
    const margin = { top: 14, right: 10, bottom: 22, left: 34 };

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const now = Date.now();
    const minTime = now - WINDOW_MS;

    // Scales
    const xScale = d3
      .scaleTime()
      .domain([new Date(minTime), new Date(now)])
      .range([0, innerWidth]);

    const valueAccessor = (d: DriftPoint) =>
      plotMode === 'VARIANCE' ? d.varianceMs : d.cumulativeDriftMs;

    const yExtent = d3.extent(history, valueAccessor) as [number, number];
    const maxAbsY = Math.max(
      6.0,
      Math.abs(yExtent[0] || 0),
      Math.abs(yExtent[1] || 0)
    );
    const yDomain = [-maxAbsY * 1.15, maxAbsY * 1.15];

    const yScale = d3
      .scaleLinear()
      .domain(yDomain)
      .range([innerHeight, 0]);

    // Gradient definition for area fill
    const defs = svg.append('defs');
    const gradient = defs
      .append('linearGradient')
      .attr('id', 'pulse-drift-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', plotMode === 'VARIANCE' ? '#00e5ff' : '#ffd700')
      .attr('stop-opacity', 0.4);

    gradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#00e5ff')
      .attr('stop-opacity', 0.0);

    // Horizontal Zero Reference Line (Ideal 3.69 Hz clock baseline)
    const zeroY = yScale(0);
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', zeroY)
      .attr('y2', zeroY)
      .attr('stroke', '#ffd700')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .attr('opacity', 0.6);

    // Warning / Anomaly threshold bounds
    const upperThresholdY = yScale(ANOMALY_DRIFT_THRESHOLD_MS);
    const lowerThresholdY = yScale(-ANOMALY_DRIFT_THRESHOLD_MS);

    if (upperThresholdY >= 0 && upperThresholdY <= innerHeight) {
      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', upperThresholdY)
        .attr('y2', upperThresholdY)
        .attr('stroke', '#ff1744')
        .attr('stroke-width', 0.8)
        .attr('stroke-dasharray', '2,2')
        .attr('opacity', 0.5);
    }

    if (lowerThresholdY >= 0 && lowerThresholdY <= innerHeight) {
      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', lowerThresholdY)
        .attr('y2', lowerThresholdY)
        .attr('stroke', '#ff1744')
        .attr('stroke-width', 0.8)
        .attr('stroke-dasharray', '2,2')
        .attr('opacity', 0.5);
    }

    // Area generator
    const areaGen = d3
      .area<DriftPoint>()
      .x((d) => xScale(new Date(d.timestamp)))
      .y0(zeroY)
      .y1((d) => yScale(valueAccessor(d)))
      .curve(d3.curveMonotoneX);

    // Render Area
    g.append('path')
      .datum(history)
      .attr('fill', 'url(#pulse-drift-gradient)')
      .attr('d', areaGen);

    // Line generator
    const lineGen = d3
      .line<DriftPoint>()
      .x((d) => xScale(new Date(d.timestamp)))
      .y((d) => yScale(valueAccessor(d)))
      .curve(d3.curveMonotoneX);

    // Render Line
    g.append('path')
      .datum(history)
      .attr('fill', 'none')
      .attr('stroke', plotMode === 'VARIANCE' ? '#00e5ff' : '#ffd700')
      .attr('stroke-width', 1.6)
      .attr('d', lineGen);

    // Current latest point circle
    if (history.length > 0) {
      const latest = history[history.length - 1];
      g.append('circle')
        .attr('cx', xScale(new Date(latest.timestamp)))
        .attr('cy', yScale(valueAccessor(latest)))
        .attr('r', 3)
        .attr('fill', Math.abs(valueAccessor(latest)) >= ANOMALY_DRIFT_THRESHOLD_MS ? '#ff1744' : '#00ff7f')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 1);
    }

    // Axes
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(4)
      .tickFormat((d) => {
        const secAgo = Math.round((now - (d as Date).getTime()) / 1000);
        return secAgo === 0 ? 'NOW' : `-${secAgo}s`;
      })
      .tickSize(3);

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .call((axis) => axis.select('.domain').attr('stroke', 'rgba(0,229,255,0.3)'))
      .selectAll('text')
      .attr('fill', '#78909c')
      .attr('font-size', '8px')
      .attr('font-family', 'JetBrains Mono, monospace');

    const yAxis = d3
      .axisLeft(yScale)
      .ticks(5)
      .tickFormat((d) => `${Number(d) > 0 ? '+' : ''}${d}ms`)
      .tickSize(2);

    g.append('g')
      .call(yAxis)
      .call((axis) => axis.select('.domain').remove())
      .selectAll('text')
      .attr('fill', '#78909c')
      .attr('font-size', '8px')
      .attr('font-family', 'JetBrains Mono, monospace');

    // Interactive Overlay for Tooltip Tracking
    const bisectDate = d3.bisector<DriftPoint, Date>((d) => new Date(d.timestamp)).left;

    svg
      .append('rect')
      .attr('transform', `translate(${margin.left},${margin.top})`)
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .attr('cursor', 'crosshair')
      .on('mousemove', (event) => {
        const [mx] = d3.pointer(event);
        const hoveredDate = xScale.invert(mx);
        const index = bisectDate(history, hoveredDate, 1);
        const d0 = history[index - 1];
        const d1 = history[index];
        let d = d0;
        if (d0 && d1) {
          d = hoveredDate.getTime() - d0.timestamp > d1.timestamp - hoveredDate.getTime() ? d1 : d0;
        }
        if (d) {
          setHoveredPoint(d);
        }
      })
      .on('mouseleave', () => {
        setHoveredPoint(null);
      });
  }, [history, nominalPeriodMs, plotMode]);

  // Statistics
  const latestPoint = history[history.length - 1];
  const currentVariance = latestPoint ? latestPoint.varianceMs : 0;
  const currentDrift = latestPoint ? latestPoint.cumulativeDriftMs : 0;

  const variances = history.map((p) => p.varianceMs);
  const meanVariance = variances.reduce((a, b) => a + b, 0) / (variances.length || 1);
  const stdDev = Math.sqrt(
    variances.reduce((acc, v) => acc + Math.pow(v - meanVariance, 2), 0) / (variances.length || 1)
  );
  const maxVariance = Math.max(...variances.map((v) => Math.abs(v)));
  const isDrifting = Math.abs(currentVariance) >= ANOMALY_DRIFT_THRESHOLD_MS;

  return (
    <div className="bg-black/60 border border-[#00e5ff]/30 rounded p-2 text-xs font-mono">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-1.5 border-b border-[#00e5ff]/20">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-[#00e5ff]" />
          <span className="text-[10px] font-bold text-[#00e5ff] tracking-wider">
            60s PULSE TIMING VARIANCE & DRIFT
          </span>
        </div>
        <div className="flex items-center gap-1">
          {isDrifting ? (
            <span className="px-1 py-0.5 rounded text-[8px] bg-[#ff1744]/20 border border-[#ff1744]/60 text-[#ff1744] font-bold flex items-center gap-0.5">
              <AlertCircle className="w-2.5 h-2.5" /> DRIFT ALERT
            </span>
          ) : (
            <span className="px-1 py-0.5 rounded text-[8px] bg-[#00ff7f]/15 border border-[#00ff7f]/40 text-[#00ff7f] flex items-center gap-0.5">
              <ShieldCheck className="w-2.5 h-2.5" /> METRONOME SYNC
            </span>
          )}
        </div>
      </div>

      {/* Mode Switcher & Stats Readout */}
      <div className="flex items-center justify-between mt-1 text-[9px]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPlotMode('VARIANCE')}
            className={`px-1.5 py-0.5 rounded border text-[8px] transition ${
              plotMode === 'VARIANCE'
                ? 'bg-[#00e5ff]/20 border-[#00e5ff] text-[#00e5ff] font-bold'
                : 'border-white/10 text-[#78909c] hover:text-white'
            }`}
          >
            CYCLE VARIANCE (ΔT)
          </button>
          <button
            onClick={() => setPlotMode('CUMULATIVE')}
            className={`px-1.5 py-0.5 rounded border text-[8px] transition ${
              plotMode === 'CUMULATIVE'
                ? 'bg-[#ffd700]/20 border-[#ffd700] text-[#ffd700] font-bold'
                : 'border-white/10 text-[#78909c] hover:text-white'
            }`}
          >
            CUMULATIVE DRIFT (Σ)
          </button>
        </div>
        <div className="text-[#78909c] text-[8px]">
          NOMINAL: <span className="text-[#ffd700]">{nominalPeriodMs}ms</span>
        </div>
      </div>

      {/* D3 SVG Line Chart */}
      <div className="relative mt-1 flex justify-center">
        <svg
          ref={svgRef}
          viewBox="0 0 296 120"
          className="w-full h-[120px] overflow-visible"
        />
      </div>

      {/* Live Readout / Tooltip */}
      <div className="mt-1 px-1.5 py-1 bg-black/80 border border-white/10 rounded text-[9px] flex items-center justify-between">
        {hoveredPoint ? (
          <>
            <span className="text-[#00e5ff] flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              -{Math.round((Date.now() - hoveredPoint.timestamp) / 1000)}s:
            </span>
            <span className="text-white">
              T: {hoveredPoint.measuredCycleMs.toFixed(1)}ms
            </span>
            <span
              className={`font-bold ${
                Math.abs(hoveredPoint.varianceMs) >= ANOMALY_DRIFT_THRESHOLD_MS
                  ? 'text-[#ff1744]'
                  : 'text-[#00ff7f]'
              }`}
            >
              Δ {hoveredPoint.varianceMs > 0 ? '+' : ''}{hoveredPoint.varianceMs.toFixed(2)}ms
            </span>
            <span className="text-[#ffd700]">
              Σ {hoveredPoint.cumulativeDriftMs > 0 ? '+' : ''}{hoveredPoint.cumulativeDriftMs.toFixed(2)}ms
            </span>
          </>
        ) : (
          <>
            <span className="text-[#78909c]">VARIANCE:</span>
            <span className={Math.abs(currentVariance) >= ANOMALY_DRIFT_THRESHOLD_MS ? 'text-[#ff1744] font-bold' : 'text-[#00ff7f]'}>
              {currentVariance > 0 ? '+' : ''}{currentVariance.toFixed(2)}ms
            </span>
            <span className="text-[#78909c]">60s DRIFT:</span>
            <span className="text-[#ffd700]">
              {currentDrift > 0 ? '+' : ''}{currentDrift.toFixed(2)}ms
            </span>
            <span className="text-[#78909c]">σ:</span>
            <span className="text-white">±{stdDev.toFixed(2)}ms</span>
          </>
        )}
      </div>

      {/* Sub-Footer Guidance */}
      <div className="mt-1.5 flex items-center justify-between text-[8px] text-[#78909c] pt-1 border-t border-white/10">
        <div className="flex items-center gap-1">
          <Compass className="w-2.5 h-2.5 text-[#00e5ff]" />
          <span>GOLD DASH = 3.69Hz LOCKED BASELINE | PEAK: ±{maxVariance.toFixed(1)}ms</span>
        </div>
        <span className="text-[7.5px] text-[#00e5ff]/80">60-SEC BUFFER</span>
      </div>
    </div>
  );
};
