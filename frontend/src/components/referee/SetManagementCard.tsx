import React from 'react';
import { ArrowLeftRight, ChevronRight, ChevronLeft, RefreshCw, CheckCircle } from 'lucide-react';

interface SetManagementCardProps {
  currentSet: number;
  maxSets: number;
  redSetScore: number;
  blueSetScore: number;
  sideSwap: boolean;
  isSetAlreadyAwarded?: boolean;
  isMatchEnded?: boolean;
  currentSetWinner?: string | null;
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
  isSetAlreadyAwarded = false,
  isMatchEnded = false,
  currentSetWinner,
  onAwardSet,
  onNextSet,
  onPrevSet,
  onSwapSides,
  onResetMatch,
  onConfirmMatchEnd,
}) => {
  return (
    <div className="flex flex-col gap-5 p-6 rounded-2xl bg-[var(--court-surface)] border border-[var(--court-line)]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--court-line-soft)] pb-4">
        <div>
          <h3 className="text-base font-bold text-[var(--court-ink)]">
            Set &amp; side management (Set {currentSet} of {maxSets})
          </h3>
        </div>

        <div className="flex items-center gap-2 text-sm font-bold tabular-nums">
          <span style={{ color: 'var(--drone-red-text)' }}>Red: {redSetScore}</span>
          <span className="text-[var(--court-muted)]">–</span>
          <span style={{ color: 'var(--drone-blue-text)' }}>Blue: {blueSetScore}</span>
        </div>
      </div>

      {/* Award Set Winner */}
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-[var(--court-muted)]">
            Award winner for Set {currentSet}
          </span>
          {isMatchEnded ? (
            <span
              className="text-xs font-semibold px-2.5 py-0.5 rounded-full border"
              style={{
                backgroundColor: 'var(--signal-amber-tint)',
                borderColor: 'var(--signal-amber-border)',
                color: 'var(--signal-amber-text)',
              }}
            >
              Match concluded
            </span>
          ) : isSetAlreadyAwarded ? (
            <span
              className="text-xs font-semibold px-2.5 py-0.5 rounded-full border"
              style={{
                backgroundColor: 'var(--signal-live-tint)',
                borderColor: 'var(--signal-live-border)',
                color: 'var(--signal-live-text)',
              }}
            >
              Set {currentSet} awarded ({currentSetWinner || 'Confirmed'})
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => onAwardSet('RED')}
            disabled={isSetAlreadyAwarded || isMatchEnded}
            className="py-3 px-4 rounded-xl text-white font-bold text-sm disabled:opacity-35 disabled:cursor-not-allowed transition-opacity hover:opacity-95"
            style={{ backgroundColor: 'var(--drone-red-solid)' }}
          >
            Award Red (+1 set)
          </button>

          <button
            type="button"
            onClick={() => onAwardSet('BLUE')}
            disabled={isSetAlreadyAwarded || isMatchEnded}
            className="py-3 px-4 rounded-xl text-white font-bold text-sm disabled:opacity-35 disabled:cursor-not-allowed transition-opacity hover:opacity-95"
            style={{ backgroundColor: 'var(--drone-blue-solid)' }}
          >
            Award Blue (+1 set)
          </button>

          <button
            type="button"
            onClick={() => onAwardSet('TIE')}
            disabled={isSetAlreadyAwarded || isMatchEnded}
            className="py-3 px-4 rounded-xl bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] disabled:opacity-35 disabled:cursor-not-allowed text-[var(--court-ink)] font-bold text-sm border border-[var(--court-line)] transition-colors"
          >
            Record tie set
          </button>
        </div>

        {isSetAlreadyAwarded && !isMatchEnded && (
          <p className="text-xs text-[var(--court-muted)]">
            Set {currentSet} is recorded. Start intermission above or advance to Set {currentSet + 1} below.
          </p>
        )}
      </div>

      {/* Navigation & Side Swap */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 border-t border-[var(--court-line-soft)]">
        <button
          type="button"
          onClick={onSwapSides}
          className="py-2.5 px-3 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 border transition-colors"
          style={
            sideSwap
              ? {
                  backgroundColor: 'var(--signal-intermission-tint)',
                  borderColor: 'var(--signal-intermission-border)',
                  color: 'var(--signal-intermission-text)',
                }
              : {
                  backgroundColor: 'var(--court-control-bg)',
                  borderColor: 'var(--court-line)',
                  color: 'var(--court-ink)',
                }
          }
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>Swap sides ({sideSwap ? 'Blue/Red' : 'Red/Blue'})</span>
        </button>

        <button
          type="button"
          onClick={onPrevSet}
          disabled={currentSet <= 1}
          className="py-2.5 px-3 rounded-lg bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-[var(--court-ink)] text-xs font-semibold inline-flex items-center justify-center gap-1 border border-[var(--court-line)] disabled:opacity-40 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous set</span>
        </button>

        <button
          type="button"
          onClick={onNextSet}
          disabled={currentSet >= maxSets}
          className="py-2.5 px-3 rounded-lg bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-[var(--court-ink)] text-xs font-semibold inline-flex items-center justify-center gap-1 border border-[var(--court-line)] disabled:opacity-40 transition-colors"
        >
          <span>Next set</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onConfirmMatchEnd}
          className="py-2.5 px-3 rounded-lg border text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
          style={{
            backgroundColor: 'var(--signal-live-tint)',
            borderColor: 'var(--signal-live-border)',
            color: 'var(--signal-live-text)',
          }}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Conclude &amp; save</span>
        </button>
      </div>

      {/* Full Match Reset */}
      <div className="flex justify-end pt-3 border-t border-[var(--court-line-soft)]">
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Reset this match to Set 1 and clear the scores and check-ins?')) {
              onResetMatch();
            }
          }}
          className="text-xs font-semibold inline-flex items-center gap-1.5 hover:underline"
          style={{ color: 'var(--drone-red-text)' }}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset match to Set 1</span>
        </button>
      </div>
    </div>
  );
};
