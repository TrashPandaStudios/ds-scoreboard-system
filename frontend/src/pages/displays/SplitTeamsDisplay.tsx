import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useArenaStore } from '../../store/arenaStore';
import { useArenaWebSocket } from '../../hooks/useArenaWebSocket';
import { useAuthoritativeTimer } from '../../hooks/useAuthoritativeTimer';
import { useAudioBuzzer } from '../../hooks/useAudioBuzzer';
import { HeaderNav } from '../../components/common/HeaderNav';
import { PenaltyPips } from '../../components/display/PenaltyPips';
import { SetTracker } from '../../components/display/SetTracker';
import { PhaseAlertBanner } from '../../components/display/PhaseAlertBanner';
import { SetWinnerTakeoverModal } from '../../components/display/SetWinnerTakeoverModal';
import { Shield, Target, Trophy, Maximize, Minimize } from 'lucide-react';
import { TeamBadge } from '../../components/common/TeamBadge';

export const SplitTeamsDisplay: React.FC = () => {
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
    completedSets: [],
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

  const leftTeam = state.sideSwap ? 'blue' : 'red';
  const rightTeam = state.sideSwap ? 'red' : 'blue';
  const leftTeamName = leftTeam === 'red' ? state.teamRed : state.teamBlue;
  const rightTeamName = rightTeam === 'red' ? state.teamRed : state.teamBlue;
  const leftTeamLogo = leftTeam === 'red' ? state.teamRedLogoUrl : state.teamBlueLogoUrl;
  const rightTeamLogo = rightTeam === 'red' ? state.teamRedLogoUrl : state.teamBlueLogoUrl;

  return (
    <div
      className={`h-screen max-h-screen w-full bg-[#080b11] text-slate-100 flex flex-col select-none overflow-hidden ${
        isBuzzerFiring ? 'buzzer-active-flash' : ''
      }`}
    >
      <HeaderNav arenaId={arenaId} variant="display" />

      <main className="flex-1 min-h-0 h-full flex flex-col justify-between px-3 sm:px-6 lg:px-8 py-2 sm:py-3 w-full relative overflow-hidden">
        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="absolute top-2 right-3 sm:top-3 sm:right-6 z-40 p-2 sm:p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-colors shadow-lg"
          title="Toggle Fullscreen Split View"
        >
          {isFullscreen ? <Minimize className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />}
        </button>

        {/* Top Header: Phase & Cage Info */}
        <div className="flex flex-col items-center gap-1 shrink-0 mb-1 sm:mb-2">
          <div className="text-center">
            <span className="text-[10px] sm:text-xs font-mono tracking-widest text-cyan-400 font-bold uppercase">
              {state.arenaName} • DEDICATED SPLIT TEAM TELEMETRY • MATCH {state.matchNumber}
            </span>
          </div>
          <div className="w-full max-w-2xl">
            <PhaseAlertBanner phase={state.phase} currentSet={state.currentSet} />
          </div>
        </div>

        {/* Center: High-Impact Side-by-Side Dual Team Monitor */}
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 lg:gap-6 items-stretch justify-center w-full h-full flex-1 min-h-0 my-1 sm:my-2">
          {/* Left Team Side */}
          <div
            className={`flex-[1.1] min-w-0 h-full flex flex-col justify-between p-4 sm:p-6 lg:p-7 rounded-3xl border-2 transition-all ${
              leftTeam === 'red'
                ? 'bg-gradient-to-b from-red-950/50 via-slate-900/90 to-slate-950/95 border-red-500/40 box-glow-red'
                : 'bg-gradient-to-b from-blue-950/50 via-slate-900/90 to-slate-950/95 border-blue-500/40 box-glow-blue'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 sm:pb-4 shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <TeamBadge
                  teamName={leftTeamName}
                  logoUrl={leftTeamLogo}
                  side={leftTeam}
                  size="lg"
                  className="rounded-2xl shrink-0"
                />
                <div className="min-w-0">
                  <span
                    className={`text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider ${
                      leftTeam === 'red' ? 'text-red-400' : 'text-blue-400'
                    }`}
                  >
                    {leftTeam === 'red' ? 'RED TEAM' : 'BLUE TEAM'}
                  </span>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-display font-black text-white truncate">
                    {leftTeam === 'red' ? state.teamRed : state.teamBlue}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-mono bg-slate-900 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-slate-800 shrink-0">
                <Target className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-cyan-400" />
                <span>STRIKER #1</span>
              </div>
            </div>

            {/* Score */}
            <div className="flex-1 min-h-0 flex items-center justify-center my-auto w-full py-2">
              <div
                className={`font-display font-black text-[clamp(6rem,14vw,22rem)] leading-none tabular-nums select-none ${
                  leftTeam === 'red' ? 'text-red-500 glow-red' : 'text-blue-400 glow-blue'
                }`}
              >
                {leftTeam === 'red' ? state.redScore : state.blueScore}
              </div>
            </div>

            {/* Footer: Penalties & Sets Won */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-3 sm:pt-4 shrink-0">
              <PenaltyPips
                count={leftTeam === 'red' ? state.redPenalties : state.bluePenalties}
                team={leftTeam}
                size="md"
              />
              <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-mono text-amber-400 font-bold bg-slate-900 px-2.5 sm:px-3 py-1 rounded-xl border border-slate-800">
                <Trophy className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                <span>SETS: {leftTeam === 'red' ? state.redSetScore : state.blueSetScore}</span>
              </div>
            </div>
          </div>

          {/* Center Dividing HUD: Clock & Set Tracker */}
          <div className="flex-[0.9] lg:flex-1 min-w-0 h-full flex flex-col justify-between items-center p-4 sm:p-6 rounded-3xl bg-slate-900/90 border-2 border-slate-800 shadow-2xl">
            <div className="w-full flex items-center justify-between border-b border-slate-800 pb-2 shrink-0">
              <span className="text-[10px] sm:text-xs font-mono font-black text-cyan-400 tracking-widest uppercase">
                MATCH CLOCK
              </span>
              <span className="text-[10px] sm:text-xs font-mono text-slate-400 font-bold uppercase">
                SET {state.currentSet} OF {state.maxSets}
              </span>
            </div>

            <div className="flex-1 min-h-0 flex items-center justify-center my-auto w-full py-2">
              <span
                className={`font-mono font-black text-[clamp(3.5rem,6.5vw,9.5rem)] tabular-nums leading-none whitespace-nowrap ${
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

            {/* Set Progression */}
            <div className="w-full pt-3 border-t border-slate-800 flex flex-col items-center gap-1.5 shrink-0">
              <SetTracker
                currentSet={state.currentSet}
                maxSets={state.maxSets}
                completedSets={state.completedSets || []}
                teamRed={state.teamRed}
                teamBlue={state.teamBlue}
              />
            </div>
          </div>

          {/* Right Team Side */}
          <div
            className={`flex-[1.1] min-w-0 h-full flex flex-col justify-between p-4 sm:p-6 lg:p-7 rounded-3xl border-2 transition-all ${
              rightTeam === 'red'
                ? 'bg-gradient-to-b from-red-950/50 via-slate-900/90 to-slate-950/95 border-red-500/40 box-glow-red'
                : 'bg-gradient-to-b from-blue-950/50 via-slate-900/90 to-slate-950/95 border-blue-500/40 box-glow-blue'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 sm:pb-4 shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <TeamBadge
                  teamName={rightTeamName}
                  logoUrl={rightTeamLogo}
                  side={rightTeam}
                  size="lg"
                  className="rounded-2xl shrink-0"
                />
                <div className="min-w-0">
                  <span
                    className={`text-[10px] sm:text-xs font-mono font-black uppercase tracking-wider ${
                      rightTeam === 'red' ? 'text-red-400' : 'text-blue-400'
                    }`}
                  >
                    {rightTeam === 'red' ? 'RED TEAM' : 'BLUE TEAM'}
                  </span>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-display font-black text-white truncate">
                    {rightTeam === 'red' ? state.teamRed : state.teamBlue}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-mono bg-slate-900 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-slate-800 shrink-0">
                <Target className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-cyan-400" />
                <span>STRIKER #1</span>
              </div>
            </div>

            {/* Score */}
            <div className="flex-1 min-h-0 flex items-center justify-center my-auto w-full py-2">
              <div
                className={`font-display font-black text-[clamp(6rem,14vw,22rem)] leading-none tabular-nums select-none ${
                  rightTeam === 'red' ? 'text-red-500 glow-red' : 'text-blue-400 glow-blue'
                }`}
              >
                {rightTeam === 'red' ? state.redScore : state.blueScore}
              </div>
            </div>

            {/* Footer: Penalties & Sets Won */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-3 sm:pt-4 shrink-0">
              <PenaltyPips
                count={rightTeam === 'red' ? state.redPenalties : state.bluePenalties}
                team={rightTeam}
                size="md"
              />
              <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-mono text-amber-400 font-bold bg-slate-900 px-2.5 sm:px-3 py-1 rounded-xl border border-slate-800">
                <Trophy className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                <span>SETS: {rightTeam === 'red' ? state.redSetScore : state.blueSetScore}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Status Info */}
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 shrink-0 text-[10px] sm:text-xs font-mono text-slate-500">
          <span>{state.recentEvent}</span>
          <span>•</span>
          <span>{state.sideSwap ? 'ORIENTATION: BLUE ON LEFT / RED ON RIGHT' : 'ORIENTATION: RED ON LEFT / BLUE ON RIGHT'}</span>
        </div>
      </main>

      {/* Authoritative Set & Match Winner Takeover Popup */}
      {state.setWinnerBanner?.active && (
        <SetWinnerTakeoverModal banner={state.setWinnerBanner} />
      )}
    </div>
  );
};
