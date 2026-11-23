import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useArenaStore } from '../store/arenaStore';
import { useArenaWebSocket } from '../hooks/useArenaWebSocket';
import { useAudioBuzzer } from '../hooks/useAudioBuzzer';
import { useSpectatorTheme } from '../hooks/useSpectatorTheme';
import { HeaderNav } from '../components/common/HeaderNav';
import { ScoreCard } from '../components/display/ScoreCard';
import { TabularTimer } from '../components/common/TabularTimer';
import { SetTracker } from '../components/display/SetTracker';
import { PhaseAlertBanner } from '../components/display/PhaseAlertBanner';
import { SponsorTakeover } from '../components/display/SponsorTakeover';
import { SetWinnerTakeoverModal } from '../components/display/SetWinnerTakeoverModal';
import { ScheduledMatch } from '../types/scoreboard';
import { Maximize, Minimize, Sun, Moon, Info, X } from 'lucide-react';

export const CrowdDisplay: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const arenaId = parseInt(id || '1', 10);

  useArenaWebSocket(arenaId);
  const { arenaStates, activeBuzzerArenaId, buzzerTriggerTimestamp, sponsors, setSponsors } = useArenaStore();
  const { playBuzzer } = useAudioBuzzer();
  const { theme, toggleTheme } = useSpectatorTheme();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [upcomingMatches, setUpcomingMatches] = useState<ScheduledMatch[]>([]);
  const [showMatchInfo, setShowMatchInfo] = useState(false);

  const arenaState = arenaStates[arenaId] || {
    arenaId,
    arenaName: `Arena ${arenaId}`,
    matchNumber: 'M-101',
    tournamentName: 'World Drone Soccer Championship',
    teamRed: 'Red Phoenix',
    teamBlue: 'Blue Comets',
    redScore: 0,
    blueScore: 0,
    redSetScore: 0,
    blueSetScore: 0,
    redPenalties: 0,
    bluePenalties: 0,
    currentSet: 1,
    maxSets: 3,
    timeRemainingMs: 180000,
    totalSetDurationMs: 180000,
    timerRunning: false,
    phase: 'NORMAL_PHASE' as const,
    sideSwap: false,
    matchWinner: null,
    serverEpochMs: Date.now(),
    recentEvent: 'Arena Initialized',
    completedSets: [],
  };

  useEffect(() => {
    fetch('/api/sponsors')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setSponsors(data))
      .catch(() => {});

    fetch(`/api/queue/arena/${arenaId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setUpcomingMatches(data))
      .catch(() => {});
  }, [arenaId, setSponsors]);

  const isBuzzerFiring =
    activeBuzzerArenaId === arenaId && Date.now() - buzzerTriggerTimestamp < 2500;

  useEffect(() => {
    if (activeBuzzerArenaId === arenaId) {
      playBuzzer(800);
    }
  }, [activeBuzzerArenaId, buzzerTriggerTimestamp, arenaId, playBuzzer]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const isIdleOrIntermission =
    arenaState.phase === 'INTERMISSION' && sponsors.some((s) => s.active);

  const leftTeam = arenaState.sideSwap ? 'blue' : 'red';
  const rightTeam = arenaState.sideSwap ? 'red' : 'blue';

  return (
    <div
      className={`app-shell h-screen max-h-screen w-full flex flex-col select-none overflow-hidden ${
        isBuzzerFiring ? 'buzzer-active-flash' : ''
      }`}
    >
      <HeaderNav arenaId={arenaId} variant="display" />

      <main className="flex-1 min-h-0 h-full flex flex-col justify-between px-3 sm:px-6 lg:px-8 py-3 w-full relative overflow-hidden gap-3">
        {/* Top Bar: Match Identity, Phase Banner & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-sm sm:text-base font-bold text-[var(--court-ink)] truncate">
              {arenaState.arenaName}
            </span>
            <span className="text-xs sm:text-sm text-[var(--court-muted)] hidden sm:inline truncate">
              {arenaState.tournamentName}
            </span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-[var(--court-surface)] border border-[var(--court-line)] text-[var(--court-ink)]">
              Match {arenaState.matchNumber}
            </span>
          </div>

          <div className="flex-1 max-w-xl mx-auto">
            <PhaseAlertBanner phase={arenaState.phase} currentSet={arenaState.currentSet} maxSets={arenaState.maxSets} />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowMatchInfo(!showMatchInfo)}
              className="px-2.5 py-1.5 rounded-lg bg-[var(--court-surface)] hover:bg-[var(--court-control-hover)] text-[var(--court-ink)] border border-[var(--court-line)] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              title="Match information and schedule"
            >
              <Info className="w-3.5 h-3.5 text-[var(--court-accent-link)]" />
              <span className="hidden sm:inline">Match info</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              className="p-2 rounded-lg bg-[var(--court-surface)] hover:bg-[var(--court-control-hover)] text-[var(--court-ink-secondary)] border border-[var(--court-line)] transition-colors"
              title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-[var(--court-surface)] hover:bg-[var(--court-control-hover)] text-[var(--court-ink-secondary)] border border-[var(--court-line)] transition-colors"
              title="Toggle fullscreen"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Center Stage: Live Scoreboard OR Sponsor Takeover */}
        {isIdleOrIntermission ? (
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <SponsorTakeover
              sponsors={sponsors}
              upcomingMatches={upcomingMatches}
              arenaName={arenaState.arenaName}
              isIntermission={arenaState.phase === 'INTERMISSION'}
            />
          </div>
        ) : (
          <div className="flex-1 min-h-0 h-full flex flex-col lg:flex-row items-stretch justify-center gap-3 sm:gap-4 w-full">
            {/* Left Team */}
            <div className="flex-[1.1] min-w-0 h-full flex">
              {leftTeam === 'red' ? (
                <ScoreCard
                  team="red"
                  teamName={arenaState.teamRed}
                  logoUrl={arenaState.teamRedLogoUrl}
                  score={arenaState.redScore}
                  setScore={arenaState.redSetScore}
                  penalties={arenaState.redPenalties}
                  isWinning={arenaState.redScore > arenaState.blueScore}
                  align="left"
                />
              ) : (
                <ScoreCard
                  team="blue"
                  teamName={arenaState.teamBlue}
                  logoUrl={arenaState.teamBlueLogoUrl}
                  score={arenaState.blueScore}
                  setScore={arenaState.blueSetScore}
                  penalties={arenaState.bluePenalties}
                  isWinning={arenaState.blueScore > arenaState.redScore}
                  align="left"
                />
              )}
            </div>

            {/* Center Clock Panel */}
            <div className="flex-[0.9] lg:flex-1 min-w-0 h-full flex flex-col justify-between items-center py-5 px-5 sm:px-6 rounded-2xl bg-[var(--court-surface)] border border-[var(--court-line)]">
              <div className="w-full flex items-center justify-between border-b border-[var(--court-line-soft)] pb-2.5 shrink-0 text-xs font-semibold">
                <span className="text-[var(--court-ink)]">Match clock</span>
                <span className="text-[var(--court-muted)]">
                  Set {arenaState.currentSet} of {arenaState.maxSets}
                </span>
              </div>

              <div className="flex-1 min-h-0 flex items-center justify-center my-auto w-full py-2">
                <TabularTimer
                  serverRemainingMs={arenaState.timeRemainingMs}
                  totalDurationMs={arenaState.totalSetDurationMs}
                  timerRunning={arenaState.timerRunning}
                  phase={arenaState.phase}
                  size="stadium"
                  showProgressBar={true}
                />
              </div>

              <div className="w-full pt-2.5 border-t border-[var(--court-line-soft)] text-center shrink-0 text-xs text-[var(--court-muted)]">
                <span>Best of {arenaState.maxSets} sets</span>
              </div>
            </div>

            {/* Right Team */}
            <div className="flex-[1.1] min-w-0 h-full flex">
              {rightTeam === 'red' ? (
                <ScoreCard
                  team="red"
                  teamName={arenaState.teamRed}
                  logoUrl={arenaState.teamRedLogoUrl}
                  score={arenaState.redScore}
                  setScore={arenaState.redSetScore}
                  penalties={arenaState.redPenalties}
                  isWinning={arenaState.redScore > arenaState.blueScore}
                  align="right"
                />
              ) : (
                <ScoreCard
                  team="blue"
                  teamName={arenaState.teamBlue}
                  logoUrl={arenaState.teamBlueLogoUrl}
                  score={arenaState.blueScore}
                  setScore={arenaState.blueSetScore}
                  penalties={arenaState.bluePenalties}
                  isWinning={arenaState.blueScore > arenaState.redScore}
                  align="right"
                />
              )}
            </div>
          </div>
        )}

        {/* Bottom Set Tracker & Event Strip */}
        <div className="flex flex-wrap items-center justify-between border-t border-[var(--court-line-soft)] pt-2.5 shrink-0 gap-2">
          <SetTracker
            currentSet={arenaState.currentSet}
            maxSets={arenaState.maxSets}
            completedSets={arenaState.completedSets || []}
            teamRed={arenaState.teamRed}
            teamBlue={arenaState.teamBlue}
          />

          <div className="flex items-center gap-3 text-xs text-[var(--court-muted)]">
            <span>{arenaState.recentEvent}</span>
            <span>{arenaState.sideSwap ? 'Sides swapped (Blue left)' : 'Standard sides (Red left)'}</span>
          </div>
        </div>
      </main>

      {/* Match Information Modal */}
      {showMatchInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-sm"
          style={{ backgroundColor: 'var(--court-overlay-backdrop)' }}
        >
          <div className="w-full max-w-2xl rounded-2xl bg-[var(--court-surface)] border border-[var(--court-line)] shadow-2xl p-6 relative">
            <button
              type="button"
              onClick={() => setShowMatchInfo(false)}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-[var(--court-muted)] hover:text-[var(--court-ink)] hover:bg-[var(--court-control-bg)]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5 pr-8">
              <span className="text-xs font-semibold text-[var(--court-muted)] block">{arenaState.arenaName}</span>
              <h2 className="spectator-numeral text-3xl font-black text-[var(--court-ink)]">
                {arenaState.matchNumber}: {arenaState.teamRed} vs {arenaState.teamBlue}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              <div className="p-4 rounded-xl bg-[var(--court-subtle)] border border-[var(--court-line-soft)] text-xs">
                <span className="text-[var(--court-muted)] block mb-1 font-semibold">Match format</span>
                <span className="text-[var(--court-ink)] block text-sm font-bold">
                  {arenaState.maxSets} sets × 3:00 minutes
                </span>
                <span className="text-[var(--court-muted)] block mt-0.5">First team to win 2 sets takes the match</span>
              </div>
              <div className="p-4 rounded-xl bg-[var(--court-subtle)] border border-[var(--court-line-soft)] text-xs">
                <span className="text-[var(--court-muted)] block mb-1 font-semibold">Tournament</span>
                <span className="text-[var(--court-ink)] block text-sm font-bold">{arenaState.tournamentName}</span>
                <span className="text-[var(--court-muted)] block mt-0.5">Live synchronized arena clock</span>
              </div>
            </div>

            <div className="mb-5">
              <h3 className="text-xs font-semibold text-[var(--court-muted)] mb-2">
                Upcoming queue on {arenaState.arenaName}
              </h3>
              <div className="rounded-xl border border-[var(--court-line-soft)] divide-y divide-[var(--court-line-soft)] bg-[var(--court-subtle)] max-h-48 overflow-y-auto">
                {upcomingMatches.map((m) => (
                  <div key={m.id} className="px-4 py-2.5 flex items-center justify-between text-xs">
                    <span className="font-bold text-[var(--court-ink)]">{m.matchNumber}</span>
                    <span>
                      <strong style={{ color: 'var(--drone-red-text)' }}>{m.teamRed}</strong>{' '}
                      <span className="text-[var(--court-muted)]">vs</span>{' '}
                      <strong style={{ color: 'var(--drone-blue-text)' }}>{m.teamBlue}</strong>
                    </span>
                    <span className="text-[var(--court-muted)]">{m.status}</span>
                  </div>
                ))}
                {upcomingMatches.length === 0 && (
                  <div className="text-xs text-[var(--court-muted)] py-5 text-center">
                    No further scheduled matches for this cage.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowMatchInfo(false)}
                className="px-4 py-2 rounded-lg bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-[var(--court-ink)] text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {arenaState.setWinnerBanner?.active && (
        <SetWinnerTakeoverModal banner={arenaState.setWinnerBanner} />
      )}
    </div>
  );
};
