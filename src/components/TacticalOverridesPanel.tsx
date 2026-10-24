import React, { useState } from 'react';
import { OctaLobe, SystemState } from '../types';
import { Sliders, Zap, ShieldAlert, Key, CheckCircle, Database } from 'lucide-react';

interface TacticalOverridesPanelProps {
  selectedLobe: OctaLobe;
  systemState: SystemState;
  onSaveLobeNotes: (lobeId: number, notes: string) => void;
  onHarmonicPulse: () => void;
  onCollapseQuantumState: () => void;
  onAtrmNullification: () => void;
  onCommitFiduciarySeal: () => void;
  onTriggerEmergencyTripwire: () => void;
  isSavingNotes: boolean;
  hasUnsavedNotes: boolean;
  isFirestoreConnected: boolean;
}

export const TacticalOverridesPanel: React.FC<TacticalOverridesPanelProps> = ({
  selectedLobe,
  systemState,
  onSaveLobeNotes,
  onHarmonicPulse,
  onCollapseQuantumState,
  onAtrmNullification,
  onCommitFiduciarySeal,
  onTriggerEmergencyTripwire,
  isSavingNotes,
  isFirestoreConnected,
}) => {
  const [notesInput, setNotesInput] = useState<string>(selectedLobe.notes || '');

  // Synchronize input when selected lobe changes
  React.useEffect(() => {
    setNotesInput(selectedLobe.notes || '');
  }, [selectedLobe.id, selectedLobe.notes]);

  return (
    <div className="hud-panel-glow flex flex-col bg-[rgba(10,16,32,0.88)] border border-[#00e5ff]/30 rounded p-3 h-full overflow-hidden text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#00e5ff]/30 text-[#00e5ff] font-bold tracking-wider">
        <span className="flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5" />
          LOBE INSPECTOR & SUB-ROUTINES
        </span>
        <span className="text-[10px] text-[#ffd700]">SLOT #{selectedLobe.id + 1}</span>
      </div>

      {/* Inspector Details */}
      <div className="mt-2 bg-black/40 border border-white/10 p-2.5 rounded">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-bold text-white tracking-wide">
            {selectedLobe.name}
          </div>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/30">
            {selectedLobe.tag}
          </span>
        </div>

        <div className="text-[10px] text-[#78909c] mt-1.5 leading-relaxed">
          {selectedLobe.desc}
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10 text-[9px]">
          <span className="text-[#78909c]">SUB-ROUTINE:</span>
          <span className="font-mono text-[#00ff7f]">{selectedLobe.subroutine}</span>
        </div>

        {/* Live Operator Directive Notes */}
        <div className="mt-2.5 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between text-[9px] text-[#78909c] mb-1">
            <span>OPERATOR DIRECTIVE (FIRESTORE SYNC)</span>
            <button
              onClick={() => onSaveLobeNotes(selectedLobe.id, notesInput)}
              disabled={isSavingNotes}
              className="text-[9px] text-[#ffd700] hover:text-white transition flex items-center gap-1 disabled:opacity-50"
            >
              <Database className="w-3 h-3" />
              {isSavingNotes ? 'COMMITTING...' : 'SAVE DIRECTIVE'}
            </button>
          </div>
          <textarea
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
            rows={2}
            className="w-full bg-black/60 border border-white/15 rounded p-1.5 text-[10px] text-[#e0f7fa] font-mono focus:outline-none focus:border-[#00e5ff] resize-none"
            placeholder="Input cryptographic or tactical instructions for this lobe..."
          />
        </div>
      </div>

      {/* Tactical Overrides Actions */}
      <div className="flex items-center justify-between pb-1.5 pt-3 border-b border-[#00e5ff]/30 text-[#00e5ff] font-bold tracking-wider">
        <span className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" />
          TACTICAL OVERRIDES
        </span>
        <span className="text-[10px] text-[#00ff7f]">READY</span>
      </div>

      <div className="flex flex-col gap-1.5 mt-2">
        <button
          onClick={onHarmonicPulse}
          className="border border-[#00e5ff] text-[#00e5ff] hover:bg-[#00e5ff] hover:text-black py-1.5 px-2.5 rounded font-mono text-[10px] uppercase font-semibold transition tracking-wider flex items-center justify-between"
        >
          <span>Harmonic Pulse (3.69 Hz)</span>
          <Zap className="w-3 h-3" />
        </button>

        <button
          onClick={onCollapseQuantumState}
          className="border border-[#00e5ff] text-[#00e5ff] hover:bg-[#00e5ff] hover:text-black py-1.5 px-2.5 rounded font-mono text-[10px] uppercase font-semibold transition tracking-wider flex items-center justify-between"
        >
          <span>Simulate Bell State (|Φ+⟩)</span>
          <span className="text-[9px]">QASM 3.0</span>
        </button>

        <button
          onClick={onAtrmNullification}
          className="border border-[#00e5ff] text-[#00e5ff] hover:bg-[#00e5ff] hover:text-black py-1.5 px-2.5 rounded font-mono text-[10px] uppercase font-semibold transition tracking-wider flex items-center justify-between"
        >
          <span>Execute ATRM Phase Inversion</span>
          <span className="text-[9px]">-42.6 dB</span>
        </button>

        <button
          onClick={onCommitFiduciarySeal}
          className="border border-[#ffd700] text-[#ffd700] hover:bg-[#ffd700] hover:text-black py-1.5 px-2.5 rounded font-mono text-[10px] uppercase font-semibold transition tracking-wider flex items-center justify-between"
        >
          <span>Commit DYV-PHYS-HASH Seal</span>
          <Key className="w-3 h-3" />
        </button>

        <button
          onClick={onTriggerEmergencyTripwire}
          className="border border-[#ff1744] text-[#ff1744] hover:bg-[#ff1744] hover:text-white py-1.5 px-2.5 rounded font-mono text-[10px] uppercase font-bold transition tracking-wider flex items-center justify-between shadow-[0_0_8px_rgba(255,23,68,0.2)]"
        >
          <span>Trip Modulo-9 Circuit Breaker</span>
          <ShieldAlert className="w-3 h-3" />
        </button>
      </div>

      {/* Active Security State */}
      <div className="flex items-center justify-between pb-1.5 pt-3 border-b border-[#00e5ff]/30 text-[#00e5ff] font-bold tracking-wider">
        <span className="flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5" />
          ACTIVE SECURITY STATE
        </span>
      </div>

      <div className="bg-black/60 border border-white/10 p-2.5 rounded mt-2 text-[10px] space-y-1 font-mono">
        <div className="flex justify-between items-center">
          <span className="text-[#78909c]">STATUS:</span>
          <span className="text-[#00ff7f] font-bold">{systemState.status}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#78909c]">ATOMIC ROOT:</span>
          <span className="text-[#ffd700] font-bold truncate max-w-[150px]">
            {systemState.atomicRoot}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#78909c]">POW SIEVE:</span>
          <span className="text-[#00e5ff]">
            {systemState.powSieveOps.toLocaleString()} OPS/SEC
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#78909c]">MCL GOVERNANCE:</span>
          <span className="text-white">MCL § 700.7913 / UCC-9</span>
        </div>
        <div className="flex justify-between items-center pt-1 border-t border-white/10">
          <span className="text-[#78909c]">LEDGER SYNC:</span>
          <span className={isFirestoreConnected ? 'text-[#00ff7f]' : 'text-[#ffd700]'}>
            {isFirestoreConnected ? 'FIRESTORE WAL REALTIME' : 'LOCAL CACHE BUFFER'}
          </span>
        </div>
      </div>
    </div>
  );
};
