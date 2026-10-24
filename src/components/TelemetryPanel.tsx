import React from 'react';
import { OctaLobe, SystemState } from '../types';
import { Cpu, Activity, RefreshCw } from 'lucide-react';

interface TelemetryPanelProps {
  systemState: SystemState;
  lobes: OctaLobe[];
  selectedLobeIdx: number;
  onSelectLobe: (idx: number) => void;
  onUpdateMetronomeHz: (hz: number) => void;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({
  systemState,
  lobes,
  selectedLobeIdx,
  onSelectLobe,
  onUpdateMetronomeHz,
}) => {
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
          <div className="text-[9px] text-[#78909c] uppercase tracking-wider">ENTROPY H(X)</div>
          <div className="text-sm font-bold text-[#00ff7f] mt-0.5">
            {systemState.entropyH.toFixed(4)}
          </div>
        </div>

        <div className="bg-black/50 border border-white/10 p-2 rounded">
          <div className="text-[9px] text-[#78909c] uppercase tracking-wider">ATRM ATTENUATION</div>
          <div className="text-sm font-bold text-[#00e5ff] mt-0.5">
            {systemState.atrmDb.toFixed(2)} dB
          </div>
        </div>

        <div className="bg-black/50 border border-white/10 p-2 rounded">
          <div className="text-[9px] text-[#78909c] uppercase tracking-wider">4D MANIFOLD M</div>
          <div className="text-sm font-bold text-[#00ff7f] mt-0.5">
            {systemState.manifoldM.toFixed(4)}
          </div>
        </div>

        <div className="bg-black/50 border border-white/10 p-2 rounded">
          <div className="text-[9px] text-[#78909c] uppercase tracking-wider">COLLATERAL PARITY</div>
          <div className="text-sm font-bold text-[#ffd700] mt-0.5">
            {systemState.collateralParity}
          </div>
        </div>
      </div>

      {/* Lobe List Header */}
      <div className="flex items-center justify-between pb-1.5 pt-2 border-b border-[#00e5ff]/30 text-[#00e5ff] font-bold tracking-wider">
        <span className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5" />
          OCTA-LOBE COGNITIVE MODULES
        </span>
        <span className="text-[10px] text-[#ffd700]">8 NODES</span>
      </div>

      {/* Lobe List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 mt-2">
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
            </div>
          );
        })}
      </div>
    </div>
  );
};
