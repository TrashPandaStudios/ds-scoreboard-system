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

  const redNetPenaltiesAgainst = Math.max(0, redPenalties - bluePenalties);
  const blueNetPenaltiesAgainst = Math.max(0, bluePenalties - redPenalties);

  const trailingTeamGetsPenaltyTime =
    (redLeading && redNetPenaltiesAgainst > 0) ||
    (blueLeading && blueNetPenaltiesAgainst > 0);

  const leaderTeam = redLeading ? 'RED' : blueLeading ? 'BLUE' : null;
  const leaderName = redLeading ? teamRed : blueLeading ? teamBlue : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm select-none"
      style={{ backgroundColor: 'var(--court-overlay-backdrop)' }}
    >
      <div className="w-full max-w-xl rounded-2xl bg-[var(--court-surface)] border border-[var(--court-line)] shadow-2xl p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-[var(--court-muted)] hover:text-[var(--court-ink)] hover:bg-[var(--court-control-bg)]"
          title="Dismiss dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5 pr-8">
          <span className="text-xs font-semibold text-[var(--court-muted)] block">
            Set {currentSet} of {maxSets} end-of-time check
          </span>
          <h2 className="text-xl font-bold text-[var(--court-ink)] mt-0.5">
            Verify scores, penalties &amp; set winner
          </h2>
        </div>

        {/* Scores */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2 text-xs">
            <span className="font-semibold text-[var(--court-ink-secondary)]">End-of-set scores</span>
            <span className="text-[var(--court-muted)]">Adjust late goals if needed</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div
              className="p-3.5 rounded-xl border flex flex-col items-center gap-2"
              style={{ backgroundColor: 'var(--drone-red-tint)', borderColor: 'var(--drone-red-border)' }}
            >
              <span className="text-xs font-bold truncate max-w-[180px]" style={{ color: 'var(--drone-red-text)' }}>
                {teamRed}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onAdjustScore(true, -1)}
                  disabled={redScore <= 0}
                  className="w-9 h-9 rounded-lg bg-[var(--court-surface)] border border-[var(--court-line)] disabled:opacity-35 text-[var(--court-ink)] flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="spectator-numeral text-4xl font-black text-[var(--court-ink)] min-w-[2.5rem] text-center">
                  {redScore}
                </span>
                <button
                  type="button"
                  onClick={() => onAdjustScore(true, 1)}
                  className="w-9 h-9 rounded-lg text-white flex items-center justify-center"
                  style={{ backgroundColor: 'var(--drone-red-solid)' }}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div
              className="p-3.5 rounded-xl border flex flex-col items-center gap-2"
              style={{ backgroundColor: 'var(--drone-blue-tint)', borderColor: 'var(--drone-blue-border)' }}
            >
              <span className="text-xs font-bold truncate max-w-[180px]" style={{ color: 'var(--drone-blue-text)' }}>
                {teamBlue}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onAdjustScore(false, -1)}
                  disabled={blueScore <= 0}
                  className="w-9 h-9 rounded-lg bg-[var(--court-surface)] border border-[var(--court-line)] disabled:opacity-35 text-[var(--court-ink)] flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="spectator-numeral text-4xl font-black text-[var(--court-ink)] min-w-[2.5rem] text-center">
                  {blueScore}
                </span>
                <button
                  type="button"
                  onClick={() => onAdjustScore(false, 1)}
                  className="w-9 h-9 rounded-lg text-white flex items-center justify-center"
                  style={{ backgroundColor: 'var(--drone-blue-solid)' }}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Penalties */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2 text-xs">
            <span className="font-semibold text-[var(--court-ink-secondary)]">End-of-set penalties</span>
            <span className="text-[var(--court-muted)]">Verify before awarding</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-[var(--court-subtle)] border border-[var(--court-line-soft)] flex flex-col items-center gap-2">
              <span className="text-xs font-semibold" style={{ color: 'var(--drone-red-text)' }}>
                Red penalties
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onAdjustPenalty(true, -1)}
                  disabled={redPenalties <= 0}
                  className="w-8 h-8 rounded-lg bg-[var(--court-surface)] border border-[var(--court-line)] disabled:opacity-35 text-[var(--court-ink)] flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="spectator-numeral text-3xl font-bold text-[var(--court-ink)] min-w-[2rem] text-center">
                  {redPenalties}
                </span>
                <button
                  type="button"
                  onClick={() => onAdjustPenalty(true, 1)}
                  className="w-8 h-8 rounded-lg text-white flex items-center justify-center"
                  style={{ backgroundColor: 'var(--drone-red-solid)' }}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[var(--court-subtle)] border border-[var(--court-line-soft)] flex flex-col items-center gap-2">
              <span className="text-xs font-semibold" style={{ color: 'var(--drone-blue-text)' }}>
                Blue penalties
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onAdjustPenalty(false, -1)}
                  disabled={bluePenalties <= 0}
                  className="w-8 h-8 rounded-lg bg-[var(--court-surface)] border border-[var(--court-line)] disabled:opacity-35 text-[var(--court-ink)] flex items-center justify-center"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="spectator-numeral text-3xl font-bold text-[var(--court-ink)] min-w-[2rem] text-center">
                  {bluePenalties}
                </span>
                <button
                  type="button"
                  onClick={() => onAdjustPenalty(false, 1)}
                  className="w-8 h-8 rounded-lg text-white flex items-center justify-center"
                  style={{ backgroundColor: 'var(--drone-blue-solid)' }}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Status Callout */}
        <div
          className="mb-5 p-3 rounded-xl border text-xs font-semibold text-center"
          style={
            isTied || trailingTeamGetsPenaltyTime
              ? {
                  backgroundColor: 'var(--signal-amber-tint)',
                  borderColor: 'var(--signal-amber-border)',
                  color: 'var(--signal-amber-text)',
                }
              : {
                  backgroundColor: 'var(--signal-live-tint)',
                  borderColor: 'var(--signal-live-border)',
                  color: 'var(--signal-live-text)',
                }
          }
        >
          {isTied ? (
            <span className="inline-flex items-center justify-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Score is tied — proceed to sudden death overtime.
            </span>
          ) : trailingTeamGetsPenaltyTime ? (
            <span className="inline-flex items-center justify-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Net penalties ({redLeading ? redNetPenaltiesAgainst : blueNetPenaltiesAgainst}) against {leaderName} — penalty shootout due.
            </span>
          ) : (
            <span>Penalties resolved — set winner is clear.</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5">
          {isTied ? (
            <button
              type="button"
              onClick={() => {
                onEnterSuddenDeath();
                onClose();
              }}
              className="w-full py-3 px-4 rounded-xl text-white font-bold text-sm inline-flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--signal-amber-solid)' }}
            >
              <Swords className="w-4 h-4" />
              <span>Start sudden death (first goal wins)</span>
            </button>
          ) : trailingTeamGetsPenaltyTime ? (
            <>
              <button
                type="button"
                onClick={() => {
                  onEnterPenaltyPhase();
                  onClose();
                }}
                className="w-full py-3 px-4 rounded-xl text-white font-bold text-sm inline-flex items-center justify-center gap-2"
                style={{ backgroundColor: 'var(--signal-amber-solid)' }}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Start penalty shootout (30s)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (leaderTeam) onAwardSet(leaderTeam);
                  onClose();
                }}
                className="w-full py-2.5 px-4 rounded-lg bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-[var(--court-ink)] border border-[var(--court-line)] text-xs font-semibold"
              >
                Bypass penalties &amp; award set to {leaderName}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (leaderTeam) onAwardSet(leaderTeam);
                onClose();
              }}
              className="w-full py-3 px-4 rounded-xl text-white font-bold text-sm inline-flex items-center justify-center gap-2"
              style={{
                backgroundColor: redLeading ? 'var(--drone-red-solid)' : 'var(--drone-blue-solid)',
              }}
            >
              <Trophy className="w-4 h-4" />
              <span>Award Set {currentSet} to {leaderName}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
