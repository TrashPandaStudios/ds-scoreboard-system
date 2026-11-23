import React from 'react';
import { PenaltyPips } from '../display/PenaltyPips';
import { Plus, Minus } from 'lucide-react';

interface PenaltyControlsProps {
  team: 'red' | 'blue';
  penalties: number;
  pendingDelta?: number;
  onAddPenalty: () => void;
  onSubPenalty: () => void;
  hotkeyInfo: string;
}

export const PenaltyControls: React.FC<PenaltyControlsProps> = ({
  team,
  penalties,
  pendingDelta = 0,
  onAddPenalty,
  onSubPenalty,
  hotkeyInfo,
}) => {
  const isRed = team === 'red';

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--court-surface)] border border-[var(--court-line)]">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <PenaltyPips count={penalties} team={team} size="sm" label="Penalties" />
          {pendingDelta !== 0 && (
            <span
              className="px-2 py-0.5 rounded-full border text-[11px] font-semibold animate-pulse"
              style={{
                backgroundColor: 'var(--signal-amber-tint)',
                borderColor: 'var(--signal-amber-border)',
                color: 'var(--signal-amber-text)',
              }}
            >
              {pendingDelta > 0 ? `+${pendingDelta}` : pendingDelta} syncing
            </span>
          )}
        </div>
        <span className="text-[11px] font-mono text-[var(--court-muted)]">{hotkeyInfo}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onAddPenalty}
          className="px-3 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1 text-white transition-opacity hover:opacity-95 active:scale-[0.98]"
          style={{
            backgroundColor: isRed ? 'var(--drone-red-solid)' : 'var(--signal-amber-solid)',
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+1 penalty</span>
        </button>

        <button
          type="button"
          onClick={onSubPenalty}
          disabled={penalties <= 0}
          className="p-2 rounded-lg bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-[var(--court-ink)] border border-[var(--court-line)] disabled:opacity-40 transition-colors active:scale-[0.98]"
          aria-label="Remove penalty"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
