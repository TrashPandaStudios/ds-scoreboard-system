import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useArenaStore } from '../store/arenaStore';
import { useArenaWebSocket } from '../hooks/useArenaWebSocket';
import { useAuthoritativeTimer } from '../hooks/useAuthoritativeTimer';
import { useSpectatorTheme } from '../hooks/useSpectatorTheme';
import { TeamBadge } from '../components/common/TeamBadge';
import { getSpectatorPhaseMeta } from '../components/public/PublicLiveCard';
import {
  ArenaSummary,
  MatchRecord,
  PublicArenaDetailResponse,
  ScheduledMatch,
} from '../types/scoreboard';
import { ArrowLeft, Trophy, AlertTriangle, Clock, Sun, Moon } from 'lucide-react';

interface PublicMatchDetailProps {
  publicPortalMode?: boolean;
}

const SetPips: React.FC<{ won: number; needed: number; color: 'red' | 'blue' }> = ({
  won,
  needed,
  color,
}) => {
  const count = Math.max(2, needed);
  const activeColor = color === 'red' ? 'var(--drone-red)' : 'var(--drone-blue)';
  return (
    <div className="inline-flex items-center gap-1.5" aria-label={`${won} sets won`}>
      {Array.from({ length: count }, (_, idx) => (
        <span
          key={idx}
          className="w-3 h-3 rounded-sm border"
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

export const PublicMatchDetail: React.FC<PublicMatchDetailProps> = ({ publicPortalMode = false }) => {
  const { id } = useParams<{ id: string }>();
  const arenaId = parseInt(id || '1', 10);

  useArenaWebSocket(Number.isFinite(arenaId) ? arenaId : undefined, { readOnly: true });
  const { arenaStates, setArenaState, isConnected, transportMode } = useArenaStore();
  const { theme, toggleTheme } = useSpectatorTheme();

  const [allArenas, setAllArenas] = useState<ArenaSummary[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<ScheduledMatch[]>([]);
  const [recentMatches, setRecentMatches] = useState<MatchRecord[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  const liveHomePath = publicPortalMode ? '/' : '/live';

  const fetchDetail = useCallback(async () => {
    if (!Number.isFinite(arenaId)) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    try {
      const [detailRes, arenasRes] = await Promise.all([
        fetch(`/api/public/arenas/${arenaId}`, { cache: 'no-store' }),
        fetch('/api/arenas', { cache: 'no-store' }),
      ]);

      if (detailRes.status === 404) {
        setNotFound(true);
      } else if (detailRes.ok) {
        const data: PublicArenaDetailResponse = await detailRes.json();
        setNotFound(false);
        if (data.arena && data.arena.arenaId) {
          setArenaState(arenaId, data.arena);
        }
        setUpcomingMatches(Array.isArray(data.upcomingMatches) ? data.upcomingMatches : []);
        setRecentMatches(Array.isArray(data.recentMatches) ? data.recentMatches : []);
      }

      if (arenasRes.ok) {
        const list: ArenaSummary[] = await arenasRes.json();
        if (Array.isArray(list)) {
          setAllArenas([...list].sort((a, b) => a.arenaId - b.arenaId));
        }
      }
    } catch {
      // Keep live state on brief connectivity drop
    } finally {
      setLoading(false);
    }
  }, [arenaId, setArenaState]);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    fetchDetail();
    const interval = window.setInterval(fetchDetail, 15000);
    return () => window.clearInterval(interval);
  }, [fetchDetail]);

  const arenaState = arenaStates[arenaId];

  const { formattedTime, formattedWithTenths, progressPercent, currentMs } = useAuthoritativeTimer({
    serverRemainingMs: arenaState?.timeRemainingMs ?? 180000,
    totalDurationMs: arenaState?.totalSetDurationMs ?? 180000,
    timerRunning: arenaState?.timerRunning ?? false,
    phase: arenaState?.phase ?? 'IDLE',
  });

  useEffect(() => {
    if (arenaState) {
      document.title = `${arenaState.teamRed} vs ${arenaState.teamBlue} — ${arenaState.arenaName}`;
    } else {
      document.title = `Cage ${arenaId} — Drone Soccer Live`;
    }
  }, [arenaState, arenaId]);

  const setsArray = useMemo(() => {
    const maxSets = arenaState?.maxSets || 3;
    return Array.from({ length: maxSets }, (_, idx) => idx + 1);
  }, [arenaState?.maxSets]);

  const connectionBadge =
    isConnected || transportMode === 'WS'
      ? {
          text: 'Live',
          dotColor: 'var(--signal-live)',
          style: {
            backgroundColor: 'var(--signal-live-tint)',
            color: 'var(--signal-live-text)',
            borderColor: 'var(--signal-live-border)',
          },
        }
      : transportMode === 'HTTP_FALLBACK'
      ? {
          text: 'Auto-updating',
          dotColor: 'var(--signal-info)',
          style: {
            backgroundColor: 'var(--signal-info-tint)',
            color: 'var(--signal-info-text)',
            borderColor: 'var(--signal-info-border)',
          },
        }
      : {
          text: 'Reconnecting',
          dotColor: 'var(--signal-amber)',
          style: {
            backgroundColor: 'var(--signal-amber-tint)',
            color: 'var(--signal-amber-text)',
            borderColor: 'var(--signal-amber-border)',
          },
        };

  if (notFound && !arenaState) {
    return (
      <div
        className="spectator-shell min-h-screen flex flex-col items-center justify-center p-6 text-center"
        data-spectator-theme={theme}
      >
        <div className="max-w-sm rounded-2xl bg-[var(--court-surface)] border border-[var(--court-line)] p-8">
          <h1 className="spectator-numeral text-3xl font-extrabold text-[var(--court-ink)]">
            Cage {arenaId} is not active
          </h1>
          <p className="text-sm text-[var(--court-muted)] mt-2">
            Choose an active flight cage from the live board to follow ongoing scores.
          </p>
          <Link
            to={liveHomePath}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
            style={{
              backgroundColor: 'var(--court-active-pill-bg)',
              color: 'var(--court-active-pill-fg)',
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to matches</span>
          </Link>
        </div>
      </div>
    );
  }

  const phaseMeta = arenaState
    ? getSpectatorPhaseMeta(arenaState.phase, arenaState.timerRunning)
    : getSpectatorPhaseMeta('IDLE', false);
  const isLowTime =
    arenaState && arenaState.phase !== 'SUDDEN_DEATH' && currentMs > 0 && currentMs <= 10000;
  const displayClock =
    isLowTime || arenaState?.phase === 'COUNTDOWN' ? formattedWithTenths : formattedTime;
  const setsNeeded = Math.ceil((arenaState?.maxSets || 3) / 2);

  return (
    <div className="spectator-shell min-h-screen flex flex-col" data-spectator-theme={theme}>
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-[var(--court-surface)] border-b border-[var(--court-line)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to={liveHomePath}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-sm font-semibold text-[var(--court-ink)] transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to matches</span>
            </Link>

            {allArenas.length > 1 && (
              <nav
                className="hidden md:flex items-center gap-1 pl-3 border-l border-[var(--court-line-soft)]"
                aria-label="Switch cage"
              >
                {allArenas.map((a) => {
                  const active = a.arenaId === arenaId;
                  return (
                    <Link
                      key={a.arenaId}
                      to={`/live/arena/${a.arenaId}`}
                      className="px-2.5 py-1 rounded-md text-xs font-semibold transition-colors"
                      style={
                        active
                          ? {
                              backgroundColor: 'var(--court-active-pill-bg)',
                              color: 'var(--court-active-pill-fg)',
                            }
                          : { color: 'var(--court-muted)' }
                      }
                    >
                      Cage {a.arenaId}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold"
              style={connectionBadge.style}
              role="status"
              aria-live="polite"
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: connectionBadge.dotColor }} />
              <span>{connectionBadge.text}</span>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--court-line)] bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-xs font-semibold text-[var(--court-ink-secondary)] transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full flex flex-col gap-6">
        {/* Mobile Cage Switcher */}
        {allArenas.length > 1 && (
          <div className="flex md:hidden items-center gap-1.5 overflow-x-auto pb-1">
            {allArenas.map((a) => {
              const active = a.arenaId === arenaId;
              return (
                <Link
                  key={a.arenaId}
                  to={`/live/arena/${a.arenaId}`}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 border"
                  style={
                    active
                      ? {
                          backgroundColor: 'var(--court-active-pill-bg)',
                          color: 'var(--court-active-pill-fg)',
                          borderColor: 'var(--court-active-pill-bg)',
                        }
                      : {
                          backgroundColor: 'var(--court-surface)',
                          color: 'var(--court-ink-secondary)',
                          borderColor: 'var(--court-line)',
                        }
                  }
                >
                  {a.arenaName}
                </Link>
              );
            })}
          </div>
        )}

        {!arenaState ? (
          <div className="rounded-2xl bg-[var(--court-surface)] border border-[var(--court-line)] p-10 text-center">
            <p className="text-sm font-semibold text-[var(--court-ink)]">
              {loading ? `Loading Cage ${arenaId}` : 'Waiting for live telemetry'}
            </p>
            <p className="text-xs text-[var(--court-muted)] mt-1">
              Scores update automatically as soon as the cage connects.
            </p>
          </div>
        ) : (
          <>
            {/* =============================================================== */}
            {/* HERO LIVE SCOREBOARD STAGE                                      */}
            {/* =============================================================== */}
            <section className="rounded-2xl bg-[var(--court-surface)] border border-[var(--court-line)] overflow-hidden">
              {/* Match Identity Bar */}
              <div className="px-5 sm:px-6 py-4 border-b border-[var(--court-line-soft)] flex flex-wrap items-center justify-between gap-3 bg-[var(--court-subtle)]">
                <div>
                  <h1 className="text-base sm:text-lg font-bold text-[var(--court-ink)] leading-tight">
                    {arenaState.arenaName}
                  </h1>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[var(--court-muted)] mt-0.5">
                    {arenaState.tournamentName && <span>{arenaState.tournamentName}</span>}
                    <span>Match {arenaState.matchNumber}</span>
                    <span>
                      Set {arenaState.currentSet} of {arenaState.maxSets}
                    </span>
                  </div>
                </div>

                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
                  style={phaseMeta.pillStyle}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${phaseMeta.pulse ? 'animate-pulse' : ''}`}
                    style={{ backgroundColor: phaseMeta.dotColor }}
                  />
                  {phaseMeta.label}
                </span>
              </div>

              {/* Phase Alert Strip */}
              {(arenaState.phase === 'SUDDEN_DEATH' ||
                arenaState.phase === 'PENALTY_PHASE' ||
                arenaState.phase === 'TIMEOUT' ||
                arenaState.phase === 'INTERMISSION') && (
                <div
                  className="px-5 sm:px-6 py-2.5 border-b text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 text-center"
                  style={{
                    backgroundColor: 'var(--signal-amber-tint)',
                    borderColor: 'var(--signal-amber-border)',
                    color: 'var(--signal-amber-text)',
                  }}
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: 'var(--signal-amber)' }} />
                  <span>
                    {arenaState.phase === 'SUDDEN_DEATH'
                      ? 'Sudden death overtime: next goal wins the set'
                      : arenaState.phase === 'PENALTY_PHASE'
                      ? 'Penalty shootout in progress'
                      : arenaState.phase === 'TIMEOUT'
                      ? 'Official timeout in progress'
                      : 'Intermission break before the next set'}
                  </span>
                </div>
              )}

              {/* Inline Non-Blocking Winner Banner */}
              {arenaState.setWinnerBanner?.active && (
                <div
                  className="px-5 sm:px-6 py-3 border-b flex flex-wrap items-center justify-center gap-2 text-sm font-semibold text-center"
                  style={{
                    backgroundColor: 'var(--signal-live-tint)',
                    borderColor: 'var(--signal-live-border)',
                    color: 'var(--signal-live-text)',
                  }}
                >
                  <Trophy className="w-4 h-4 shrink-0" style={{ color: 'var(--signal-live)' }} />
                  <span>
                    {arenaState.setWinnerBanner.isMatchWinner || arenaState.setWinnerBanner.matchWinner
                      ? 'Match winner'
                      : `Set ${arenaState.setWinnerBanner.currentSet} winner`}
                    : {arenaState.setWinnerBanner.winnerName}
                  </span>
                  <span className="text-xs font-medium opacity-85 tabular-nums">
                    (Sets {arenaState.setWinnerBanner.redSetScore} – {arenaState.setWinnerBanner.blueSetScore})
                  </span>
                </div>
              )}

              {/* Main Red / Clock / Blue Stage */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_230px_1fr] divide-y md:divide-y-0 md:divide-x divide-[var(--court-line-soft)]">
                {/* Red Team Bay */}
                <div className="spectator-red-bay p-6 sm:p-7 border-l-4 border-l-[var(--drone-red)] flex flex-col justify-between gap-5">
                  <div className="flex items-center gap-3.5">
                    <TeamBadge
                      teamName={arenaState.teamRed}
                      logoUrl={arenaState.teamRedLogoUrl}
                      side="red"
                      size="lg"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-[var(--drone-red-text)]">Red team</span>
                      <h2 className="spectator-numeral text-3xl sm:text-4xl font-extrabold text-[var(--court-ink)] leading-tight truncate">
                        {arenaState.teamRed}
                      </h2>
                    </div>
                  </div>

                  <div className="flex items-end justify-between gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-xs text-[var(--court-muted)]">
                        <SetPips won={arenaState.redSetScore} needed={setsNeeded} color="red" />
                        <span className="font-semibold text-[var(--court-ink)] tabular-nums">
                          {arenaState.redSetScore} {arenaState.redSetScore === 1 ? 'set' : 'sets'}
                        </span>
                      </div>
                      <span
                        className="inline-flex items-center gap-1 text-xs font-medium w-fit"
                        style={
                          arenaState.redPenalties > 0
                            ? {
                                padding: '2px 8px',
                                borderRadius: '4px',
                                backgroundColor: 'var(--signal-amber-tint)',
                                color: 'var(--signal-amber-text)',
                                border: '1px solid var(--signal-amber-border)',
                                fontWeight: 600,
                              }
                            : { color: 'var(--court-muted)' }
                        }
                      >
                        {arenaState.redPenalties > 0 && <AlertTriangle className="w-3 h-3" />}
                        Penalties: {arenaState.redPenalties}
                      </span>
                    </div>

                    <div className="spectator-numeral text-7xl sm:text-8xl font-black text-[var(--drone-red)] leading-none">
                      {arenaState.redScore}
                    </div>
                  </div>
                </div>

                {/* Authoritative Clock Column */}
                <div className="p-6 flex flex-col items-center justify-center gap-3 bg-[var(--court-subtle)]">
                  <span className="text-xs font-semibold text-[var(--court-muted)]">
                    Set {arenaState.currentSet} of {arenaState.maxSets}
                  </span>
                  <div
                    className="spectator-numeral text-6xl sm:text-7xl font-black leading-none"
                    style={{
                      color:
                        arenaState.phase === 'SUDDEN_DEATH' || arenaState.phase === 'PENALTY_PHASE'
                          ? 'var(--signal-amber-text)'
                          : isLowTime
                          ? 'var(--drone-red)'
                          : 'var(--court-ink)',
                    }}
                  >
                    {displayClock}
                  </div>
                  <div className="w-full max-w-[180px] h-2 rounded-full bg-[var(--court-line-soft)] overflow-hidden">
                    <div
                      className="h-full transition-all duration-150"
                      style={{
                        width: `${progressPercent}%`,
                        backgroundColor: isLowTime ? 'var(--drone-red)' : phaseMeta.accentColor,
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium text-[var(--court-muted)]">
                    {arenaState.timerRunning ? 'Clock running' : 'Clock stopped'}
                  </span>
                </div>

                {/* Blue Team Bay */}
                <div className="spectator-blue-bay p-6 sm:p-7 border-l-4 md:border-l-0 md:border-r-4 border-l-[var(--drone-blue)] md:border-r-[var(--drone-blue)] flex flex-col justify-between gap-5">
                  <div className="flex items-center md:flex-row-reverse gap-3.5">
                    <TeamBadge
                      teamName={arenaState.teamBlue}
                      logoUrl={arenaState.teamBlueLogoUrl}
                      side="blue"
                      size="lg"
                    />
                    <div className="min-w-0 md:text-right">
                      <span className="text-xs font-semibold text-[var(--drone-blue-text)]">Blue team</span>
                      <h2 className="spectator-numeral text-3xl sm:text-4xl font-extrabold text-[var(--court-ink)] leading-tight truncate">
                        {arenaState.teamBlue}
                      </h2>
                    </div>
                  </div>

                  <div className="flex items-end justify-between md:flex-row-reverse gap-4">
                    <div className="flex flex-col md:items-end gap-2">
                      <div className="flex items-center gap-2 text-xs text-[var(--court-muted)]">
                        <span className="font-semibold text-[var(--court-ink)] tabular-nums">
                          {arenaState.blueSetScore} {arenaState.blueSetScore === 1 ? 'set' : 'sets'}
                        </span>
                        <SetPips won={arenaState.blueSetScore} needed={setsNeeded} color="blue" />
                      </div>
                      <span
                        className="inline-flex items-center gap-1 text-xs font-medium w-fit"
                        style={
                          arenaState.bluePenalties > 0
                            ? {
                                padding: '2px 8px',
                                borderRadius: '4px',
                                backgroundColor: 'var(--signal-amber-tint)',
                                color: 'var(--signal-amber-text)',
                                border: '1px solid var(--signal-amber-border)',
                                fontWeight: 600,
                              }
                            : { color: 'var(--court-muted)' }
                        }
                      >
                        {arenaState.bluePenalties > 0 && <AlertTriangle className="w-3 h-3" />}
                        Penalties: {arenaState.bluePenalties}
                      </span>
                    </div>

                    <div className="spectator-numeral text-7xl sm:text-8xl font-black text-[var(--drone-blue)] leading-none">
                      {arenaState.blueScore}
                    </div>
                  </div>
                </div>
              </div>

              {/* Latest Event Status Footer */}
              {arenaState.recentEvent && (
                <div className="px-5 sm:px-6 py-2.5 bg-[var(--court-subtle)] border-t border-[var(--court-line-soft)] flex items-center justify-between gap-3 text-xs text-[var(--court-muted)]">
                  <span className="truncate">Latest update: {arenaState.recentEvent}</span>
                  <span className="shrink-0 font-medium">Best of {arenaState.maxSets}</span>
                </div>
              )}
            </section>

            {/* =============================================================== */}
            {/* SET-BY-SET RESULTS LEDGER                                       */}
            {/* =============================================================== */}
            <section className="rounded-xl bg-[var(--court-surface)] border border-[var(--court-line)] overflow-hidden">
              <div className="px-5 py-3 bg-[var(--court-subtle)] border-b border-[var(--court-line-soft)] flex items-center justify-between">
                <h2 className="text-sm font-bold text-[var(--court-ink)]">Set breakdown</h2>
                <span className="text-xs text-[var(--court-muted)]">First to {setsNeeded} sets wins</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[var(--court-line-soft)]">
                {setsArray.map((setNum) => {
                  const completed = (arenaState.completedSets || []).find((s) => s.setNumber === setNum);
                  const isCurrent = setNum === arenaState.currentSet && arenaState.phase !== 'MATCH_ENDED';

                  return (
                    <div
                      key={setNum}
                      className="p-4 sm:p-5 flex flex-col gap-2"
                      style={{
                        backgroundColor: isCurrent ? 'var(--drone-blue-tint)' : 'var(--court-surface)',
                      }}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[var(--court-ink)]">Set {setNum}</span>
                        {completed ? (
                          <span
                            className="px-2 py-0.5 rounded-full font-semibold border"
                            style={
                              completed.winner === 'RED'
                                ? {
                                    backgroundColor: 'var(--drone-red-tint)',
                                    color: 'var(--drone-red-text)',
                                    borderColor: 'var(--drone-red-border)',
                                  }
                                : completed.winner === 'BLUE'
                                ? {
                                    backgroundColor: 'var(--drone-blue-tint)',
                                    color: 'var(--drone-blue-text)',
                                    borderColor: 'var(--drone-blue-border)',
                                  }
                                : {
                                    backgroundColor: 'var(--court-control-bg)',
                                    color: 'var(--court-ink-secondary)',
                                    borderColor: 'var(--court-line)',
                                  }
                            }
                          >
                            {completed.winner === 'RED'
                              ? 'Red won'
                              : completed.winner === 'BLUE'
                              ? 'Blue won'
                              : 'Draw'}
                          </span>
                        ) : isCurrent ? (
                          <span
                            className="px-2 py-0.5 rounded-full font-semibold border"
                            style={{
                              backgroundColor: 'var(--signal-live-tint)',
                              color: 'var(--signal-live-text)',
                              borderColor: 'var(--signal-live-border)',
                            }}
                          >
                            In progress
                          </span>
                        ) : (
                          <span className="text-[var(--court-muted)]">Scheduled</span>
                        )}
                      </div>

                      {completed ? (
                        <div className="flex items-baseline justify-between pt-1">
                          <div>
                            <span className="spectator-numeral text-3xl font-black text-[var(--drone-red)]">
                              {completed.redScore}
                            </span>
                            {completed.redPenalties > 0 && (
                              <span
                                className="text-xs ml-1.5"
                                style={{ color: 'var(--signal-amber-text)' }}
                              >
                                {completed.redPenalties}P
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-[var(--court-muted)]">to</span>
                          <div className="text-right">
                            {completed.bluePenalties > 0 && (
                              <span
                                className="text-xs mr-1.5"
                                style={{ color: 'var(--signal-amber-text)' }}
                              >
                                {completed.bluePenalties}P
                              </span>
                            )}
                            <span className="spectator-numeral text-3xl font-black text-[var(--drone-blue)]">
                              {completed.blueScore}
                            </span>
                          </div>
                        </div>
                      ) : isCurrent ? (
                        <div className="flex items-baseline justify-between pt-1">
                          <span className="spectator-numeral text-3xl font-black text-[var(--drone-red)]">
                            {arenaState.redScore}
                          </span>
                          <span className="text-xs font-medium text-[var(--court-muted)]">Live score</span>
                          <span className="spectator-numeral text-3xl font-black text-[var(--drone-blue)]">
                            {arenaState.blueScore}
                          </span>
                        </div>
                      ) : (
                        <div className="spectator-numeral text-2xl font-bold text-[var(--court-muted)] pt-1">
                          – : –
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* =============================================================== */}
            {/* BOTTOM TWO-COLUMN LEDGERS: UP NEXT & EARLIER ON THIS CAGE       */}
            {/* =============================================================== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Up Next */}
              <section className="rounded-xl bg-[var(--court-surface)] border border-[var(--court-line)] overflow-hidden">
                <div className="px-5 py-3 bg-[var(--court-subtle)] border-b border-[var(--court-line-soft)]">
                  <h2 className="text-sm font-bold text-[var(--court-ink)]">
                    Up next on {arenaState.arenaName}
                  </h2>
                </div>
                <div className="divide-y divide-[var(--court-line-soft)]">
                  {upcomingMatches.map((m) => (
                    <div key={m.id} className="px-5 py-3 flex items-center justify-between gap-3 text-sm">
                      <span className="font-bold text-[var(--court-ink)] shrink-0">{m.matchNumber}</span>
                      <div className="truncate text-center">
                        <span className="font-semibold" style={{ color: 'var(--drone-red-text)' }}>
                          {m.teamRed}
                        </span>
                        <span className="text-xs text-[var(--court-muted)] mx-1.5">vs</span>
                        <span className="font-semibold" style={{ color: 'var(--drone-blue-text)' }}>
                          {m.teamBlue}
                        </span>
                      </div>
                      {m.scheduledTime ? (
                        <span className="inline-flex items-center gap-1 text-xs text-[var(--court-muted)] tabular-nums shrink-0">
                          <Clock className="w-3 h-3" />
                          {new Date(m.scheduledTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--court-muted)] shrink-0">Queued</span>
                      )}
                    </div>
                  ))}
                  {upcomingMatches.length === 0 && (
                    <p className="px-5 py-6 text-xs text-[var(--court-muted)] text-center">
                      No additional matches queued on this cage.
                    </p>
                  )}
                </div>
              </section>

              {/* Earlier Results on This Cage */}
              <section className="rounded-xl bg-[var(--court-surface)] border border-[var(--court-line)] overflow-hidden">
                <div className="px-5 py-3 bg-[var(--court-subtle)] border-b border-[var(--court-line-soft)]">
                  <h2 className="text-sm font-bold text-[var(--court-ink)]">
                    Earlier on {arenaState.arenaName}
                  </h2>
                </div>
                <div className="divide-y divide-[var(--court-line-soft)]">
                  {recentMatches.slice(0, 6).map((m) => (
                    <div key={m.id} className="px-5 py-3 flex items-center justify-between gap-3 text-sm">
                      <span className="font-bold text-[var(--court-ink)] shrink-0">{m.matchNumber}</span>
                      <div className="truncate text-center">
                        <span className="font-semibold" style={{ color: 'var(--drone-red-text)' }}>
                          {m.teamRed}
                        </span>
                        <span className="spectator-numeral text-lg font-extrabold text-[var(--court-ink)] mx-2">
                          {m.redSetScore}–{m.blueSetScore}
                        </span>
                        <span className="font-semibold" style={{ color: 'var(--drone-blue-text)' }}>
                          {m.teamBlue}
                        </span>
                      </div>
                      {m.winner ? (
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0"
                          style={
                            m.winner === 'RED'
                              ? {
                                  backgroundColor: 'var(--drone-red-tint)',
                                  color: 'var(--drone-red-text)',
                                  borderColor: 'var(--drone-red-border)',
                                }
                              : m.winner === 'BLUE'
                              ? {
                                  backgroundColor: 'var(--drone-blue-tint)',
                                  color: 'var(--drone-blue-text)',
                                  borderColor: 'var(--drone-blue-border)',
                                }
                              : {
                                  backgroundColor: 'var(--court-control-bg)',
                                  color: 'var(--court-ink-secondary)',
                                  borderColor: 'var(--court-line)',
                                }
                          }
                        >
                          {m.winner === 'RED' ? 'Red' : m.winner === 'BLUE' ? 'Blue' : 'Draw'}
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--court-muted)] shrink-0">–</span>
                      )}
                    </div>
                  ))}
                  {recentMatches.length === 0 && (
                    <p className="px-5 py-6 text-xs text-[var(--court-muted)] text-center">
                      No completed matches recorded on this cage yet.
                    </p>
                  )}
                </div>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
