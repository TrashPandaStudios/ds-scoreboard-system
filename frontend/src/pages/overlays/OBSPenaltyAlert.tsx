import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useArenaStore } from '../../store/arenaStore';
import { useArenaWebSocket } from '../../hooks/useArenaWebSocket';
import { useAuthoritativeTimer } from '../../hooks/useAuthoritativeTimer';
import { AlertTriangle } from 'lucide-react';

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
    phase: 'PENALTY_PHASE' as const,
  };

  const { formattedTime } = useAuthoritativeTimer({
    serverRemainingMs: state.timeRemainingMs,
    totalDurationMs: state.totalSetDurationMs,
    timerRunning: state.timerRunning,
    phase: state.phase,
  });

  useEffect(() => {
    document.documentElement.style.background = 'transparent';
    document.body.style.background = 'transparent';
    return () => {
      document.documentElement.style.background = '';
      document.body.style.background = '';
    };
  }, []);

  if (state.phase !== 'PENALTY_PHASE') {
    return <div style={{ background: 'transparent' }} className="w-screen h-screen" />;
  }

  return (
    <div
      className="w-screen h-screen flex flex-col items-center justify-center p-8 select-none overflow-hidden"
      style={{ background: 'transparent' }}
    >
      <div className="w-full max-w-3xl rounded-2xl overflow-hidden bg-[#151B23]/95 border-2 border-[#D29922] shadow-[0_20px_60px_rgba(0,0,0,0.75)] backdrop-blur-md">
        <div className="h-3 w-full hazard-bar" />

        <div className="p-8 flex flex-col items-center text-center gap-5">
          <div className="flex items-center gap-3 text-[#F2CC60]">
            <AlertTriangle className="w-8 h-8" />
            <h1 className="spectator-numeral text-5xl font-black text-[#F0F6FC] leading-none">
              Penalty shootout
            </h1>
          </div>

          <div className="flex items-center justify-center gap-5 flex-wrap">
            <div className="flex items-center gap-3 bg-[#F85149]/15 px-5 py-2.5 rounded-xl border border-[#F85149]/40">
              <span className="spectator-numeral text-2xl font-bold text-[#FF7B72]">
                {state.teamRed}
              </span>
              <span className="spectator-numeral text-3xl font-black text-[#F0F6FC] px-2.5 py-0.5 rounded-lg bg-[#1C232D]">
                {state.redPenalties}
              </span>
            </div>

            <span className="text-[#8B949E] font-bold text-sm">vs</span>

            <div className="flex items-center gap-3 bg-[#388BFD]/15 px-5 py-2.5 rounded-xl border border-[#388BFD]/40">
              <span className="spectator-numeral text-2xl font-bold text-[#79C0FF]">
                {state.teamBlue}
              </span>
              <span className="spectator-numeral text-3xl font-black text-[#F0F6FC] px-2.5 py-0.5 rounded-lg bg-[#1C232D]">
                {state.bluePenalties}
              </span>
            </div>
          </div>

          <div className="px-6 py-2 rounded-xl bg-[#D29922]/15 border border-[#D29922]/50">
            <span className="spectator-numeral text-4xl font-black text-[#F2CC60]">
              {formattedTime}
            </span>
          </div>
        </div>

        <div className="h-3 w-full hazard-bar" />
      </div>
    </div>
  );
};
