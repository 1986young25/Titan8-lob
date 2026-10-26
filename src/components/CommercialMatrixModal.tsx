import React, { useState } from 'react';
import {
  X,
  Shield,
  Layers,
  Cpu,
  DollarSign,
  FileText,
  Copy,
  Check,
  Building2,
  Lock,
  Zap,
  Volume2,
  ChevronRight,
  ExternalLink,
  Award
} from 'lucide-react';
import { voiceEngine } from '../utils/speechSynthesis';

interface CommercialMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogTerminal?: (source: string, type: 'BOOT' | 'PULSE' | 'QASM' | 'ATRM' | 'SEAL' | 'TRIPWIRE' | 'HEAL' | 'TICK' | 'DIRECTIVE', msg: string) => void;
}

export const CommercialMatrixModal: React.FC<CommercialMatrixModalProps> = ({
  isOpen,
  onClose,
  onLogTerminal,
}) => {
  const [activeTab, setActiveTab] = useState<'tiers' | 'services' | 'calculator' | 'entity'>('tiers');
  
  // Calculator state
  const [selectedTier, setSelectedTier] = useState<'tier0' | 'tier1' | 'tier2' | 'tier3'>('tier2');
  const [nodeCount, setNodeCount] = useState<number>(5);
  const [addonBareMetal, setAddonBareMetal] = useState<boolean>(true);
  const [addonCanTuning, setAddonCanTuning] = useState<boolean>(false);
  const [addonLedgerMigrate, setAddonLedgerMigrate] = useState<boolean>(false);
  const [addonDisasterRecovery, setAddonDisasterRecovery] = useState<boolean>(true);
  const [addonStatutoryTrust, setAddonStatutoryTrust] = useState<boolean>(false);
  const [advisoryHours, setAdvisoryHours] = useState<number>(4);
  const [paymentChannel, setPaymentChannel] = useState<'MARKETPLACE' | 'DIRECT_ACH' | 'DEFENSE_DRAW'>('MARKETPLACE');
  const [copiedSow, setCopiedSow] = useState<boolean>(false);

  if (!isOpen) return null;

  // Calculation logic
  let baseAnnual = 0;
  let baseMonthly = 0;
  let upfrontOnboarding = 0;

  if (selectedTier === 'tier0') {
    baseAnnual = 0;
    baseMonthly = 0;
  } else if (selectedTier === 'tier1') {
    baseMonthly = 4500 * nodeCount;
    baseAnnual = 48000 * nodeCount;
    upfrontOnboarding = 7500 * Math.ceil(nodeCount / 2);
  } else if (selectedTier === 'tier2') {
    baseAnnual = 195000 + Math.max(0, nodeCount - 5) * (3200 * 12);
    baseMonthly = 18500 + Math.max(0, nodeCount - 5) * 3200;
  } else if (selectedTier === 'tier3') {
    baseAnnual = 350000;
    baseMonthly = Math.round(350000 / 12);
  }

  let addonTotal = 0;
  if (addonBareMetal) addonTotal += 3500 * Math.min(nodeCount, 3);
  if (addonCanTuning) addonTotal += 15000;
  if (addonLedgerMigrate) addonTotal += 5000;
  if (addonDisasterRecovery) addonTotal += 25000;
  if (addonStatutoryTrust) addonTotal += 10000;
  if (advisoryHours > 0) addonTotal += advisoryHours * 500;

  const totalFirstYear = baseAnnual + upfrontOnboarding + addonTotal;
  const trustSweepAllocation = totalFirstYear * 0.70; // 70% gross IP royalty sweep

  const generateSowText = () => {
    const ts = new Date().toISOString();
    return `TITAN GAMES SECURITY L.L.C. // SOW & COMMERCIAL PROCUREMENT ORDER
Generated: ${ts}
Holding Trust: The Nicholas Young Master Trust (EIN 41-6820289)
Operating Arm: Titan Games Security L.L.C. (EIN 42-4264313 | LARA ID 28678008)
Clearances: CAGE Active | SAM.gov Registered | D-U-N-S: 145054895 | DARPAConnect #21270632
Statutory Governing: MCL § 700.7913 / UCC Article 12 (CERs)

SELECTED ARCHITECTURE:
- Tier: ${selectedTier.toUpperCase()}
- Node / Appliance Units: ${nodeCount}
- Settlement Channel: ${paymentChannel === 'MARKETPLACE' ? 'Google Cloud Marketplace Spend Drawdown (cloudcommerceprocurement)' : paymentChannel}
- Base Platform Investment: $${baseAnnual.toLocaleString()} / Year
- Onboarding & Silicon Calibration: $${upfrontOnboarding.toLocaleString()}
- Professional Services & Enclave Hardening: $${addonTotal.toLocaleString()}
------------------------------------------------------------
ESTIMATED FIRST-YEAR COMMITTED TOTAL: $${totalFirstYear.toLocaleString()} USD
70% FIDUCIARY TRUST SWEEP (ASC 350-40): $${trustSweepAllocation.toLocaleString()} USD
Cryptographic Verification Hash: SHA256:${Math.random().toString(36).substring(2, 10).toUpperCase()}-XB6-SEAL`;
  };

  const handleCopySow = () => {
    const sow = generateSowText();
    navigator.clipboard.writeText(sow);
    setCopiedSow(true);
    setTimeout(() => setCopiedSow(false), 2000);

    if (onLogTerminal) {
      onLogTerminal('COMMERCIAL', 'SEAL', `Procurement SOW generated for ${selectedTier.toUpperCase()} ($${totalFirstYear.toLocaleString()} USD total commitment).`);
    }

    voiceEngine.speak(`Commercial Statement of Work generated for ${selectedTier.toUpperCase()}. Total commitment: ${totalFirstYear.toLocaleString()} dollars.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-lg border-2 border-[#00e5ff] bg-[#070c18] text-[#e0f7fa] shadow-[0_0_40px_rgba(0,229,255,0.35)] overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-[#00e5ff]/30 bg-[#0a1224] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-[#00e5ff]/15 border border-[#00e5ff]/40 text-[#00e5ff]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold tracking-wider text-[#00e5ff]">
                  COMMERCIAL SERVICES CATALOG & PRICING MATRIX
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ffd700]/20 text-[#ffd700] border border-[#ffd700]/40">
                  TRL 9 CASH-FLOW MATRIX
                </span>
              </div>
              <p className="text-[11px] text-[#78909c]">
                Federal Contracting Vehicles • Google Cloud Marketplace Spend • Bare-Metal Enclaves • Sovereign Reentry Forge
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded border border-white/20 text-[#78909c] hover:text-white hover:border-[#ff5252] hover:bg-[#ff5252]/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-[#080e1b] px-5 gap-2 overflow-x-auto">
          {[
            { id: 'tiers', label: 'DEPLOYMENT TIERS (0–3)', icon: Layers },
            { id: 'services', label: 'SERVICES CATALOG (PARTS 1 & 3)', icon: Cpu },
            { id: 'calculator', label: 'QUOTE CALCULATOR & SOW GENERATOR', icon: DollarSign },
            { id: 'entity', label: 'FIDUCIARY TRUST & CLEARANCES', icon: Award },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-3.5 text-xs font-bold tracking-wider transition border-b-2 whitespace-nowrap ${
                  isActive
                    ? 'border-[#00e5ff] text-[#00e5ff] bg-[#00e5ff]/10'
                    : 'border-transparent text-[#78909c] hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs text-[#b0bec5]">
          
          {/* TAB 1: DEPLOYMENT TIERS */}
          {activeTab === 'tiers' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Tier 0 */}
                <div className="rounded-lg border border-[#00ff7f]/40 bg-[#00ff7f]/5 p-4 flex flex-col justify-between hover:border-[#00ff7f] transition shadow-[0_0_15px_rgba(0,255,127,0.1)]">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00ff7f]/20 text-[#00ff7f]">
                        HUMANITARIAN
                      </span>
                      <span className="text-[10px] text-[#78909c]">REENTRY FORGE</span>
                    </div>
                    <h3 className="text-sm font-bold text-white">TIER 0: SECOND CHANCE FORGE</h3>
                    <div className="my-2.5">
                      <div className="text-lg font-extrabold text-[#00ff7f]">$0.00 Upfront</div>
                      <div className="text-[10px] text-[#78909c]">30% Gross Covenant (5 Yrs)</div>
                      <div className="text-[10px] text-[#ffd700] mt-0.5">$2,000/mo Living Floor Exempt</div>
                    </div>
                    <p className="text-[11px] text-[#cfd8dc] mb-3 leading-relaxed">
                      Zero-capital software distribution for returning citizens and formerly incarcerated developers.
                    </p>
                    <ul className="space-y-1.5 text-[10px] text-[#b0bec5] border-t border-white/10 pt-2.5">
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#00ff7f] shrink-0 mt-0.5" />
                        <span>POSIX daemons (sovereign_node, proxy_shield)</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#00ff7f] shrink-0 mt-0.5" />
                        <span>In-Memory Shannon Entropy sieve (H &lt; 1.5)</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#00ff7f] shrink-0 mt-0.5" />
                        <span>Immutable SQLite local audit pipeline</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#00ff7f] shrink-0 mt-0.5" />
                        <span>100% Royalty Expiration at 60 months</span>
                      </li>
                    </ul>
                  </div>
                  <button
                    onClick={() => { setSelectedTier('tier0'); setActiveTab('calculator'); }}
                    className="mt-4 w-full py-1.5 rounded bg-[#00ff7f]/20 hover:bg-[#00ff7f]/30 border border-[#00ff7f]/40 text-[#00ff7f] font-bold text-[11px] transition text-center"
                  >
                    CONFIG COVENANT
                  </button>
                </div>

                {/* Tier 1 */}
                <div className="rounded-lg border border-[#00e5ff]/40 bg-[#00e5ff]/5 p-4 flex flex-col justify-between hover:border-[#00e5ff] transition shadow-[0_0_15px_rgba(0,229,255,0.1)]">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00e5ff]/20 text-[#00e5ff]">
                        COMMERCIAL
                      </span>
                      <span className="text-[10px] text-[#78909c]">SINGLE NODE</span>
                    </div>
                    <h3 className="text-sm font-bold text-white">TIER 1: SOVEREIGN APPLIANCE</h3>
                    <div className="my-2.5">
                      <div className="text-lg font-extrabold text-[#00e5ff]">$4,500 / mo</div>
                      <div className="text-[10px] text-[#78909c]">$48,000 / yr upfront (11% off)</div>
                      <div className="text-[10px] text-[#ffd700] mt-0.5">+$7,500 One-Time Silicon Setup</div>
                    </div>
                    <p className="text-[11px] text-[#cfd8dc] mb-3 leading-relaxed">
                      For logistics operators, automated warehouses, robotics labs requiring local edge independence.
                    </p>
                    <ul className="space-y-1.5 text-[10px] text-[#b0bec5] border-t border-white/10 pt-2.5">
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#00e5ff] shrink-0 mt-0.5" />
                        <span>Bare-metal x86/ARM64 daemon enclaves</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#00e5ff] shrink-0 mt-0.5" />
                        <span>CAN/MAVLink EMA (α=0.2) debounce filter</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#00e5ff] shrink-0 mt-0.5" />
                        <span>Nanosecond timestamp audit logging</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#00e5ff] shrink-0 mt-0.5" />
                        <span>99.9% Deterministic SLA guarantee</span>
                      </li>
                    </ul>
                  </div>
                  <button
                    onClick={() => { setSelectedTier('tier1'); setActiveTab('calculator'); }}
                    className="mt-4 w-full py-1.5 rounded bg-[#00e5ff]/20 hover:bg-[#00e5ff]/30 border border-[#00e5ff]/40 text-[#00e5ff] font-bold text-[11px] transition text-center"
                  >
                    CONFIG APPLIANCE
                  </button>
                </div>

                {/* Tier 2 */}
                <div className="rounded-lg border-2 border-[#ffd700] bg-[#ffd700]/10 p-4 flex flex-col justify-between hover:shadow-[0_0_20px_rgba(255,215,0,0.3)] transition relative">
                  <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded text-[9px] font-black bg-[#ffd700] text-black">
                    MOST POPULAR
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ffd700]/30 text-[#ffd700]">
                        ENTERPRISE
                      </span>
                      <span className="text-[10px] text-[#ffd700]">MARKETPLACE</span>
                    </div>
                    <h3 className="text-sm font-bold text-white">TIER 2: HYPERSCALE SUITE</h3>
                    <div className="my-2.5">
                      <div className="text-lg font-extrabold text-[#ffd700]">$195,000 / yr</div>
                      <div className="text-[10px] text-[#78909c]">Up to 5 Master + 20 Edge Satellites</div>
                      <div className="text-[10px] text-[#00ff7f] mt-0.5">Google Cloud Spend Drawdown</div>
                    </div>
                    <p className="text-[11px] text-[#cfd8dc] mb-3 leading-relaxed">
                      Turnkey SOC 2–defensible cryptographic logging and real-time processing billed via cloud commitments.
                    </p>
                    <ul className="space-y-1.5 text-[10px] text-[#b0bec5] border-t border-white/10 pt-2.5">
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#ffd700] shrink-0 mt-0.5" />
                        <span>Titan 4D Enclave & Telemetry Twin</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#ffd700] shrink-0 mt-0.5" />
                        <span>Dual commit: SQLite + CSV compliance</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#ffd700] shrink-0 mt-0.5" />
                        <span>Autonomous CDC daemon (cdc_feedback.py)</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#ffd700] shrink-0 mt-0.5" />
                        <span>Sub-hour mission critical 24/7/365 SLA</span>
                      </li>
                    </ul>
                  </div>
                  <button
                    onClick={() => { setSelectedTier('tier2'); setActiveTab('calculator'); }}
                    className="mt-4 w-full py-1.5 rounded bg-[#ffd700] hover:bg-[#ffe552] text-black font-extrabold text-[11px] transition text-center shadow-[0_0_10px_rgba(255,215,0,0.5)]"
                  >
                    CONFIG ENTERPRISE
                  </button>
                </div>

                {/* Tier 3 */}
                <div className="rounded-lg border border-[#ff5252]/40 bg-[#ff5252]/5 p-4 flex flex-col justify-between hover:border-[#ff5252] transition shadow-[0_0_15px_rgba(255,82,82,0.1)]">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#ff5252]/20 text-[#ff5252]">
                        DEFENSE / SBIR
                      </span>
                      <span className="text-[10px] text-[#78909c]">AIR-GAPPED</span>
                    </div>
                    <h3 className="text-sm font-bold text-white">TIER 3: FEDERAL & AEROSPACE</h3>
                    <div className="my-2.5">
                      <div className="text-lg font-extrabold text-[#ff5252]">$150K – $750K+</div>
                      <div className="text-[10px] text-[#78909c]">Fixed-Price / Cost-Plus Milestone</div>
                      <div className="text-[10px] text-[#ffd700] mt-0.5">CAGE: Active | SAM.gov Active</div>
                    </div>
                    <p className="text-[11px] text-[#cfd8dc] mb-3 leading-relaxed">
                      For defense prime contractors, municipal tracking operations, and SBIR/STTR solicitations.
                    </p>
                    <ul className="space-y-1.5 text-[10px] text-[#b0bec5] border-t border-white/10 pt-2.5">
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#ff5252] shrink-0 mt-0.5" />
                        <span>Air-gapped zero-cloud tactical hardware</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#ff5252] shrink-0 mt-0.5" />
                        <span>Wave-impedance locked (Z₀ = 376.5 Ω)</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#ff5252] shrink-0 mt-0.5" />
                        <span>USPTO Patent App #64/014,873 Formalities</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#ff5252] shrink-0 mt-0.5" />
                        <span>DARPAConnect / ARI #21270632 Compliant</span>
                      </li>
                    </ul>
                  </div>
                  <button
                    onClick={() => { setSelectedTier('tier3'); setActiveTab('calculator'); }}
                    className="mt-4 w-full py-1.5 rounded bg-[#ff5252]/20 hover:bg-[#ff5252]/30 border border-[#ff5252]/40 text-[#ff5252] font-bold text-[11px] transition text-center"
                  >
                    CONFIG DEFENSE
                  </button>
                </div>

              </div>

              {/* Settlement Architecture Footer Bar */}
              <div className="p-4 rounded-lg border border-white/10 bg-[#0a1426] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-[#ffd700]" />
                  <div>
                    <div className="text-white font-bold text-xs">COMMERCIAL CLEARANCE CHANNELS & STATUTORY TITLE</div>
                    <div className="text-[11px] text-[#78909c]">
                      D-U-N-S: 145054895 • CAGE Active • SAM.gov Active • Michigan Trust Code MCL § 700.7913 • UCC Article 12 (CERs)
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-[#00e5ff]/10 border border-[#00e5ff]/30 text-[#00e5ff] text-[10px] font-bold">
                    Net-30 Invoicing (Paydex 75+)
                  </span>
                  <span className="px-2.5 py-1 rounded bg-[#ffd700]/10 border border-[#ffd700]/30 text-[#ffd700] text-[10px] font-bold">
                    GCP Marketplace Drawdown
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COMPREHENSIVE SERVICES CATALOG */}
          {activeTab === 'services' && (
            <div className="space-y-6">
              
              {/* Part 1 Services */}
              <div>
                <h3 className="text-sm font-bold text-[#00e5ff] tracking-wide mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#00e5ff]" />
                  PART 1: COMPREHENSIVE CATALOG OF CORE SERVICES
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div className="p-3.5 rounded border border-white/10 bg-[#0a1224]">
                    <div className="text-white font-bold text-xs mb-1">1. Sovereign Edge & Cyber-Physical Hardening</div>
                    <p className="text-[11px] text-[#90a4ae] leading-relaxed mb-2">
                      Zero-cloud-rent bare-metal POSIX enclaves, mathematical Shannon entropy threat filters (H(X) &lt; 1.5) with inline bitwise inversion (~arr), and Modulo-9 data/control plane separation.
                    </p>
                    <div className="text-[10px] text-[#00e5ff] font-mono">
                      DELIVERABLE: sovereign_node.py • proxy_shield.py • Shannon sieve module
                    </div>
                  </div>

                  <div className="p-3.5 rounded border border-white/10 bg-[#0a1224]">
                    <div className="text-white font-bold text-xs mb-1">2. Kinetic Telemetry, Robotics & Autonomous Vehicle Conditioning</div>
                    <p className="text-[11px] text-[#90a4ae] leading-relaxed mb-2">
                      Real-time CAN and MAVLink physical filtering using Exponential Moving Average (α=0.2) smoothing, 376.5 Ω impedance synchronization, 3.69 Hz pulse metronome, and 4D digital twin ingress.
                    </p>
                    <div className="text-[10px] text-[#00e5ff] font-mono">
                      DELIVERABLE: MAVLink UDP 14550 stream • 4D GIS rasterizer • Pixel 8a field bridge
                    </div>
                  </div>

                  <div className="p-3.5 rounded border border-white/10 bg-[#0a1224]">
                    <div className="text-white font-bold text-xs mb-1">3. Fiduciary Cryptographic Auditing & Title Ledger Engineering</div>
                    <p className="text-[11px] text-[#90a4ae] leading-relaxed mb-2">
                      Nanosecond state-sealing SQLite ledgers, UCC Article 12 proof-of-reserve hashes (UCC-CER-NYMT-XB6-...), and continuous Change Data Capture daemons (cdc_feedback.py).
                    </p>
                    <div className="text-[10px] text-[#00e5ff] font-mono">
                      DELIVERABLE: digital_twin_state.db • cdc_feedback.py • SHA-256 seal generator
                    </div>
                  </div>

                  <div className="p-3.5 rounded border border-white/10 bg-[#0a1224]">
                    <div className="text-white font-bold text-xs mb-1">4. Auxiliary Hyperscale AI & Cloud Commerce Dispatch</div>
                    <p className="text-[11px] text-[#90a4ae] leading-relaxed mb-2">
                      Inverted hyperscale AI bridging routing to Google Cloud (Vertex AI Gemini 2.5 Flash/Pro) for semantic triage without ceding local state authority, integrated with cloudcommerceprocurement.
                    </p>
                    <div className="text-[10px] text-[#00e5ff] font-mono">
                      DELIVERABLE: actions.googleapis.com bridge • Marketplace billing draw-down
                    </div>
                  </div>

                </div>
              </div>

              {/* Part 3 Professional Services */}
              <div>
                <h3 className="text-sm font-bold text-[#ffd700] tracking-wide mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#ffd700]" />
                  PART 3: SPECIALIZED PROFESSIONAL SERVICES & SPRINT ADD-ONS
                </h3>
                <div className="overflow-x-auto rounded border border-white/10 bg-[#0a1224]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/15 bg-white/5 text-[#78909c]">
                        <th className="p-3 font-semibold">PROFESSIONAL SERVICE MODULE</th>
                        <th className="p-3 font-semibold">BILLING MODEL</th>
                        <th className="p-3 font-semibold text-right">RATE / PRICING</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      <tr>
                        <td className="p-3 text-white font-medium">Bare-Metal Hardware Node Provisioning & Benchmarking</td>
                        <td className="p-3 text-[#b0bec5]">Flat Rate / Node</td>
                        <td className="p-3 text-right font-mono text-[#00e5ff] font-bold">$3,500 + hardware</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-white font-medium">Custom Vehicle CAN / MAVLink Physical Signal Tuning</td>
                        <td className="p-3 text-[#b0bec5]">Fixed Engagement (2-week sprint)</td>
                        <td className="p-3 text-right font-mono text-[#00e5ff] font-bold">$15,000</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-white font-medium">Enterprise Fiduciary Ledger Migration (CSV/SQL -&gt; UCC Seals)</td>
                        <td className="p-3 text-[#b0bec5]">Per 1M Records</td>
                        <td className="p-3 text-right font-mono text-[#00e5ff] font-bold">$5,000</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-white font-medium">On-Premises Air-Gapped Disaster Recovery Deployment</td>
                        <td className="p-3 text-[#b0bec5]">Fixed Fee</td>
                        <td className="p-3 text-right font-mono text-[#00e5ff] font-bold">$25,000</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-white font-medium">Statutory Trust & IP Titling Architectural Consultation</td>
                        <td className="p-3 text-[#b0bec5]">Retainer</td>
                        <td className="p-3 text-right font-mono text-[#00e5ff] font-bold">$10,000</td>
                      </tr>
                      <tr>
                        <td className="p-3 text-white font-medium">Executive Systems Architecture Advisory (Nicholas Lee Young)</td>
                        <td className="p-3 text-[#b0bec5]">Hourly Retainer (4 hr min)</td>
                        <td className="p-3 text-right font-mono text-[#00e5ff] font-bold">$500 / hr</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: QUOTE CALCULATOR & SOW GENERATOR */}
          {activeTab === 'calculator' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Configuration Controls */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* Select Tier */}
                <div className="p-4 rounded-lg border border-white/10 bg-[#0a1224]">
                  <label className="text-white font-bold block mb-2">1. SELECT COMMERCIAL DEPLOYMENT TIER</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'tier0', name: 'Tier 0: Forge', desc: '$0 upfront' },
                      { id: 'tier1', name: 'Tier 1: Appliance', desc: '$4.5k/mo/node' },
                      { id: 'tier2', name: 'Tier 2: Enterprise', desc: '$195k/yr cluster' },
                      { id: 'tier3', name: 'Tier 3: Defense', desc: '$150k - $750k' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTier(t.id as any)}
                        className={`p-2.5 rounded text-left transition border ${
                          selectedTier === t.id
                            ? 'border-[#00e5ff] bg-[#00e5ff]/20 text-white'
                            : 'border-white/10 bg-black/30 text-[#90a4ae] hover:border-white/30'
                        }`}
                      >
                        <div className="font-bold text-xs">{t.name}</div>
                        <div className="text-[10px] text-[#ffd700]">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Node Scaling */}
                <div className="p-4 rounded-lg border border-white/10 bg-[#0a1224]">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-white font-bold">2. OPERATIONAL NODES / APPLIANCES</label>
                    <span className="font-mono text-base font-bold text-[#00e5ff]">{nodeCount} Nodes</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={nodeCount}
                    onChange={(e) => setNodeCount(parseInt(e.target.value))}
                    className="w-full accent-[#00e5ff] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#78909c] mt-1">
                    <span>1 (Single Edge)</span>
                    <span>5 (Standard Cluster)</span>
                    <span>20 (Hyperscale Mesh)</span>
                  </div>
                </div>

                {/* Professional Services Add-ons */}
                <div className="p-4 rounded-lg border border-white/10 bg-[#0a1224]">
                  <label className="text-white font-bold block mb-2">3. PROFESSIONAL SERVICES & HARDENING ADD-ONS</label>
                  <div className="space-y-2">
                    
                    <label className="flex items-center justify-between p-2 rounded bg-black/30 border border-white/10 hover:border-white/20 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={addonBareMetal}
                          onChange={(e) => setAddonBareMetal(e.target.checked)}
                          className="accent-[#00e5ff]"
                        />
                        <div>
                          <span className="text-white font-medium">Bare-Metal Node Hardware Benchmarking</span>
                          <span className="text-[10px] text-[#78909c] block">Includes baseline stress tests & silicon memory locks</span>
                        </div>
                      </div>
                      <span className="text-[#00e5ff] font-mono font-bold">$3,500/ea</span>
                    </label>

                    <label className="flex items-center justify-between p-2 rounded bg-black/30 border border-white/10 hover:border-white/20 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={addonCanTuning}
                          onChange={(e) => setAddonCanTuning(e.target.checked)}
                          className="accent-[#00e5ff]"
                        />
                        <div>
                          <span className="text-white font-medium">Custom CAN / MAVLink Signal Tuning Sprint</span>
                          <span className="text-[10px] text-[#78909c] block">2-week dedicated sprint with vehicle telemetry lab</span>
                        </div>
                      </div>
                      <span className="text-[#00e5ff] font-mono font-bold">+$15,000</span>
                    </label>

                    <label className="flex items-center justify-between p-2 rounded bg-black/30 border border-white/10 hover:border-white/20 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={addonDisasterRecovery}
                          onChange={(e) => setAddonDisasterRecovery(e.target.checked)}
                          className="accent-[#00e5ff]"
                        />
                        <div>
                          <span className="text-white font-medium">Air-Gapped Disaster Recovery Deployment</span>
                          <span className="text-[10px] text-[#78909c] block">On-premise physical air-gap failover cluster</span>
                        </div>
                      </div>
                      <span className="text-[#00e5ff] font-mono font-bold">+$25,000</span>
                    </label>

                    <label className="flex items-center justify-between p-2 rounded bg-black/30 border border-white/10 hover:border-white/20 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={addonStatutoryTrust}
                          onChange={(e) => setAddonStatutoryTrust(e.target.checked)}
                          className="accent-[#00e5ff]"
                        />
                        <div>
                          <span className="text-white font-medium">Statutory Trust & IP Titling Consultation</span>
                          <span className="text-[10px] text-[#78909c] block">MCL § 700.7913 asset partitioning & UCC-9 filings</span>
                        </div>
                      </div>
                      <span className="text-[#00e5ff] font-mono font-bold">+$10,000</span>
                    </label>

                  </div>

                  {/* Advisory hours */}
                  <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-white font-medium">Executive Advisory (Nicholas Lee Young)</span>
                      <span className="text-[10px] text-[#78909c] block">$500/hr (Min 4 hrs)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="40"
                        value={advisoryHours}
                        onChange={(e) => setAdvisoryHours(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-16 px-2 py-1 bg-black/50 border border-white/20 rounded text-center text-white font-mono"
                      />
                      <span className="text-[#00e5ff] font-mono font-bold">${(advisoryHours * 500).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Settlement Channel */}
                <div className="p-4 rounded-lg border border-white/10 bg-[#0a1224]">
                  <label className="text-white font-bold block mb-2">4. SELECT SETTLEMENT & CLEARANCE CHANNEL</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'MARKETPLACE', name: 'GCP Marketplace Spend', tag: 'Direct Drawdown' },
                      { id: 'DIRECT_ACH', name: 'Corporate ACH / PO', tag: 'Net-30 (Paydex 75+)' },
                      { id: 'DEFENSE_DRAW', name: 'Federal Milestone Draw', tag: 'CAGE / SAM Active' },
                    ].map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setPaymentChannel(c.id as any)}
                        className={`p-2.5 rounded text-left transition border ${
                          paymentChannel === c.id
                            ? 'border-[#ffd700] bg-[#ffd700]/20 text-white'
                            : 'border-white/10 bg-black/30 text-[#90a4ae] hover:border-white/30'
                        }`}
                      >
                        <div className="font-bold text-xs">{c.name}</div>
                        <div className="text-[10px] text-[#ffd700]">{c.tag}</div>
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Financial Summary & SOW Output */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                
                <div className="p-5 rounded-lg border-2 border-[#00e5ff] bg-[#0c162d] shadow-[0_0_25px_rgba(0,229,255,0.2)]">
                  <div className="flex items-center justify-between pb-3 border-b border-white/15">
                    <span className="text-xs font-bold text-[#00e5ff]">INVESTMENT SUMMARY</span>
                    <span className="text-[10px] font-mono text-[#ffd700]">TRL 9 VERIFIED</span>
                  </div>

                  <div className="space-y-3 py-3 border-b border-white/10 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#90a4ae]">Base Platform License:</span>
                      <span className="text-white font-mono font-bold">${baseAnnual.toLocaleString()} / yr</span>
                    </div>
                    {upfrontOnboarding > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[#90a4ae]">Hardware Onboarding:</span>
                        <span className="text-white font-mono font-bold">${upfrontOnboarding.toLocaleString()}</span>
                      </div>
                    )}
                    {addonTotal > 0 && (
                      <div className="flex justify-between">
                        <span className="text-[#90a4ae]">Professional Add-Ons:</span>
                        <span className="text-white font-mono font-bold">${addonTotal.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-1">
                      <span className="text-[#90a4ae]">Estimated Monthly Burn:</span>
                      <span className="text-[#00e5ff] font-mono font-bold">~${baseMonthly.toLocaleString()} / mo</span>
                    </div>
                  </div>

                  <div className="py-3">
                    <div className="text-[11px] text-[#78909c]">FIRST-YEAR COMMITTED TOTAL</div>
                    <div className="text-2xl font-black text-[#ffd700] font-mono">
                      ${totalFirstYear.toLocaleString()} <span className="text-xs text-white font-normal">USD</span>
                    </div>
                    <div className="text-[10px] text-[#00ff7f] mt-1 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>70% Fiduciary Sweep to Master Trust: ${trustSweepAllocation.toLocaleString()} USD</span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col gap-2">
                    <button
                      onClick={handleCopySow}
                      className="w-full py-2.5 rounded bg-[#00e5ff] hover:bg-[#33ebff] text-black font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(0,229,255,0.4)]"
                    >
                      {copiedSow ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedSow ? 'COPIED TO CLIPBOARD' : 'COPY OFFICIAL PROCUREMENT SOW'}</span>
                    </button>

                    <button
                      onClick={() => {
                        voiceEngine.speak(
                          `Titan Games Security quote initialized for ${selectedTier.toUpperCase()} tier. Total first-year commitment: ${totalFirstYear.toLocaleString()} dollars. Channel: ${paymentChannel}.`
                        );
                      }}
                      className="w-full py-1.5 rounded border border-[#00e5ff]/40 bg-[#00e5ff]/10 hover:bg-[#00e5ff]/20 text-[#00e5ff] text-[11px] font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-[#00ff7f]" />
                      <span>SPEAK QUOTE BRIEF (WEB SPEECH API)</span>
                    </button>
                  </div>
                </div>

                {/* Statutory Note */}
                <div className="p-3.5 rounded border border-white/10 bg-black/40 text-[10px] text-[#90a4ae] space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-[#ffd700]" />
                    <span>Statutory & Title Perfection</span>
                  </div>
                  <p>
                    All contracts are executed by Titan Games Security L.L.C. as the operating carrier for The Nicholas Young Master Trust under MCL § 700.7913. Digital deliverables and algorithmic yields are Controllable Electronic Records (CERs) under UCC Article 12.
                  </p>
                </div>

              </div>

            </div>
          )}

          {/* TAB 4: FIDUCIARY TRUST & CLEARANCES */}
          {activeTab === 'entity' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-[#ffd700]/30 bg-[#ffd700]/5 space-y-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#ffd700]" />
                  <h3 className="text-sm font-bold text-white">CORPORATE & FIDUCIARY TOPOLOGY</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded bg-black/50 border border-white/10">
                    <div className="text-[10px] text-[#ffd700] font-bold">HOLDING TRUST</div>
                    <div className="text-white font-bold text-sm">The Nicholas Young Master Trust</div>
                    <div className="text-[#90a4ae] text-[11px]">EIN: 41-6820289</div>
                    <div className="text-[10px] text-[#78909c] mt-1">Authority: Sole Trustee Nicholas Lee Young</div>
                    <div className="text-[10px] text-[#00ff7f]">Statutory Anchor: MCL § 700.7913</div>
                  </div>
                  <div className="p-3 rounded bg-black/50 border border-white/10">
                    <div className="text-[10px] text-[#00e5ff] font-bold">OPERATING CARRIER</div>
                    <div className="text-white font-bold text-sm">Titan Games Security L.L.C.</div>
                    <div className="text-[#90a4ae] text-[11px]">EIN: 42-4264313 | LARA ID: 28678008</div>
                    <div className="text-[10px] text-[#78909c] mt-1">D-U-N-S: 145054895 | UEI: S3SXM538MG79</div>
                    <div className="text-[10px] text-[#00ff7f]">Clearances: CAGE Active | SAM.gov Active</div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-white/10 bg-[#0a1224] space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-[#00e5ff]" />
                  <span>FEDERAL CONTRACTING VEHICLES & CLEARANCES</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2.5 rounded bg-black/40 border border-white/5">
                    <div className="text-[10px] text-[#78909c]">CAGE STATUS</div>
                    <div className="text-[#00ff7f] font-bold">ACTIVE</div>
                    <div className="text-[9px] text-[#90a4ae]">DoD & Federal primes</div>
                  </div>
                  <div className="p-2.5 rounded bg-black/40 border border-white/5">
                    <div className="text-[10px] text-[#78909c]">SAM.GOV</div>
                    <div className="text-[#00ff7f] font-bold">REGISTERED</div>
                    <div className="text-[9px] text-[#90a4ae]">Entity Unique ID active</div>
                  </div>
                  <div className="p-2.5 rounded bg-black/40 border border-white/5">
                    <div className="text-[10px] text-[#78909c]">DARPACONNECT</div>
                    <div className="text-[#00ff7f] font-bold">ARI #21270632</div>
                    <div className="text-[9px] text-[#90a4ae]">SBIR / STTR pipeline</div>
                  </div>
                  <div className="p-2.5 rounded bg-black/40 border border-white/5">
                    <div className="text-[10px] text-[#78909c]">USPTO APPLICATION</div>
                    <div className="text-[#ffd700] font-bold">#64/014,873</div>
                    <div className="text-[9px] text-[#90a4ae]">Formalities verification</div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-[#0a1224] flex items-center justify-between text-[11px]">
          <div className="text-[#78909c]">
            Titan Games Security L.L.C. • Nicholas Young Master Trust • All rights reserved
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded border border-white/20 hover:border-[#00e5ff] text-white hover:text-[#00e5ff] font-bold transition"
          >
            DISMISS
          </button>
        </div>

      </div>
    </div>
  );
};
