import React from 'react';
import { Link } from 'react-router-dom';
import { ArenaSummary, MatchPhase } from '../../types/scoreboard';
import { useAuthoritativeTimer } from '../../hooks/useAuthoritativeTimer';
import { TeamBadge } from '../common/TeamBadge';
import { ChevronRight, Trophy, AlertTriangle, Swords, Coffee, Clock, Radio } from 'lucide-react';

interface PublicLiveCardProps {
  arena: ArenaSummary;
}

function getPhaseBadge(phase: MatchPhase, timerRunning: boolean) {
  switch (phase) {
    case 'SUDDEN_DEATH':
      return {
        label: 'SUDDEN DEATH',
        className: 'bg-amber-500/20 text-amber-300 border-amber-400/50 animate-pulse',
        icon: <Swords className="w-3 h-3 text-amber-400" />,
      };
    case 'PENALTY_PHASE':
      return {
        label: 'PENALTY SHOOTOUT',
        className: 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse',
        icon: <AlertTriangle className="w-3 h-3 text-amber-400" />,
      };
    case 'TIMEOUT':
      return {
        label: 'TIMEOUT',
        className: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
        icon: <Clock className="w-3 h-3 text-sky-400" />,
      };
    case 'INTERMISSION':
      return {
        label: 'INTERMISSION',
        className: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        icon: <Coffee className="w-3 h-3 text-purple-400" />,
      };
    case 'COUNTDOWN':
      return {
        label: 'STARTING',
        className: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse',
        icon: <Radio className="w-3 h-3 text-rose-400" />,
      };
    case 'MATCH_ENDED':
      return {
        label: 'FINAL',
        className: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
        icon: <Trophy className="w-3 h-3 text-amber-400" />,
      };
    case 'NORMAL_PHASE':
      return timerRunning
        ? {
            label: 'LIVE',
            className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
            icon: <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />,
          }
        : {
            label: 'PAUSED',
            className: 'bg-slate-800 text-amber-300 border-amber-500/30',
            icon: <span className="w-2 h-2 rounded-full bg-amber-400" />,
          };
    case 'IDLE':
    default:
      return {
        label: 'STANDBY',
        className: 'bg-slate-800/80 text-slate-400 border-slate-700',
        icon: <span className="w-2 h-2 rounded-full bg-slate-500" />,
      };
  }
}

