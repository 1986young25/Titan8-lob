import React, { useState } from 'react';
import { OctaLobe, SystemState } from '../types';
import { Cpu, Activity, BarChart2, Layers, TrendingUp } from 'lucide-react';
import { PulseLatencyHeatmap } from './PulseLatencyHeatmap';
import { PulseDriftLineChart } from './PulseDriftLineChart';

interface TelemetryPanelProps {
  systemState: SystemState;
  lobes: OctaLobe[];
  selectedLobeIdx: number;
  onSelectLobe: (idx: number) => void;
  onUpdateMetronomeHz: (hz: number) => void;
  tickCounter: number;
  onAnomalyDetected?: (msg: string) => void;
  onForceResync?: () => void;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({
  systemState,
  lobes,
  selectedLobeIdx,
  onSelectLobe,
  onUpdateMetronomeHz,
  tickCounter,
  onAnomalyDetected,
  onForceResync,
}) => {
  const [activeTab, setActiveTab] = useState<'DRIFT' | 'HEATMAP' | 'LOBES' | 'ALL'>('DRIFT');

  return (
    <div className="hud-panel-glow flex flex-col bg-[rgba(10,16,32,0.88)] border border-[#00e5ff]/30 rounded p-3 h-full overflow-hidden text-xs">
      {/* Title */}
      <div className="flex items-center justify-between pb-2 border-b border-[#00e5ff]/30 text-[#00e5ff] font-bold tracking-wider">
        <span className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" />
          CORE PHYSICAL CONSTANTS & TELEMETRY
        </span>
        <span className="text-[10px] text-[#78909c]">P2P MESH</span>
      </div>

      {/* Stat Grid */}
      <div className="grid grid-cols-2 gap-2 my-2.5">
        <div className="bg-black/50 border border-white/10 p-2 rounded">
          <div className="text-[9px] text-[#78909c] uppercase tracking-wider">FREE SPACE Z₀</div>
          <div className="text-sm font-bold text-[#00ff7f] mt-0.5">
            {systemState.freeSpaceZ0.toFixed(1)} Ω
          </div>
        </div>

        <div className="bg-black/50 border border-white/10 p-2 rounded">
          <div className="text-[9px] text-[#78909c] uppercase tracking-wider flex justify-between">
            <span>METRONOME</span>
            <span className="text-[#ffd700] text-[8px] cursor-pointer" onClick={() => onUpdateMetronomeHz(3.69)}>RESET</span>
          </div>
          <div className="text-sm font-bold text-[#ffd700] mt-0.5 flex items-center justify-between">
            <span>{systemState.metronomeHz.toFixed(2)} Hz</span>
            <div className="flex gap-1">
              <button
                onClick={() => onUpdateMetronomeHz(1.845)}
                className={`text-[8px] px-1 py-0.5 rounded border ${
                  Math.abs(systemState.metronomeHz - 1.845) < 0.05
                    ? 'border-[#ffd700] bg-[#ffd700]/20 text-white'
                    : 'border-white/10 text-[#78909c]'
                }`}
              >
                1/2
              </button>
              <button
                onClick={() => onUpdateMetronomeHz(3.69)}
                className={`text-[8px] px-1 py-0.5 rounded border ${
                  Math.abs(systemState.metronomeHz - 3.69) < 0.05
                    ? 'border-[#ffd700] bg-[#ffd700]/20 text-white'
                    : 'border-white/10 text-[#78909c]'
                }`}
              >
                1x
              </button>
              <button
                onClick={() => onUpdateMetronomeHz(7.38)}
                className={`text-[8px] px-1 py-0.5 rounded border ${
                  Math.abs(systemState.metronomeHz - 7.38) < 0.05
                    ? 'border-[#ffd700] bg-[#ffd700]/20 text-white'
                    : 'border-white/10 text-[#78909c]'
                }`}
              >
                2x
              </button>
            </div>
          </div>
        </div>

        <div className="bg-black/50 border border-white/10 p-2 rounded">
          <div className="text-[9px] text-[#78909c] uppercase tracking-wider">GRID FREQ (BI-MATCH)</div>
          <div className="text-sm font-bold text-[#00e5ff] mt-0.5 flex items-center justify-between">
            <span>60.00 Hz</span>
            <span className="text-[8px] px-1 rounded bg-[#00ff7f]/15 text-[#00ff7f] font-mono">LOCK</span>
          </div>
        </div>

        <div className="bg-black/50 border border-white/10 p-2 rounded">
          <div className="text-[9px] text-[#78909c] uppercase tracking-wider">PHASE MATCH ANGLE</div>
          <div className="text-sm font-bold text-[#ffd700] mt-0.5 font-mono">
            {(((tickCounter * (1000 / (systemState.metronomeHz || 3.69)) / 1000) * 3.69 * 360) % 360).toFixed(2)}°
          </div>
        </div>

        <div className="bg-black/50 border border-white/10 p-2 rounded">
          <div className="text-[9px] text-[#78909c] uppercase tracking-wider flex justify-between">
            <span>ENTROPY H(X)</span>
            <span className="text-[#00ff7f] text-[8px]">OPTIMAL</span>
          </div>
          <div className="text-sm font-bold text-[#00ff7f] mt-0.5">
            2.7182
          </div>
        </div>

        <div className="bg-black/50 border border-white/10 p-2 rounded">
          <div className="text-[9px] text-[#78909c] uppercase tracking-wider">SIEVING LATENCY</div>
          <div className="text-sm font-bold text-[#00e5ff] mt-0.5">
            228.04 µs
          </div>
        </div>

        <div className="bg-black/50 border border-white/10 p-2 rounded">
          <div className="text-[9px] text-[#78909c] uppercase tracking-wider">COLLATERAL PARITY</div>
          <div className="text-sm font-bold text-[#ffd700] mt-0.5">
            10:1 LOCK
          </div>
        </div>

        <div className="bg-black/50 border border-white/10 p-2 rounded">
          <div className="text-[9px] text-[#78909c] uppercase tracking-wider">UCC ARTICLE 12 CER</div>
          <div className="text-sm font-bold text-[#00ff7f] mt-0.5 truncate">
            $31,970,000 USD
          </div>
        </div>
      </div>

      {/* Cloud Uplink & Resync Bar */}
      <div className="flex flex-col gap-1.5 mb-2">
        <div className="px-2 py-1 bg-black/70 border border-[#00e5ff]/20 rounded text-[9px] font-mono flex items-center justify-between text-[#78909c]">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff7f] animate-pulse inline-block" />
            <span className="text-[#00e5ff] font-bold">UPLINK:</span> port-8899.saas.titan.internal
          </span>
          <span className="text-[#ffd700]">ROOT: 0x782F...</span>
        </div>

        {onForceResync && (
          <button
            onClick={onForceResync}
            className="w-full py-1.5 px-2 rounded bg-[#00e5ff]/15 hover:bg-[#00e5ff] hover:text-black text-[#00e5ff] font-mono text-[9px] font-bold border border-[#00e5ff]/40 transition tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_8px_rgba(0,229,255,0.2)]"
          >
            <Activity className="w-3 h-3 text-[#ffd700]" />
            <span>FORCE 3.69 Hz / 60 Hz RESYNC</span>
          </button>
        )}
      </div>

      {/* Sub-Panel Switcher Tab Bar */}
      <div className="flex items-center justify-between pb-1.5 pt-1 border-b border-[#00e5ff]/30 text-[10px]">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('DRIFT')}
            className={`px-1.5 py-0.5 rounded font-mono uppercase transition border flex items-center gap-1 ${
              activeTab === 'DRIFT'
                ? 'bg-[#00e5ff]/20 border-[#00e5ff] text-[#00e5ff] font-bold shadow-[0_0_8px_rgba(0,229,255,0.3)]'
                : 'border-white/10 text-[#78909c] hover:text-white'
            }`}
          >
            <TrendingUp className="w-3 h-3" />
            <span>60s DRIFT</span>
          </button>
          <button
            onClick={() => setActiveTab('HEATMAP')}
            className={`px-1.5 py-0.5 rounded font-mono uppercase transition border flex items-center gap-1 ${
              activeTab === 'HEATMAP'
                ? 'bg-[#00e5ff]/20 border-[#00e5ff] text-[#00e5ff] font-bold shadow-[0_0_8px_rgba(0,229,255,0.3)]'
                : 'border-white/10 text-[#78909c] hover:text-white'
            }`}
          >
            <BarChart2 className="w-3 h-3" />
            <span>HEAT-MAP</span>
          </button>
          <button
            onClick={() => setActiveTab('LOBES')}
            className={`px-1.5 py-0.5 rounded font-mono uppercase transition border flex items-center gap-1 ${
              activeTab === 'LOBES'
                ? 'bg-[#00e5ff]/20 border-[#00e5ff] text-[#00e5ff] font-bold shadow-[0_0_8px_rgba(0,229,255,0.3)]'
                : 'border-white/10 text-[#78909c] hover:text-white'
            }`}
          >
            <Cpu className="w-3 h-3" />
            <span>LOBES (8)</span>
          </button>
        </div>
        <button
          onClick={() => setActiveTab(activeTab === 'ALL' ? 'DRIFT' : 'ALL')}
          title="Toggle Full Stacked View"
          className={`px-1.5 py-0.5 rounded border text-[9px] font-mono flex items-center gap-0.5 transition shrink-0 ${
            activeTab === 'ALL'
              ? 'border-[#ffd700] text-[#ffd700] bg-[#ffd700]/15'
              : 'border-white/10 text-[#78909c] hover:text-[#00e5ff]'
          }`}
        >
          <Layers className="w-2.5 h-2.5" />
          <span>ALL</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto mt-2 space-y-2 pr-1">
        {/* D3 Real-Time 60s Pulse Drift Line Chart */}
        {(activeTab === 'DRIFT' || activeTab === 'ALL') && (
          <PulseDriftLineChart
            metronomeHz={systemState.metronomeHz}
            tickCounter={tickCounter}
          />
        )}

