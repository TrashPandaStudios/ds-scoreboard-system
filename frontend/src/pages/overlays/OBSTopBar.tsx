import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useArenaStore } from '../../store/arenaStore';
import { useArenaWebSocket } from '../../hooks/useArenaWebSocket';
import { useAuthoritativeTimer } from '../../hooks/useAuthoritativeTimer';
import { Shield } from 'lucide-react';

export const OBSTopBar: React.FC = () => {
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
      className={`w-screen h-screen flex flex-col justify-start p-6 select-none overflow-hidden ${
        isBuzzerFiring ? 'buzzer-active-flash' : ''
      }`}
      style={{ background: 'transparent' }}
    >
      {/* 1920x200 Top Bar HUD */}
      <div className="w-full max-w-4xl mx-auto flex items-stretch rounded-2xl overflow-hidden bg-slate-950/95 border-2 border-slate-700/80 shadow-[0_12px_36px_rgba(0,0,0,0.8)] backdrop-blur-md">
        {/* Left Team */}
        <div
          className={`flex-1 flex items-center justify-between px-5 py-2.5 ${
            leftTeam === 'red' ? 'bg-red-950/40' : 'bg-blue-950/40'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs ${
                leftTeam === 'red' ? 'bg-red-600' : 'bg-blue-600'
              }`}
            >
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-display font-black text-lg text-white truncate max-w-[160px]">
              {leftTeam === 'red' ? state.teamRed : state.teamBlue}
            </span>
          </div>

          <span
            className={`font-display font-black text-4xl tabular-nums ${
              leftTeam === 'red' ? 'text-red-500 glow-red' : 'text-blue-400 glow-blue'
            }`}
          >
            {leftTeam === 'red' ? state.redScore : state.blueScore}
          </span>
        </div>

        {/* Center Clock */}
        <div className="w-40 bg-slate-900 flex flex-col items-center justify-center px-3 py-1 border-x border-slate-800">
          <span className="font-mono font-black text-2xl text-white tabular-nums">
            {formattedTime}
          </span>
          <span className="text-[9px] font-mono text-cyan-400 font-bold uppercase tracking-widest">
            SET {state.currentSet}/{state.maxSets}
          </span>
        </div>

        {/* Right Team */}
        <div
          className={`flex-1 flex items-center justify-between px-5 py-2.5 ${
            rightTeam === 'red' ? 'bg-red-950/40' : 'bg-blue-950/40'
          }`}
        >
          <span
            className={`font-display font-black text-4xl tabular-nums ${
              rightTeam === 'red' ? 'text-red-500 glow-red' : 'text-blue-400 glow-blue'
            }`}
          >
            {rightTeam === 'red' ? state.redScore : state.blueScore}
          </span>

          <div className="flex items-center gap-2.5">
            <span className="font-display font-black text-lg text-white truncate max-w-[160px] text-right">
              {rightTeam === 'red' ? state.teamRed : state.teamBlue}
            </span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs ${
                rightTeam === 'red' ? 'bg-red-600' : 'bg-blue-600'
              }`}
            >
              <Shield className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
