import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ backgroundColor: 'var(--court-overlay-backdrop)' }}
    >
      <div className="w-full max-w-md rounded-2xl bg-[var(--court-surface)] border border-[var(--drone-red-border)] shadow-2xl p-6 relative">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-[var(--court-muted)] hover:text-[var(--court-ink)] hover:bg-[var(--court-control-bg)]"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-[var(--court-ink)] mb-1 pr-8">Decommission arena</h2>
        <p className="text-xs text-[var(--court-muted)] mb-5">
          Confirm removal of Cage #{arena.arenaId}.
        </p>

        <div className="p-4 rounded-xl bg-[var(--court-subtle)] border border-[var(--court-line-soft)] mb-4">
          <div className="text-base font-bold text-[var(--court-ink)]">{arena.arenaName}</div>
          <div className="text-xs text-[var(--court-muted)] mt-1">
            Match {arena.matchNumber || 'M-101'}: {arena.teamRed || 'Red Phoenix'} vs{' '}
            {arena.teamBlue || 'Blue Comets'}
          </div>
        </div>

        <div
          className="p-3.5 rounded-xl border text-xs flex items-start gap-2.5 mb-6"
          style={{
            backgroundColor: 'var(--drone-red-tint)',
            borderColor: 'var(--drone-red-border)',
            color: 'var(--drone-red-text)',
          }}
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            Stopping this arena terminates its match clock immediately. Connected crowd displays, referee desks, and OBS feeds for this cage will stop updating.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-[var(--court-ink-secondary)] text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleConfirm}
            className="px-4 py-2 rounded-lg text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
            style={{ backgroundColor: 'var(--drone-red-solid)' }}
          >
            <Trash2 className="w-4 h-4" />
            <span>{loading ? 'Removing...' : 'Decommission arena'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
