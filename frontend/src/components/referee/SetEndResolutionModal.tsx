import React from 'react';
import { ShieldAlert, Swords, Trophy, Plus, Minus, X, AlertTriangle } from 'lucide-react';

interface SetEndResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSet: number;
  maxSets: number;
  teamRed: string;
  teamBlue: string;
  redScore: number;
  blueScore: number;
  redPenalties: number;
  bluePenalties: number;
  onAdjustScore: (isRed: boolean, delta: number) => void;
  onAdjustPenalty: (isRed: boolean, delta: number) => void;
  onEnterPenaltyPhase: () => void;
  onEnterSuddenDeath: () => void;
  onAwardSet: (winner: 'RED' | 'BLUE') => void;
}

export const SetEndResolutionModal: React.FC<SetEndResolutionModalProps> = ({
  isOpen,
  onClose,
  currentSet,
  maxSets,
  teamRed,
  teamBlue,
  redScore,
  blueScore,
  redPenalties,
  bluePenalties,
  onAdjustScore,
  onAdjustPenalty,
  onEnterPenaltyPhase,
  onEnterSuddenDeath,
  onAwardSet,
}) => {
  if (!isOpen) return null;

  const isTied = redScore === blueScore;
  const redLeading = redScore > blueScore;
  const blueLeading = blueScore > redScore;

  // Net penalty calculation
  // Penalties committed by team give penalty kicks to opposing team
  const redNetPenaltiesAgainst = Math.max(0, redPenalties - bluePenalties); // Blue gets penalty kicks
  const blueNetPenaltiesAgainst = Math.max(0, bluePenalties - redPenalties); // Red gets penalty kicks

  // Does the trailing team get penalty kicks that could bridge or resolve the set?
  const trailingTeamGetsPenaltyTime =
    (redLeading && redNetPenaltiesAgainst > 0) ||
    (blueLeading && blueNetPenaltiesAgainst > 0);

  const leaderTeam = redLeading ? 'RED' : blueLeading ? 'BLUE' : null;
  const leaderName = redLeading ? teamRed : blueLeading ? teamBlue : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in select-none">
      <div className="w-full max-w-xl rounded-3xl bg-slate-900 border-2 border-cyan-500/50 shadow-2xl p-6 sm:p-8 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          title="Dismiss Resolution Dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title & Set Header */}
        <div className="flex items-center gap-2 mb-2">
          <ShieldAlert className="w-5 h-5 text-cyan-400" />
          <span className="text-xs font-mono text-cyan-400 font-bold tracking-widest uppercase">
            SET {currentSet} OF {maxSets} • END OF TIME RESOLUTION
          </span>
        </div>
        <h2 className="text-2xl font-display font-black text-white mb-4">
          Resolve Score, Penalties & Set Winner
        </h2>

        {/* Score Adjustment Grid */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-300 font-bold uppercase">
              End-of-Set Scores:
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Adjust if late goal or correction
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Red Score */}
            <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-red-900/50 flex flex-col items-center gap-2">
              <span className="text-xs font-mono text-red-400 font-bold truncate max-w-[180px]">
                {teamRed}
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onAdjustScore(true, -1)}
                  disabled={redScore <= 0}
                  className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white flex items-center justify-center font-bold transition-colors"
                  title="Decrease Red Score"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-3xl font-display font-black text-white min-w-[2.5rem] text-center">
                  {redScore}
                </span>
                <button
                  onClick={() => onAdjustScore(true, 1)}
                  className="w-9 h-9 rounded-xl bg-red-600 hover:bg-red-500 text-white flex items-center justify-center font-bold shadow-md shadow-red-600/30 transition-colors"
                  title="Increase Red Score"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Blue Score */}
            <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-blue-900/50 flex flex-col items-center gap-2">
              <span className="text-xs font-mono text-blue-400 font-bold truncate max-w-[180px]">
                {teamBlue}
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onAdjustScore(false, -1)}
                  disabled={blueScore <= 0}
                  className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white flex items-center justify-center font-bold transition-colors"
                  title="Decrease Blue Score"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-3xl font-display font-black text-white min-w-[2.5rem] text-center">
                  {blueScore}
                </span>
                <button
                  onClick={() => onAdjustScore(false, 1)}
                  className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center font-bold shadow-md shadow-blue-600/30 transition-colors"
                  title="Increase Blue Score"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Penalty Adjustment Grid */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-slate-300 font-bold uppercase">
              End-of-Set Penalties:
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Verify before awarding set
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Red Penalties */}
            <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-red-900/50 flex flex-col items-center gap-2">
              <span className="text-xs font-mono text-red-400 font-bold">RED PENALTIES</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onAdjustPenalty(true, -1)}
                  disabled={redPenalties <= 0}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white flex items-center justify-center font-bold"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-2xl font-mono font-bold text-white min-w-[2rem] text-center">
                  {redPenalties}
                </span>
                <button
                  onClick={() => onAdjustPenalty(true, 1)}
                  className="w-8 h-8 rounded-lg bg-red-600 hover:bg-red-500 text-white flex items-center justify-center font-bold"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Blue Penalties */}
            <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-blue-900/50 flex flex-col items-center gap-2">
              <span className="text-xs font-mono text-blue-400 font-bold">BLUE PENALTIES</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onAdjustPenalty(false, -1)}
                  disabled={bluePenalties <= 0}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white flex items-center justify-center font-bold"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-2xl font-mono font-bold text-white min-w-[2rem] text-center">
                  {bluePenalties}
                </span>
                <button
                  onClick={() => onAdjustPenalty(false, 1)}
                  className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center font-bold"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Penalty Resolution Status Banner */}
        <div className="mb-6 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-center">
          {isTied ? (
            <div className="text-amber-400 flex items-center justify-center gap-2 font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>Score is tied! Proceed to Sudden Death overtime.</span>
            </div>
          ) : trailingTeamGetsPenaltyTime ? (
            <div className="text-amber-400 flex items-center justify-center gap-2 font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>
                Net Penalties: {redLeading ? redNetPenaltiesAgainst : blueNetPenaltiesAgainst} against {leaderName}. Penalty phase shootout due!
              </span>
            </div>
          ) : (
            <div className="text-emerald-400 font-bold">
              ✓ Penalties offset/resolved: No penalty kicks for trailing team. Set winner clear.
            </div>
          )}
        </div>

        {/* Dynamic Action Buttons */}
        <div className="flex flex-col gap-3">
          {isTied ? (
            <button
              onClick={() => {
                onEnterSuddenDeath();
                onClose();
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-display font-black text-sm tracking-wide uppercase flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
            >
              <Swords className="w-5 h-5" />
              <span>Enter Sudden Death Phase (First Goal Wins)</span>
            </button>
          ) : trailingTeamGetsPenaltyTime ? (
            <>
              <button
                onClick={() => {
                  onEnterPenaltyPhase();
                  onClose();
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-display font-black text-sm tracking-wide uppercase flex items-center justify-center gap-2 shadow-lg shadow-amber-600/30 transition-all"
              >
                <ShieldAlert className="w-5 h-5" />
                <span>Enter Penalty Phase (30s Shootout)</span>
              </button>

              <button
                onClick={() => {
                  if (leaderTeam) onAwardSet(leaderTeam);
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-mono text-xs font-bold transition-colors"
              >
                Bypass Penalties & Award Set to {leaderName}
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                if (leaderTeam) onAwardSet(leaderTeam);
                onClose();
              }}
              className={`w-full py-3.5 px-4 rounded-2xl ${
                redLeading
                  ? 'bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400'
                  : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400'
              } text-white font-display font-black text-sm tracking-wide uppercase flex items-center justify-center gap-2 shadow-xl transition-all`}
            >
              <Trophy className="w-5 h-5" />
              <span>Award Set {currentSet} to {leaderName}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
