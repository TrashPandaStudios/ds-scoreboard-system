import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useArenaStore } from '../../store/arenaStore';
import { useArenaWebSocket } from '../../hooks/useArenaWebSocket';
import { useAuthoritativeTimer } from '../../hooks/useAuthoritativeTimer';
import { useAudioBuzzer } from '../../hooks/useAudioBuzzer';
import { HeaderNav } from '../../components/common/HeaderNav';
import { PhaseAlertBanner } from '../../components/display/PhaseAlertBanner';
import { SetWinnerTakeoverModal } from '../../components/display/SetWinnerTakeoverModal';
import { Clock, Play, Pause, AlertTriangle, Maximize, Minimize, Shield } from 'lucide-react';
import { TeamBadge } from '../../components/common/TeamBadge';

export const DedicatedTimerDisplay: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const arenaId = parseInt(id || '1', 10);

  useArenaWebSocket(arenaId);
  const { arenaStates, activeBuzzerArenaId, buzzerTriggerTimestamp } = useArenaStore();
  const { playBuzzer } = useAudioBuzzer();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const state = arenaStates[arenaId] || {
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
    phase: 'NORMAL_PHASE',
    sideSwap: false,
  };

  const { formattedTime, formattedWithTenths, progressPercent, currentMs } = useAuthoritativeTimer({
    serverRemainingMs: state.timeRemainingMs,
    totalDurationMs: state.totalSetDurationMs,
    timerRunning: state.timerRunning,
  });

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

  const isPenaltyPhase = state.phase === 'PENALTY_PHASE';
  const isLowTime = currentMs <= 10000 && currentMs > 0;
  const isZero = currentMs <= 0;

  return (
    <div
      className={`min-h-screen bg-[#080b11] text-slate-100 flex flex-col select-none ${
        isBuzzerFiring ? 'buzzer-active-flash' : ''
      }`}
    >
      <HeaderNav arenaId={arenaId} variant="display" />

      <main className="flex-1 flex flex-col justify-between p-6 lg:p-12 max-w-[1920px] w-full mx-auto relative overflow-hidden bg-gradient-to-b from-slate-950 via-[#080b11] to-slate-950">
        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="absolute top-6 right-6 z-40 p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-colors shadow-lg"
          title="Toggle Fullscreen Dedicated Clock View"
        >
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>

        {/* Top Header: Tournament & Arena Header */}
        <div className="flex flex-col items-center gap-2 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-800 uppercase">
              {state.arenaName} • DEDICATED STADIUM CLOCK
            </span>
          </div>
          <h1 className="text-xl lg:text-2xl font-display font-bold text-slate-300">
            {state.tournamentName} • MATCH {state.matchNumber}
          </h1>
          <div className="w-full max-w-xl mt-2">
            <PhaseAlertBanner phase={state.phase} currentSet={state.currentSet} />
          </div>
        </div>

        {/* Center: Gigantic Authoritative Timer Display */}
        <div className="my-auto flex flex-col items-center justify-center text-center">
          <div className="relative">
            <span
              className={`font-mono tabular-nums leading-none select-none tracking-tighter text-[140px] sm:text-[200px] md:text-[260px] lg:text-[320px] font-black transition-colors duration-150 ${
                isZero
                  ? 'text-rose-500 glow-red animate-pulse'
                  : isPenaltyPhase
                  ? 'text-amber-400 glow-amber'
                  : isLowTime
                  ? 'text-rose-400 glow-red animate-pulse-fast'
                  : state.timerRunning
                  ? 'text-white'
                  : 'text-slate-300 opacity-90'
              }`}
            >
              {isLowTime || state.phase === 'COUNTDOWN' ? formattedWithTenths : formattedTime}
            </span>

            {/* Floating Timer Status Pill */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-6 py-1.5 rounded-full bg-slate-900/95 border border-slate-700 text-sm font-mono tracking-widest text-slate-300 backdrop-blur-md shadow-2xl">
              {state.timerRunning ? (
                <>
                  <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                  <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                  <span className="text-emerald-300 font-black">MATCH CLOCK ACTIVE</span>
                </>
              ) : isZero ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span className="text-rose-400 font-black">TIME EXPIRED</span>
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-amber-300 font-black">CLOCK PAUSED</span>
                </>
              )}
            </div>
          </div>

          {/* Large Synchronized Progress Bar */}
          <div className="w-full max-w-4xl h-4 bg-slate-900 rounded-full mt-12 overflow-hidden border-2 border-slate-800 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-100 ease-linear ${
                isPenaltyPhase
                  ? 'bg-amber-400 box-glow-amber'
                  : isLowTime
                  ? 'bg-rose-500 box-glow-red'
                  : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Bottom Banner: Match Scores Summary Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-6">
          {/* Red Team Snapshot */}
          <div className="flex items-center gap-3">
            <TeamBadge
              teamName={state.teamRed}
              logoUrl={state.teamRedLogoUrl}
              side="red"
              size="md"
            />
            <div>
              <span className="text-[10px] font-mono text-red-400 uppercase font-bold block">
                RED TEAM (SETS: {state.redSetScore})
              </span>
              <span className="text-xl font-display font-black text-white">{state.teamRed}</span>
            </div>
            <span className="text-4xl font-display font-black text-red-500 tabular-nums ml-2">
              {state.redScore}
            </span>
          </div>

          {/* Set Status */}
          <div className="flex items-center gap-2 px-6 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-cyan-300">
            <span>SET {state.currentSet} OF {state.maxSets}</span>
          </div>

          {/* Blue Team Snapshot */}
          <div className="flex items-center gap-3 text-right">
            <span className="text-4xl font-display font-black text-blue-400 tabular-nums mr-2">
              {state.blueScore}
            </span>
            <div>
              <span className="text-[10px] font-mono text-blue-400 uppercase font-bold block">
                BLUE TEAM (SETS: {state.blueSetScore})
              </span>
              <span className="text-xl font-display font-black text-white">{state.teamBlue}</span>
            </div>
            <TeamBadge
              teamName={state.teamBlue}
              logoUrl={state.teamBlueLogoUrl}
              side="blue"
              size="md"
            />
          </div>
        </div>
      </main>

      {/* Authoritative Set & Match Winner Takeover Popup */}
      {state.setWinnerBanner?.active && (
        <SetWinnerTakeoverModal banner={state.setWinnerBanner} />
      )}
    </div>
  );
};