export const PublicLiveCard: React.FC<PublicLiveCardProps> = ({ arena }) => {
  const { formattedTime, formattedWithTenths, progressPercent, currentMs } = useAuthoritativeTimer({
    serverRemainingMs: arena.timeRemainingMs,
    totalDurationMs: arena.totalSetDurationMs || 180000,
    timerRunning: arena.timerRunning,
    phase: arena.phase,
  });

  const badge = getPhaseBadge(arena.phase, arena.timerRunning);
  const isLowTime = arena.phase !== 'SUDDEN_DEATH' && currentMs > 0 && currentMs <= 10000;
  const displayClock = isLowTime || arena.phase === 'COUNTDOWN' ? formattedWithTenths : formattedTime;

  const redLeading = arena.redScore > arena.blueScore;
  const blueLeading = arena.blueScore > arena.redScore;
  const redPenalties = arena.redPenalties ?? 0;
  const bluePenalties = arena.bluePenalties ?? 0;

  const winnerLabel =
    arena.setWinnerBanner?.active && arena.setWinnerBanner.winnerName
      ? `${arena.setWinnerBanner.isMatchWinner || arena.setWinnerBanner.matchWinner ? 'MATCH WINNER' : `SET ${arena.setWinnerBanner.currentSet} WINNER`}: ${arena.setWinnerBanner.winnerName}`
      : arena.phase === 'MATCH_ENDED' && arena.matchWinner
      ? `MATCH WINNER: ${arena.matchWinner === 'RED' ? arena.teamRed : arena.matchWinner === 'BLUE' ? arena.teamBlue : 'TIE'}`
      : null;

  return (
    <Link
      to={`/live/arena/${arena.arenaId}`}
      className={`group flex flex-col justify-between rounded-3xl bg-slate-900/90 border-2 transition-all duration-200 shadow-xl overflow-hidden hover:-translate-y-0.5 ${
        arena.phase === 'PENALTY_PHASE' || arena.phase === 'SUDDEN_DEATH'
          ? 'border-amber-500/60 hover:border-amber-400 shadow-amber-500/10'
          : arena.timerRunning
          ? 'border-cyan-500/40 hover:border-cyan-400 shadow-cyan-500/10'
          : 'border-slate-800 hover:border-slate-600'
      }`}
    >
      {/* Top Arena & Match Bar */}
      <div className="px-5 pt-4 pb-3 border-b border-slate-800/80 flex items-center justify-between gap-2 bg-slate-950/40">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-400 truncate">
              {arena.arenaName}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold mt-0.5">
            <span>Match {arena.matchNumber}</span>
            <span className="text-slate-600">•</span>
            <span className="font-mono text-[11px] text-slate-400">
              Set {arena.currentSet}/{arena.maxSets}
            </span>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase border shrink-0 ${badge.className}`}
        >
          {badge.icon}
          <span>{badge.label}</span>
        </span>
      </div>

      {/* Main Live Scoreboard Body */}
      <div className="p-5 flex-1 flex flex-col justify-center gap-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          {/* Red Team */}
          <div
            className={`flex flex-col items-center text-center p-3 rounded-2xl border transition-colors ${
              redLeading
                ? 'bg-red-950/45 border-red-500/40'
                : 'bg-red-950/20 border-red-500/15'
            }`}
          >
            <TeamBadge teamName={arena.teamRed} logoUrl={arena.teamRedLogoUrl} side="red" size="md" />
            <span className="mt-2 text-xs font-bold text-red-300 line-clamp-2 leading-tight min-h-[2rem] flex items-center">
              {arena.teamRed}
            </span>
            <span className="font-display font-black text-4xl sm:text-5xl text-red-400 tabular-nums leading-none mt-1">
              {arena.redScore}
            </span>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 text-[10px] font-mono">
              <span className="px-1.5 py-0.5 rounded bg-slate-950/80 text-slate-300 border border-slate-800">
                Sets: <strong className="text-red-300">{arena.redSetScore}</strong>
              </span>
              {redPenalties > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-500/30">
                  P:{redPenalties}
                </span>
              )}
            </div>
          </div>

          {/* Center Clock */}
          <div className="flex flex-col items-center justify-center px-1">
            <span
              className={`font-mono font-black text-2xl sm:text-3xl tabular-nums tracking-tight ${
                arena.phase === 'SUDDEN_DEATH' || arena.phase === 'PENALTY_PHASE'
                  ? 'text-amber-400'
                  : isLowTime
                  ? 'text-rose-400 animate-pulse'
                  : arena.timerRunning
                  ? 'text-white'
                  : 'text-slate-300'
              }`}
            >
              {displayClock}
            </span>
            <div className="w-20 h-1.5 rounded-full bg-slate-800 overflow-hidden mt-2 border border-slate-700/60">
              <div
                className={`h-full rounded-full transition-all duration-150 ${
                  arena.phase === 'PENALTY_PHASE' || arena.phase === 'SUDDEN_DEATH'
                    ? 'bg-amber-400'
                    : isLowTime
                    ? 'bg-rose-500'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mt-1.5">
              {arena.timerRunning ? 'IN FLIGHT' : 'CLOCK STOPPED'}
            </span>
          </div>

          {/* Blue Team */}
          <div
            className={`flex flex-col items-center text-center p-3 rounded-2xl border transition-colors ${
              blueLeading
                ? 'bg-blue-950/45 border-blue-500/40'
                : 'bg-blue-950/20 border-blue-500/15'
            }`}
          >
            <TeamBadge teamName={arena.teamBlue} logoUrl={arena.teamBlueLogoUrl} side="blue" size="md" />
            <span className="mt-2 text-xs font-bold text-blue-300 line-clamp-2 leading-tight min-h-[2rem] flex items-center">
              {arena.teamBlue}
            </span>
            <span className="font-display font-black text-4xl sm:text-5xl text-blue-400 tabular-nums leading-none mt-1">
              {arena.blueScore}
            </span>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 text-[10px] font-mono">
              <span className="px-1.5 py-0.5 rounded bg-slate-950/80 text-slate-300 border border-slate-800">
                Sets: <strong className="text-blue-300">{arena.blueSetScore}</strong>
              </span>
              {bluePenalties > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-500/30">
                  P:{bluePenalties}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Winner Callout Strip (when active) */}
        {winnerLabel && (
          <div className="px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center gap-2 text-xs font-mono font-bold text-amber-300">
            <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{winnerLabel}</span>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="px-5 py-3 border-t border-slate-800/80 bg-slate-950/50 flex items-center justify-between text-xs font-mono">
        <span className="text-slate-400 truncate">
          {arena.tournamentName || 'Drone Soccer Live'}
        </span>
        <span className="text-cyan-400 group-hover:text-cyan-300 font-bold flex items-center gap-1 shrink-0">
          <span>LIVE DETAILS</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </Link>
  );
};
