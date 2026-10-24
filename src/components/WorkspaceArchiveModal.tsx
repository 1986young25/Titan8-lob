import React, { useState, useEffect } from 'react';
import {
  FileText,
  HardDrive,
  ExternalLink,
  UploadCloud,
  CheckCircle2,
  X,
  RefreshCw,
  Folder,
  AlertCircle,
  FileCode,
} from 'lucide-react';
import {
  listDriveFiles,
  createSovereignAuditDoc,
  uploadLedgerToDrive,
  DriveFileItem,
  getCachedWorkspaceToken,
  signInWithGoogleWorkspace,
} from '../services/workspace';
import { SystemState, TelemetryEvent, OctaLobe } from '../types';
import { FIDUCIARY_ANCHOR } from '../constants';

interface WorkspaceArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemState: SystemState;
  logs: TelemetryEvent[];
  lobes: OctaLobe[];
  onLogTerminal: (source: string, type: TelemetryEvent['type'], message: string) => void;
}

export const WorkspaceArchiveModal: React.FC<WorkspaceArchiveModalProps> = ({
  isOpen,
  onClose,
  systemState,
  logs,
  lobes,
  onLogTerminal,
}) => {
  const [hasToken, setHasToken] = useState<boolean>(!!getCachedWorkspaceToken());
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGeneratingDoc, setIsGeneratingDoc] = useState<boolean>(false);
  const [isUploadingBackup, setIsUploadingBackup] = useState<boolean>(false);
  const [recentDocUrl, setRecentDocUrl] = useState<string | null>(null);
  const [recentBackupUrl, setRecentBackupUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const token = getCachedWorkspaceToken();
      setHasToken(!!token);
      if (token) {
        loadFiles();
      }
    }
  }, [isOpen]);

  const handleConnectWorkspace = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await signInWithGoogleWorkspace();
      setHasToken(true);
      onLogTerminal('WORKSPACE', 'BOOT', 'Google Workspace (Drive & Docs) OAuth token granted.');
      await loadFiles();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      onLogTerminal('WORKSPACE_ERR', 'BOOT', `OAuth error: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFiles = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const files = await listDriveFiles();
      setDriveFiles(files);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate Google Doc Audit Record
  const handleGenerateAuditDoc = async () => {
    setIsGeneratingDoc(true);
    setErrorMsg(null);
    try {
      const timestamp = new Date().toISOString();
      const title = `THE CRYPTED BRAIN // Audit Record - ${timestamp.substring(0, 10)}`;

      const docBody = `================================================================================
THE CRYPTED BRAIN // SOVEREIGN OCTA-LOBE TACTICAL COMMAND
AUDIT REPORT & STATE ATTESTATION
Generated at: ${timestamp} UTC
================================================================================

1. FIDUCIARY & STATUTORY FOUNDATION
--------------------------------------------------------------------------------
Trust Entity:    ${FIDUCIARY_ANCHOR.trust}
EIN:             ${FIDUCIARY_ANCHOR.ein}
Carrier Shell:   ${FIDUCIARY_ANCHOR.carrier}
UEI:             ${FIDUCIARY_ANCHOR.uei}
Port Topology:   ${FIDUCIARY_ANCHOR.ports}
Governance:      ${FIDUCIARY_ANCHOR.statutory}

2. PHYSICAL CONSTANTS & TELEMETRY BASELINE
--------------------------------------------------------------------------------
Free-Space Impedance (Z0):  ${systemState.freeSpaceZ0.toFixed(2)} Ohms
Metronome Clock Gating:     ${systemState.metronomeHz.toFixed(3)} Hz (Tesla Cadence)
Entropy Floor H(X):         ${systemState.entropyH.toFixed(4)}
ATRM Attenuation Floor:     ${systemState.atrmDb.toFixed(2)} dB
4D Hyper-Manifold M-Score:  ${systemState.manifoldM.toFixed(4)}
Collateral Parity Ratio:    ${systemState.collateralParity}
Atomic State Root Hash:     ${systemState.atomicRoot}
PoW Sieve Throughput:       ${systemState.powSieveOps.toLocaleString()} OPS/SEC
Enclave Status:             ${systemState.status}

3. OCTA-LOBE COGNITIVE MODULES
--------------------------------------------------------------------------------
${lobes
  .map(
    (l) => `* [MOD-0${l.id + 1}] ${l.name}
  Tag: ${l.tag} | Status: ${l.status}
  Subroutine: ${l.subroutine}
  Directive: ${l.notes || 'Nominal operational gating.'}
`
  )
  .join('\n')}

4. RECENT FORENSIC LEDGER ENTRIES (${Math.min(logs.length, 25)} events)
--------------------------------------------------------------------------------
${logs
  .slice(-25)
  .map(
    (log) =>
      `[${log.timestamp}] [${log.source}] [${log.type}] ${log.message}${
        log.sealHash ? ` (SEAL: ${log.sealHash})` : ''
      }`
  )
  .join('\n')}

================================================================================
END OF ATTESTATION RECORD
================================================================================`;

      const result = await createSovereignAuditDoc(title, docBody);
      setRecentDocUrl(result.documentUrl);
      onLogTerminal('GOOGLE_DOCS', 'SEAL', `Generated Google Doc Audit: ${title}`);
      await loadFiles();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      onLogTerminal('GOOGLE_DOCS_ERR', 'BOOT', `Docs export failed: ${msg}`);
    } finally {
      setIsGeneratingDoc(false);
    }
  };

  // Upload JSON Ledger to Google Drive
  const handleUploadDriveBackup = async () => {
    setIsUploadingBackup(true);
    setErrorMsg(null);
    try {
      const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `crypted_brain_ledger_${dateStr}.json`;
      const payload = {
        metadata: {
          app: 'THE CRYPTED BRAIN // SOVEREIGN OCTA-LOBE COMMAND',
          fiduciaryAnchor: FIDUCIARY_ANCHOR,
          exportedAt: new Date().toISOString(),
          systemState,
        },
        lobes,
        ledger: logs,
      };

      const result = await uploadLedgerToDrive(filename, payload);
      setRecentBackupUrl(result.webViewLink || null);
      onLogTerminal('GOOGLE_DRIVE', 'SEAL', `Backup uploaded to Drive: ${filename}`);
      await loadFiles();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
      onLogTerminal('GOOGLE_DRIVE_ERR', 'BOOT', `Drive upload failed: ${msg}`);
    } finally {
      setIsUploadingBackup(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-text">
      <div className="hud-panel-glow w-full max-w-3xl bg-[rgba(10,16,32,0.95)] border-2 border-[#00e5ff] rounded-lg shadow-2xl flex flex-col max-h-[88vh] overflow-hidden text-xs text-[#e0f7fa] font-mono">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#00e5ff]/30 bg-black/40">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-[#00e5ff]" />
            <div>
              <h2 className="text-sm font-extrabold tracking-widest text-[#00e5ff]">
                GOOGLE WORKSPACE ARCHIVE // DRIVE & DOCS
              </h2>
              <div className="text-[10px] text-[#ffd700]">
                DIRECT CLOUD ATTESTATION & FORENSIC REPOSITORY
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#78909c] hover:text-[#ff1744] hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 bg-[#ff1744]/15 border border-[#ff1744]/40 rounded text-[#ff1744] flex items-center gap-2 text-[11px]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Connect / Scope Status */}
          {!hasToken ? (
            <div className="p-4 bg-black/60 border border-[#00e5ff]/30 rounded-lg text-center space-y-3">
              <div className="text-sm font-bold text-white">
                Authorize Google Workspace (Drive & Docs)
              </div>
              <p className="text-[11px] text-[#78909c] max-w-md mx-auto">
                Connect your Google Account with Drive and Docs permissions to archive forensic audit attestations and download cryptographic ledger backups directly to your cloud storage.
              </p>
              <button
                onClick={handleConnectWorkspace}
                disabled={isLoading}
                className="px-4 py-2 rounded bg-[#00e5ff] text-black font-bold tracking-wider hover:bg-[#00e5ff]/90 transition inline-flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <HardDrive className="w-4 h-4" />}
                <span>AUTHORIZE GOOGLE DRIVE & DOCS</span>
              </button>
            </div>
          ) : (
            <>
              {/* Workspace Action Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Create Google Doc */}
                <div className="p-3 bg-black/50 border border-[#00e5ff]/30 rounded flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-[#00e5ff] font-bold text-[11px]">
                      <FileText className="w-4 h-4" />
                      <span>CREATE GOOGLE DOC AUDIT</span>
                    </div>
                    <div className="text-[10px] text-[#78909c] mt-1 leading-relaxed">
                      Generates a full attestation document with current physical constants ($Z_0$, metronome, entropy) and recent cryptographic state seals in Google Docs.
                    </div>
                  </div>
                  <div className="mt-3">
                    <button
                      onClick={handleGenerateAuditDoc}
                      disabled={isGeneratingDoc}
                      className="w-full py-1.5 px-3 rounded border border-[#00e5ff] text-[#00e5ff] hover:bg-[#00e5ff] hover:text-black font-bold text-[10px] tracking-wider transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isGeneratingDoc ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FileText className="w-3.5 h-3.5" />
                      )}
                      <span>{isGeneratingDoc ? 'GENERATING DOC...' : 'CREATE GOOGLE DOC'}</span>
                    </button>
                    {recentDocUrl && (
                      <a
                        href={recentDocUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 text-[10px] text-[#ffd700] hover:underline flex items-center gap-1 justify-center"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Open Document in Google Docs</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Upload Drive Backup */}
                <div className="p-3 bg-black/50 border border-[#ffd700]/30 rounded flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-[#ffd700] font-bold text-[11px]">
                      <UploadCloud className="w-4 h-4" />
                      <span>BACKUP LEDGER TO GOOGLE DRIVE</span>
                    </div>
                    <div className="text-[10px] text-[#78909c] mt-1 leading-relaxed">
                      Uploads a forensic JSON ledger containing all system ticks, overrides, and cryptographic state seals to your Google Drive root.
                    </div>
                  </div>
                  <div className="mt-3">
                    <button
                      onClick={handleUploadDriveBackup}
                      disabled={isUploadingBackup}
                      className="w-full py-1.5 px-3 rounded border border-[#ffd700] text-[#ffd700] hover:bg-[#ffd700] hover:text-black font-bold text-[10px] tracking-wider transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {isUploadingBackup ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <UploadCloud className="w-3.5 h-3.5" />
                      )}
                      <span>{isUploadingBackup ? 'UPLOADING...' : 'SAVE BACKUP TO DRIVE'}</span>
                    </button>
                    {recentBackupUrl && (
                      <a
                        href={recentBackupUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 text-[10px] text-[#00ff7f] hover:underline flex items-center gap-1 justify-center"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>View Backup File in Drive</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Google Drive Files Explorer */}
              <div className="bg-black/60 border border-white/10 rounded-lg p-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-[#00e5ff]" />
                    <span className="font-bold text-[11px] text-white">
                      YOUR GOOGLE DRIVE FILES ({driveFiles.length})
                    </span>
                  </div>
                  <button
                    onClick={loadFiles}
                    disabled={isLoading}
                    className="text-[10px] text-[#78909c] hover:text-[#00e5ff] flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>REFRESH</span>
                  </button>
                </div>

                <div className="mt-2 max-h-56 overflow-y-auto space-y-1.5 pr-1">
                  {driveFiles.length === 0 ? (
                    <div className="py-6 text-center text-[#78909c] text-[10px]">
                      {isLoading ? 'Scanning Google Drive files...' : 'No files found or ready.'}
                    </div>
                  ) : (
                    driveFiles.map((file) => {
                      const isDoc = file.mimeType.includes('document');
                      return (
                        <div
                          key={file.id}
                          className="p-2 rounded bg-black/40 border border-white/5 hover:border-[#00e5ff]/40 flex items-center justify-between transition text-[10px]"
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            {isDoc ? (
                              <FileText className="w-3.5 h-3.5 text-[#00e5ff] shrink-0" />
                            ) : (
                              <FileCode className="w-3.5 h-3.5 text-[#ffd700] shrink-0" />
                            )}
                            <span className="text-white truncate font-medium">{file.name}</span>
                          </div>
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#00e5ff] hover:text-[#ffd700] shrink-0 flex items-center gap-1"
                            >
                              <span>OPEN</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-white/10 bg-black/40 flex items-center justify-between text-[10px] text-[#78909c]">
          <span>MCL § 700.7913 / UCC-9 Audit Compliant</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded border border-white/20 text-white hover:bg-white/10 transition"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
