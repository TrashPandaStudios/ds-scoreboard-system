import React from 'react';
import { MatchPhase } from '../../types/scoreboard';
import { AlertTriangle, Clock, PlayCircle, Coffee, CheckCircle2, Zap, Swords } from 'lucide-react';

interface PhaseAlertBannerProps {
  phase: MatchPhase;
  currentSet: number;
  maxSets?: number;
}

export const PhaseAlertBanner: React.FC<PhaseAlertBannerProps> = ({
  phase,
  currentSet,
  maxSets = 3,
}) => {
  switch (phase) {
    case 'SUDDEN_DEATH':
      return (
        <div
          className="w-full rounded-xl border px-4 py-2 flex items-center justify-center gap-2.5 text-sm sm:text-base font-bold"
          style={{
            backgroundColor: 'var(--signal-amber-tint)',
            borderColor: 'var(--signal-amber-border)',
            color: 'var(--signal-amber-text)',
          }}
        >
          <Swords className="w-5 h-5 shrink-0" />
          <span>Sudden death overtime — first goal wins</span>
        </div>
      );

    case 'PENALTY_PHASE':
      return (
        <div
          className="w-full rounded-xl border px-4 py-2 flex items-center justify-center gap-2.5 text-sm sm:text-base font-bold"
          style={{
            backgroundColor: 'var(--signal-amber-tint)',
            borderColor: 'var(--signal-amber-border)',
            color: 'var(--signal-amber-text)',
          }}
        >
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>Penalty shootout in progress</span>
        </div>
      );

    case 'TIMEOUT':
      return (
        <div
          className="w-full rounded-xl border px-4 py-2 flex items-center justify-center gap-2 text-sm font-bold"
          style={{
            backgroundColor: 'var(--signal-info-tint)',
            borderColor: 'var(--signal-info-border)',
            color: 'var(--signal-info-text)',
          }}
        >
          <Clock className="w-4 h-4 shrink-0" />
          <span>Official timeout in progress</span>
        </div>
      );

    case 'INTERMISSION':
      return (
        <div
          className="w-full rounded-xl border px-4 py-2 flex items-center justify-center gap-2 text-sm font-bold"
          style={{
            backgroundColor: 'var(--signal-intermission-tint)',
            borderColor: 'var(--signal-intermission-border)',
            color: 'var(--signal-intermission-text)',
          }}
        >
          <Coffee className="w-4 h-4 shrink-0" />
          <span>Intermission break — preparing next set</span>
        </div>
      );

    case 'COUNTDOWN':
      return (
        <div
          className="w-full rounded-xl border px-4 py-2 flex items-center justify-center gap-2 text-sm font-bold"
          style={{
            backgroundColor: 'var(--drone-red-tint)',
            borderColor: 'var(--drone-red-border)',
            color: 'var(--drone-red-text)',
          }}
        >
          <Zap className="w-4 h-4 shrink-0" />
          <span>Get ready — Set {currentSet} starting</span>
        </div>
      );

    case 'MATCH_ENDED':
      return (
        <div
          className="w-full rounded-xl border px-4 py-2 flex items-center justify-center gap-2 text-sm font-bold"
          style={{
            backgroundColor: 'var(--signal-amber-tint)',
            borderColor: 'var(--signal-amber-border)',
            color: 'var(--signal-amber-text)',
          }}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Match complete</span>
        </div>
      );

    case 'NORMAL_PHASE':
    default:
      return (
        <div className="flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-[var(--court-surface)] border border-[var(--court-line)] text-xs font-semibold text-[var(--court-ink-secondary)]">
          <PlayCircle className="w-4 h-4" style={{ color: 'var(--signal-live)' }} />
          <span>
            Set {currentSet} of {maxSets} — Active flight
          </span>
        </div>
      );
  }
};
