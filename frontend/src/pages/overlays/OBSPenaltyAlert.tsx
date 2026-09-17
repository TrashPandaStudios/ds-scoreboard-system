import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useArenaStore } from '../../store/arenaStore';
import { useArenaWebSocket } from '../../hooks/useArenaWebSocket';
import { useAuthoritativeTimer } from '../../hooks/useAuthoritativeTimer';
import { AlertTriangle, Zap } from 'lucide-react';

export const OBSPenaltyAlert: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const arenaId = parseInt(id || '1', 10);

  useArenaWebSocket(arenaId);
  const { arenaStates } = useArenaStore();

  const state = arenaStates[arenaId] || {
    arenaId,
    arenaName: `Arena ${arenaId}`,
    teamRed: 'Red Phoenix',
    teamBlue: 'Blue Comets',
    redScore: 0,
    blueScore: 0,
    redPenalties: 1,
    bluePenalties: 2,
    timeRemainingMs: 30000,
    totalSetDurationMs: 30000,
    timerRunning: false,
    phase: 'PENALTY_PHASE',
  };

  const { formattedTime } = useAuthoritativeTimer({
    serverRemainingMs: state.timeRemainingMs,
    totalDurationMs: state.totalSetDurationMs,
    timerRunning: state.timerRunning,
  });

  useEffect(() => {
    document.documentElement.style.background = 'transparent';
    document.body.style.background = 'transparent';
    return () => {
      document.documentElement.style.background = '';
      document.body.style.background = '';
    };
  }, []);

  const isPenaltyPhase = state.phase === 'PENALTY_PHASE';

  if (!isPenaltyPhase) {
    return <div style={{ background: 'transparent' }} className="w-screen h-screen" />;
  }

  return (
    <div
      className="w-screen h-screen flex flex-col items-center justify-center p-8 select-none overflow-hidden"
      style={{ background: 'transparent' }}
    >
      <div className="w-full max-w-3xl rounded-3xl overflow-hidden bg-slate-950/95 border-4 border-amber-500 shadow-[0_0_80px_rgba(245,158,11,0.6)] backdrop-blur-xl animate-bounce">
        {/* Hazard Animated Bar Top */}
        <div className="h-4 w-full hazard-bar" />

        <div className="p-8 flex flex-col items-center text-center gap-4">
          <div className="flex items-center gap-3 text-amber-400">
            <AlertTriangle className="w-10 h-10 animate-spin" />
            <h1 className="text-4xl font-display font-black text-white uppercase tracking-widest drop-shadow-lg">
              PENALTY SHOOTOUT PHASE
            </h1>
            <AlertTriangle className="w-10 h-10 animate-spin" />
          </div>

          <div className="flex items-center gap-6 my-2 text-xl font-bold font-mono">
            <span className="text-red-400">
              {state.teamRed} ({state.redPenalties} penalties)
            </span>
            <span className="text-slate-500">VS</span>
            <span className="text-blue-400">
              {state.teamBlue} ({state.bluePenalties} penalties)
            </span>
          </div>

          <div className="flex items-center gap-2 px-6 py-2 rounded-2xl bg-amber-500/20 border border-amber-500/50">
            <Zap className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
            <span className="font-mono font-black text-3xl text-amber-300 tabular-nums">
              {formattedTime}
            </span>
          </div>
        </div>

        {/* Hazard Animated Bar Bottom */}
        <div className="h-4 w-full hazard-bar" />
      </div>
    </div>
  );
};
