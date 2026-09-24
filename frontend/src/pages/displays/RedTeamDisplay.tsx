import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useArenaStore } from '../../store/arenaStore';
import { useArenaWebSocket } from '../../hooks/useArenaWebSocket';
import { useAuthoritativeTimer } from '../../hooks/useAuthoritativeTimer';
import { useAudioBuzzer } from '../../hooks/useAudioBuzzer';
import { HeaderNav } from '../../components/common/HeaderNav';
import { PenaltyPips } from '../../components/display/PenaltyPips';
import { SetWinnerTakeoverModal } from '../../components/display/SetWinnerTakeoverModal';
import { Shield, Target, Trophy, Maximize, Minimize, AlertTriangle } from 'lucide-react';
import { TeamBadge } from '../../components/common/TeamBadge';

export const RedTeamDisplay: React.FC = () => {
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

  const { formattedTime, formattedWithTenths, currentMs } = useAuthoritativeTimer({
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
  const leadDiff = state.redScore - state.blueScore;

  return (
    <div
      className={`h-screen max-h-screen w-full bg-[#080b11] text-slate-100 flex flex-col select-none overflow-hidden ${
        isBuzzerFiring ? 'buzzer-active-flash' : ''
      }`}
    >
      <HeaderNav arenaId={arenaId} variant="display" />

      <main className="flex-1 min-h-0 h-full w-full flex flex-col justify-between p-4 sm:p-6 lg:p-8 xl:p-10 relative overflow-hidden bg-gradient-to-b from-red-950/30 via-[#080b11] to-red-950/40">
        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="absolute top-3 right-3 sm:top-5 sm:right-6 z-40 p-2 sm:p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-colors shadow-lg"
          title="Toggle Fullscreen Monitor View"
        >
          {isFullscreen ? <Minimize className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />}
        </button>

        {/* Top Header Bar */}
        <div className="flex items-center justify-between gap-4 border-b border-red-500/30 pb-3 sm:pb-4 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <TeamBadge
              teamName={state.teamRed}
              logoUrl={state.teamRedLogoUrl}
              side="red"
              size="lg"
              className="rounded-2xl shadow-red-600/40 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] sm:text-xs font-mono font-black uppercase tracking-widest text-red-400 bg-red-500/20 px-2.5 sm:px-3 py-0.5 rounded-full border border-red-500/40">
                  RED TEAM PILOT BOX MONITOR
                </span>
                <span className="text-[10px] sm:text-xs font-mono text-cyan-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {state.arenaName}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-display font-black text-white tracking-wide mt-1 truncate">
                {state.teamRed}
              </h1>
            </div>
          </div>

          {/* Synchronized Compact Clock */}
          <div className="flex items-center gap-3 sm:gap-4 bg-slate-900/90 px-4 sm:px-6 py-2 sm:py-2.5 rounded-2xl border border-red-500/30 shadow-xl shrink-0">
            <div className="flex flex-col items-end">
              <span className="text-[9px] sm:text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                SET {state.currentSet} OF {state.maxSets}
              </span>
              <span className="text-[11px] sm:text-xs font-mono font-black text-cyan-400 uppercase">
                {state.phase}
              </span>
            </div>
            <span
              className={`font-mono font-black text-3xl sm:text-4xl lg:text-5xl xl:text-6xl tabular-nums leading-none ${
                isPenaltyPhase
                  ? 'text-amber-400 glow-amber'
                  : isLowTime
                  ? 'text-rose-400 glow-red animate-pulse'
                  : 'text-white'
              }`}
            >
              {isLowTime ? formattedWithTenths : formattedTime}
            </span>
          </div>
        </div>

        {/* Center: Massive Red Team Score Card & Striker HUD */}
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-center my-auto py-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm lg:text-base font-mono text-red-400 bg-red-950/60 px-3.5 sm:px-5 py-1 rounded-full border border-red-500/40 mb-2 sm:mb-4 shrink-0">
            <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 animate-pulse" />
            <span>DESIGNATED STRIKER TAG #1</span>
          </div>

          <div className="font-display font-black text-[clamp(8rem,34vh,38rem)] leading-none text-red-500 glow-red select-none tabular-nums py-1 sm:py-2">
            {state.redScore}
          </div>

          {/* Lead/Deficit Pill */}
          <div className="mt-2 sm:mt-4 shrink-0">
            {leadDiff > 0 ? (
              <span className="px-4 sm:px-6 py-1.5 sm:py-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-xs sm:text-sm lg:text-base font-mono font-black">
                ▲ LEADING BY +{leadDiff} GOAL{leadDiff > 1 ? 'S' : ''}
              </span>
            ) : leadDiff < 0 ? (
              <span className="px-4 sm:px-6 py-1.5 sm:py-2 rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-400 text-xs sm:text-sm lg:text-base font-mono font-black">
                ▼ DEFICIT: {leadDiff} GOAL{leadDiff < -1 ? 'S' : ''}
              </span>
            ) : (
              <span className="px-4 sm:px-6 py-1.5 sm:py-2 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 text-xs sm:text-sm lg:text-base font-mono font-bold">
                ● TIED SET SCORE
              </span>
            )}
          </div>
        </div>

        {/* Bottom Bar: Penalties, Sets Won, and Opponent Quick Check */}
        <div className="grid grid-cols-3 items-center justify-between gap-3 sm:gap-6 border-t border-red-500/30 pt-3 sm:pt-4 shrink-0">
          {/* Penalties */}
          <div className="flex items-center gap-2 sm:gap-3">
            <PenaltyPips count={state.redPenalties} team="red" size="lg" />
          </div>

          {/* Sets Won */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 bg-slate-900/80 px-3 sm:px-6 py-2 sm:py-3 rounded-2xl border border-slate-800">
            <Trophy className="w-4 h-4 sm:w-6 sm:h-6 text-amber-400 shrink-0" />
            <div className="text-left">
              <span className="text-[9px] sm:text-[10px] font-mono text-slate-400 block uppercase font-bold">
                TOTAL SETS WON
              </span>
              <span className="text-lg sm:text-2xl font-mono font-black text-white leading-tight">
                {state.redSetScore} <span className="text-xs sm:text-sm font-normal text-slate-500">/ 2 to win</span>
              </span>
            </div>
          </div>

          {/* Opponent Quick Telemetry */}
          <div className="flex items-center justify-end gap-2 sm:gap-3 text-right">
            <div className="min-w-0">
              <span className="text-[9px] sm:text-[10px] font-mono text-slate-400 uppercase block font-bold truncate">
                OPPONENT ({state.teamBlue})
              </span>
              <span className="text-lg sm:text-2xl font-display font-black text-blue-400 tabular-nums">
                {state.blueScore} pts <span className="text-[10px] sm:text-xs text-slate-500">({state.bluePenalties} pen)</span>
              </span>
            </div>
            <TeamBadge
              teamName={state.teamBlue}
              logoUrl={state.teamBlueLogoUrl}
              side="blue"
              size="md"
              className="shrink-0"
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
