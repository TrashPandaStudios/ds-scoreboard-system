import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useArenaStore } from '../store/arenaStore';
import { useArenaWebSocket } from '../hooks/useArenaWebSocket';
import { useAudioBuzzer } from '../hooks/useAudioBuzzer';
import { HeaderNav } from '../components/common/HeaderNav';
import { ScoreCard } from '../components/display/ScoreCard';
import { TabularTimer } from '../components/common/TabularTimer';
import { SetTracker } from '../components/display/SetTracker';
import { PhaseAlertBanner } from '../components/display/PhaseAlertBanner';
import { SponsorTakeover } from '../components/display/SponsorTakeover';
import { ScheduledMatch } from '../types/scoreboard';
import { Maximize, Minimize } from 'lucide-react';

export const CrowdDisplay: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const arenaId = parseInt(id || '1', 10);

  useArenaWebSocket(arenaId);
  const { arenaStates, activeBuzzerArenaId, buzzerTriggerTimestamp, sponsors, setSponsors } = useArenaStore();
  const { playBuzzer } = useAudioBuzzer();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [upcomingMatches, setUpcomingMatches] = useState<ScheduledMatch[]>([]);

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
    phase: 'IDLE',
    sideSwap: false,
    matchWinner: null,
    serverEpochMs: Date.now(),
    recentEvent: 'Arena Initialized',
    completedSets: [],
  };

  // Fetch Sponsors and Upcoming Matches
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

  // Audio & Visual Buzzer Sync
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
    arenaState.phase === 'IDLE' || arenaState.phase === 'INTERMISSION';

  const isPenaltyPhase = arenaState.phase === 'PENALTY_PHASE';

  // Side-Swap: false = Red Left, Blue Right; true = Blue Left, Red Right
  const leftTeam = arenaState.sideSwap ? 'blue' : 'red';
  const rightTeam = arenaState.sideSwap ? 'red' : 'blue';

  const [showMatchInfo, setShowMatchInfo] = useState(false);

  return (
    <div
      className={`min-h-screen bg-[#080b11] text-slate-100 flex flex-col transition-all duration-200 select-none ${
        isBuzzerFiring ? 'buzzer-active-flash' : ''
      }`}
    >
      {/* Header bar (subtle scoreboard display variant) */}
      <HeaderNav arenaId={arenaId} variant="display" />

      {/* Main Stadium Arena Display */}
      <main className="flex-1 flex flex-col justify-between p-4 lg:p-8 max-w-[1920px] w-full mx-auto relative overflow-hidden">
        {/* Floating Top-Right Action Controls */}
        <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
          <button
            onClick={() => setShowMatchInfo(!showMatchInfo)}
            className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 border border-slate-700 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shadow-lg"
            title="View Cage Match Information & Schedule"
          >
            <span>MATCH INFO</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-colors shadow-lg"
            title="Toggle Fullscreen Stadium View"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>

        {/* Top Banner: Match Phase & Tournament Title */}
        <div className="flex flex-col items-center gap-2 mb-4">
          <div className="text-center">
            <span className="text-xs font-mono tracking-widest text-cyan-400 font-bold uppercase">
              {arenaState.arenaName} • {arenaState.tournamentName} • MATCH {arenaState.matchNumber}
            </span>
          </div>
          <div className="w-full max-w-2xl">
            <PhaseAlertBanner phase={arenaState.phase} currentSet={arenaState.currentSet} />
          </div>
        </div>

        {/* Center Area: Either Live Scoreboard OR Sponsor Takeover */}
        {isIdleOrIntermission ? (
          <div className="flex-1 flex items-center justify-center my-4">
            <SponsorTakeover
              sponsors={sponsors}
              upcomingMatches={upcomingMatches}
              arenaName={arenaState.arenaName}
              isIntermission={arenaState.phase === 'INTERMISSION'}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center my-4">
            {/* Split Scoreboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left Team Card */}
              <div className="lg:col-span-5 flex">
                {leftTeam === 'red' ? (
                  <ScoreCard
                    team="red"
                    teamName={arenaState.teamRed}
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
                    score={arenaState.blueScore}
                    setScore={arenaState.blueSetScore}
                    penalties={arenaState.bluePenalties}
                    isWinning={arenaState.blueScore > arenaState.redScore}
                    align="left"
                  />
                )}
              </div>

              {/* Authoritative Center Clock */}
              <div className="lg:col-span-2 flex flex-col items-center justify-center py-6 px-4 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md shadow-2xl">
                <span className="text-xs font-mono font-black text-cyan-400 tracking-widest uppercase mb-1">
                  MATCH CLOCK
                </span>
                <TabularTimer
                  serverRemainingMs={arenaState.timeRemainingMs}
                  totalDurationMs={arenaState.totalSetDurationMs}
                  timerRunning={arenaState.timerRunning}
                  phase={arenaState.phase}
                  size="hero"
                  showProgressBar={true}
                />
                <div className="mt-6 text-center">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                    SET {arenaState.currentSet} OF {arenaState.maxSets}
                  </span>
                </div>
              </div>

              {/* Right Team Card */}
              <div className="lg:col-span-5 flex">
                {rightTeam === 'red' ? (
                  <ScoreCard
                    team="red"
                    teamName={arenaState.teamRed}
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
                    score={arenaState.blueScore}
                    setScore={arenaState.blueSetScore}
                    penalties={arenaState.bluePenalties}
                    isWinning={arenaState.blueScore > arenaState.redScore}
                    align="right"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Bar: Set Progression & Sponsor Watermark */}
        <div className="flex flex-wrap items-center justify-between border-t border-slate-800/80 pt-4 mt-4 gap-4">
          <SetTracker
            currentSet={arenaState.currentSet}
            maxSets={arenaState.maxSets}
            completedSets={arenaState.completedSets || []}
            teamRed={arenaState.teamRed}
            teamBlue={arenaState.teamBlue}
          />

          <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
            <span>{arenaState.recentEvent}</span>
            <span>•</span>
            <span>{arenaState.sideSwap ? 'SIDES SWAPPED (BLUE/RED)' : 'DEFAULT SIDES (RED/BLUE)'}</span>
          </div>
        </div>
      </main>

      {/* Match Information & Schedule Drawer Modal */}
      {showMatchInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border-2 border-slate-700 shadow-2xl p-6 lg:p-8 relative">
            <button
              onClick={() => setShowMatchInfo(false)}
              className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              ✕
            </button>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-950/60 px-3 py-1 rounded-lg border border-cyan-800 uppercase">
                {arenaState.arenaName} INFORMATION
              </span>
              <h2 className="text-2xl font-display font-black text-white">
                {arenaState.matchNumber}: {arenaState.teamRed} vs {arenaState.teamBlue}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono">
                <span className="text-slate-400 block mb-1 font-bold">MATCH FORMAT</span>
                <span className="text-white block text-sm font-bold">3 Sets × 3:00 Minutes</span>
                <span className="text-slate-500 block mt-1">First team to win 2 sets takes the match</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono">
                <span className="text-slate-400 block mb-1 font-bold">TOURNAMENT</span>
                <span className="text-white block text-sm font-bold">{arenaState.tournamentName}</span>
                <span className="text-slate-500 block mt-1">Authoritative 10Hz sync engine</span>
              </div>
            </div>

            {/* Upcoming Matches for this cage */}
            <div className="mb-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                UPCOMING QUEUE ON THIS CAGE:
              </h3>
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                {upcomingMatches.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono"
                  >
                    <span className="font-bold text-cyan-400">{m.matchNumber}</span>
                    <span className="text-white">
                      <strong className="text-red-400">{m.teamRed}</strong> vs <strong className="text-blue-400">{m.teamBlue}</strong>
                    </span>
                    <span className="text-slate-500">{m.status}</span>
                  </div>
                ))}
                {upcomingMatches.length === 0 && (
                  <div className="text-xs font-mono text-slate-500 py-3 text-center">
                    No further scheduled matches in queue for this cage.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowMatchInfo(false)}
                className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-colors"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
