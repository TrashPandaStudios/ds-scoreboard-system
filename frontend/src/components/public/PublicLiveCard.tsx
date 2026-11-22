import React from 'react';
import { Link } from 'react-router-dom';
import { ArenaSummary, MatchPhase } from '../../types/scoreboard';
import { useAuthoritativeTimer } from '../../hooks/useAuthoritativeTimer';
import { TeamBadge } from '../common/TeamBadge';
import { ChevronRight, Trophy, AlertTriangle } from 'lucide-react';

export interface PublicLiveCardProps {
  arena: ArenaSummary;
  variant?: 'spotlight' | 'row';
}

export function getSpectatorPhaseMeta(phase: MatchPhase, timerRunning: boolean) {
  switch (phase) {
    case 'SUDDEN_DEATH':
      return {
        label: 'Sudden death',
        pillStyle: {
          backgroundColor: 'var(--signal-amber-tint)',
          color: 'var(--signal-amber-text)',
          borderColor: 'var(--signal-amber-border)',
        },
        dotColor: 'var(--signal-amber)',
        pulse: true,
        accentColor: 'var(--signal-amber)',
      };
    case 'PENALTY_PHASE':
      return {
        label: 'Penalty shootout',
        pillStyle: {
          backgroundColor: 'var(--signal-amber-tint)',
          color: 'var(--signal-amber-text)',
          borderColor: 'var(--signal-amber-border)',
        },
        dotColor: 'var(--signal-amber)',
        pulse: true,
        accentColor: 'var(--signal-amber)',
      };
    case 'TIMEOUT':
      return {
        label: 'Timeout',
        pillStyle: {
          backgroundColor: 'var(--signal-info-tint)',
          color: 'var(--signal-info-text)',
          borderColor: 'var(--signal-info-border)',
        },
        dotColor: 'var(--signal-info)',
        pulse: false,
        accentColor: 'var(--signal-info)',
      };
    case 'INTERMISSION':
      return {
        label: 'Intermission',
        pillStyle: {
          backgroundColor: 'var(--signal-intermission-tint)',
          color: 'var(--signal-intermission-text)',
          borderColor: 'var(--signal-intermission-border)',
        },
        dotColor: 'var(--signal-intermission)',
        pulse: false,
        accentColor: 'var(--signal-intermission)',
      };
    case 'COUNTDOWN':
      return {
        label: 'Starting soon',
        pillStyle: {
          backgroundColor: 'var(--drone-red-tint)',
          color: 'var(--drone-red-text)',
          borderColor: 'var(--drone-red-border)',
        },
        dotColor: 'var(--drone-red)',
        pulse: true,
        accentColor: 'var(--drone-red)',
      };
    case 'MATCH_ENDED':
      return {
        label: 'Final',
        pillStyle: {
          backgroundColor: 'var(--court-control-bg)',
          color: 'var(--court-ink-secondary)',
          borderColor: 'var(--court-line)',
        },
        dotColor: 'var(--court-muted)',
        pulse: false,
        accentColor: 'var(--court-muted)',
      };
    case 'NORMAL_PHASE':
      return timerRunning
        ? {
            label: 'In flight',
            pillStyle: {
              backgroundColor: 'var(--signal-live-tint)',
              color: 'var(--signal-live-text)',
              borderColor: 'var(--signal-live-border)',
            },
            dotColor: 'var(--signal-live)',
            pulse: true,
            accentColor: 'var(--signal-live)',
          }
        : {
            label: 'Paused',
            pillStyle: {
              backgroundColor: 'var(--signal-amber-tint)',
              color: 'var(--signal-amber-text)',
              borderColor: 'var(--signal-amber-border)',
            },
            dotColor: 'var(--signal-amber)',
            pulse: false,
            accentColor: 'var(--signal-amber)',
          };
    case 'IDLE':
    default:
      return {
        label: 'Standby',
        pillStyle: {
          backgroundColor: 'var(--court-control-bg)',
          color: 'var(--court-muted)',
          borderColor: 'var(--court-line-soft)',
        },
        dotColor: 'var(--court-muted)',
        pulse: false,
        accentColor: 'var(--court-muted)',
      };
  }
}

