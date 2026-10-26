/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { OctaLobe, TelemetryEvent, SystemState } from './types';
import { INITIAL_OCTA_LOBES, INITIAL_SYSTEM_STATE } from './constants';
import { ThreeBrainCanvas } from './components/ThreeBrainCanvas';
import { HudHeader } from './components/HudHeader';
import { TelemetryPanel } from './components/TelemetryPanel';
import { TacticalOverridesPanel } from './components/TacticalOverridesPanel';
import { TerminalLogStream } from './components/TerminalLogStream';
import { WorkspaceArchiveModal } from './components/WorkspaceArchiveModal';
import { CommercialMatrixModal } from './components/CommercialMatrixModal';
import { audioEngine } from './utils/audioMetronome';
import { voiceEngine } from './utils/speechSynthesis';
import { evaluateShannonEntropyGate } from './utils/shannonEntropy';
import { Eye } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [lobes, setLobes] = useState<OctaLobe[]>(INITIAL_OCTA_LOBES);
  const [selectedLobeIdx, setSelectedLobeIdx] = useState<number>(0);
  const [systemState, setSystemState] = useState<SystemState>(INITIAL_SYSTEM_STATE);
  const [logs, setLogs] = useState<TelemetryEvent[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(true);
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [tickCounter, setTickCounter] = useState<number>(0);
  const [pulseTrigger, setPulseTrigger] = useState<number>(0);
  const [tripwireTrigger, setTripwireTrigger] = useState<number>(0);
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);
  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(false);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState<boolean>(false);
  const [isCommercialModalOpen, setIsCommercialModalOpen] = useState<boolean>(false);

  // Initial Boot Logs
  useEffect(() => {
    const bootLogs: TelemetryEvent[] = [
      {
        timestamp: new Date().toISOString().substring(11, 19) + ' UTC',
        source: 'BOOTSTRAP',
        type: 'BOOT',
        message: 'SOVEREIGN ENCLAVE SYSTEM BOOTSTRAP INITIALIZED...',
        operatorUid: 'system',
      },
      {
        timestamp: new Date().toISOString().substring(11, 19) + ' UTC',
        source: 'PHYS_BASELINE',
        type: 'BOOT',
        message: 'IMPEDANCE ANCHOR LOCKED: 376.5 Ohm Free-Space Baseline.',
        operatorUid: 'system',
      },
      {
        timestamp: new Date().toISOString().substring(11, 19) + ' UTC',
        source: 'METRONOME',
        type: 'BOOT',
        message: '3.69 Hz METRONOME CADENCE ENGAGED (271.00 ms Period).',
        operatorUid: 'system',
      },
      {
        timestamp: new Date().toISOString().substring(11, 19) + ' UTC',
        source: 'MAVLINK_UDP',
        type: 'BOOT',
        message: 'MAVLink UDP Stream active on 127.0.0.1:14550.',
        operatorUid: 'system',
      },
    ];
    setLogs(bootLogs);
  }, []);

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        logTerminal(
          'OPERATOR_AUTH',
          'BOOT',
          `Operator authenticated: ${currentUser.displayName || currentUser.email} (UID: ${currentUser.uid.substring(0, 8)}...)`
        );
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time Firestore Telemetry Events Listener
  useEffect(() => {
    const q = query(
      collection(db, 'telemetry_events'),
      orderBy('timestamp', 'desc'),
      limit(40)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setIsFirestoreConnected(true);
        if (!snapshot.empty) {
          const remoteEvents: TelemetryEvent[] = [];
          snapshot.forEach((docSnap) => {
            remoteEvents.push({ id: docSnap.id, ...(docSnap.data() as TelemetryEvent) });
          });
          remoteEvents.reverse();

          setLogs((prev) => {
            const seen = new Set(remoteEvents.map((e) => e.timestamp + e.message));
            const merged = [...remoteEvents];
            prev.forEach((p) => {
              if (!seen.has(p.timestamp + p.message)) {
                merged.push(p);
              }
            });
            return merged.slice(-150);
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'telemetry_events');
      }
    );

    return () => unsubscribe();
  }, []);

  // Real-time Firestore System State Listener
  useEffect(() => {
    const stateDocRef = doc(db, 'system_state', 'current');
    const unsubscribe = onSnapshot(
      stateDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Partial<SystemState>;
          setSystemState((prev) => ({
            ...prev,
            ...data,
          }));
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'system_state/current');
      }
    );
    return () => unsubscribe();
  }, []);

  // Helper to log terminal messages & sync to Firestore if authenticated
  const logTerminal = useCallback(
    async (
      source: string,
      type: TelemetryEvent['type'],
      message: string,
      extra?: { entropy?: number; attenuationDb?: number; sealHash?: string }
    ) => {
      const ts = new Date().toISOString().substring(11, 19) + ' UTC';
      const newEvent: TelemetryEvent = {
        timestamp: ts,
        source,
        type,
        message,
        entropy: extra?.entropy,
        attenuationDb: extra?.attenuationDb,
        sealHash: extra?.sealHash,
        operatorUid: user?.uid || 'sovereign_operator',
        operatorName: user?.displayName || 'OPERATOR',
      };

      setLogs((prev) => [...prev.slice(-140), newEvent]);

      // If user is authenticated, persist to Firestore immutable ledger
      if (user) {
        try {
          const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          await setDoc(doc(db, 'telemetry_events', eventId), {
            id: eventId,
            timestamp: newEvent.timestamp,
            source: newEvent.source,
            type: newEvent.type,
            message: newEvent.message,
            operatorUid: user.uid,
            operatorName: user.displayName || 'COMMANDER',
            ...(newEvent.entropy ? { entropy: newEvent.entropy } : {}),
            ...(newEvent.attenuationDb ? { attenuationDb: newEvent.attenuationDb } : {}),
            ...(newEvent.sealHash ? { sealHash: newEvent.sealHash } : {}),
          });
        } catch (err) {
          console.warn('Firestore write failed, cached locally:', err);
        }
      }
    },
    [user]
  );

  const handleAnomalyDetected = useCallback((msg: string) => {
    logTerminal('JITTER_SIEVE', 'TICK', msg);
  }, [logTerminal]);

  // 3.69 Hz Tesla Pulse Metronome Timer Loop (~271 ms interval)
  useEffect(() => {
    const intervalMs = Math.round(1000 / (systemState.metronomeHz || 3.69));
    const timer = setInterval(() => {
      setTickCounter((prev) => {
        const next = prev + 1;
        // Periodic background telemetry every 12 ticks (~3.2s)
        if (next % 12 === 0) {
          const nodeNames = ['MOD-01-CORE', 'MOD-02-CANOPY', 'MOD-04-TURRET', 'GLOBAL_CHASSIS'];
          const activeNode = nodeNames[next % nodeNames.length];
          const hVal = Number((6.80 + Math.sin(next) * 0.05).toFixed(4));
          const tickMsg = `Target: ${activeNode} | H(X): ${hVal} | Status: CLOCKED`;
          logTerminal(`3.69Hz TICK #${String(next).padStart(5, '0')}`, 'TICK', tickMsg, {
            entropy: hVal,
          });
        }
        audioEngine.playTick(738, 0.02);
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [systemState.metronomeHz, logTerminal]);

  // Auth Actions
  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login error:', error);
      logTerminal('AUTH_ERR', 'BOOT', 'Operator authentication cancelled or failed.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      logTerminal('AUTH', 'BOOT', 'Operator session terminated.');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Metronome Frequency change
  const handleUpdateMetronomeHz = async (hz: number) => {
    setSystemState((prev) => ({ ...prev, metronomeHz: hz }));
    logTerminal('CADENCE', 'PULSE', `Metronome clock gating tuned to ${hz.toFixed(3)} Hz`);

    if (user) {
      try {
        await setDoc(
          doc(db, 'system_state', 'current'),
          {
            status: systemState.status,
            atomicRoot: systemState.atomicRoot,
            metronomeHz: hz,
            updatedAt: new Date().toISOString(),
            lastOperatorUid: user.uid,
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('System state sync error:', err);
      }
    }
  };

  // Tactical Overrides
  const handleForceResync = () => {
    setPulseTrigger((prev) => prev + 1);
    setTickCounter(0);
    audioEngine.playHarmonicPulse();
    voiceEngine.speak("Phase resync complete. Tesla metronome and grid frequency locked.");
    logTerminal(
      'PHASE_RESYNC',
      'PULSE',
      '--> [RESYNC] 3.69 Hz Tesla Metronome bi-matched with 60.00 Hz Utility Grid. Phase Offset: 0.00°, Δt: 0.00 µs.'
    );
  };

  const triggerHarmonicPulse = () => {
    setPulseTrigger((prev) => prev + 1);
    audioEngine.playHarmonicPulse();
    logTerminal('PULSE', 'PULSE', '--> [PULSE] Initiating 3.69 Hz Tesla Fundamental Shockwave...');
  };

  const collapseQuantumState = () => {
    audioEngine.playQuantumCollapse();
    const collapsed = Math.random() > 0.5 ? '|00⟩' : '|11⟩';
    const newEntropy = Number((Math.random() * 0.5 + 6.5).toFixed(4));
    setSystemState((prev) => ({ ...prev, entropyH: newEntropy }));
    logTerminal(
      'QASM_3.0',
      'QASM',
      `--> [QASM 3.0] Bell State (|Φ+⟩) measurement executed: collapsed to ${collapsed}`,
      { entropy: newEntropy }
    );
  };

  const runAtrmNullification = () => {
    audioEngine.playAtrmInversion();
    const newDb = Number((-42.60 - Math.random() * 1.5).toFixed(2));
    setSystemState((prev) => ({ ...prev, atrmDb: newDb }));
    logTerminal(
      'ATRM_NULL',
      'ATRM',
      `--> [ATRM] SPEC-DB-003 Nullifier: Phase inverted by π rad. Floor: ${newDb} dB`,
      { attenuationDb: newDb }
    );
  };

  const commitFiduciarySeal = async () => {
    audioEngine.playSealCommit();
    const seed = Math.random().toString(36).substring(2, 10).toUpperCase();
    const seal = `DYV-SEAL-${seed}`;
    const newRoot = `0x${seed.toLowerCase()}${Date.now().toString(16).slice(-6)}`;

    setSystemState((prev) => ({
      ...prev,
      atomicRoot: newRoot,
      updatedAt: new Date().toISOString(),
    }));

    logTerminal(
      'LEDGER_COMMIT',
      'SEAL',
      `--> [LEDGER] Atomic State Seal appended to digital_twin_state.db: ${seal}`,
      { sealHash: newRoot }
    );

    if (user) {
      try {
        await setDoc(
          doc(db, 'system_state', 'current'),
          {
            status: 'SYNCHRONIZED_ENCLAVE',
            atomicRoot: newRoot,
            metronomeHz: systemState.metronomeHz,
            updatedAt: new Date().toISOString(),
            lastOperatorUid: user.uid,
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Seal sync error:', err);
      }
    }
  };

  const triggerEmergencyTripwire = () => {
    audioEngine.playTripwire();
    setTripwireTrigger((prev) => prev + 1);

    // Evaluate malicious low-entropy buffer through Shannon Entropy Gate (triggers Web Speech audible rejection)
    const exploitBuffer = '0x90'.repeat(32);
    const gateResult = evaluateShannonEntropyGate(exploitBuffer, 1.5000, true);

    // Trip Lobe 0
    setLobes((prev) =>
      prev.map((l, idx) =>
        idx === 0 ? { ...l, status: 'CIRCUIT_TRIPPED' } : l
      )
    );

    logTerminal(
      'SHANNON_SIEVE',
      'TRIPWIRE',
      `--> [GATE ALERT] Low-entropy payload rejected (H=${gateResult.entropyH}). ${gateResult.action}. Audible alert broadcast.`
    );

    // Automated Autonomous Bitwise NOT Healing Loop after 1.2s
    setTimeout(() => {
      setLobes((prev) =>
        prev.map((l, idx) =>
          idx === 0 ? { ...l, status: 'ONLINE' } : l
        )
      );
      logTerminal('PID_HEAL', 'HEAL', '--> [HEAL] Bitwise NOT (~) complete. State normalized.');
    }, 1250);
  };

  // Save Operator Directive Notes for a Lobe
  const handleSaveLobeNotes = async (lobeId: number, notes: string) => {
    setIsSavingNotes(true);
    setLobes((prev) =>
      prev.map((l) => (l.id === lobeId ? { ...l, notes } : l))
    );

    const lobe = lobes.find((l) => l.id === lobeId);
    logTerminal(
      'DIRECTIVE',
      'DIRECTIVE',
      `Directive updated for [${lobe?.tag || `MOD-0${lobeId + 1}`}]: "${notes.substring(0, 60)}${notes.length > 60 ? '...' : ''}"`
    );

    if (user) {
      try {
        const lobeDocId = `lobe_mod_0${lobeId + 1}`;
        await setDoc(
          doc(db, 'lobe_configs', lobeDocId),
          {
            lobeIndex: lobeId,
            name: lobe?.name || `MOD-0${lobeId + 1}`,
            tag: lobe?.tag || 'TACTICAL-TAG',
            status: lobe?.status || 'ONLINE',
            notes,
            updatedAt: new Date().toISOString(),
            operatorUid: user.uid,
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Lobe directive sync failed:', err);
      }
    }

    setTimeout(() => setIsSavingNotes(false), 300);
  };

  const handleToggleMute = () => {
    const muted = audioEngine.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#050811] text-[#e0f7fa]">
      {/* 3D WebGL Canvas Layer */}
      <ThreeBrainCanvas
        lobes={lobes}
        selectedLobeIdx={selectedLobeIdx}
        onSelectLobe={(idx) => {
          setSelectedLobeIdx(idx);
          logTerminal('COMMAND', 'BOOT', `Inspected Focus switched to: ${lobes[idx].tag}`);
        }}
        metronomeHz={systemState.metronomeHz}
        pulseTrigger={pulseTrigger}
        tripwireTrigger={tripwireTrigger}
      />

      {/* CRT Scanline Overlay */}
      <div className="crt-overlay absolute inset-0 pointer-events-none z-10" />

      {/* Zen Mode Restore Button */}
      {isZenMode && (
        <button
          onClick={() => setIsZenMode(false)}
          className="absolute top-4 left-4 z-30 px-3 py-1.5 rounded bg-[rgba(10,16,32,0.9)] border border-[#00e5ff] text-[#00e5ff] text-xs font-mono font-bold hover:bg-[#00e5ff] hover:text-black transition shadow-[0_0_12px_rgba(0,229,255,0.4)] flex items-center gap-2"
        >
          <Eye className="w-4 h-4" />
          <span>RESTORE TACTICAL HUD</span>
        </button>
      )}

      {/* Full HUD Grid Overlay */}
      {!isZenMode && (
        <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-3 gap-3">
          {/* Header */}
          <div className="pointer-events-auto">
            <HudHeader
              user={user}
              onLogin={handleLogin}
              onLogout={handleLogout}
              metronomeHz={systemState.metronomeHz}
              isMuted={isMuted}
              onToggleMute={handleToggleMute}
              isVoiceEnabled={isVoiceEnabled}
              onToggleVoice={() => setIsVoiceEnabled(voiceEngine.toggle())}
              isZenMode={isZenMode}
              onToggleZenMode={() => setIsZenMode(!isZenMode)}
              tickCounter={tickCounter}
              isFirestoreConnected={isFirestoreConnected}
              onOpenWorkspace={() => setIsWorkspaceModalOpen(true)}
              onOpenCommercialMatrix={() => setIsCommercialModalOpen(true)}
            />
          </div>

          {/* Center Main Stage (Left Telemetry + Center Spacer + Right Overrides) */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-[320px_1fr_360px] gap-3 min-h-0 pointer-events-none">
            {/* Left Telemetry Panel */}
            <div className="pointer-events-auto h-full max-h-[calc(100vh-270px)] md:max-h-full">
              <TelemetryPanel
                systemState={systemState}
                lobes={lobes}
                selectedLobeIdx={selectedLobeIdx}
                onSelectLobe={(idx) => {
                  setSelectedLobeIdx(idx);
                  logTerminal('COMMAND', 'BOOT', `Inspected Focus switched to: ${lobes[idx].tag}`);
                }}
                onUpdateMetronomeHz={handleUpdateMetronomeHz}
                tickCounter={tickCounter}
                onAnomalyDetected={handleAnomalyDetected}
                onForceResync={handleForceResync}
              />
            </div>

            {/* Middle Transparent Area for 3D Brain Interaction */}
            <div className="pointer-events-none hidden md:block" />

            {/* Right Tactical Overrides & Inspector Panel */}
            <div className="pointer-events-auto h-full max-h-[calc(100vh-270px)] md:max-h-full">
              <TacticalOverridesPanel
                selectedLobe={lobes[selectedLobeIdx]}
                systemState={systemState}
                onSaveLobeNotes={handleSaveLobeNotes}
                onHarmonicPulse={triggerHarmonicPulse}
                onCollapseQuantumState={collapseQuantumState}
                onAtrmNullification={runAtrmNullification}
                onCommitFiduciarySeal={commitFiduciarySeal}
                onTriggerEmergencyTripwire={triggerEmergencyTripwire}
                onForceResync={handleForceResync}
                isSavingNotes={isSavingNotes}
                hasUnsavedNotes={false}
                isFirestoreConnected={isFirestoreConnected}
                onLogTerminal={logTerminal}
              />
            </div>
          </div>

          {/* Footer Terminal Stream */}
          <div className="pointer-events-auto h-40 md:h-44 shrink-0">
            <TerminalLogStream
              logs={logs}
              onClearLogs={() => setLogs([])}
            />
          </div>
        </div>
      )}

      {/* Google Workspace Drive & Docs Modal */}
      <WorkspaceArchiveModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
        systemState={systemState}
        logs={logs}
        lobes={lobes}
        onLogTerminal={logTerminal}
      />

      {/* Commercial Services & Pricing Matrix Modal */}
      <CommercialMatrixModal
        isOpen={isCommercialModalOpen}
        onClose={() => setIsCommercialModalOpen(false)}
        onLogTerminal={logTerminal}
      />
    </div>
  );
}
