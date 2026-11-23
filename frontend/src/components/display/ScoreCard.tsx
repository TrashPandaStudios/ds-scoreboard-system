import React from 'react';
import { PenaltyPips } from './PenaltyPips';
import { Trophy } from 'lucide-react';
import { TeamBadge } from '../common/TeamBadge';

interface ScoreCardProps {
  team: 'red' | 'blue';
  teamName: string;
  logoUrl?: string | null;
  score: number;
  setScore: number;
  penalties: number;
  isWinning?: boolean;
  align?: 'left' | 'right';
}

export const ScoreCard: React.FC<ScoreCardProps> = ({
  team,
  teamName,
  logoUrl,
  score,
  setScore,
  penalties,
  isWinning = false,
  align = 'left',
}) => {
  const isRed = team === 'red';

  return (
    <div
      className={`relative flex-1 h-full min-h-0 w-full flex flex-col justify-between p-5 sm:p-6 lg:p-7 rounded-2xl border border-[var(--court-line)] overflow-hidden ${
        isRed
          ? 'spectator-red-vertical border-t-4 border-t-[var(--drone-red)]'
          : 'spectator-blue-vertical border-t-4 border-t-[var(--drone-blue)]'
      }`}
    >
      {/* Top Banner */}
      <div
        className={`flex items-center justify-between gap-3 sm:gap-4 shrink-0 ${
          align === 'right' ? 'flex-row-reverse' : ''
        }`}
      >
        <div
          className={`flex items-center gap-3 min-w-0 ${
            align === 'right' ? 'flex-row-reverse text-right' : ''
          }`}
        >
          <TeamBadge teamName={teamName} logoUrl={logoUrl} side={team} size="lg" className="shrink-0" />
          <div className="min-w-0">
            <span
              className="text-xs font-bold block"
              style={{ color: isRed ? 'var(--drone-red-text)' : 'var(--drone-blue-text)' }}
            >
              {isRed ? 'Red team' : 'Blue team'}
            </span>
            <h2 className="spectator-numeral text-3xl sm:text-4xl lg:text-5xl font-black text-[var(--court-ink)] leading-tight truncate">
              {teamName}
            </h2>
          </div>
        </div>

        {/* Sets Won Counter */}
        <div className="flex flex-col items-center bg-[var(--court-subtle)] px-3.5 py-2 rounded-xl border border-[var(--court-line)] shrink-0">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-[var(--court-muted)]">
            <Trophy className="w-3.5 h-3.5" style={{ color: 'var(--signal-amber)' }} />
            <span>Sets</span>
          </div>
          <span className="spectator-numeral text-3xl font-black text-[var(--court-ink)] leading-none mt-0.5">
            {setScore}
          </span>
        </div>
      </div>

      {/* Center Massive Score */}
      <div className="flex-1 min-h-0 flex items-center justify-center my-auto w-full py-2">
        <div
          className="spectator-numeral font-black text-[clamp(7rem,16vw,24rem)] leading-none select-none"
          style={{ color: isRed ? 'var(--drone-red)' : 'var(--drone-blue)' }}
        >
          {score}
        </div>
      </div>

      {/* Bottom Penalty Bar */}
      <div
        className={`flex items-center justify-between border-t border-[var(--court-line-soft)] pt-3 lg:pt-4 shrink-0 flex-wrap gap-2 ${
          align === 'right' ? 'flex-row-reverse' : ''
        }`}
      >
        <PenaltyPips count={penalties} team={team} size="xl" label="Penalties" />
        {isWinning && (
          <span
            className="text-xs sm:text-sm font-bold px-3 py-1 rounded-full border"
            style={
              isRed
                ? {
                    backgroundColor: 'var(--drone-red-tint)',
                    borderColor: 'var(--drone-red-border)',
                    color: 'var(--drone-red-text)',
                  }
                : {
                    backgroundColor: 'var(--drone-blue-tint)',
                    borderColor: 'var(--drone-blue-border)',
                    color: 'var(--drone-blue-text)',
                  }
            }
          >
            Leading set
          </span>
        )}
      </div>
    </div>
  );
};
