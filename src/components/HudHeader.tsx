import React from 'react';
import { User } from 'firebase/auth';
import { Volume2, VolumeX, Eye, EyeOff, Shield, ShieldCheck, LogIn, LogOut, Radio, HardDrive, Mic, MicOff, Building2 } from 'lucide-react';
import { FIDUCIARY_ANCHOR } from '../constants';

interface HudHeaderProps {
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  metronomeHz: number;
  isMuted: boolean;
  onToggleMute: () => void;
  isVoiceEnabled?: boolean;
  onToggleVoice?: () => void;
  isZenMode: boolean;
  onToggleZenMode: () => void;
  tickCounter: number;
  isFirestoreConnected: boolean;
  onOpenWorkspace: () => void;
  onOpenCommercialMatrix?: () => void;
}

export const HudHeader: React.FC<HudHeaderProps> = ({
  user,
  onLogin,
  onLogout,
  metronomeHz,
  isMuted,
  onToggleMute,
  isVoiceEnabled = true,
  onToggleVoice,
  isZenMode,
  onToggleZenMode,
  tickCounter,
  isFirestoreConnected,
  onOpenWorkspace,
  onOpenCommercialMatrix,
}) => {
  return (
    <header className="hud-panel-glow border-b-2 border-[#00e5ff] bg-[rgba(10,16,32,0.92)] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs z-20">
      {/* Title & Fiduciary Anchor */}
      <div className="flex flex-col min-w-[280px]">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-[#00e5ff] shrink-0" />
          <h1 className="text-sm md:text-base font-extrabold tracking-widest text-[#00e5ff]">
            THE CRYPTED BRAIN // AURA SOVEREIGN OCTA-LOBE C2
          </h1>
          <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-[#ffd700]/15 text-[#ffd700] border border-[#ffd700]/40 rounded font-bold">
            CAGE: 25AD9
          </span>
          <span className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] bg-[#00ff7f]/15 text-[#00ff7f] border border-[#00ff7f]/30 rounded font-mono">
            UCC CER: $31,970,000 USD
          </span>
        </div>
        <div className="text-[10px] md:text-[11px] text-[#ffd700] tracking-wide mt-0.5 truncate max-w-4xl">
          TRUST: {FIDUCIARY_ANCHOR.trust} (EIN: {FIDUCIARY_ANCHOR.ein}) | OPERATING: {FIDUCIARY_ANCHOR.carrier} (EIN: {FIDUCIARY_ANCHOR.carrierEin} | DUNS: {FIDUCIARY_ANCHOR.duns} | DARPA: {FIDUCIARY_ANCHOR.darpaConnect})
        </div>
      </div>

      {/* Center / Right Telemetry & Controls */}
      <div className="flex items-center gap-2 md:gap-2.5 ml-auto">
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

        {/* Commercial Matrix Button */}
        {onOpenCommercialMatrix && (
          <button
            onClick={onOpenCommercialMatrix}
            className="px-2.5 py-1 rounded border border-[#ffd700] bg-[#ffd700]/15 text-[#ffd700] hover:bg-[#ffd700] hover:text-black font-bold tracking-wider text-[10px] transition flex items-center gap-1.5 shadow-[0_0_10px_rgba(255,215,0,0.25)]"
            title="Open Commercial Services Catalog, Deployment Tiers & Pricing Matrix"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">COMMERCIAL MATRIX</span>
            <span className="sm:hidden">PRICING</span>
          </button>
        )}

        {/* Google Workspace Drive & Docs Button */}
        <button
          onClick={onOpenWorkspace}
          className="px-2 py-1 rounded border border-[#00e5ff] bg-[#00e5ff]/15 text-[#00e5ff] hover:bg-[#00e5ff] hover:text-black font-semibold tracking-wider text-[10px] transition flex items-center gap-1.5 shadow-[0_0_8px_rgba(0,229,255,0.2)]"
          title="Open Google Drive & Google Docs Workspace Archive"
        >
          <HardDrive className="w-3.5 h-3.5 text-[#00e5ff]" />
          <span className="hidden xl:inline">WORKSPACE ARCHIVE</span>
          <span className="xl:hidden">WORKSPACE</span>
        </button>

        {/* Tactical Audio & Voice Controls */}
        <div className="flex items-center gap-1.5">
          {/* Web Speech Voice Feedback Toggle */}
          {onToggleVoice && (
            <button
              onClick={onToggleVoice}
              title={isVoiceEnabled ? 'Disable Web Speech Tactical Voice' : 'Enable Web Speech Tactical Voice'}
              className={`p-1.5 rounded border text-[10px] transition flex items-center gap-1 ${
                isVoiceEnabled
                  ? 'border-[#00e5ff] bg-[#00e5ff]/20 text-[#00e5ff]'
                  : 'border-white/15 text-[#78909c] hover:border-white/30'
              }`}
            >
              {isVoiceEnabled ? <Mic className="w-3.5 h-3.5 text-[#00ff7f]" /> : <MicOff className="w-3.5 h-3.5" />}
              <span className="hidden 2xl:inline text-[9px]">{isVoiceEnabled ? 'VOICE ON' : 'VOICE OFF'}</span>
            </button>
          )}

          {/* 3.69 Hz Oscillator Synthesizer Mute */}
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
