import React from 'react';
import { Trophy, ArrowLeftRight, ChevronRight, ChevronLeft, RefreshCw, CheckCircle } from 'lucide-react';

interface SetManagementCardProps {
  currentSet: number;
  maxSets: number;
  redSetScore: number;
  blueSetScore: number;
  sideSwap: boolean;
  onAwardSet: (winner: 'RED' | 'BLUE' | 'TIE') => void;
  onNextSet: () => void;
  onPrevSet: () => void;
  onSwapSides: () => void;
  onResetMatch: () => void;
  onConfirmMatchEnd: () => void;
}

export const SetManagementCard: React.FC<SetManagementCardProps> = ({
  currentSet,
  maxSets,
  redSetScore,
  blueSetScore,
  sideSwap,
  onAwardSet,
  onNextSet,
  onPrevSet,
  onSwapSides,
  onResetMatch,
  onConfirmMatchEnd,
}) => {
  return (
    <div className="flex flex-col gap-6 p-6 rounded-3xl bg-slate-900/90 border-2 border-slate-800 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-display font-bold text-white">
            Set &amp; Side Management (Set {currentSet} of {maxSets})
          </h3>
        </div>

        <div className="flex items-center gap-3 text-sm font-mono font-black">
          <span className="text-red-400">RED: {redSetScore}</span>
          <span className="text-slate-600">-</span>
          <span className="text-blue-400">BLUE: {blueSetScore}</span>
        </div>
      </div>

      {/* Award Current Set Winner Buttons */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
          AWARD WINNER FOR SET {currentSet}:
        </span>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => onAwardSet('RED')}
            className="py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-display font-bold text-sm shadow-md shadow-red-600/20 active:scale-95 transition-all"
          >
            AWARD RED (+1 SET)
          </button>

          <button
            onClick={() => onAwardSet('BLUE')}
            className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-display font-bold text-sm shadow-md shadow-blue-600/20 active:scale-95 transition-all"
          >
            AWARD BLUE (+1 SET)
          </button>

          <button
            onClick={() => onAwardSet('TIE')}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-display font-bold text-sm border border-slate-700 active:scale-95 transition-all"
          >
            RECORD TIE SET
          </button>
        </div>
      </div>

      {/* Set Controls & Side Swap */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800">
        {/* Swap Arena Sides */}
        <button
          onClick={onSwapSides}
          className={`py-2.5 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 border transition-all active:scale-95 ${
            sideSwap
              ? 'bg-purple-600/30 text-purple-300 border-purple-500/50 shadow-sm shadow-purple-500/20'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4 text-purple-400" />
          <span>SWAP SIDES ({sideSwap ? 'BLUE/RED' : 'RED/BLUE'})</span>
        </button>

        {/* Previous Set */}
        <button
          onClick={onPrevSet}
          disabled={currentSet <= 1}
          className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold flex items-center justify-center gap-1 border border-slate-700 disabled:opacity-40 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>PREV SET</span>
        </button>

        {/* Next Set */}
        <button
          onClick={onNextSet}
          disabled={currentSet >= maxSets}
          className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold flex items-center justify-center gap-1 border border-slate-700 disabled:opacity-40 transition-colors"
        >
          <span>NEXT SET</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* End & Save Match */}
        <button
          onClick={onConfirmMatchEnd}
          className="py-2.5 px-3 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 text-xs font-mono font-bold flex items-center justify-center gap-1.5 border border-emerald-500/40 transition-colors"
        >
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>CONCLUDE &amp; SAVE</span>
        </button>
      </div>

      {/* Full Match Reset */}
      <div className="flex justify-end pt-2 border-t border-slate-800/80">
        <button
          onClick={() => {
            if (window.confirm('Reset this entire match back to Set 1 and clear scores?')) {
              onResetMatch();
            }
          }}
          className="text-xs font-mono text-rose-400 hover:text-rose-300 flex items-center gap-1 hover:underline"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Match to Set 1</span>
        </button>
      </div>
    </div>
  );
};
