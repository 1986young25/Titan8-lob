import React from 'react';
import { User } from 'firebase/auth';
import { Volume2, VolumeX, Eye, EyeOff, Shield, ShieldCheck, LogIn, LogOut, Radio, HardDrive } from 'lucide-react';
import { FIDUCIARY_ANCHOR } from '../constants';

interface HudHeaderProps {
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  metronomeHz: number;
  isMuted: boolean;
  onToggleMute: () => void;
  isZenMode: boolean;
  onToggleZenMode: () => void;
  tickCounter: number;
  isFirestoreConnected: boolean;
  onOpenWorkspace: () => void;
}

export const HudHeader: React.FC<HudHeaderProps> = ({
  user,
  onLogin,
  onLogout,
  metronomeHz,
  isMuted,
  onToggleMute,
  isZenMode,
  onToggleZenMode,
  tickCounter,
  isFirestoreConnected,
  onOpenWorkspace,
}) => {
  return (
    <header className="hud-panel-glow border-b-2 border-[#00e5ff] bg-[rgba(10,16,32,0.92)] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs z-20">
      {/* Title & Fiduciary Anchor */}
      <div className="flex flex-col min-w-[280px]">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-[#00e5ff] shrink-0" />
          <h1 className="text-sm md:text-base font-extrabold tracking-widest text-[#00e5ff]">
            THE CRYPTED BRAIN // SOVEREIGN OCTA-LOBE COMMAND
          </h1>
          <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-[#00e5ff]/10 text-[#00e5ff] border border-[#00e5ff]/30 rounded">
            v3.69-ENCLAVE
          </span>
        </div>
        <div className="text-[10px] md:text-[11px] text-[#ffd700] tracking-wide mt-0.5 truncate max-w-4xl">
          FIDUCIARY ANCHOR: {FIDUCIARY_ANCHOR.trust} (EIN: {FIDUCIARY_ANCHOR.ein}) | CARRIER: {FIDUCIARY_ANCHOR.carrier} (UEI: {FIDUCIARY_ANCHOR.uei})
        </div>
      </div>

      {/* Center / Right Telemetry & Controls */}
      <div className="flex items-center gap-3 md:gap-4 ml-auto">
        {/* Metronome Beat */}
        <div className="flex flex-col items-end">
          <div className="text-[11px] text-[#00e5ff] font-medium flex items-center gap-1.5">
            <span>CLOCK GATING:</span>
            <span className="text-[#ffd700] font-bold">
              {metronomeHz.toFixed(2)} Hz TESLA PULSE
            </span>
            <span
              className={`inline-block w-2 h-2 rounded-full border ${
                tickCounter % 2 === 0
                  ? 'bg-[#ffd700] border-[#ffd700]'
                  : 'bg-[#00e5ff]/30 border-[#00e5ff]'
              }`}
            />
          </div>
          <div className="text-[9px] text-[#78909c]">
            PORT TOPOLOGY: {FIDUCIARY_ANCHOR.ports}
          </div>
        </div>

        {/* Database Status */}
        <div className="hidden lg:flex items-center gap-1 px-2 py-1 bg-black/40 border border-white/10 rounded text-[10px]">
          {isFirestoreConnected ? (
            <ShieldCheck className="w-3.5 h-3.5 text-[#00ff7f]" />
          ) : (
            <Shield className="w-3.5 h-3.5 text-[#ffd700]" />
          )}
          <span className={isFirestoreConnected ? 'text-[#00ff7f]' : 'text-[#ffd700]'}>
            {isFirestoreConnected ? 'FIRESTORE: ATOMIC WAL' : 'FIRESTORE: READY'}
          </span>
        </div>

        {/* Google Workspace Drive & Docs Button */}
        <button
          onClick={onOpenWorkspace}
          className="px-2.5 py-1 rounded border border-[#00e5ff] bg-[#00e5ff]/15 text-[#00e5ff] hover:bg-[#00e5ff] hover:text-black font-semibold tracking-wider text-[10px] transition flex items-center gap-1.5 shadow-[0_0_8px_rgba(0,229,255,0.2)]"
          title="Open Google Drive & Google Docs Workspace Archive"
        >
          <HardDrive className="w-3.5 h-3.5 text-[#ffd700]" />
          <span className="hidden sm:inline">WORKSPACE ARCHIVE</span>
          <span className="sm:hidden">WORKSPACE</span>
        </button>

        {/* Tactical Actions */}
        <div className="flex items-center gap-1.5">
          {/* Audio Synthesizer */}
          <button
            onClick={onToggleMute}
            title={isMuted ? 'Unmute 3.69 Hz Tesla Sound' : 'Mute Sound'}
            className="p-1.5 rounded border border-[#00e5ff]/30 text-[#00e5ff] hover:bg-[#00e5ff]/20 hover:border-[#00e5ff] transition"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#ffd700]" />}
          </button>

          {/* Zen Viewport Mode */}
          <button
            onClick={onToggleZenMode}
            title={isZenMode ? 'Show HUD Panels' : 'Hide Panels for 3D Zen View'}
            className="p-1.5 rounded border border-[#00e5ff]/30 text-[#00e5ff] hover:bg-[#00e5ff]/20 hover:border-[#00e5ff] transition flex items-center gap-1"
          >
            {isZenMode ? <Eye className="w-3.5 h-3.5 text-[#00ff7f]" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="hidden xl:inline text-[10px]">{isZenMode ? 'HUD ON' : 'ZEN 3D'}</span>
          </button>

          {/* Auth Operator */}
          {user ? (
            <div className="flex items-center gap-2 pl-1 border-l border-white/20">
              <div className="text-right">
                <div className="text-[10px] font-bold text-[#e0f7fa] leading-tight truncate max-w-[110px]">
                  {user.displayName || 'COMMANDER'}
                </div>
                <div className="text-[9px] text-[#00ff7f] leading-none">
                  SOVEREIGN CLEARANCE
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Disconnect Operator"
                className="p-1.5 rounded border border-[#ff1744]/40 text-[#ff1744] hover:bg-[#ff1744]/20 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="px-2.5 py-1 rounded border border-[#00e5ff] bg-[#00e5ff]/10 text-[#00e5ff] hover:bg-[#00e5ff] hover:text-black font-semibold tracking-wider text-[10px] transition flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>OPERATOR AUTH</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
