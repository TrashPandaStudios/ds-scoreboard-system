import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, ShieldAlert } from 'lucide-react';

export interface DeletableArenaInfo {
  arenaId: number;
  arenaName: string;
  matchNumber?: string;
  teamRed?: string;
  teamBlue?: string;
  phase?: string;
  timerRunning?: boolean;
}

interface DeleteArenaConfirmModalProps {
  isOpen: boolean;
  arena: DeletableArenaInfo | null;
  onClose: () => void;
  onConfirm: (arenaId: number) => Promise<void> | void;
}

export const DeleteArenaConfirmModal: React.FC<DeleteArenaConfirmModalProps> = ({
  isOpen,
  arena,
  onClose,
  onConfirm,
}) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !arena) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(arena.arenaId);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border-2 border-rose-600/50 shadow-2xl p-6 lg:p-8 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <ShieldAlert className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <span className="text-xs font-mono text-rose-400 font-bold uppercase tracking-widest block">
              SAFETY CONFIRMATION
            </span>
            <h2 className="text-xl font-display font-black text-white">Decommission Arena</h2>
          </div>
        </div>

        {/* Target Arena Info */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-slate-400">ARENA ID: #{arena.arenaId}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                arena.timerRunning
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {arena.phase || 'IDLE'}
            </span>
          </div>
          <div className="text-lg font-display font-bold text-white mb-1">{arena.arenaName}</div>
          <div className="text-xs font-mono text-slate-400">
            Current Match: {arena.matchNumber || 'M-101'} ({arena.teamRed || 'Red Phoenix'} vs {arena.teamBlue || 'Blue Comets'})
          </div>
        </div>

        {/* Warning text */}
        <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/40 text-rose-200 text-xs font-mono flex items-start gap-2.5 mb-6">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <p>
            Decommissioning will immediately terminate this arena&apos;s authoritative match engine. Any connected crowd displays, referee consoles, or OBS overlays for this cage will stop receiving updates.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold transition-colors"
          >
            CANCEL
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleConfirm}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-black flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <span>DECOMMISSIONING...</span>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>CONFIRM DECOMMISSION</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
