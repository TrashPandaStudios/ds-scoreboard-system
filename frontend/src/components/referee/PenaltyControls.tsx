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
    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <PenaltyPips count={penalties} team={team} size="sm" />
          {pendingDelta !== 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold animate-pulse">
              {pendingDelta > 0 ? `+${pendingDelta}` : pendingDelta} syncing
            </span>
          )}
        </div>
        <span className="text-[10px] font-mono text-slate-400">HOTKEY: [{hotkeyInfo}]</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onAddPenalty}
          className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1 transition-all active:scale-95 ${
            isRed
              ? 'bg-rose-600 hover:bg-rose-500 text-white'
              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+1 PENALTY</span>
        </button>

        <button
          onClick={onSubPenalty}
          disabled={penalties <= 0}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 disabled:opacity-40 transition-all active:scale-95"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
