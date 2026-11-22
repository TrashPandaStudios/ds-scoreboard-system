import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useArenaStore } from '../store/arenaStore';
import { useArenaWebSocket } from '../hooks/useArenaWebSocket';
import { PublicLiveCard } from '../components/public/PublicLiveCard';
import {
  MatchRecord,
  PublicOverviewResponse,
  ScheduledMatch,
  SponsorItem,
} from '../types/scoreboard';
import {
  Radio,
  Trophy,
  Calendar,
  Search,
  ChevronDown,
  ChevronUp,
  Wifi,
  WifiOff,
  RefreshCw,
  ArrowRight,
  Zap,
  Clock,
} from 'lucide-react';

type PublicTab = 'LIVE' | 'RESULTS' | 'SCHEDULE';

export const PublicLiveHub: React.FC = () => {
  useArenaWebSocket(undefined, { readOnly: true });
  const { arenaSummaries, setArenaSummaries, isConnected, transportMode } = useArenaStore();

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
      // Retain existing live state if transient network hiccup occurs
    } finally {
      setIsLoading(false);
    }
  }, [setArenaSummaries]);

  useEffect(() => {
    document.title = 'Drone Soccer — Live Matches & Results';
    fetchOverview();
    const interval = window.setInterval(fetchOverview, 12000);
    return () => window.clearInterval(interval);
  }, [fetchOverview]);

  const sortedArenas = useMemo(
    () => [...arenaSummaries].sort((a, b) => a.arenaId - b.arenaId),
    [arenaSummaries]
  );

  const tournamentTitle = useMemo(() => {
    const fromArena = sortedArenas.find((a) => a.tournamentName && a.tournamentName.trim().length > 0)?.tournamentName;
    if (fromArena) return fromArena;
    const fromQueue = upcomingMatches.find((m) => m.tournamentName && m.tournamentName.trim().length > 0)?.tournamentName;
    if (fromQueue) return fromQueue;
    const fromHistory = recentMatches.find((m) => m.tournamentName && m.tournamentName.trim().length > 0)?.tournamentName;
    return fromHistory || 'Live Tournament Scoreboard';
  }, [sortedArenas, upcomingMatches, recentMatches]);

  const runningCount = useMemo(
    () => sortedArenas.filter((a) => a.timerRunning).length,
    [sortedArenas]
  );

  const availableArenaIds = useMemo(() => {
    const ids = new Set<number>();
    sortedArenas.forEach((a) => ids.add(a.arenaId));
    recentMatches.forEach((m) => ids.add(m.arenaId));
    upcomingMatches.forEach((m) => ids.add(m.arenaId));
    return Array.from(ids).sort((a, b) => a - b);
  }, [sortedArenas, recentMatches, upcomingMatches]);

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

  const arenaNameMap = useMemo(() => {
    const map = new Map<number, string>();
    sortedArenas.forEach((a) => map.set(a.arenaId, a.arenaName));
    return map;
  }, [sortedArenas]);

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col">
      {/* Clean Public Spectator Header */}
      <header className="sticky top-0 z-40 bg-[#080b11]/95 backdrop-blur-md border-b border-slate-800/90 px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black tracking-wider text-base sm:text-lg text-white leading-tight">
                  DRONE SOCCER LIVE
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-[10px] font-mono font-bold text-cyan-300 uppercase">
                  SPECTATOR PORTAL
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400 block truncate max-w-[240px] sm:max-w-md">
                {tournamentTitle}
              </span>
            </div>
          </div>

          {/* Live Sync Indicator */}
          <div className="flex items-center gap-2">
            {isConnected || transportMode === 'WS' ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <Wifi className="w-3.5 h-3.5" />
                <span>LIVE SYNC</span>
              </div>
            ) : transportMode === 'HTTP_FALLBACK' ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>LIVE POLLING</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
                <WifiOff className="w-3.5 h-3.5" />
                <span>CONNECTING...</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 sm:py-8 flex-1 w-full flex flex-col gap-6">
        {/* Hero Stats + Navigation Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Tabs */}
          <div className="inline-flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 self-start">
            <button
              onClick={() => setActiveTab('LIVE')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all ${
                activeTab === 'LIVE'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>LIVE MATCHES ({sortedArenas.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('RESULTS')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all ${
                activeTab === 'RESULTS'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>RESULTS ({recentMatches.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('SCHEDULE')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all ${
                activeTab === 'SCHEDULE'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>UPCOMING ({upcomingMatches.length})</span>
            </button>
          </div>

          {/* Quick Telemetry Counters */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="px-3.5 py-2 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Active Cages</span>
              <span className="text-lg font-display font-black text-white">{sortedArenas.length}</span>
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
              <span className="text-[10px] font-mono text-emerald-400 uppercase block">In Flight</span>
              <span className="text-lg font-display font-black text-emerald-300">{runningCount}</span>
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
              <span className="text-[10px] font-mono text-amber-400 uppercase block">Completed</span>
              <span className="text-lg font-display font-black text-amber-300">{recentMatches.length}</span>
            </div>
          </div>
        </div>

        {/* TAB 1: LIVE MATCHES */}
        {activeTab === 'LIVE' && (
          <div className="flex flex-col gap-8 animate-fadeIn">
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <h1 className="text-lg sm:text-xl font-display font-black text-white uppercase tracking-wide">
                    Active Flight Cages
                  </h1>
                </div>
                <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                  Select any match for live set-by-set scoreboard &amp; results
                </span>
              </div>

              {sortedArenas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {sortedArenas.map((arena) => (
                    <PublicLiveCard key={arena.arenaId} arena={arena} />
                  ))}
                </div>
              ) : (
                <div className="p-12 rounded-3xl bg-slate-900/70 border border-slate-800 text-center">
                  <Radio className="w-10 h-10 text-slate-600 mx-auto mb-3 animate-pulse" />
                  <p className="text-base font-display font-bold text-slate-300">
                    {isLoading ? 'Loading live flight cages...' : 'No active flight cages right now'}
                  </p>
                  <p className="text-xs font-mono text-slate-500 mt-1">
                    Matches will appear here automatically in real time once started.
                  </p>
                </div>
              )}
            </section>

            {/* Quick Recent Results Strip below Live Cages */}
            {recentMatches.length > 0 && (
              <section className="p-5 sm:p-6 rounded-3xl bg-slate-900/75 border border-slate-800">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <h2 className="text-base font-display font-black text-white uppercase tracking-wide">
                      Latest Match Results
                    </h2>
                  </div>
                  <button
                    onClick={() => setActiveTab('RESULTS')}
                    className="text-xs font-mono font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <span>ALL RESULTS</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {recentMatches.slice(0, 4).map((m) => (
                    <div
                      key={m.id}
                      onClick={() => {
                        setActiveTab('RESULTS');
                        setExpandedMatchId(m.id);
                      }}
                      className="p-4 rounded-2xl bg-slate-950/70 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
                        <span className="text-cyan-400 font-bold">
                          {m.matchNumber} • {arenaNameMap.get(m.arenaId) || `Cage ${m.arenaId}`}
                        </span>
                        {m.winner && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              m.winner === 'RED'
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                : m.winner === 'BLUE'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {m.winner === 'RED' ? `${m.teamRed} WON` : m.winner === 'BLUE' ? `${m.teamBlue} WON` : m.winner}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 text-sm font-bold">
                        <span className="text-red-400 truncate flex-1">{m.teamRed}</span>
                        <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 font-mono text-white tabular-nums shrink-0">
                          {m.redSetScore} - {m.blueSetScore}
                        </span>
                        <span className="text-blue-400 truncate flex-1 text-right">{m.teamBlue}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* TAB 2: RESULTS */}
        {activeTab === 'RESULTS' && (
          <section className="flex flex-col gap-4 p-5 sm:p-6 rounded-3xl bg-slate-900/85 border border-slate-800 animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-display font-black text-white">Completed Match Results</h2>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search team or match..."
                    value={resultsSearch}
                    onChange={(e) => setResultsSearch(e.target.value)}
                    className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-500 w-52"
                  />
                </div>

                <select
                  value={resultsArenaFilter}
                  onChange={(e) => setResultsArenaFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="ALL">All Arenas</option>
                  {availableArenaIds.map((id) => (
                    <option key={id} value={String(id)}>
                      {arenaNameMap.get(id) || `Arena ${id}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {filteredResults.map((m) => {
                const isExpanded = expandedMatchId === m.id;
                const hasSets = m.setRecords && m.setRecords.length > 0;

                return (
                  <div
                    key={m.id}
                    className="rounded-2xl bg-slate-950/80 border border-slate-800 overflow-hidden transition-colors hover:border-slate-700"
                  >
                    <button
                      type="button"
                      onClick={() => hasSets && setExpandedMatchId(isExpanded ? null : m.id)}
                      className="w-full p-4 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-800/60 text-xs font-mono font-bold text-cyan-400 shrink-0">
                          {m.matchNumber}
                        </span>
                        <div className="min-w-0">
                          <span className="text-[11px] font-mono text-slate-400 block">
                            {arenaNameMap.get(m.arenaId) || `Cage ${m.arenaId}`}
                            {m.tournamentName ? ` • ${m.tournamentName}` : ''}
                          </span>
                          <div className="flex flex-wrap items-center gap-2 text-sm font-bold mt-0.5">
                            <span className="text-red-400">{m.teamRed}</span>
                            <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-700 font-mono text-white tabular-nums">
                              {m.redSetScore} - {m.blueSetScore}
                            </span>
                            <span className="text-blue-400">{m.teamBlue}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
                        {m.winner && (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                              m.winner === 'RED'
                                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                : m.winner === 'BLUE'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            <Trophy className="w-3 h-3" />
                            <span>
                              {m.winner === 'RED'
                                ? m.teamRed
                                : m.winner === 'BLUE'
                                ? m.teamBlue
                                : m.winner}
                            </span>
                          </span>
                        )}

                        {hasSets && (
                          <span className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </span>
                        )}
                      </div>
                    </button>

                    {isExpanded && hasSets && (
                      <div className="px-4 pb-4 pt-1 border-t border-slate-800/80 bg-slate-900/50">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-2.5 mt-2">
                          Set-by-Set Results
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {m.setRecords.map((set) => (
                            <div
                              key={set.id}
                              className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono"
                            >
                              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                                <span className="font-bold text-slate-200">SET {set.setNumber}</span>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    set.winner === 'RED'
                                      ? 'bg-red-500/20 text-red-300'
                                      : set.winner === 'BLUE'
                                      ? 'bg-blue-500/20 text-blue-300'
                                      : 'bg-slate-800 text-slate-300'
                                  }`}
                                >
                                  {set.winner}
                                </span>
                              </div>
                              <div className="flex items-center justify-between font-bold text-sm">
                                <span className="text-red-400">
                                  {set.redScore} pts
                                  {set.redPenalties > 0 ? ` (${set.redPenalties}P)` : ''}
                                </span>
                                <span className="text-slate-600">vs</span>
                                <span className="text-blue-400">
                                  {set.blueScore} pts
                                  {set.bluePenalties > 0 ? ` (${set.bluePenalties}P)` : ''}
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
                <div className="py-10 text-center text-xs font-mono text-slate-500">
                  No completed match results match your filter yet.
                </div>
              )}
            </div>
          </section>
        )}

        {/* TAB 3: UPCOMING SCHEDULE */}
        {activeTab === 'SCHEDULE' && (
          <section className="flex flex-col gap-4 p-5 sm:p-6 rounded-3xl bg-slate-900/85 border border-slate-800 animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-display font-black text-white">Upcoming Match Schedule</h2>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search team or match..."
                    value={scheduleSearch}
                    onChange={(e) => setScheduleSearch(e.target.value)}
                    className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-500 w-52"
                  />
                </div>

                <select
                  value={scheduleArenaFilter}
                  onChange={(e) => setScheduleArenaFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="ALL">All Arenas</option>
                  {availableArenaIds.map((id) => (
                    <option key={id} value={String(id)}>
                      {arenaNameMap.get(id) || `Arena ${id}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              {filteredSchedule.map((m) => {
                const isLive = m.status === 'IN_PROGRESS';
                return (
                  <div
                    key={m.id}
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isLive
                        ? 'bg-emerald-950/20 border-emerald-500/40'
                        : 'bg-slate-950/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-cyan-400 shrink-0">
                        {m.matchNumber}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                          <span>{arenaNameMap.get(m.arenaId) || `Cage ${m.arenaId}`}</span>
                          {m.scheduledTime && (
                            <>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(m.scheduledTime).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm font-bold mt-0.5">
                          <span className="text-red-400">{m.teamRed}</span>
                          <span className="text-slate-600 font-mono text-xs">VS</span>
                          <span className="text-blue-400">{m.teamBlue}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isLive ? (
                        <Link
                          to={`/live/arena/${m.arenaId}`}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                          <span>WATCH LIVE</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-[10px] font-mono font-bold text-slate-300 uppercase">
                          {m.status}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredSchedule.length === 0 && (
                <div className="py-10 text-center text-xs font-mono text-slate-500">
                  No upcoming matches scheduled right now.
                </div>
              )}
            </div>
          </section>
        )}

        {/* Active Sponsors Strip */}
        {sponsors.length > 0 && (
          <section className="mt-auto pt-4 border-t border-slate-800/80">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block text-center mb-3">
              Event Partners &amp; Sponsors
            </span>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {sponsors.map((s) => (
                <div
                  key={s.id}
                  className="px-4 py-2 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center gap-2.5"
                >
                  {s.logoUrl && (
                    <img
                      src={s.logoUrl}
                      alt={s.name}
                      className="h-6 max-w-[96px] object-contain"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <span className="text-xs font-mono font-bold text-slate-300">{s.name}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-slate-800/80 py-4 px-4 text-center text-[11px] font-mono text-slate-500">
        Drone Soccer Live Spectator Portal • Real-Time Read-Only Match Telemetry
      </footer>
    </div>
  );
};
