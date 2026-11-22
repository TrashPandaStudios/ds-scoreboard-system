import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useArenaStore } from '../store/arenaStore';
import { useArenaWebSocket } from '../hooks/useArenaWebSocket';
import { useSpectatorTheme } from '../hooks/useSpectatorTheme';
import { PublicLiveCard } from '../components/public/PublicLiveCard';
import {
  ArenaSummary,
  MatchRecord,
  PublicOverviewResponse,
  ScheduledMatch,
  SponsorItem,
} from '../types/scoreboard';
import { Search, ChevronDown, ChevronUp, Trophy, Clock, ChevronRight, Sun, Moon } from 'lucide-react';

type PublicTab = 'LIVE' | 'RESULTS' | 'SCHEDULE';

function pickSpotlightArena(arenas: ArenaSummary[]): ArenaSummary | null {
  if (arenas.length === 0) return null;
  const priorityScore = (a: ArenaSummary): number => {
    if (a.phase === 'SUDDEN_DEATH') return 100;
    if (a.phase === 'PENALTY_PHASE') return 90;
    if (a.timerRunning && a.phase === 'NORMAL_PHASE') return 80;
    if (a.timerRunning) return 70;
    if (a.phase === 'COUNTDOWN') return 60;
    if (a.phase === 'NORMAL_PHASE' || a.phase === 'TIMEOUT' || a.phase === 'INTERMISSION') return 40;
    if (a.phase === 'MATCH_ENDED') return 30;
    return 10;
  };
  return [...arenas].sort((a, b) => {
    const diff = priorityScore(b) - priorityScore(a);
    return diff !== 0 ? diff : a.arenaId - b.arenaId;
  })[0];
}

