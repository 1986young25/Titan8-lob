import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Download, Trash2, Pause, Play } from 'lucide-react';
import { TelemetryEvent } from '../types';

interface TerminalLogStreamProps {
  logs: TelemetryEvent[];
  onClearLogs: () => void;
}

export const TerminalLogStream: React.FC<TerminalLogStreamProps> = ({ logs, onClearLogs }) => {
  const [filter, setFilter] = useState<'ALL' | 'SEALS' | 'OVERRIDES' | 'TICKS'>('ALL');
  const [isAutoScroll, setIsAutoScroll] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAutoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, isAutoScroll]);

  const filteredLogs = logs.filter((log) => {
    if (filter === 'SEALS') return log.type === 'SEAL';
    if (filter === 'TICKS') return log.type === 'TICK';
    if (filter === 'OVERRIDES') {
      return ['PULSE', 'QASM', 'ATRM', 'TRIPWIRE', 'HEAL', 'DIRECTIVE'].includes(log.type);
    }
    return true;
  });

  const exportLedger = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `crypted_brain_ledger_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <footer className="hud-panel-glow flex flex-col bg-[rgba(10,16,32,0.92)] border border-[#00e5ff]/30 rounded p-2.5 h-full overflow-hidden text-xs">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between pb-1.5 border-b border-[#00e5ff]/20 text-[#00e5ff] text-[10px]">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5" />
          <span className="font-bold tracking-wider">
            ATOMIC TELEMETRY LEDGER STREAM ({logs.length} ENTRIES)
          </span>
        </div>

        {/* Filters & Actions */}
        <div className="flex items-center gap-2">
          {/* Filter Pills */}
          <div className="flex gap-1">
            {(['ALL', 'SEALS', 'OVERRIDES', 'TICKS'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-mono transition border ${
                  filter === f
                    ? 'border-[#00e5ff] bg-[#00e5ff]/20 text-white font-bold'
                    : 'border-white/10 text-[#78909c] hover:border-white/30'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Autoscroll toggle */}
          <button
            onClick={() => setIsAutoScroll(!isAutoScroll)}
            title={isAutoScroll ? 'Pause autoscroll' : 'Resume autoscroll'}
            className="p-1 rounded border border-white/10 text-[#78909c] hover:text-[#00e5ff]"
          >
            {isAutoScroll ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 text-[#00ff7f]" />}
          </button>

          {/* Export Ledger */}
          <button
            onClick={exportLedger}
            title="Export forensic cryptographic audit ledger"
            className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-[#ffd700]/30 text-[#ffd700] hover:bg-[#ffd700]/10 text-[9px]"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">EXPORT</span>
          </button>

          {/* Clear View */}
          <button
            onClick={onClearLogs}
            title="Clear display buffer"
            className="p-1 rounded border border-white/10 text-[#78909c] hover:text-[#ff1744]"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Terminal View */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto bg-black/80 border border-[#00e5ff]/15 rounded p-2 mt-1.5 font-mono text-[10px] space-y-1 select-text"
      >
        {filteredLogs.map((log, index) => {
          let colorClass = 'text-[#00ff7f]';
          if (log.type === 'SEAL') colorClass = 'text-[#ffd700] font-bold';
          if (log.type === 'TRIPWIRE') colorClass = 'text-[#ff1744] font-bold';
          if (log.type === 'QASM') colorClass = 'text-[#00e5ff]';
          if (log.type === 'ATRM') colorClass = 'text-[#80d8ff]';
          if (log.type === 'PULSE') colorClass = 'text-[#ffd700]';
          if (log.type === 'DIRECTIVE') colorClass = 'text-[#b388ff]';

          return (
            <div key={log.id || index} className="leading-relaxed">
              <span className="text-[#78909c]">[{log.timestamp}]</span>{' '}
              <span className="text-[#00e5ff]/60">[{log.source}]</span>{' '}
              <span className={colorClass}>{log.message}</span>
              {log.sealHash && (
                <span className="text-[#ffd700] text-[9px] ml-2">
                  [HASH: {log.sealHash}]
                </span>
              )}
            </div>
          );
        })}
      </div>
    </footer>
  );
};
