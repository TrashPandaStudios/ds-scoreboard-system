import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useArenaStore } from '../../store/arenaStore';
import { useArenaWebSocket } from '../../hooks/useArenaWebSocket';
import { useAuthoritativeTimer } from '../../hooks/useAuthoritativeTimer';
import { AlertTriangle } from 'lucide-react';
import { TeamBadge } from '../../components/common/TeamBadge';

export interface OBSBroadcastOverlayProps {
  position: 'top' | 'bottom';
}

export const OBSBroadcastOverlay: React.FC<OBSBroadcastOverlayProps> = ({ position }) => {
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
    phase: 'NORMAL_PHASE' as const,
    sideSwap: false,
  };

  const { formattedTime } = useAuthoritativeTimer({
    serverRemainingMs: state.timeRemainingMs,
    totalDurationMs: state.totalSetDurationMs,
    timerRunning: state.timerRunning,
    phase: state.phase,
  });

  const isBuzzerFiring =
    activeBuzzerArenaId === arenaId && Date.now() - buzzerTriggerTimestamp < 2500;
  const isPenaltyPhase = state.phase === 'PENALTY_PHASE' || state.phase === 'SUDDEN_DEATH';

  // Keep transparent background for OBS Browser Source compositing
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
  const leftTeamName = leftTeam === 'red' ? state.teamRed : state.teamBlue;
  const rightTeamName = rightTeam === 'red' ? state.teamRed : state.teamBlue;
  const leftTeamLogo = leftTeam === 'red' ? state.teamRedLogoUrl : state.teamBlueLogoUrl;
  const rightTeamLogo = rightTeam === 'red' ? state.teamRedLogoUrl : state.teamBlueLogoUrl;
  const leftScore = leftTeam === 'red' ? state.redScore : state.blueScore;
  const rightScore = rightTeam === 'red' ? state.redScore : state.blueScore;
  const leftSets = leftTeam === 'red' ? state.redSetScore : state.blueSetScore;
  const rightSets = rightTeam === 'red' ? state.redSetScore : state.blueSetScore;
  const leftPen = leftTeam === 'red' ? state.redPenalties : state.bluePenalties;
  const rightPen = rightTeam === 'red' ? state.redPenalties : state.bluePenalties;

  const phaseCallout = isPenaltyPhase && (
    <div className="flex items-center justify-center gap-2 py-1.5 px-4 rounded-xl bg-[#151B23]/95 border border-[#D29922] text-[#F2CC60] text-xs font-bold shadow-xl self-center">
      <AlertTriangle className="w-4 h-4 text-[#D29922]" />
      <span>
        {state.phase === 'SUDDEN_DEATH' ? 'Sudden death overtime' : 'Penalty shootout in progress'}
      </span>
    </div>
  );

  const mainBroadcastBar = (
    <div className="flex items-stretch rounded-2xl overflow-hidden bg-[#151B23]/95 border border-[#30363D] shadow-[0_14px_36px_rgba(0,0,0,0.65)] backdrop-blur-md">
      {/* Left Team */}
      <div
        className={`flex-1 flex items-center justify-between px-5 py-3 border-r border-[#242B35] border-l-4 ${
          leftTeam === 'red'
            ? 'border-l-[#F85149] bg-gradient-to-r from-[#F85149]/15 to-transparent'
            : 'border-l-[#388BFD] bg-gradient-to-r from-[#388BFD]/15 to-transparent'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <TeamBadge teamName={leftTeamName} logoUrl={leftTeamLogo} side={leftTeam} size="md" />
          <div className="min-w-0">
            <span
              className="text-xs font-semibold block"
              style={{ color: leftTeam === 'red' ? '#FF7B72' : '#79C0FF' }}
            >
              {leftSets} {leftSets === 1 ? 'set' : 'sets'}
            </span>
            <span className="spectator-numeral text-2xl font-extrabold text-[#F0F6FC] truncate block leading-tight">
              {leftTeamName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3.5">
          {leftPen > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-[#D29922]/20 border border-[#D29922]/60 text-[#F2CC60] text-xs font-bold tabular-nums">
              {leftPen}P
            </span>
          )}
          <span
            className="spectator-numeral text-5xl font-black leading-none"
            style={{ color: leftTeam === 'red' ? '#F85149' : '#388BFD' }}
          >
            {leftScore}
          </span>
        </div>
      </div>

      {/* Center Clock */}
      <div className="w-44 bg-[#1C232D] flex flex-col items-center justify-center px-4 py-2 border-r border-[#242B35]">
        <span
          className="spectator-numeral text-4xl font-black leading-none"
          style={{
            color: isPenaltyPhase ? '#F2CC60' : state.timerRunning ? '#F0F6FC' : '#C9D1D9',
          }}
        >
          {formattedTime}
        </span>
        <span className="text-[11px] font-semibold text-[#8B949E] mt-1">
          Set {state.currentSet} of {state.maxSets}
        </span>
      </div>

      {/* Right Team */}
      <div
        className={`flex-1 flex items-center justify-between px-5 py-3 border-r-4 ${
          rightTeam === 'red'
            ? 'border-r-[#F85149] bg-gradient-to-l from-[#F85149]/15 to-transparent'
            : 'border-r-[#388BFD] bg-gradient-to-l from-[#388BFD]/15 to-transparent'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <span
            className="spectator-numeral text-5xl font-black leading-none"
            style={{ color: rightTeam === 'red' ? '#F85149' : '#388BFD' }}
          >
            {rightScore}
          </span>
          {rightPen > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-[#D29922]/20 border border-[#D29922]/60 text-[#F2CC60] text-xs font-bold tabular-nums">
              {rightPen}P
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-right min-w-0">
          <div className="min-w-0">
            <span
              className="text-xs font-semibold block"
              style={{ color: rightTeam === 'red' ? '#FF7B72' : '#79C0FF' }}
            >
              {rightSets} {rightSets === 1 ? 'set' : 'sets'}
            </span>
            <span className="spectator-numeral text-2xl font-extrabold text-[#F0F6FC] truncate block leading-tight">
              {rightTeamName}
            </span>
          </div>
          <TeamBadge teamName={rightTeamName} logoUrl={rightTeamLogo} side={rightTeam} size="md" />
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`w-screen h-screen flex flex-col ${
        position === 'top' ? 'justify-start' : 'justify-end'
      } p-8 select-none overflow-hidden ${isBuzzerFiring ? 'buzzer-active-flash' : ''}`}
      style={{ background: 'transparent' }}
    >
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-2">
        {position === 'bottom' && phaseCallout}
        {mainBroadcastBar}
        {position === 'top' && phaseCallout}
      </div>
    </div>
  );
};
