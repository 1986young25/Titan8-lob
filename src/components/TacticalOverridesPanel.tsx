import React, { useState } from 'react';
import { OctaLobe, SystemState } from '../types';
import { Sliders, Zap, ShieldAlert, Key, CheckCircle, Database, ShieldX, Play, Volume2 } from 'lucide-react';
import { evaluateShannonEntropyGate, ShannonEvaluationResult } from '../utils/shannonEntropy';

interface TacticalOverridesPanelProps {
  selectedLobe: OctaLobe;
  systemState: SystemState;
  onSaveLobeNotes: (lobeId: number, notes: string) => void;
  onHarmonicPulse: () => void;
  onCollapseQuantumState: () => void;
  onAtrmNullification: () => void;
  onCommitFiduciarySeal: () => void;
  onTriggerEmergencyTripwire: () => void;
  onForceResync?: () => void;
  isSavingNotes: boolean;
  hasUnsavedNotes: boolean;
  isFirestoreConnected: boolean;
  onLogTerminal: (source: string, type: 'BOOT' | 'PULSE' | 'QASM' | 'ATRM' | 'SEAL' | 'TRIPWIRE' | 'HEAL' | 'TICK' | 'DIRECTIVE', msg: string) => void;
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
  onForceResync,
  isSavingNotes,
  isFirestoreConnected,
  onLogTerminal,
}) => {
  const [notesInput, setNotesInput] = useState<string>(selectedLobe.notes || '');
  const [testPayload, setTestPayload] = useState<string>('AAAAAAA'.repeat(16)); // Low entropy exploit default
  const [entropyResult, setEntropyResult] = useState<ShannonEvaluationResult | null>(null);

  // Synchronize input when selected lobe changes
  React.useEffect(() => {
    setNotesInput(selectedLobe.notes || '');
  }, [selectedLobe.id, selectedLobe.notes]);

  const handleRunEntropyGate = (payloadOverride?: string) => {
    const payload = payloadOverride !== undefined ? payloadOverride : testPayload;
    const result = evaluateShannonEntropyGate(payload, 1.5000, true);
    setEntropyResult(result);

    if (result.isRejected) {
      onLogTerminal(
        'SHANNON_GATE',
        'TRIPWIRE',
        `[REJECTED & NEUTRALIZED] H(X)=${result.entropyH} < 1.5000. Inversion: ${result.action} | Sample: ${result.sampleHex}`
      );
    } else {
      onLogTerminal(
        'SHANNON_GATE',
        'TICK',
        `[ACTIVE EXECUTION] H(X)=${result.entropyH} >= 1.5000. Payload accepted into Data Plane.`
      );
    }
  };

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

        {selectedLobe.vehicle && (
          <div className="flex items-center justify-between mt-1 text-[9px]">
            <span className="text-[#78909c]">FIELD VEHICLE:</span>
            <span className="font-mono text-[#00e5ff]">{selectedLobe.vehicle}</span>
          </div>
        )}

        {selectedLobe.pos && (
          <div className="flex items-center justify-between mt-0.5 text-[9px]">
            <span className="text-[#78909c]">3D ENCLAVE POS:</span>
            <span className="font-mono text-[#ffd700]">[{selectedLobe.pos.join(', ')}]</span>
          </div>
        )}

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

      {/* Shannon Entropy Gate Sieve Card */}
      <div className="mt-2 bg-black/60 border border-[#00e5ff]/30 rounded p-2 text-[10px] font-mono">
        <div className="flex items-center justify-between pb-1 border-b border-white/10">
          <span className="text-[#00e5ff] font-bold flex items-center gap-1">
            <Volume2 className="w-3 h-3 text-[#ffd700]" />
            SHANNON ENTROPY GATE (H &lt; 1.5000)
          </span>
          <span className="text-[8px] text-[#ffd700]">WEB SPEECH ACTIVE</span>
        </div>

        <div className="flex items-center gap-1 mt-1.5">
          <input
            type="text"
            value={testPayload}
            onChange={(e) => setTestPayload(e.target.value)}
            placeholder="Payload buffer to evaluate..."
            className="flex-1 bg-black/80 border border-white/20 rounded px-1.5 py-0.5 text-[9px] text-white focus:outline-none focus:border-[#00e5ff]"
          />
          <button
            onClick={() => handleRunEntropyGate()}
            title="Evaluate Shannon Entropy and trigger voice alert on rejection"
            className="px-2 py-0.5 rounded bg-[#00e5ff] text-black font-bold text-[9px] hover:bg-[#00e5ff]/90 transition flex items-center gap-0.5 shrink-0"
          >
            <Play className="w-2.5 h-2.5" />
            <span>TEST</span>
          </button>
        </div>

        {/* Quick Test Presets */}
        <div className="flex items-center justify-between mt-1 text-[8px] text-[#78909c]">
          <span>PRESETS:</span>
          <div className="flex gap-1">
            <button
              onClick={() => {
                const low = 'A'.repeat(80);
                setTestPayload(low);
                handleRunEntropyGate(low);
              }}
              className="px-1 rounded border border-[#ff1744]/40 text-[#ff1744] hover:bg-[#ff1744]/15"
            >
              LOW H(X) EXPLOIT
            </button>
            <button
              onClick={() => {
                const high = 'MOD-01-CORE:1791493198042489161:0XBB0933F1FDDFB629:3.69HZ';
                setTestPayload(high);
                handleRunEntropyGate(high);
              }}
              className="px-1 rounded border border-[#00ff7f]/40 text-[#00ff7f] hover:bg-[#00ff7f]/15"
            >
              HIGH H(X) TELEMETRY
            </button>
          </div>
        </div>

        {/* Evaluation Readout */}
        {entropyResult && (
          <div
            className={`mt-1.5 p-1.5 rounded border text-[9px] ${
              entropyResult.isRejected
                ? 'bg-[#ff1744]/15 border-[#ff1744]/50 text-[#ff1744]'
                : 'bg-[#00ff7f]/10 border-[#00ff7f]/40 text-[#00ff7f]'
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <span>{entropyResult.status}</span>
              <span>H(X): {entropyResult.entropyH.toFixed(4)}</span>
            </div>
            <div className="text-[8px] text-[#e0f7fa] mt-0.5 leading-tight">
              {entropyResult.details}
            </div>
            {entropyResult.isRejected && (
              <div className="text-[8px] text-[#ffd700] mt-0.5 truncate">
                ~POLARITY INVERTED: {entropyResult.sampleHex}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tactical Overrides Actions */}
      <div className="flex items-center justify-between pb-1.5 pt-2.5 border-b border-[#00e5ff]/30 text-[#00e5ff] font-bold tracking-wider">
        <span className="flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" />
          TACTICAL OVERRIDES
        </span>
        <span className="text-[10px] text-[#00ff7f]">READY</span>
      </div>

      <div className="flex flex-col gap-1.5 mt-2">
        {onForceResync && (
          <button
            onClick={onForceResync}
            className="border border-[#ffd700] bg-[#ffd700]/15 text-[#ffd700] hover:bg-[#ffd700] hover:text-black py-1.5 px-2.5 rounded font-mono text-[10px] uppercase font-bold transition tracking-wider flex items-center justify-between shadow-[0_0_8px_rgba(255,215,0,0.2)]"
          >
            <span>Force 3.69 Hz / 60 Hz Resync</span>
            <Zap className="w-3 h-3 text-[#ffd700]" />
          </button>
        )}

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
      <div className="flex items-center justify-between pb-1.5 pt-2.5 border-b border-[#00e5ff]/30 text-[#00e5ff] font-bold tracking-wider">
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
          <span className="text-[#78909c]">CAGE / SAM:</span>
          <span className="text-[#ffd700] font-bold">25AD9 (ACTIVE)</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#78909c]">UCC ART. 12 CER:</span>
          <span className="text-[#00ff7f] font-bold">$31,970,000.00 USD</span>
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
