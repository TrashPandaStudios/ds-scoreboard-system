import React from 'react';
import { SetWinnerBanner } from '../../types/scoreboard';
import { TeamBadge } from '../common/TeamBadge';
import { Trophy } from 'lucide-react';

interface SetWinnerTakeoverModalProps {
  banner: SetWinnerBanner;
}

export const SetWinnerTakeoverModal: React.FC<SetWinnerTakeoverModalProps> = ({ banner }) => {
  if (!banner || !banner.active) return null;

  const isRed = banner.winner === 'RED';
  const isBlue = banner.winner === 'BLUE';
  const setsNeededToWin = Math.floor((banner.maxSets || 3) / 2) + 1;
  const isMatchWinner =
    Boolean(banner.isMatchWinner) ||
    Boolean(banner.matchWinner) ||
    banner.setsWon >= setsNeededToWin ||
    banner.redSetScore >= setsNeededToWin ||
    banner.blueSetScore >= setsNeededToWin;

  const accentBorder = isRed
    ? 'var(--drone-red)'
    : isBlue
    ? 'var(--drone-blue)'
    : 'var(--signal-amber)';
  const accentText = isRed
    ? 'var(--drone-red-text)'
    : isBlue
    ? 'var(--drone-blue-text)'
    : 'var(--signal-amber-text)';

  const otherSetsWon = isRed ? banner.blueSetScore : banner.redSetScore;
  const isTiedSeries = banner.redSetScore === banner.blueSetScore;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 backdrop-blur-md select-none"
      style={{ backgroundColor: 'var(--court-overlay-backdrop)' }}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl border-2 bg-[var(--court-surface)] p-8 sm:p-10 flex flex-col items-center text-center shadow-2xl overflow-hidden"
        style={{ borderColor: accentBorder }}
      >
        {/* Top Accent Strip */}
        <div className="absolute top-0 inset-x-0 h-2" style={{ backgroundColor: accentBorder }} />

        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border mb-3"
          style={
            isMatchWinner
              ? {
                  backgroundColor: 'var(--signal-amber-tint)',
                  borderColor: 'var(--signal-amber-border)',
                  color: 'var(--signal-amber-text)',
                }
              : {
                  backgroundColor: 'var(--court-control-bg)',
                  borderColor: 'var(--court-line)',
                  color: 'var(--court-ink-secondary)',
                }
          }
        >
          {isMatchWinner && <Trophy className="w-3.5 h-3.5" />}
          <span>{isMatchWinner ? 'Official match winner' : `Set ${banner.currentSet} concluded`}</span>
        </span>

        <h1 className="spectator-numeral text-5xl sm:text-6xl font-black text-[var(--court-ink)] leading-none mb-5">
          {isMatchWinner ? 'Match winner' : `Set ${banner.currentSet} winner`}
        </h1>

        <div className="flex flex-col items-center gap-3 my-2">
          <TeamBadge
            side={isRed ? 'red' : isBlue ? 'blue' : 'neutral'}
            teamName={banner.winnerName}
            logoUrl={banner.winnerLogoUrl}
            size="xl"
          />

          <span className="spectator-numeral text-4xl sm:text-6xl font-black leading-tight" style={{ color: accentText }}>
            {banner.winnerName}
          </span>

          <span className="text-sm font-semibold text-[var(--court-muted)] tabular-nums">
            {isMatchWinner
              ? `Final sets: ${banner.setsWon} – ${otherSetsWon}`
              : isTiedSeries
              ? `Series tied ${banner.setsWon} – ${otherSetsWon}`
              : `Leads match ${banner.setsWon} – ${otherSetsWon} (Best of ${banner.maxSets})`}
          </span>
        </div>

        {/* Set Totals Bar */}
        <div className="w-full max-w-md bg-[var(--court-subtle)] border border-[var(--court-line-soft)] rounded-xl p-4 mt-5 flex items-center justify-around">
          <div className="flex flex-col items-center">
            <span className="text-xs font-semibold" style={{ color: 'var(--drone-red-text)' }}>
              Red sets
            </span>
            <span className="spectator-numeral text-4xl font-black text-[var(--court-ink)] leading-none mt-1">
              {banner.redSetScore}
            </span>
          </div>

          <div className="h-9 w-px bg-[var(--court-line-soft)]" />

          <div className="flex flex-col items-center">
            <span className="text-xs font-semibold text-[var(--court-muted)]">Set</span>
            <span className="spectator-numeral text-2xl font-bold text-[var(--court-ink-secondary)] leading-none mt-1">
              {banner.currentSet} / {banner.maxSets}
            </span>
          </div>

          <div className="h-9 w-px bg-[var(--court-line-soft)]" />

          <div className="flex flex-col items-center">
            <span className="text-xs font-semibold" style={{ color: 'var(--drone-blue-text)' }}>
              Blue sets
            </span>
            <span className="spectator-numeral text-4xl font-black text-[var(--court-ink)] leading-none mt-1">
              {banner.blueSetScore}
            </span>
          </div>
        </div>

        <p className="mt-5 text-xs text-[var(--court-muted)]">
          {isMatchWinner ? 'Match complete — official result recorded' : 'Intermission break pending referee call'}
        </p>
      </div>
    </div>
  );
};
