import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useArenaStore } from '../store/arenaStore';
import { useArenaWebSocket } from '../hooks/useArenaWebSocket';
import { useAuthoritativeTimer } from '../hooks/useAuthoritativeTimer';
import { useSpectatorTheme } from '../hooks/useSpectatorTheme';
import { useArenaDisplayConfig } from '../hooks/useArenaDisplayConfig';
import { TeamBadge } from '../components/common/TeamBadge';
import { getSpectatorPhaseMeta } from '../components/public/PublicLiveCard';
import { ArenaDisplayCustomizeDrawer } from '../components/public/ArenaDisplayCustomizeDrawer';
import {
  ArenaSummary,
  MatchRecord,
  PublicArenaDetailResponse,
  PublicScheduledMatch,
  SponsorItem,
} from '../types/scoreboard';
import {
  ArrowLeft,
  SlidersHorizontal,
  Maximize,
  Minimize,
  Sun,
  Moon,
  Clock,
  Trophy,
  AlertTriangle,
  CalendarClock,
  ListOrdered,
  Radio,
} from 'lucide-react';

interface PublicArenaDisplayProps {
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
          className="w-3.5 h-3.5 rounded-sm border"
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

function formatScheduledTime(iso?: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const PublicArenaDisplay: React.FC<PublicArenaDisplayProps> = ({
  publicPortalMode = false,
}) => {
  const { id } = useParams<{ id: string }>();
  const arenaId = parseInt(id || '1', 10);

  useArenaWebSocket(Number.isFinite(arenaId) ? arenaId : undefined, { readOnly: true });
  const { arenaStates, setArenaState, isConnected, transportMode } = useArenaStore();
  const { theme: storedTheme, toggleTheme } = useSpectatorTheme();

  const {
    visibility,
    upcomingLimit,
    themeOverride,
    setElementVisible,
    toggleElement,
    applyPreset,
    setUpcomingLimit,
    setThemeOverride,
    resetDefaults,
    buildPathWithCurrentConfig,
  } = useArenaDisplayConfig('display');

  const activeTheme = themeOverride ?? storedTheme;

  const [allArenas, setAllArenas] = useState<ArenaSummary[]>([]);
  const [nextMatch, setNextMatch] = useState<PublicScheduledMatch | null>(null);
  const [upcomingMatches, setUpcomingMatches] = useState<PublicScheduledMatch[]>([]);
  const [recentMatches, setRecentMatches] = useState<MatchRecord[]>([]);
  const [sponsors, setSponsors] = useState<SponsorItem[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const liveHomePath = publicPortalMode ? '/' : '/live';

  const fetchArenaInfo = useCallback(async () => {
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
        const liveArena = data.currentMatch || data.arena;
        if (liveArena && liveArena.arenaId) {
          setArenaState(arenaId, liveArena);
        }
        const pending = Array.isArray(data.upcomingMatches) ? data.upcomingMatches : [];
        setUpcomingMatches(pending);
        setNextMatch(data.nextMatch !== undefined ? data.nextMatch : pending[0] ?? null);
        setRecentMatches(Array.isArray(data.recentMatches) ? data.recentMatches : []);
        setSponsors(Array.isArray(data.sponsors) ? data.sponsors : []);
      }

      if (arenasRes.ok) {
        const list: ArenaSummary[] = await arenasRes.json();
        if (Array.isArray(list)) {
          setAllArenas([...list].sort((a, b) => a.arenaId - b.arenaId));
        }
      }
    } catch {
      // Keep displaying last known live state during brief connectivity drops
    } finally {
      setLoading(false);
    }
  }, [arenaId, setArenaState]);

  const arenaState = arenaStates[arenaId];
  const currentMatchKey = `${arenaState?.matchNumber ?? ''}|${arenaState?.phase ?? ''}`;

  // Fetch on load and poll every 10s, plus immediately whenever the active match changes
  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    fetchArenaInfo();
    const interval = window.setInterval(fetchArenaInfo, 10000);
    return () => window.clearInterval(interval);
  }, [fetchArenaInfo]);

  useEffect(() => {
    if (arenaState?.matchNumber) {
      fetchArenaInfo();
    }
  }, [currentMatchKey, arenaState?.matchNumber, fetchArenaInfo]);

  // Keyboard shortcuts for TVs/kiosks: C toggles customize drawer, F toggles fullscreen, Esc closes drawer
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }
      if (e.key === 'Escape' && isCustomizeOpen) {
        setIsCustomizeOpen(false);
      } else if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setIsCustomizeOpen((prev) => !prev);
      } else if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      }
    };
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('fullscreenchange', onFsChange);
    };
  }, [isCustomizeOpen]);

  const { formattedTime, formattedWithTenths, progressPercent, currentMs } = useAuthoritativeTimer({
    serverRemainingMs: arenaState?.timeRemainingMs ?? 180000,
    totalDurationMs: arenaState?.totalSetDurationMs ?? 180000,
    timerRunning: arenaState?.timerRunning ?? false,
    phase: arenaState?.phase ?? 'IDLE',
  });

  useEffect(() => {
    if (arenaState) {
      document.title = `${arenaState.arenaName} — Arena Information Display`;
    } else {
      document.title = `Cage ${arenaId} — Arena Information Display`;
    }
  }, [arenaState, arenaId]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // When Next Match card is visible, avoid repeating #1 in the Upcoming Queue below it
  const queueListItems = useMemo(() => {
    const source =
      visibility.next && nextMatch
        ? upcomingMatches.filter((m) => m.id !== nextMatch.id)
        : upcomingMatches;
    return upcomingLimit > 0 ? source.slice(0, upcomingLimit) : source;
  }, [upcomingMatches, nextMatch, visibility.next, upcomingLimit]);

  const totalQueueFollowing = useMemo(() => {
    if (visibility.next && nextMatch) {
      return Math.max(0, upcomingMatches.length - 1);
    }
    return upcomingMatches.length;
  }, [upcomingMatches.length, visibility.next, nextMatch]);

  const setsArray = useMemo(() => {
    const maxSets = arenaState?.maxSets || 3;
    return Array.from({ length: maxSets }, (_, idx) => idx + 1);
  }, [arenaState?.maxSets]);

  const shareUrl = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const path = buildPathWithCurrentConfig(`/live/arena/${arenaId}/display`, 'display');
    return `${origin}${path}`;
  }, [arenaId, buildPathWithCurrentConfig]);

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
        data-spectator-theme={activeTheme}
      >
        <div className="max-w-md rounded-2xl bg-[var(--court-surface)] border border-[var(--court-line)] p-8">
          <h1 className="spectator-numeral text-3xl font-extrabold text-[var(--court-ink)]">
            Cage {arenaId} is not active
          </h1>
          <p className="text-sm text-[var(--court-muted)] mt-2">
            No active flight cage was found for Arena {arenaId}. Choose an active cage from the live board.
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
            <span>Back to live board</span>
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

  const anyContentVisible =
    visibility.current ||
    visibility.sets ||
    visibility.next ||
    visibility.upcoming ||
    visibility.recent ||
    (visibility.sponsors && sponsors.length > 0);

  // Adaptive sizing: when current match is hidden, elevate Next Match into a large hero centerpiece
  const nextIsHero = visibility.next && !visibility.current;
  const showSideBySideLower = visibility.next && visibility.upcoming && visibility.current;

  return (
    <div
      className="spectator-shell min-h-screen flex flex-col"
      data-spectator-theme={activeTheme}
    >
      {/* ================================================================= */}
      {/* ARENA HEADER BAR (hideable via ?hide=header)                      */}
      {/* ================================================================= */}
      {visibility.header && (
        <header className="sticky top-0 z-40 bg-[var(--court-surface)] border-b border-[var(--court-line)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {visibility.controls && (
                <Link
                  to={liveHomePath}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-xs font-semibold text-[var(--court-ink)] transition-colors shrink-0"
                  title="Back to all cages"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">All cages</span>
                </Link>
              )}

              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="px-2.5 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider shrink-0"
                  style={{
                    backgroundColor: 'var(--court-active-pill-bg)',
                    color: 'var(--court-active-pill-fg)',
                  }}
                >
                  Cage {arenaId}
                </span>
                <div className="min-w-0">
                  <h1 className="spectator-numeral text-xl sm:text-2xl font-extrabold text-[var(--court-ink)] leading-none truncate">
                    {arenaState?.arenaName || `Arena ${arenaId}`}
                  </h1>
                  {arenaState?.tournamentName && (
                    <p className="text-xs text-[var(--court-muted)] truncate mt-0.5">
                      {arenaState.tournamentName}
                    </p>
                  )}
                </div>
              </div>

              {visibility.controls && allArenas.length > 1 && (
                <nav
                  className="hidden lg:flex items-center gap-1 pl-3 ml-1 border-l border-[var(--court-line-soft)]"
                  aria-label="Switch arena display"
                >
                  {allArenas.map((a) => {
                    const active = a.arenaId === arenaId;
                    return (
                      <Link
                        key={a.arenaId}
                        to={buildPathWithCurrentConfig(`/live/arena/${a.arenaId}/display`, 'display')}
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
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: connectionBadge.dotColor }}
                />
                <span>{connectionBadge.text}</span>
              </div>

              {visibility.controls && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsCustomizeOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--court-line)] bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-xs font-semibold text-[var(--court-ink)] transition-colors"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--court-accent-link)]" />
                    <span>Customize</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (themeOverride) {
                        setThemeOverride(themeOverride === 'dark' ? 'light' : 'dark');
                      } else {
                        toggleTheme();
                      }
                    }}
                    aria-label={activeTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                    className="p-1.5 rounded-lg border border-[var(--court-line)] bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-[var(--court-ink-secondary)] transition-colors"
                  >
                    {activeTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    title="Toggle fullscreen (F)"
                    aria-label="Toggle fullscreen"
                    className="p-1.5 rounded-lg border border-[var(--court-line)] bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-[var(--court-ink-secondary)] transition-colors"
                  >
                    {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  </button>
                </>
              )}
            </div>
          </div>
        </header>
      )}

      {/* ================================================================= */}
      {/* MAIN SIGNAGE CONTENT                                              */}
      {/* ================================================================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 flex-1 w-full flex flex-col gap-6">
        {!arenaState && loading ? (
          <div className="rounded-2xl bg-[var(--court-surface)] border border-[var(--court-line)] p-12 text-center my-auto">
            <p className="spectator-numeral text-2xl font-bold text-[var(--court-ink)]">
              Connecting to Cage {arenaId}...
            </p>
            <p className="text-sm text-[var(--court-muted)] mt-1">
              Live match status and upcoming queue will appear automatically.
            </p>
          </div>
        ) : !anyContentVisible ? (
          <div className="rounded-2xl bg-[var(--court-surface)] border border-[var(--court-line)] p-10 text-center my-auto max-w-md mx-auto">
            <h2 className="spectator-numeral text-2xl font-bold text-[var(--court-ink)]">
              All display sections are hidden
            </h2>
            <p className="text-sm text-[var(--court-muted)] mt-1.5">
              Enable at least one section (Current Match, Next Match, or Upcoming Matches) to show arena details.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setIsCustomizeOpen(true)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white"
                style={{ backgroundColor: 'var(--drone-blue-solid)' }}
              >
                Open customize panel
              </button>
              <button
                type="button"
                onClick={resetDefaults}
                className="px-4 py-2 rounded-lg text-xs font-semibold border border-[var(--court-line)] bg-[var(--court-control-bg)] text-[var(--court-ink)]"
              >
                Reset defaults
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* =============================================================== */}
            {/* SECTION 1: CURRENT MATCH RUNNING (hideable via ?hide=current)   */}
            {/* =============================================================== */}
            {visibility.current && arenaState && (
              <section
                aria-label="Current match running"
                className="rounded-2xl bg-[var(--court-surface)] border border-[var(--court-line)] overflow-hidden shadow-sm"
              >
                {/* Section Identity Strip */}
                <div className="px-5 sm:px-6 py-3.5 border-b border-[var(--court-line-soft)] bg-[var(--court-subtle)] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: 'var(--signal-live-tint)',
                        color: 'var(--signal-live-text)',
                      }}
                    >
                      <Radio className="w-3.5 h-3.5" />
                      <span>Current match</span>
                    </span>
                    <span className="text-sm sm:text-base font-bold text-[var(--court-ink)]">
                      Match {arenaState.matchNumber}
                    </span>
                    <span className="text-xs sm:text-sm text-[var(--court-muted)]">
                      Set {arenaState.currentSet} of {arenaState.maxSets}
                    </span>
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
                    className="px-5 py-2.5 border-b text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 text-center"
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

                {/* Winner Banner */}
                {arenaState.setWinnerBanner?.active && (
                  <div
                    className="px-5 py-3 border-b flex flex-wrap items-center justify-center gap-2 text-sm font-semibold text-center"
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
                    <span className="text-xs opacity-85 tabular-nums">
                      (Sets {arenaState.setWinnerBanner.redSetScore} – {arenaState.setWinnerBanner.blueSetScore})
                    </span>
                  </div>
                )}

                {/* Main Split Stage */}
                <div
                  className={`grid grid-cols-1 divide-y md:divide-y-0 md:divide-x divide-[var(--court-line-soft)] ${
                    visibility.clock ? 'md:grid-cols-[1fr_240px_1fr]' : 'md:grid-cols-2'
                  }`}
                >
                  {/* Red Team Bay */}
                  <div className="spectator-red-bay p-6 sm:p-8 border-l-4 border-l-[var(--drone-red)] flex flex-col justify-between gap-5">
                    <div className="flex items-center gap-4 min-w-0">
                      <TeamBadge
                        teamName={arenaState.teamRed}
                        logoUrl={arenaState.teamRedLogoUrl}
                        side="red"
                        size="lg"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--drone-red-text)]">
                          Red team
                        </span>
                        <h2 className="spectator-numeral text-3xl sm:text-4xl lg:text-5xl font-black text-[var(--court-ink)] leading-tight truncate">
                          {arenaState.teamRed}
                        </h2>
                      </div>
                    </div>

                    {visibility.scores && (
                      <div className="flex items-end justify-between gap-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-[var(--court-muted)]">
                            <SetPips won={arenaState.redSetScore} needed={setsNeeded} color="red" />
                            <span className="font-bold text-[var(--court-ink)] tabular-nums">
                              {arenaState.redSetScore} {arenaState.redSetScore === 1 ? 'set' : 'sets'}
                            </span>
                          </div>
                          {arenaState.redPenalties > 0 && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold w-fit border"
                              style={{
                                backgroundColor: 'var(--signal-amber-tint)',
                                color: 'var(--signal-amber-text)',
                                borderColor: 'var(--signal-amber-border)',
                              }}
                            >
                              <AlertTriangle className="w-3 h-3" />
                              {arenaState.redPenalties}{' '}
                              {arenaState.redPenalties === 1 ? 'penalty' : 'penalties'}
                            </span>
                          )}
                        </div>

                        <div className="spectator-numeral text-7xl sm:text-8xl lg:text-9xl font-black text-[var(--drone-red)] leading-none">
                          {arenaState.redScore}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Center Authoritative Clock (hideable via ?hide=clock) */}
                  {visibility.clock && (
                    <div className="p-6 flex flex-col items-center justify-center gap-3 bg-[var(--court-subtle)]">
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--court-muted)]">
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
                  )}

                  {/* Blue Team Bay */}
                  <div className="spectator-blue-bay p-6 sm:p-8 border-l-4 md:border-l-0 md:border-r-4 border-l-[var(--drone-blue)] md:border-r-[var(--drone-blue)] flex flex-col justify-between gap-5">
                    <div className="flex items-center md:flex-row-reverse gap-4 min-w-0">
                      <TeamBadge
                        teamName={arenaState.teamBlue}
                        logoUrl={arenaState.teamBlueLogoUrl}
                        side="blue"
                        size="lg"
                      />
                      <div className="min-w-0 md:text-right">
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--drone-blue-text)]">
                          Blue team
                        </span>
                        <h2 className="spectator-numeral text-3xl sm:text-4xl lg:text-5xl font-black text-[var(--court-ink)] leading-tight truncate">
                          {arenaState.teamBlue}
                        </h2>
                      </div>
                    </div>

                    {visibility.scores && (
                      <div className="flex items-end justify-between md:flex-row-reverse gap-4">
                        <div className="flex flex-col md:items-end gap-2">
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-[var(--court-muted)]">
                            <span className="font-bold text-[var(--court-ink)] tabular-nums">
                              {arenaState.blueSetScore} {arenaState.blueSetScore === 1 ? 'set' : 'sets'}
                            </span>
                            <SetPips won={arenaState.blueSetScore} needed={setsNeeded} color="blue" />
                          </div>
                          {arenaState.bluePenalties > 0 && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold w-fit border"
                              style={{
                                backgroundColor: 'var(--signal-amber-tint)',
                                color: 'var(--signal-amber-text)',
                                borderColor: 'var(--signal-amber-border)',
                              }}
                            >
                              <AlertTriangle className="w-3 h-3" />
                              {arenaState.bluePenalties}{' '}
                              {arenaState.bluePenalties === 1 ? 'penalty' : 'penalties'}
                            </span>
                          )}
                        </div>

                        <div className="spectator-numeral text-7xl sm:text-8xl lg:text-9xl font-black text-[var(--drone-blue)] leading-none">
                          {arenaState.blueScore}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* =============================================================== */}
            {/* SECTION 2: SET BREAKDOWN (optional via ?show=sets)              */}
            {/* =============================================================== */}
            {visibility.sets && arenaState && (
              <section
                aria-label="Set breakdown"
                className="rounded-2xl bg-[var(--court-surface)] border border-[var(--court-line)] overflow-hidden"
              >
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
                          <span className="text-[var(--court-muted)] font-semibold">
                            {completed
                              ? completed.winner === 'RED'
                                ? 'Red won'
                                : completed.winner === 'BLUE'
                                ? 'Blue won'
                                : 'Draw'
                              : isCurrent
                              ? 'In progress'
                              : 'Scheduled'}
                          </span>
                        </div>
                        {completed ? (
                          <div className="flex items-baseline justify-between">
                            <span className="spectator-numeral text-3xl font-black text-[var(--drone-red)]">
                              {completed.redScore}
                            </span>
                            <span className="text-xs text-[var(--court-muted)]">to</span>
                            <span className="spectator-numeral text-3xl font-black text-[var(--drone-blue)]">
                              {completed.blueScore}
                            </span>
                          </div>
                        ) : isCurrent ? (
                          <div className="flex items-baseline justify-between">
                            <span className="spectator-numeral text-3xl font-black text-[var(--drone-red)]">
                              {arenaState.redScore}
                            </span>
                            <span className="text-xs font-medium text-[var(--court-muted)]">Live</span>
                            <span className="spectator-numeral text-3xl font-black text-[var(--drone-blue)]">
                              {arenaState.blueScore}
                            </span>
                          </div>
                        ) : (
                          <div className="spectator-numeral text-2xl font-bold text-[var(--court-muted)]">
                            – : –
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* =============================================================== */}
            {/* SECTIONS 3 & 4: NEXT MATCH (ON DECK) + UPCOMING QUEUE           */}
            {/* =============================================================== */}
            {(visibility.next || visibility.upcoming) && (
              <div
                className={
                  showSideBySideLower
                    ? 'grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'
                    : 'flex flex-col gap-6'
                }
              >
                {/* NEXT MATCH ON DECK */}
                {visibility.next && (
                  <section
                    aria-label="Next match on deck"
                    className={`${
                      showSideBySideLower ? 'lg:col-span-5' : 'w-full'
                    } rounded-2xl bg-[var(--court-surface)] border-2 overflow-hidden shadow-sm`}
                    style={{ borderColor: 'var(--signal-amber-border)' }}
                  >
                    <div
                      className="px-5 sm:px-6 py-3.5 border-b flex items-center justify-between gap-3"
                      style={{
                        backgroundColor: 'var(--signal-amber-tint)',
                        borderColor: 'var(--signal-amber-border)',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <CalendarClock
                          className="w-4 h-4 shrink-0"
                          style={{ color: 'var(--signal-amber)' }}
                        />
                        <h2
                          className="text-sm font-extrabold uppercase tracking-wider"
                          style={{ color: 'var(--signal-amber-text)' }}
                        >
                          Next match — on deck
                        </h2>
                      </div>
                      {nextMatch && (
                        <span
                          className="px-2.5 py-0.5 rounded-md text-xs font-extrabold border"
                          style={{
                            backgroundColor: 'var(--court-surface)',
                            borderColor: 'var(--signal-amber-border)',
                            color: 'var(--court-ink)',
                          }}
                        >
                          {nextMatch.matchNumber}
                        </span>
                      )}
                    </div>

                    {nextMatch ? (
                      <div className={nextIsHero ? 'p-6 sm:p-10' : 'p-5 sm:p-6'}>
                        {nextMatch.scheduledTime && (
                          <div className="flex items-center justify-between gap-2 mb-5 text-xs sm:text-sm text-[var(--court-muted)]">
                            <span className="font-medium truncate">
                              {nextMatch.tournamentName || arenaState?.tournamentName || `Cage ${arenaId}`}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--court-subtle)] border border-[var(--court-line)] font-semibold text-[var(--court-ink)] tabular-nums shrink-0">
                              <Clock className="w-3.5 h-3.5 text-[var(--signal-amber)]" />
                              {formatScheduledTime(nextMatch.scheduledTime)}
                            </span>
                          </div>
                        )}

                        <div
                          className={`grid grid-cols-1 ${
                            nextIsHero ? 'md:grid-cols-[1fr_auto_1fr]' : 'sm:grid-cols-[1fr_auto_1fr]'
                          } items-center gap-4`}
                        >
                          {/* Red Next Team */}
                          <div
                            className={`rounded-xl border border-[var(--drone-red-border)] p-4 flex items-center gap-3.5 min-w-0`}
                            style={{ backgroundColor: 'var(--drone-red-tint)' }}
                          >
                            <TeamBadge
                              teamName={nextMatch.teamRed}
                              logoUrl={nextMatch.teamRedLogoUrl}
                              side="red"
                              size={nextIsHero ? 'lg' : 'md'}
                            />
                            <div className="min-w-0">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--drone-red-text)] block">
                                Red team
                              </span>
                              <div
                                className={`spectator-numeral font-black text-[var(--court-ink)] leading-tight truncate ${
                                  nextIsHero ? 'text-3xl sm:text-5xl' : 'text-2xl sm:text-3xl'
                                }`}
                              >
                                {nextMatch.teamRed}
                              </div>
                            </div>
                          </div>

                          <div className="text-center px-1">
                            <span className="spectator-numeral text-xl sm:text-2xl font-black text-[var(--court-muted)]">
                              VS
                            </span>
                          </div>

                          {/* Blue Next Team */}
                          <div
                            className={`rounded-xl border border-[var(--drone-blue-border)] p-4 flex items-center ${
                              nextIsHero ? 'md:flex-row-reverse md:text-right' : 'sm:flex-row-reverse sm:text-right'
                            } gap-3.5 min-w-0`}
                            style={{ backgroundColor: 'var(--drone-blue-tint)' }}
                          >
                            <TeamBadge
                              teamName={nextMatch.teamBlue}
                              logoUrl={nextMatch.teamBlueLogoUrl}
                              side="blue"
                              size={nextIsHero ? 'lg' : 'md'}
                            />
                            <div className="min-w-0">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--drone-blue-text)] block">
                                Blue team
                              </span>
                              <div
                                className={`spectator-numeral font-black text-[var(--court-ink)] leading-tight truncate ${
                                  nextIsHero ? 'text-3xl sm:text-5xl' : 'text-2xl sm:text-3xl'
                                }`}
                              >
                                {nextMatch.teamBlue}
                              </div>
                            </div>
                          </div>
                        </div>

                        <p className="mt-4 text-xs text-[var(--court-muted)] text-center">
                          Pilots for <strong className="text-[var(--court-ink)]">{nextMatch.matchNumber}</strong>: please report to the staging area for {arenaState?.arenaName || `Cage ${arenaId}`}.
                        </p>
                      </div>
                    ) : (
                      <div className="px-6 py-10 text-center">
                        <p className="text-sm font-semibold text-[var(--court-ink)]">
                          No next match queued
                        </p>
                        <p className="text-xs text-[var(--court-muted)] mt-1">
                          Scheduled matches assigned to {arenaState?.arenaName || `Cage ${arenaId}`} will appear here automatically.
                        </p>
                      </div>
                    )}
                  </section>
                )}

                {/* UPCOMING MATCHES QUEUE */}
                {visibility.upcoming && (
                  <section
                    aria-label="Upcoming matches"
                    className={`${
                      showSideBySideLower ? 'lg:col-span-7' : 'w-full'
                    } rounded-2xl bg-[var(--court-surface)] border border-[var(--court-line)] overflow-hidden`}
                  >
                    <div className="px-5 sm:px-6 py-3.5 bg-[var(--court-subtle)] border-b border-[var(--court-line-soft)] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <ListOrdered className="w-4 h-4 text-[var(--court-accent-link)]" />
                        <h2 className="text-sm font-extrabold uppercase tracking-wider text-[var(--court-ink)]">
                          {visibility.next ? 'Upcoming matches' : 'Match queue'}
                        </h2>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-[var(--court-control-bg)] border border-[var(--court-line-soft)] text-xs font-semibold text-[var(--court-muted)] tabular-nums">
                        {totalQueueFollowing} {totalQueueFollowing === 1 ? 'match' : 'matches'}
                      </span>
                    </div>

                    <div className="divide-y divide-[var(--court-line-soft)]">
                      {queueListItems.map((m, idx) => {
                        const pos = m.queuePosition ?? (visibility.next && nextMatch ? idx + 2 : idx + 1);
                        const isFirstInQueue = pos === 1;
                        const timeLabel = formatScheduledTime(m.scheduledTime);

                        return (
                          <div
                            key={m.id}
                            className="px-5 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4"
                            style={
                              isFirstInQueue
                                ? { backgroundColor: 'var(--signal-amber-tint)' }
                                : undefined
                            }
                          >
                            <div className="flex items-center gap-2.5 shrink-0 sm:w-36">
                              <span className="w-7 h-7 rounded-lg bg-[var(--court-control-bg)] border border-[var(--court-line-soft)] text-xs font-extrabold text-[var(--court-muted)] flex items-center justify-center tabular-nums shrink-0">
                                #{pos}
                              </span>
                              <div className="min-w-0">
                                <div className="text-sm font-extrabold text-[var(--court-ink)] leading-tight">
                                  {m.matchNumber}
                                </div>
                                {isFirstInQueue && (
                                  <span
                                    className="text-[10px] font-bold uppercase tracking-wider"
                                    style={{ color: 'var(--signal-amber-text)' }}
                                  >
                                    Up next
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex-1 grid grid-cols-[1fr_auto_1fr] items-center gap-3 min-w-0">
                              <div className="flex items-center justify-end gap-2 min-w-0">
                                <span
                                  className="text-sm sm:text-base font-bold truncate text-right"
                                  style={{ color: 'var(--drone-red-text)' }}
                                >
                                  {m.teamRed}
                                </span>
                                <TeamBadge
                                  teamName={m.teamRed}
                                  logoUrl={m.teamRedLogoUrl}
                                  side="red"
                                  size="sm"
                                />
                              </div>

                              <span className="text-xs font-semibold text-[var(--court-muted)]">vs</span>

                              <div className="flex items-center justify-start gap-2 min-w-0">
                                <TeamBadge
                                  teamName={m.teamBlue}
                                  logoUrl={m.teamBlueLogoUrl}
                                  side="blue"
                                  size="sm"
                                />
                                <span
                                  className="text-sm sm:text-base font-bold truncate text-left"
                                  style={{ color: 'var(--drone-blue-text)' }}
                                >
                                  {m.teamBlue}
                                </span>
                              </div>
                            </div>

                            <div className="shrink-0 flex justify-end sm:w-24">
                              {timeLabel ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--court-subtle)] border border-[var(--court-line-soft)] text-xs font-semibold text-[var(--court-ink-secondary)] tabular-nums">
                                  <Clock className="w-3 h-3 text-[var(--court-muted)]" />
                                  {timeLabel}
                                </span>
                              ) : (
                                <span className="text-xs text-[var(--court-muted)]">Queued</span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {queueListItems.length === 0 && (
                        <div className="px-6 py-10 text-center">
                          <p className="text-sm font-semibold text-[var(--court-ink)]">
                            {visibility.next && nextMatch
                              ? 'No additional matches queued after the next match'
                              : 'No upcoming matches queued'}
                          </p>
                          <p className="text-xs text-[var(--court-muted)] mt-1">
                            Queue updates automatically when tournament staff schedules new matches.
                          </p>
                        </div>
                      )}
                    </div>

                    {upcomingLimit > 0 && totalQueueFollowing > queueListItems.length && (
                      <div className="px-5 py-2.5 bg-[var(--court-subtle)] border-t border-[var(--court-line-soft)] text-xs text-[var(--court-muted)] flex items-center justify-between">
                        <span>
                          Showing {queueListItems.length} of {totalQueueFollowing} upcoming matches
                        </span>
                        {visibility.controls && (
                          <button
                            type="button"
                            onClick={() => setUpcomingLimit(0)}
                            className="font-semibold text-[var(--court-accent-link)] hover:underline"
                          >
                            Show all
                          </button>
                        )}
                      </div>
                    )}
                  </section>
                )}
              </div>
            )}

            {/* =============================================================== */}
            {/* SECTION 5: RECENT RESULTS (optional via ?show=recent)           */}
            {/* =============================================================== */}
            {visibility.recent && (
              <section
                aria-label="Recent results on this arena"
                className="rounded-2xl bg-[var(--court-surface)] border border-[var(--court-line)] overflow-hidden"
              >
                <div className="px-5 sm:px-6 py-3 bg-[var(--court-subtle)] border-b border-[var(--court-line-soft)] flex items-center justify-between">
                  <h2 className="text-sm font-extrabold uppercase tracking-wider text-[var(--court-ink)]">
                    Earlier on {arenaState?.arenaName || `Cage ${arenaId}`}
                  </h2>
                  <span className="text-xs text-[var(--court-muted)] tabular-nums">
                    {recentMatches.length} completed
                  </span>
                </div>
                <div className="divide-y divide-[var(--court-line-soft)]">
                  {recentMatches.slice(0, 6).map((m) => (
                    <div
                      key={m.id}
                      className="px-5 sm:px-6 py-3 flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="font-bold text-[var(--court-ink)] shrink-0">{m.matchNumber}</span>
                      <div className="truncate text-center">
                        <span className="font-semibold" style={{ color: 'var(--drone-red-text)' }}>
                          {m.teamRed}
                        </span>
                        <span className="spectator-numeral text-lg font-extrabold text-[var(--court-ink)] mx-2.5">
                          {m.redSetScore} – {m.blueSetScore}
                        </span>
                        <span className="font-semibold" style={{ color: 'var(--drone-blue-text)' }}>
                          {m.teamBlue}
                        </span>
                      </div>
                      {m.winner ? (
                        <span
                          className="text-xs font-semibold px-2.5 py-0.5 rounded-full border shrink-0"
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
            )}

            {/* =============================================================== */}
            {/* SECTION 6: SPONSORS STRIP (optional via ?show=sponsors)         */}
            {/* =============================================================== */}
            {visibility.sponsors && sponsors.length > 0 && (
              <section
                aria-label="Event partners"
                className="mt-auto pt-4 border-t border-[var(--court-line)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <span className="text-xs font-medium text-[var(--court-muted)]">Event partners</span>
                  <div className="flex flex-wrap items-center gap-3">
                    {sponsors.map((s) => (
                      <div
                        key={s.id}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--court-surface)] border border-[var(--court-line-soft)]"
                      >
                        {s.logoUrl && (
                          <img
                            src={s.logoUrl}
                            alt={s.name}
                            className="h-5 max-w-[84px] object-contain"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        <span className="text-xs font-semibold text-[var(--court-ink-secondary)]">
                          {s.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* Subtle corner hover button when controls or header are hidden for unattended TV kiosk displays */}
      {(!visibility.controls || !visibility.header) && (
        <button
          type="button"
          onClick={() => setIsCustomizeOpen(true)}
          title="Customize display (C)"
          aria-label="Customize display"
          className="fixed bottom-4 right-4 z-40 p-2.5 rounded-full bg-[var(--court-surface)] border border-[var(--court-line)] text-[var(--court-muted)] hover:text-[var(--court-ink)] opacity-15 hover:opacity-100 focus:opacity-100 transition-opacity shadow-lg"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      )}

      {/* Customize Drawer */}
      <ArenaDisplayCustomizeDrawer
        isOpen={isCustomizeOpen}
        onClose={() => setIsCustomizeOpen(false)}
        arenaName={arenaState?.arenaName || `Arena ${arenaId}`}
        visibility={visibility}
        upcomingLimit={upcomingLimit}
        themeOverride={themeOverride}
        onToggleElement={toggleElement}
        onApplyPreset={applyPreset}
        onSetUpcomingLimit={setUpcomingLimit}
        onSetThemeOverride={setThemeOverride}
        onResetDefaults={() => {
          resetDefaults();
          setElementVisible('controls', true);
        }}
        shareUrl={shareUrl}
      />
    </div>
  );
};