        {/* D3 Pulse Latency Heatmap */}
        {(activeTab === 'HEATMAP' || activeTab === 'ALL') && (
          <PulseLatencyHeatmap
            metronomeHz={systemState.metronomeHz}
            tickCounter={tickCounter}
            onAnomalyDetected={onAnomalyDetected}
          />
        )}

        {/* Lobe List */}
        {(activeTab === 'LOBES' || activeTab === 'ALL') && (
          <div className="space-y-1.5">
            {lobes.map((lobe, idx) => {
              const isActive = idx === selectedLobeIdx;
              const isTripped = lobe.status === 'CIRCUIT_TRIPPED';
              return (
                <div
                  key={lobe.id}
                  onClick={() => onSelectLobe(idx)}
                  className={`p-2 rounded cursor-pointer transition border text-left ${
                    isActive
                      ? 'bg-[#00e5ff]/20 border-[#00e5ff] shadow-[0_0_10px_rgba(0,229,255,0.3)]'
                      : 'bg-[#00e5ff]/5 border-[#00e5ff]/20 hover:bg-[#00e5ff]/10 hover:border-[#00e5ff]/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-bold ${isActive ? 'text-[#ffd700]' : 'text-white'}`}>
                      {lobe.name}
                    </span>
                    <span
                      className={`text-[9px] px-1 rounded font-mono ${
                        isTripped
                          ? 'bg-[#ff1744]/20 text-[#ff1744] border border-[#ff1744]/40'
                          : 'text-[#00ff7f]'
                      }`}
                    >
                      {lobe.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-[9px] text-[#78909c]">
                    <span>{lobe.tag}</span>
                    <span>{lobe.frequencyHz} Hz</span>
                  </div>
                  {lobe.vehicle && (
                    <div className="text-[8px] text-[#00e5ff] mt-1 font-mono flex items-center justify-between border-t border-white/5 pt-0.5">
                      <span className="truncate">VEHICLE: {lobe.vehicle}</span>
                      <span className="text-[#ffd700]">[{lobe.pos.join(', ')}]</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
