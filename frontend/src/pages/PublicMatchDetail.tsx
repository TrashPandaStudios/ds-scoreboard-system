import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useArenaStore } from '../store/arenaStore';
import { useArenaWebSocket } from '../hooks/useArenaWebSocket';
import { TeamBadge } from '../components/common/TeamBadge';
import { TabularTimer } from '../components/common/TabularTimer';
import { PhaseAlertBanner } from '../components/display/PhaseAlertBanner';
import {
  ArenaSummary,
  MatchRecord,
  PublicArenaDetailResponse,
  ScheduledMatch,
} from '../types/scoreboard';
import {
  ArrowLeft,
  Radio,
  Trophy,
  Calendar,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  Activity,
  History,
} from 'lucide-react';

interface PublicMatchDetailProps {
  publicPortalMode?: boolean;
}

export const PublicMatchDetail: React.FC<PublicMatchDetailProps> = ({ publicPortalMode = false }) => {
  const { id } = useParams<{ id: string }>();
  const arenaId = parseInt(id || '1', 10);

  useArenaWebSocket(Number.isFinite(arenaId) ? arenaId : undefined, { readOnly: true });
  const { arenaStates, setArenaState, isConnected, transportMode } = useArenaStore();

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
      // Keep existing live state on transient hiccup
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

  useEffect(() => {
    if (arenaState) {
      document.title = `${arenaState.teamRed} vs ${arenaState.teamBlue} — ${arenaState.arenaName} Live`;
    } else {
      document.title = `Arena ${arenaId} — Live Match`;
    }
  }, [arenaState, arenaId]);

  const setsArray = useMemo(() => {
    const maxSets = arenaState?.maxSets || 3;
    return Array.from({ length: maxSets }, (_, idx) => idx + 1);
  }, [arenaState?.maxSets]);

  if (notFound && !arenaState) {
    return (
      <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <Radio className="w-12 h-12 text-slate-600 mb-4" />
        <h1 className="text-2xl font-display font-black text-white mb-2">Arena Not Found</h1>
        <p className="text-xs font-mono text-slate-400 max-w-sm mb-6">
          Arena #{arenaId} is not currently active. Return to the live overview to pick an active flight cage.
        </p>
        <Link
          to={liveHomePath}
          className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold inline-flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>BACK TO LIVE MATCHES</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col">
      {/* Top Spectator Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#080b11]/95 backdrop-blur-md border-b border-slate-800/90 px-4 lg:px-8 py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to={liveHomePath}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-slate-200 hover:text-white inline-flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
              <span>ALL MATCHES</span>
            </Link>

            {/* Quick Arena Switcher Pills */}
            {allArenas.length > 1 && (
              <div className="hidden md:flex items-center gap-1 pl-2 border-l border-slate-800">
                {allArenas.map((a) => (
                  <Link
                    key={a.arenaId}
                    to={`/live/arena/${a.arenaId}`}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-colors ${
                      a.arenaId === arenaId
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    Cage {a.arenaId}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isConnected || transportMode === 'WS' ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <Wifi className="w-3.5 h-3.5" />
                <span>LIVE</span>
              </div>
            ) : transportMode === 'HTTP_FALLBACK' ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[11px] font-mono font-bold">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>POLLING</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono font-bold">
                <WifiOff className="w-3.5 h-3.5" />
                <span>SYNCING</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 lg:px-8 py-6 flex-1 w-full flex flex-col gap-6">
        {!arenaState ? (
          <div className="p-12 rounded-3xl bg-slate-900/70 border border-slate-800 text-center">
            <RefreshCw className="w-8 h-8 text-cyan-400 mx-auto mb-3 animate-spin" />
            <p className="text-sm font-mono text-slate-300">
              {loading ? `Connecting to Arena ${arenaId} live telemetry...` : 'Waiting for match data...'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Arena Switcher */}
            {allArenas.length > 1 && (
              <div className="flex md:hidden items-center gap-1.5 overflow-x-auto pb-1">
                {allArenas.map((a) => (
                  <Link
                    key={a.arenaId}
                    to={`/live/arena/${a.arenaId}`}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold shrink-0 ${
                      a.arenaId === arenaId
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {a.arenaName}
                  </Link>
                ))}
              </div>
            )}

            {/* Match Header & Phase Banner */}
            <section className="rounded-3xl bg-slate-900/90 border-2 border-slate-800 p-5 sm:p-7 shadow-2xl flex flex-col gap-5">
              <div className="flex flex-col items-center text-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400">
                  {arenaState.arenaName}
                  {arenaState.tournamentName ? ` • ${arenaState.tournamentName}` : ''} • MATCH {arenaState.matchNumber}
                </span>
                <div className="w-full max-w-2xl">
                  <PhaseAlertBanner phase={arenaState.phase} currentSet={arenaState.currentSet} />
                </div>
              </div>

              {/* Inline Winner Callout Banner (Non-blocking for mobile spectators) */}
              {arenaState.setWinnerBanner?.active && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-amber-400/15 to-amber-500/20 border-2 border-amber-400/60 flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
                  <Trophy className="w-6 h-6 text-amber-400 shrink-0" />
                  <div>
                    <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-amber-300 block">
                      {arenaState.setWinnerBanner.isMatchWinner || arenaState.setWinnerBanner.matchWinner
                        ? 'MATCH WINNER'
                        : `SET ${arenaState.setWinnerBanner.currentSet} WINNER`}
                    </span>
                    <span className="text-xl font-display font-black text-white">
                      {arenaState.setWinnerBanner.winnerName}
                    </span>
                    <span className="text-xs font-mono text-amber-200/90 ml-2">
                      (Sets: {arenaState.setWinnerBanner.redSetScore} - {arenaState.setWinnerBanner.blueSetScore})
                    </span>
                  </div>
                </div>
              )}

              {/* Live Scoreboard Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] items-stretch gap-4 sm:gap-6">
                {/* Red Team Panel */}
                <div
                  className={`flex flex-col items-center justify-between p-5 sm:p-6 rounded-3xl border-2 text-center transition-all ${
                    arenaState.redScore > arenaState.blueScore
                      ? 'bg-red-950/45 border-red-500/60 shadow-lg shadow-red-600/10'
                      : 'bg-red-950/20 border-red-500/25'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-red-400 font-bold">
                      RED TEAM
                    </span>
                    <TeamBadge
                      teamName={arenaState.teamRed}
                      logoUrl={arenaState.teamRedLogoUrl}
                      side="red"
                      size="xl"
                    />
                    <h2 className="text-xl sm:text-2xl font-display font-black text-white leading-tight mt-1">
                      {arenaState.teamRed}
                    </h2>
                  </div>

                  <div className="my-4">
                    <span className="font-display font-black text-6xl sm:text-7xl text-red-400 tabular-nums leading-none">
                      {arenaState.redScore}
                    </span>
                  </div>

                  <div className="w-full flex items-center justify-center gap-2 pt-3 border-t border-red-500/20 text-xs font-mono">
                    <span className="px-3 py-1 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200">
                      Sets Won: <strong className="text-red-300">{arenaState.redSetScore}</strong>
                    </span>
                    <span
                      className={`px-3 py-1 rounded-xl border inline-flex items-center gap-1 ${
                        arenaState.redPenalties > 0
                          ? 'bg-amber-950/70 border-amber-500/40 text-amber-300 font-bold'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400'
                      }`}
                    >
                      {arenaState.redPenalties > 0 && <AlertTriangle className="w-3 h-3" />}
                      Penalties: {arenaState.redPenalties}
                    </span>
                  </div>
                </div>

                {/* Center Clock Panel */}
                <div className="flex flex-col items-center justify-center p-5 sm:p-6 rounded-3xl bg-slate-950/80 border border-slate-800 lg:min-w-[260px]">
                  <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-cyan-400 mb-2">
                    SET {arenaState.currentSet} OF {arenaState.maxSets}
                  </span>
                  <TabularTimer
                    serverRemainingMs={arenaState.timeRemainingMs}
                    totalDurationMs={arenaState.totalSetDurationMs}
                    timerRunning={arenaState.timerRunning}
                    phase={arenaState.phase}
                    size="hero"
                    showProgressBar={true}
                  />
                </div>

                {/* Blue Team Panel */}
                <div
                  className={`flex flex-col items-center justify-between p-5 sm:p-6 rounded-3xl border-2 text-center transition-all ${
                    arenaState.blueScore > arenaState.redScore
                      ? 'bg-blue-950/45 border-blue-500/60 shadow-lg shadow-blue-600/10'
                      : 'bg-blue-950/20 border-blue-500/25'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-blue-400 font-bold">
                      BLUE TEAM
                    </span>
                    <TeamBadge
                      teamName={arenaState.teamBlue}
                      logoUrl={arenaState.teamBlueLogoUrl}
                      side="blue"
                      size="xl"
                    />
                    <h2 className="text-xl sm:text-2xl font-display font-black text-white leading-tight mt-1">
                      {arenaState.teamBlue}
                    </h2>
                  </div>

                  <div className="my-4">
                    <span className="font-display font-black text-6xl sm:text-7xl text-blue-400 tabular-nums leading-none">
                      {arenaState.blueScore}
                    </span>
                  </div>

                  <div className="w-full flex items-center justify-center gap-2 pt-3 border-t border-blue-500/20 text-xs font-mono">
                    <span className="px-3 py-1 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200">
                      Sets Won: <strong className="text-blue-300">{arenaState.blueSetScore}</strong>
                    </span>
                    <span
                      className={`px-3 py-1 rounded-xl border inline-flex items-center gap-1 ${
                        arenaState.bluePenalties > 0
                          ? 'bg-amber-950/70 border-amber-500/40 text-amber-300 font-bold'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400'
                      }`}
                    >
                      {arenaState.bluePenalties > 0 && <AlertTriangle className="w-3 h-3" />}
                      Penalties: {arenaState.bluePenalties}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Event Telemetry Strip */}
              {arenaState.recentEvent && (
                <div className="px-4 py-2.5 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 text-xs font-mono text-slate-400">
                  <div className="flex items-center gap-2 min-w-0">
                    <Activity className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate text-slate-300">{arenaState.recentEvent}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase shrink-0">
                    MATCH {arenaState.matchNumber}
                  </span>
                </div>
              )}
            </section>

            {/* Set-by-Set Live Results Breakdown */}
            <section className="p-5 sm:p-6 rounded-3xl bg-slate-900/85 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm sm:text-base font-display font-black text-white uppercase tracking-wide">
                    Match Set Results
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  Best of {arenaState.maxSets} Sets
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {setsArray.map((setNum) => {
                  const completed = (arenaState.completedSets || []).find((s) => s.setNumber === setNum);
                  const isCurrent = setNum === arenaState.currentSet && arenaState.phase !== 'MATCH_ENDED';

                  return (
                    <div
                      key={setNum}
                      className={`p-4 rounded-2xl border ${
                        isCurrent
                          ? 'bg-cyan-950/25 border-cyan-500/50 shadow-md shadow-cyan-500/10'
                          : completed
                          ? 'bg-slate-950/80 border-slate-700'
                          : 'bg-slate-950/40 border-slate-800/80 opacity-70'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-mono mb-2">
                        <span className="font-bold text-white">SET {setNum}</span>
                        {completed ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              completed.winner === 'RED'
                                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                : completed.winner === 'BLUE'
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {completed.winner === 'RED'
                              ? 'RED WON'
                              : completed.winner === 'BLUE'
                              ? 'BLUE WON'
                              : completed.winner}
                          </span>
                        ) : isCurrent ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                            LIVE NOW
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 uppercase">UPCOMING</span>
                        )}
                      </div>

                      {completed ? (
                        <div className="flex items-center justify-between font-mono text-lg font-black">
                          <div className="flex flex-col">
                            <span className="text-red-400">{completed.redScore}</span>
                            {completed.redPenalties > 0 && (
                              <span className="text-[10px] text-amber-400 font-normal">
                                {completed.redPenalties} pen
                              </span>
                            )}
                          </div>
                          <span className="text-slate-600 text-xs">VS</span>
                          <div className="flex flex-col text-right">
                            <span className="text-blue-400">{completed.blueScore}</span>
                            {completed.bluePenalties > 0 && (
                              <span className="text-[10px] text-amber-400 font-normal">
                                {completed.bluePenalties} pen
                              </span>
                            )}
                          </div>
                        </div>
                      ) : isCurrent ? (
                        <div className="flex items-center justify-between font-mono text-lg font-black">
                          <span className="text-red-400">{arenaState.redScore}</span>
                          <span className="text-slate-600 text-xs">LIVE</span>
                          <span className="text-blue-400">{arenaState.blueScore}</span>
                        </div>
                      ) : (
                        <div className="text-center font-mono text-sm text-slate-600 py-1">- : -</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Bottom Two-Column: Up Next + Recent Results on This Arena */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Up Next on This Arena */}
              <section className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-display font-black text-white uppercase tracking-wide">
                    Up Next on {arenaState.arenaName}
                  </h3>
                </div>

                <div className="flex flex-col gap-2.5">
                  {upcomingMatches.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2 text-xs font-mono"
                    >
                      <span className="font-bold text-cyan-400 shrink-0">{m.matchNumber}</span>
                      <span className="text-center truncate">
                        <strong className="text-red-400">{m.teamRed}</strong>
                        <span className="text-slate-600 mx-1.5">vs</span>
                        <strong className="text-blue-400">{m.teamBlue}</strong>
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase shrink-0">{m.status}</span>
                    </div>
                  ))}
                  {upcomingMatches.length === 0 && (
                    <p className="text-xs font-mono text-slate-500 py-4 text-center">
                      No additional matches queued for this cage.
                    </p>
                  )}
                </div>
              </section>

              {/* Recent Results on This Arena */}
              <section className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-display font-black text-white uppercase tracking-wide">
                    Recent Results on {arenaState.arenaName}
                  </h3>
                </div>

                <div className="flex flex-col gap-2.5">
                  {recentMatches.slice(0, 6).map((m) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2 text-xs font-mono"
                    >
                      <span className="font-bold text-cyan-400 shrink-0">{m.matchNumber}</span>
                      <span className="truncate text-center">
                        <strong className="text-red-400">{m.teamRed}</strong>
                        <span className="mx-2 px-1.5 py-0.5 rounded bg-slate-900 text-white">
                          {m.redSetScore}-{m.blueSetScore}
                        </span>
                        <strong className="text-blue-400">{m.teamBlue}</strong>
                      </span>
                      {m.winner ? (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            m.winner === 'RED'
                              ? 'bg-red-500/20 text-red-300'
                              : m.winner === 'BLUE'
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {m.winner}
                        </span>
                      ) : (
                        <span className="text-slate-600 shrink-0">-</span>
                      )}
                    </div>
                  ))}
                  {recentMatches.length === 0 && (
                    <p className="text-xs font-mono text-slate-500 py-4 text-center">
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