export const PublicLiveHub: React.FC = () => {
  useArenaWebSocket(undefined, { readOnly: true });
  const { arenaSummaries, setArenaSummaries, isConnected, transportMode } = useArenaStore();
  const { theme, toggleTheme } = useSpectatorTheme();

  const [activeTab, setActiveTab] = useState<PublicTab>('LIVE');
  const [recentMatches, setRecentMatches] = useState<MatchRecord[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<ScheduledMatch[]>([]);
  const [sponsors, setSponsors] = useState<SponsorItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [resultsSearch, setResultsSearch] = useState('');
  const [resultsArenaFilter, setResultsArenaFilter] = useState<string>('ALL');
  const [expandedMatchId, setExpandedMatchId] = useState<number | null>(null);

  const [scheduleSearch, setScheduleSearch] = useState('');
  const [scheduleArenaFilter, setScheduleArenaFilter] = useState<string>('ALL');

  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch('/api/public/overview', { cache: 'no-store' });
      if (!res.ok) return;
      const data: PublicOverviewResponse = await res.json();
      if (Array.isArray(data.arenas) && data.arenas.length > 0) {
        setArenaSummaries(data.arenas);
      }
      if (Array.isArray(data.recentMatches)) {
        setRecentMatches(data.recentMatches);
      }
      if (Array.isArray(data.upcomingMatches)) {
        setUpcomingMatches(data.upcomingMatches);
      }
      if (Array.isArray(data.sponsors)) {
        setSponsors(data.sponsors);
      }
    } catch {
      // Keep current live state during brief connectivity drops
    } finally {
      setIsLoading(false);
    }
  }, [setArenaSummaries]);

  useEffect(() => {
    document.title = 'Drone Soccer Live — Matches & Results';
    fetchOverview();
    const interval = window.setInterval(fetchOverview, 12000);
    return () => window.clearInterval(interval);
  }, [fetchOverview]);

  const sortedArenas = useMemo(
    () => [...arenaSummaries].sort((a, b) => a.arenaId - b.arenaId),
    [arenaSummaries]
  );

  const spotlightArena = useMemo(() => pickSpotlightArena(sortedArenas), [sortedArenas]);
  const otherArenas = useMemo(
    () => (spotlightArena ? sortedArenas.filter((a) => a.arenaId !== spotlightArena.arenaId) : []),
    [sortedArenas, spotlightArena]
  );

  const tournamentTitle = useMemo(() => {
    const fromArena = sortedArenas.find((a) => a.tournamentName?.trim())?.tournamentName;
    if (fromArena) return fromArena;
    const fromQueue = upcomingMatches.find((m) => m.tournamentName?.trim())?.tournamentName;
    if (fromQueue) return fromQueue;
    const fromHistory = recentMatches.find((m) => m.tournamentName?.trim())?.tournamentName;
    return fromHistory || 'Live Tournament Timing';
  }, [sortedArenas, upcomingMatches, recentMatches]);

  const availableArenaIds = useMemo(() => {
    const ids = new Set<number>();
    sortedArenas.forEach((a) => ids.add(a.arenaId));
    recentMatches.forEach((m) => ids.add(m.arenaId));
    upcomingMatches.forEach((m) => ids.add(m.arenaId));
    return Array.from(ids).sort((a, b) => a - b);
  }, [sortedArenas, recentMatches, upcomingMatches]);

  const arenaNameMap = useMemo(() => {
    const map = new Map<number, string>();
    sortedArenas.forEach((a) => map.set(a.arenaId, a.arenaName));
    return map;
  }, [sortedArenas]);

  const filteredResults = useMemo(() => {
    const q = resultsSearch.trim().toLowerCase();
    return recentMatches.filter((m) => {
      const matchesArena = resultsArenaFilter === 'ALL' || String(m.arenaId) === resultsArenaFilter;
      if (!matchesArena) return false;
      if (!q) return true;
      return (
        m.matchNumber.toLowerCase().includes(q) ||
        m.teamRed.toLowerCase().includes(q) ||
        m.teamBlue.toLowerCase().includes(q) ||
        (m.tournamentName && m.tournamentName.toLowerCase().includes(q))
      );
    });
  }, [recentMatches, resultsSearch, resultsArenaFilter]);

  const filteredSchedule = useMemo(() => {
    const q = scheduleSearch.trim().toLowerCase();
    return upcomingMatches.filter((m) => {
      const matchesArena = scheduleArenaFilter === 'ALL' || String(m.arenaId) === scheduleArenaFilter;
      if (!matchesArena) return false;
      if (!q) return true;
      return (
        m.matchNumber.toLowerCase().includes(q) ||
        m.teamRed.toLowerCase().includes(q) ||
        m.teamBlue.toLowerCase().includes(q) ||
        (m.tournamentName && m.tournamentName.toLowerCase().includes(q))
      );
    });
  }, [upcomingMatches, scheduleSearch, scheduleArenaFilter]);

  const connectionBadge =
    isConnected || transportMode === 'WS'
      ? {
          text: 'Live updates',
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

  return (
    <div className="spectator-shell min-h-screen flex flex-col" data-spectator-theme={theme}>
      {/* Compact Athletic Masthead */}
      <header className="sticky top-0 z-40 bg-[var(--court-surface)] border-b border-[var(--court-line)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="py-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Two-tone drone ring emblem */}
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-[var(--court-line)]"
                style={{ backgroundColor: 'var(--court-emblem-bg)' }}
                aria-hidden="true"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                  <circle cx="9.5" cy="12" r="5" stroke="#F85149" strokeWidth="2.4" />
                  <circle cx="14.5" cy="12" r="5" stroke="#388BFD" strokeWidth="2.4" />
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="spectator-numeral text-2xl font-extrabold text-[var(--court-ink)] leading-none tracking-tight truncate">
                  Drone Soccer Live
                </h1>
                <p className="text-xs text-[var(--court-muted)] mt-0.5 truncate">{tournamentTitle}</p>
              </div>
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

          {/* Primary Underline Navigation Tabs */}
          <nav className="flex items-center gap-6 -mb-px overflow-x-auto" aria-label="Tournament views">
            {(
              [
                { id: 'LIVE', label: 'Live matches', count: sortedArenas.length },
                { id: 'RESULTS', label: 'Results', count: recentMatches.length },
                { id: 'SCHEDULE', label: 'Schedule', count: upcomingMatches.length },
              ] as const
            ).map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2.5 border-b-2 text-sm font-semibold whitespace-nowrap inline-flex items-center gap-2 transition-colors ${
                    active
                      ? 'border-[var(--court-ink)] text-[var(--court-ink)]'
                      : 'border-transparent text-[var(--court-muted)] hover:text-[var(--court-ink-secondary)]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className="px-1.5 py-0.5 rounded-md text-xs tabular-nums"
                    style={
                      active
                        ? {
                            backgroundColor: 'var(--court-active-pill-bg)',
                            color: 'var(--court-active-pill-fg)',
                          }
                        : {
                            backgroundColor: 'var(--court-control-bg)',
                            color: 'var(--court-muted)',
                          }
                    }
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full flex flex-col gap-8">
        {/* =============================================================== */}
        {/* TAB 1: LIVE MATCHES                                             */}
        {/* =============================================================== */}
        {activeTab === 'LIVE' && (
          <>
            {spotlightArena ? (
              <section aria-label="Featured live match" className="flex flex-col gap-4">
                <PublicLiveCard arena={spotlightArena} variant="spotlight" />

                {otherArenas.length > 0 && (
                  <div className="rounded-xl bg-[var(--court-surface)] border border-[var(--court-line)] overflow-hidden">
                    <div className="px-4 sm:px-5 py-2.5 bg-[var(--court-subtle)] border-b border-[var(--court-line-soft)] flex items-center justify-between gap-2">
                      <h2 className="text-xs font-semibold text-[var(--court-ink-secondary)]">Other active cages</h2>
                      <span className="text-xs text-[var(--court-muted)]">Select any cage for full set breakdown</span>
                    </div>
                    <div className="divide-y divide-[var(--court-line-soft)]">
                      {otherArenas.map((arena) => (
                        <PublicLiveCard key={arena.arenaId} arena={arena} variant="row" />
                      ))}
                    </div>
                  </div>
                )}
              </section>
            ) : (
              <section className="rounded-2xl bg-[var(--court-surface)] border border-[var(--court-line)] p-8 sm:p-12 text-center">
                <h2 className="spectator-numeral text-2xl font-bold text-[var(--court-ink)]">
                  {isLoading ? 'Loading live flight cages' : 'No matches on the floor yet'}
                </h2>
                <p className="text-sm text-[var(--court-muted)] mt-1.5 max-w-md mx-auto">
                  {isLoading
                    ? 'Connecting to the arena timing system.'
                    : 'Active matches and live clocks appear here automatically as soon as referees load a cage.'}
                </p>
              </section>
            )}

            {/* Compact Latest Finals Ledger */}
            {recentMatches.length > 0 && (
              <section aria-label="Recent final results" className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-[var(--court-ink)]">Latest final scores</h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab('RESULTS')}
                    className="text-sm font-semibold text-[var(--court-accent-link)] hover:underline inline-flex items-center gap-0.5"
                  >
                    See all results
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="rounded-xl bg-[var(--court-surface)] border border-[var(--court-line)] divide-y divide-[var(--court-line-soft)] overflow-hidden">
                  {recentMatches.slice(0, 5).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setActiveTab('RESULTS');
                        setExpandedMatchId(m.id);
                      }}
                      className="w-full px-4 sm:px-5 py-3 text-left hover:bg-[var(--court-hover)] transition-colors grid grid-cols-1 sm:grid-cols-[120px_1fr_auto] items-center gap-2 sm:gap-4"
                    >
                      <div className="flex items-center gap-2 text-xs text-[var(--court-muted)]">
                        <span className="font-bold text-[var(--court-ink)]">{m.matchNumber}</span>
                        <span className="truncate">{arenaNameMap.get(m.arenaId) || `Cage ${m.arenaId}`}</span>
                      </div>

                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                        <span
                          className={`text-sm text-right truncate ${
                            m.winner === 'RED'
                              ? 'font-bold text-[var(--court-ink)]'
                              : 'font-medium text-[var(--court-muted)]'
                          }`}
                        >
                          {m.teamRed}
                        </span>
                        <span className="spectator-numeral text-xl font-extrabold text-[var(--court-ink)] px-2.5 py-0.5 rounded-md bg-[var(--court-control-bg)] border border-[var(--court-line-soft)]">
                          {m.redSetScore} – {m.blueSetScore}
                        </span>
                        <span
                          className={`text-sm text-left truncate ${
                            m.winner === 'BLUE'
                              ? 'font-bold text-[var(--court-ink)]'
                              : 'font-medium text-[var(--court-muted)]'
                          }`}
                        >
                          {m.teamBlue}
                        </span>
                      </div>

                      <div className="hidden sm:flex items-center justify-end">
                        {m.winner && (
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-full border"
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
                            {m.winner === 'RED' ? 'Red won' : m.winner === 'BLUE' ? 'Blue won' : 'Draw'}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* =============================================================== */}
        {/* TAB 2: COMPLETED RESULTS                                        */}
        {/* =============================================================== */}
        {activeTab === 'RESULTS' && (
          <section className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-[var(--court-ink)]">Match results</h2>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="w-4 h-4 text-[var(--court-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter by team or match"
                    value={resultsSearch}
                    onChange={(e) => setResultsSearch(e.target.value)}
                    className="pl-9 pr-3 py-2 rounded-lg bg-[var(--court-surface)] border border-[var(--court-line)] text-sm text-[var(--court-ink)] placeholder:text-[var(--court-muted)] w-full sm:w-56"
                  />
                </div>

                <select
                  value={resultsArenaFilter}
                  onChange={(e) => setResultsArenaFilter(e.target.value)}
                  aria-label="Filter results by cage"
                  className="px-3 py-2 rounded-lg bg-[var(--court-surface)] border border-[var(--court-line)] text-sm text-[var(--court-ink)]"
                >
                  <option value="ALL">All cages</option>
                  {availableArenaIds.map((id) => (
                    <option key={id} value={String(id)}>
                      {arenaNameMap.get(id) || `Cage ${id}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-xl bg-[var(--court-surface)] border border-[var(--court-line)] divide-y divide-[var(--court-line-soft)] overflow-hidden">
              {filteredResults.map((m) => {
                const isExpanded = expandedMatchId === m.id;
                const hasSets = m.setRecords && m.setRecords.length > 0;

                return (
                  <div key={m.id}>
                    <button
                      type="button"
                      onClick={() => hasSets && setExpandedMatchId(isExpanded ? null : m.id)}
                      className="w-full px-4 sm:px-5 py-3.5 text-left hover:bg-[var(--court-hover)] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-xs text-[var(--court-muted)] shrink-0 sm:w-36">
                          <span className="font-bold text-[var(--court-ink)]">{m.matchNumber}</span>
                          <span className="truncate">{arenaNameMap.get(m.arenaId) || `Cage ${m.arenaId}`}</span>
                        </div>

                        <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                          <span
                            className="text-sm"
                            style={{
                              fontWeight: m.winner === 'RED' ? 700 : 500,
                              color: m.winner === 'RED' ? 'var(--drone-red-text)' : 'var(--court-ink-secondary)',
                            }}
                          >
                            {m.teamRed}
                          </span>
                          <span className="spectator-numeral text-xl font-extrabold text-[var(--court-ink)] px-2.5 py-0.5 rounded-md bg-[var(--court-control-bg)] border border-[var(--court-line-soft)]">
                            {m.redSetScore} – {m.blueSetScore}
                          </span>
                          <span
                            className="text-sm"
                            style={{
                              fontWeight: m.winner === 'BLUE' ? 700 : 500,
                              color: m.winner === 'BLUE' ? 'var(--drone-blue-text)' : 'var(--court-ink-secondary)',
                            }}
                          >
                            {m.teamBlue}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        {m.winner && (
                          <span
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border"
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
                            <Trophy className="w-3 h-3" />
                            {m.winner === 'RED' ? m.teamRed : m.winner === 'BLUE' ? m.teamBlue : 'Draw'}
                          </span>
                        )}

                        {hasSets && (
                          <span className="text-[var(--court-muted)]">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </span>
                        )}
                      </div>
                    </button>

                    {isExpanded && hasSets && (
                      <div className="px-4 sm:px-5 pb-4 pt-2 bg-[var(--court-subtle)] border-t border-[var(--court-line-soft)]">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {m.setRecords.map((set) => (
                            <div
                              key={set.id}
                              className="p-3 rounded-lg bg-[var(--court-surface)] border border-[var(--court-line-soft)] flex flex-col gap-1.5"
                            >
                              <div className="flex items-center justify-between text-xs text-[var(--court-muted)]">
                                <span className="font-semibold text-[var(--court-ink)]">Set {set.setNumber}</span>
                                <span>
                                  {set.winner === 'RED'
                                    ? 'Red won'
                                    : set.winner === 'BLUE'
                                    ? 'Blue won'
                                    : 'Draw'}
                                </span>
                              </div>
                              <div className="flex items-baseline justify-between">
                                <span className="spectator-numeral text-2xl font-extrabold text-[var(--drone-red)]">
                                  {set.redScore}
                                  {set.redPenalties > 0 && (
                                    <span
                                      className="text-xs font-sans font-medium ml-1"
                                      style={{ color: 'var(--signal-amber-text)' }}
                                    >
                                      ({set.redPenalties}P)
                                    </span>
                                  )}
                                </span>
                                <span className="text-xs text-[var(--court-muted)]">to</span>
                                <span className="spectator-numeral text-2xl font-extrabold text-[var(--drone-blue)]">
                                  {set.blueScore}
                                  {set.bluePenalties > 0 && (
                                    <span
                                      className="text-xs font-sans font-medium ml-1"
                                      style={{ color: 'var(--signal-amber-text)' }}
                                    >
                                      ({set.bluePenalties}P)
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredResults.length === 0 && (
                <div className="py-12 px-4 text-center">
                  <p className="text-sm font-semibold text-[var(--court-ink)]">No completed matches found</p>
                  <p className="text-xs text-[var(--court-muted)] mt-1">
                    {resultsSearch || resultsArenaFilter !== 'ALL'
                      ? 'Clear your filter to see all recorded scores.'
                      : 'Finished matches will be logged here as each set concludes.'}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* =============================================================== */}
        {/* TAB 3: UPCOMING SCHEDULE                                        */}
        {/* =============================================================== */}
        {activeTab === 'SCHEDULE' && (
          <section className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-[var(--court-ink)]">Upcoming schedule</h2>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="w-4 h-4 text-[var(--court-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter by team or match"
                    value={scheduleSearch}
                    onChange={(e) => setScheduleSearch(e.target.value)}
                    className="pl-9 pr-3 py-2 rounded-lg bg-[var(--court-surface)] border border-[var(--court-line)] text-sm text-[var(--court-ink)] placeholder:text-[var(--court-muted)] w-full sm:w-56"
                  />
                </div>

                <select
                  value={scheduleArenaFilter}
                  onChange={(e) => setScheduleArenaFilter(e.target.value)}
                  aria-label="Filter schedule by cage"
                  className="px-3 py-2 rounded-lg bg-[var(--court-surface)] border border-[var(--court-line)] text-sm text-[var(--court-ink)]"
                >
                  <option value="ALL">All cages</option>
                  {availableArenaIds.map((id) => (
                    <option key={id} value={String(id)}>
                      {arenaNameMap.get(id) || `Cage ${id}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-xl bg-[var(--court-surface)] border border-[var(--court-line)] divide-y divide-[var(--court-line-soft)] overflow-hidden">
              {filteredSchedule.map((m) => {
                const isLive = m.status === 'IN_PROGRESS';
                return (
                  <div
                    key={m.id}
                    className="px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    style={isLive ? { backgroundColor: 'var(--signal-live-tint)' } : undefined}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-[var(--court-muted)] shrink-0 sm:w-44">
                        <span className="font-bold text-[var(--court-ink)]">{m.matchNumber}</span>
                        <span className="truncate">{arenaNameMap.get(m.arenaId) || `Cage ${m.arenaId}`}</span>
                        {m.scheduledTime && (
                          <span className="inline-flex items-center gap-1 tabular-nums">
                            <Clock className="w-3 h-3" />
                            {new Date(m.scheduledTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm font-semibold flex-wrap">
                        <span style={{ color: 'var(--drone-red-text)' }}>{m.teamRed}</span>
                        <span className="text-xs font-normal text-[var(--court-muted)]">vs</span>
                        <span style={{ color: 'var(--drone-blue-text)' }}>{m.teamBlue}</span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isLive ? (
                        <Link
                          to={`/live/arena/${m.arenaId}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition-opacity hover:opacity-90"
                          style={{ backgroundColor: 'var(--signal-live)' }}
                        >
                          <span>Watch live</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[var(--court-control-bg)] border border-[var(--court-line-soft)] text-xs font-medium text-[var(--court-muted)]">
                          Scheduled
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredSchedule.length === 0 && (
                <div className="py-12 px-4 text-center">
                  <p className="text-sm font-semibold text-[var(--court-ink)]">No upcoming matches scheduled</p>
                  <p className="text-xs text-[var(--court-muted)] mt-1">
                    {scheduleSearch || scheduleArenaFilter !== 'ALL'
                      ? 'Clear your filter to view the full tournament queue.'
                      : 'Check the Live matches tab for cages currently in flight.'}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Quiet Sponsor Strip */}
        {sponsors.length > 0 && (
          <section className="mt-auto pt-6 border-t border-[var(--court-line)]" aria-label="Event partners">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs font-medium text-[var(--court-muted)]">Event partners</span>
              <div className="flex flex-wrap items-center gap-4">
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
                    <span className="text-xs font-semibold text-[var(--court-ink-secondary)]">{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
