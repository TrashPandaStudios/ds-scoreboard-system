import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useArenaStore } from '../../store/arenaStore';
import { useArenaWebSocket } from '../../hooks/useArenaWebSocket';
import { useAuthoritativeTimer } from '../../hooks/useAuthoritativeTimer';
import { Shield, Target, AlertTriangle } from 'lucide-react';

export const OBSLowerThird: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const arenaId = parseInt(id || '1', 10);

  useArenaWebSocket(arenaId);
  const { arenaStates, activeBuzzerArenaId, buzzerTriggerTimestamp } = useArenaStore();

  const state = arenaStates[arenaId] || {
    arenaId,
    arenaName: `Arena ${arenaId}`,
    matchNumber: 'M-101',
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

  const { formattedTime } = useAuthoritativeTimer({
    serverRemainingMs: state.timeRemainingMs,
    totalDurationMs: state.totalSetDurationMs,
    timerRunning: state.timerRunning,
  });

  const isBuzzerFiring =
    activeBuzzerArenaId === arenaId && Date.now() - buzzerTriggerTimestamp < 2500;

  const isPenaltyPhase = state.phase === 'PENALTY_PHASE';

  // Force body/root background to transparent for OBS Browser Source
  useEffect(() => {
    document.documentElement.style.background = 'transparent';
    document.body.style.background = 'transparent';
    return () => {
      document.documentElement.style.background = '';
      document.body.style.background = '';
    };
  }, []);

  const leftTeam = state.sideSwap ? 'blue' : 'red';
  const rightTeam = state.sideSwap ? 'red' : 'blue';

  return (
    <div
      className={`w-screen h-screen flex flex-col justify-end p-8 select-none overflow-hidden transition-all duration-200 ${
        isBuzzerFiring ? 'buzzer-active-flash' : ''
      }`}
      style={{ background: 'transparent' }}
    >
      {/* Lower Third Main Floating Broadcast Banner (1920x1080 bottom anchor) */}
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-2">
        {/* Penalty Warning Callout if active */}
        {isPenaltyPhase && (
          <div className="flex items-center justify-center gap-2 py-1.5 px-4 rounded-xl bg-amber-950/90 border border-amber-500 text-amber-300 text-xs font-mono font-black uppercase tracking-widest shadow-xl animate-pulse self-center">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>PENALTY SHOOTOUT IN PROGRESS</span>
          </div>
        )}

        {/* Main Broadcast Bar */}
        <div className="flex items-stretch rounded-2xl overflow-hidden bg-slate-950/95 border-2 border-slate-700/80 shadow-[0_16px_40px_rgba(0,0,0,0.8)] backdrop-blur-md">
          {/* Left Team (Red or Blue) */}
          <div
            className={`flex-1 flex items-center justify-between px-6 py-3 border-r border-slate-800 ${
              leftTeam === 'red' ? 'bg-gradient-to-r from-red-950/80 to-transparent' : 'bg-gradient-to-r from-blue-950/80 to-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold shadow-md ${
                  leftTeam === 'red' ? 'bg-red-600' : 'bg-blue-600'
                }`}
              >
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-wider block">
                  {leftTeam === 'red' ? 'RED TEAM' : 'BLUE TEAM'} (SETS: {leftTeam === 'red' ? state.redSetScore : state.blueSetScore})
                </span>
                <span className="text-xl font-display font-black text-white tracking-wide">
                  {leftTeam === 'red' ? state.teamRed : state.teamBlue}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Penalty Counter Badge */}
              <div
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-mono font-black border transition-all duration-300 ${
                  (leftTeam === 'red' ? state.redPenalties : state.bluePenalties) > 0
                    ? leftTeam === 'red'
                      ? 'bg-rose-950/80 text-rose-300 border-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                      : 'bg-amber-950/80 text-amber-300 border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                    : 'bg-slate-900/80 text-slate-500 border-slate-800'
                }`}
              >
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">PENALTIES</span>
                <span className="tabular-nums">
                  {leftTeam === 'red' ? state.redPenalties : state.bluePenalties}
                </span>
              </div>

              {/* Large Score */}
              <span
                className={`text-5xl font-display font-black tabular-nums tracking-tight ${
                  leftTeam === 'red' ? 'text-red-500 glow-red' : 'text-blue-400 glow-blue'
                }`}
              >
                {leftTeam === 'red' ? state.redScore : state.blueScore}
              </span>
            </div>
          </div>

          {/* Center Clock & Set Ticker */}
          <div className="w-48 bg-slate-900/90 flex flex-col items-center justify-center px-4 py-2 border-r border-slate-800">
            <span
              className={`font-mono font-black text-3xl tabular-nums tracking-tight ${
                isPenaltyPhase
                  ? 'text-amber-400 glow-amber'
                  : state.timerRunning
                  ? 'text-white'
                  : 'text-amber-300 opacity-90'
              }`}
            >
              {formattedTime}
            </span>
            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest mt-0.5">
              SET {state.currentSet} OF {state.maxSets}
            </span>
          </div>

          {/* Right Team */}
          <div
            className={`flex-1 flex items-center justify-between px-6 py-3 ${
              rightTeam === 'red' ? 'bg-gradient-to-l from-red-950/80 to-transparent' : 'bg-gradient-to-l from-blue-950/80 to-transparent'
            }`}
          >
            <div className="flex items-center gap-4">
              {/* Large Score */}
              <span
                className={`text-5xl font-display font-black tabular-nums tracking-tight ${
                  rightTeam === 'red' ? 'text-red-500 glow-red' : 'text-blue-400 glow-blue'
                }`}
              >
                {rightTeam === 'red' ? state.redScore : state.blueScore}
              </span>

              {/* Penalty Counter Badge */}
              <div
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-mono font-black border transition-all duration-300 ${
                  (rightTeam === 'red' ? state.redPenalties : state.bluePenalties) > 0
                    ? rightTeam === 'red'
                      ? 'bg-rose-950/80 text-rose-300 border-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                      : 'bg-amber-950/80 text-amber-300 border-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                    : 'bg-slate-900/80 text-slate-500 border-slate-800'
                }`}
              >
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">PENALTIES</span>
                <span className="tabular-nums">
                  {rightTeam === 'red' ? state.redPenalties : state.bluePenalties}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-right">
              <div>
                <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-wider block">
                  {rightTeam === 'red' ? 'RED TEAM' : 'BLUE TEAM'} (SETS: {rightTeam === 'red' ? state.redSetScore : state.blueSetScore})
                </span>
                <span className="text-xl font-display font-black text-white tracking-wide">
                  {rightTeam === 'red' ? state.teamRed : state.teamBlue}
                </span>
              </div>
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold shadow-md ${
                  rightTeam === 'red' ? 'bg-red-600' : 'bg-blue-600'
                }`}
              >
                <Shield className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