const SetWinPips: React.FC<{ won: number; totalNeeded: number; color: 'red' | 'blue' }> = ({
  won,
  totalNeeded,
  color,
}) => {
  const count = Math.max(2, totalNeeded);
  const activeColor = color === 'red' ? 'var(--drone-red)' : 'var(--drone-blue)';
  return (
    <div className="inline-flex items-center gap-1" aria-label={`${won} sets won`}>
      {Array.from({ length: count }, (_, idx) => (
        <span
          key={idx}
          className="w-2.5 h-2.5 rounded-sm border"
          style={
            idx < won
              ? { backgroundColor: activeColor, borderColor: activeColor }
              : { backgroundColor: 'var(--court-surface)', borderColor: 'var(--court-line)' }
          }
        />
      ))}
    </div>
  );
};

export const PublicLiveCard: React.FC<PublicLiveCardProps> = ({ arena, variant = 'row' }) => {
  const { formattedTime, formattedWithTenths, progressPercent, currentMs } = useAuthoritativeTimer({
    serverRemainingMs: arena.timeRemainingMs,
    totalDurationMs: arena.totalSetDurationMs || 180000,
    timerRunning: arena.timerRunning,
    phase: arena.phase,
  });

  const phaseMeta = getSpectatorPhaseMeta(arena.phase, arena.timerRunning);
  const isLowTime = arena.phase !== 'SUDDEN_DEATH' && currentMs > 0 && currentMs <= 10000;
  const displayClock = isLowTime || arena.phase === 'COUNTDOWN' ? formattedWithTenths : formattedTime;

  const redPenalties = arena.redPenalties ?? 0;
  const bluePenalties = arena.bluePenalties ?? 0;
  const setsToWin = Math.ceil((arena.maxSets || 3) / 2);

  const winnerNotice =
    arena.setWinnerBanner?.active && arena.setWinnerBanner.winnerName
      ? `${
          arena.setWinnerBanner.isMatchWinner || arena.setWinnerBanner.matchWinner
            ? 'Match winner'
            : `Set ${arena.setWinnerBanner.currentSet} winner`
        }: ${arena.setWinnerBanner.winnerName}`
      : arena.phase === 'MATCH_ENDED' && arena.matchWinner
      ? `Final winner: ${
          arena.matchWinner === 'RED'
            ? arena.teamRed
            : arena.matchWinner === 'BLUE'
            ? arena.teamBlue
            : 'Draw'
        }`
      : null;

  // =========================================================================
  // SPOTLIGHT VARIANT: Full-width split Red / Clock / Blue live arena stage
  // =========================================================================
  if (variant === 'spotlight') {
    return (
      <Link
        to={`/live/arena/${arena.arenaId}`}
        className="group block rounded-2xl border border-[var(--court-line)] bg-[var(--court-surface)] hover:border-[var(--court-muted)] transition-colors overflow-hidden"
      >
        {/* Top structural timing header */}
        <div className="px-5 sm:px-6 py-3.5 border-b border-[var(--court-line-soft)] flex flex-wrap items-center justify-between gap-3 bg-[var(--court-subtle)]">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-sm font-bold text-[var(--court-ink)]">{arena.arenaName}</span>
            <span className="text-sm text-[var(--court-ink-secondary)]">Match {arena.matchNumber}</span>
            <span className="text-sm text-[var(--court-muted)]">
              Set {arena.currentSet} of {arena.maxSets}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border"
              style={phaseMeta.pillStyle}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${phaseMeta.pulse ? 'animate-pulse' : ''}`}
                style={{ backgroundColor: phaseMeta.dotColor }}
              />
              {phaseMeta.label}
            </span>

            <span className="text-xs font-semibold text-[var(--court-accent-link)] group-hover:underline inline-flex items-center gap-0.5">
              Open match
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Split Scoreboard Stage */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_196px_1fr] divide-y md:divide-y-0 md:divide-x divide-[var(--court-line-soft)]">
          {/* Red Bay */}
          <div className="spectator-red-bay p-5 sm:p-6 flex items-center justify-between gap-4 border-l-4 border-l-[var(--drone-red)]">
            <div className="flex items-center gap-3.5 min-w-0">
              <TeamBadge teamName={arena.teamRed} logoUrl={arena.teamRedLogoUrl} side="red" size="lg" />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[var(--drone-red-text)]">Red team</div>
                <h2 className="spectator-numeral text-2xl sm:text-3xl font-extrabold text-[var(--court-ink)] leading-tight truncate">
                  {arena.teamRed}
                </h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-2.5 text-xs text-[var(--court-muted)]">
                  <span className="inline-flex items-center gap-1.5">
                    <SetWinPips won={arena.redSetScore} totalNeeded={setsToWin} color="red" />
                    <span className="tabular-nums">{arena.redSetScore} sets</span>
                  </span>
                  {redPenalties > 0 && (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border font-semibold"
                      style={{
                        backgroundColor: 'var(--signal-amber-tint)',
                        color: 'var(--signal-amber-text)',
                        borderColor: 'var(--signal-amber-border)',
                      }}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      {redPenalties} {redPenalties === 1 ? 'penalty' : 'penalties'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="spectator-numeral text-6xl sm:text-7xl font-black text-[var(--drone-red)] leading-none shrink-0 pl-2">
              {arena.redScore}
            </div>
          </div>

          {/* Center Clock Column */}
          <div className="px-5 py-4 sm:py-6 flex flex-row md:flex-col items-center justify-between md:justify-center gap-3 bg-[var(--court-subtle)]">
            <div className="flex flex-col items-start md:items-center">
              <span
                className="spectator-numeral text-4xl sm:text-5xl font-black leading-none"
                style={{
                  color:
                    arena.phase === 'SUDDEN_DEATH' || arena.phase === 'PENALTY_PHASE'
                      ? 'var(--signal-amber-text)'
                      : isLowTime
                      ? 'var(--drone-red)'
                      : 'var(--court-ink)',
                }}
              >
                {displayClock}
              </span>
              <span className="text-xs text-[var(--court-muted)] mt-1 font-medium">
                {arena.timerRunning ? 'Clock running' : 'Clock stopped'}
              </span>
            </div>

            <div className="w-28 md:w-full h-1.5 rounded-full bg-[var(--court-line-soft)] overflow-hidden">
              <div
                className="h-full transition-all duration-150"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: isLowTime ? 'var(--drone-red)' : phaseMeta.accentColor,
                }}
              />
            </div>
          </div>

          {/* Blue Bay */}
          <div className="spectator-blue-bay p-5 sm:p-6 flex items-center justify-between gap-4 md:flex-row-reverse border-l-4 md:border-l-0 md:border-r-4 border-l-[var(--drone-blue)] md:border-r-[var(--drone-blue)]">
            <div className="flex items-center md:flex-row-reverse gap-3.5 min-w-0">
              <TeamBadge teamName={arena.teamBlue} logoUrl={arena.teamBlueLogoUrl} side="blue" size="lg" />
              <div className="min-w-0 md:text-right">
                <div className="text-xs font-semibold text-[var(--drone-blue-text)]">Blue team</div>
                <h2 className="spectator-numeral text-2xl sm:text-3xl font-extrabold text-[var(--court-ink)] leading-tight truncate">
                  {arena.teamBlue}
                </h2>
                <div className="mt-1.5 flex flex-wrap items-center md:justify-end gap-2.5 text-xs text-[var(--court-muted)]">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="tabular-nums">{arena.blueSetScore} sets</span>
                    <SetWinPips won={arena.blueSetScore} totalNeeded={setsToWin} color="blue" />
                  </span>
                  {bluePenalties > 0 && (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border font-semibold"
                      style={{
                        backgroundColor: 'var(--signal-amber-tint)',
                        color: 'var(--signal-amber-text)',
                        borderColor: 'var(--signal-amber-border)',
                      }}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      {bluePenalties} {bluePenalties === 1 ? 'penalty' : 'penalties'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="spectator-numeral text-6xl sm:text-7xl font-black text-[var(--drone-blue)] leading-none shrink-0 pr-2">
              {arena.blueScore}
            </div>
          </div>
        </div>

        {/* Winner Notice Bar */}
        {winnerNotice && (
          <div
            className="px-5 py-2.5 border-t flex items-center justify-center gap-2 text-xs font-semibold"
            style={{
              backgroundColor: 'var(--signal-amber-tint)',
              borderColor: 'var(--signal-amber-border)',
              color: 'var(--signal-amber-text)',
            }}
          >
            <Trophy className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--signal-amber)' }} />
            <span>{winnerNotice}</span>
          </div>
        )}
      </Link>
    );
  }

  // =========================================================================
  // ROW VARIANT: Compact horizontal timing-board strip for additional cages
  // =========================================================================
  return (
    <Link
      to={`/live/arena/${arena.arenaId}`}
      className="group block px-4 sm:px-5 py-3.5 bg-[var(--court-surface)] hover:bg-[var(--court-hover)] transition-colors"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_auto] items-center gap-3 lg:gap-4">
        {/* Left: Cage & Match metadata */}
        <div className="flex items-center justify-between lg:flex-col lg:items-start gap-1">
          <span className="text-sm font-bold text-[var(--court-ink)] truncate">{arena.arenaName}</span>
          <div className="flex items-center gap-2 text-xs text-[var(--court-muted)]">
            <span>Match {arena.matchNumber}</span>
            <span>Set {arena.currentSet}/{arena.maxSets}</span>
          </div>
        </div>

        {/* Center: Symmetrical Red / Clock / Blue Score Strip */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
          {/* Red side */}
          <div className="flex items-center justify-end gap-2.5 min-w-0">
            <div className="text-right min-w-0">
              <div className="font-bold text-sm sm:text-base text-[var(--court-ink)] truncate">
                {arena.teamRed}
              </div>
              <div className="text-[11px] text-[var(--court-muted)] tabular-nums inline-flex items-center justify-end gap-1.5">
                <span>
                  {arena.redSetScore} {arena.redSetScore === 1 ? 'set' : 'sets'}
                </span>
                {redPenalties > 0 && (
                  <span className="font-semibold" style={{ color: 'var(--signal-amber-text)' }}>
                    {redPenalties}P
                  </span>
                )}
              </div>
            </div>
            <TeamBadge teamName={arena.teamRed} logoUrl={arena.teamRedLogoUrl} side="red" size="sm" />
            <span className="spectator-numeral text-3xl sm:text-4xl font-black text-[var(--drone-red)] w-9 text-right leading-none">
              {arena.redScore}
            </span>
          </div>

          {/* Clock */}
          <div className="flex flex-col items-center px-2 sm:px-3 py-1 rounded-lg bg-[var(--court-control-bg)] border border-[var(--court-line-soft)] min-w-[78px]">
            <span
              className="spectator-numeral text-xl font-extrabold leading-none"
              style={{ color: isLowTime ? 'var(--drone-red)' : 'var(--court-ink)' }}
            >
              {displayClock}
            </span>
            <span className="text-[10px] font-medium text-[var(--court-muted)] mt-0.5 leading-none">
              {phaseMeta.label}
            </span>
          </div>

          {/* Blue side */}
          <div className="flex items-center justify-start gap-2.5 min-w-0">
            <span className="spectator-numeral text-3xl sm:text-4xl font-black text-[var(--drone-blue)] w-9 text-left leading-none">
              {arena.blueScore}
            </span>
            <TeamBadge teamName={arena.teamBlue} logoUrl={arena.teamBlueLogoUrl} side="blue" size="sm" />
            <div className="text-left min-w-0">
              <div className="font-bold text-sm sm:text-base text-[var(--court-ink)] truncate">
                {arena.teamBlue}
              </div>
              <div className="text-[11px] text-[var(--court-muted)] tabular-nums inline-flex items-center gap-1.5">
                <span>
                  {arena.blueSetScore} {arena.blueSetScore === 1 ? 'set' : 'sets'}
                </span>
                {bluePenalties > 0 && (
                  <span className="font-semibold" style={{ color: 'var(--signal-amber-text)' }}>
                    {bluePenalties}P
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Open chevron */}
        <div className="hidden lg:flex items-center justify-end gap-1 text-xs font-semibold text-[var(--court-muted)] group-hover:text-[var(--court-accent-link)]">
          <span>Details</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      {winnerNotice && (
        <div
          className="mt-2.5 pt-2 border-t border-[var(--court-line-soft)] flex items-center gap-1.5 text-xs font-semibold"
          style={{ color: 'var(--signal-amber-text)' }}
        >
          <Trophy className="w-3.5 h-3.5" style={{ color: 'var(--signal-amber)' }} />
          <span>{winnerNotice}</span>
        </div>
      )}
    </Link>
  );
};
