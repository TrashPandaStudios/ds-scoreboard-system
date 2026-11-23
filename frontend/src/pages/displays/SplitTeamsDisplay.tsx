import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useArenaStore } from '../../store/arenaStore';
import { useArenaWebSocket } from '../../hooks/useArenaWebSocket';
import { useAuthoritativeTimer } from '../../hooks/useAuthoritativeTimer';
import { useAudioBuzzer } from '../../hooks/useAudioBuzzer';
import { useSpectatorTheme } from '../../hooks/useSpectatorTheme';
import { HeaderNav } from '../../components/common/HeaderNav';
import { PenaltyPips } from '../../components/display/PenaltyPips';
import { SetTracker } from '../../components/display/SetTracker';
import { PhaseAlertBanner } from '../../components/display/PhaseAlertBanner';
import { SetWinnerTakeoverModal } from '../../components/display/SetWinnerTakeoverModal';
import { Trophy, Maximize, Minimize, Sun, Moon } from 'lucide-react';
import { TeamBadge } from '../../components/common/TeamBadge';

export const SplitTeamsDisplay: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const arenaId = parseInt(id || '1', 10);

  useArenaWebSocket(arenaId);
  const { arenaStates, activeBuzzerArenaId, buzzerTriggerTimestamp } = useArenaStore();
  const { playBuzzer } = useAudioBuzzer();
  const { theme, toggleTheme } = useSpectatorTheme();
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
    phase: 'NORMAL_PHASE' as const,
    sideSwap: false,
    completedSets: [],
  };

  const { formattedTime, formattedWithTenths, currentMs } = useAuthoritativeTimer({
    serverRemainingMs: state.timeRemainingMs,
    totalDurationMs: state.totalSetDurationMs,
    timerRunning: state.timerRunning,
    phase: state.phase,
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

  const isPenaltyPhase = state.phase === 'PENALTY_PHASE' || state.phase === 'SUDDEN_DEATH';
  const isLowTime = state.phase !== 'SUDDEN_DEATH' && currentMs <= 10000 && currentMs > 0;

  const leftTeam = state.sideSwap ? 'blue' : 'red';
  const rightTeam = state.sideSwap ? 'red' : 'blue';

  const renderSidePanel = (side: 'red' | 'blue') => {
    const isRed = side === 'red';
    const name = isRed ? state.teamRed : state.teamBlue;
    const logo = isRed ? state.teamRedLogoUrl : state.teamBlueLogoUrl;
    const score = isRed ? state.redScore : state.blueScore;
    const penalties = isRed ? state.redPenalties : state.bluePenalties;
    const sets = isRed ? state.redSetScore : state.blueSetScore;

    return (
      <div
        className={`flex-[1.1] min-w-0 h-full flex flex-col justify-between p-5 sm:p-6 rounded-2xl border border-[var(--court-line)] overflow-hidden ${
          isRed
            ? 'spectator-red-vertical border-t-4 border-t-[var(--drone-red)]'
            : 'spectator-blue-vertical border-t-4 border-t-[var(--drone-blue)]'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[var(--court-line-soft)] pb-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <TeamBadge teamName={name} logoUrl={logo} side={side} size="lg" />
            <div className="min-w-0">
              <span
                className="text-xs font-bold block"
                style={{ color: isRed ? 'var(--drone-red-text)' : 'var(--drone-blue-text)' }}
              >
                {isRed ? 'Red team' : 'Blue team'}
              </span>
              <h2 className="spectator-numeral text-3xl lg:text-4xl font-black text-[var(--court-ink)] leading-tight truncate">
                {name}
              </h2>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--court-subtle)] border border-[var(--court-line)] shrink-0">
            <Trophy className="w-4 h-4" style={{ color: 'var(--signal-amber)' }} />
            <span className="spectator-numeral text-2xl font-black text-[var(--court-ink)] leading-none">
              {sets} {sets === 1 ? 'set' : 'sets'}
            </span>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex items-center justify-center my-auto w-full py-2">
          <div
            className="spectator-numeral font-black text-[clamp(7rem,16vw,22rem)] leading-none select-none"
            style={{ color: isRed ? 'var(--drone-red)' : 'var(--drone-blue)' }}
          >
            {score}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[var(--court-line-soft)] pt-3 shrink-0">
          <PenaltyPips count={penalties} team={side} size="xl" label="Penalties" />
        </div>
      </div>
    );
  };

  return (
    <div
      className={`app-shell h-screen max-h-screen w-full flex flex-col select-none overflow-hidden ${
        isBuzzerFiring ? 'buzzer-active-flash' : ''
      }`}
    >
      <HeaderNav arenaId={arenaId} variant="display" />

      <main className="flex-1 min-h-0 h-full flex flex-col justify-between px-3 sm:px-6 lg:px-8 py-3 w-full relative overflow-hidden gap-3">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-bold text-[var(--court-ink)]">{state.arenaName}</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-[var(--court-surface)] border border-[var(--court-line)]">
              Match {state.matchNumber}
            </span>
          </div>

          <div className="flex-1 max-w-xl mx-auto">
            <PhaseAlertBanner phase={state.phase} currentSet={state.currentSet} maxSets={state.maxSets} />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              className="p-2 rounded-lg bg-[var(--court-surface)] hover:bg-[var(--court-control-hover)] text-[var(--court-ink-secondary)] border border-[var(--court-line)]"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-[var(--court-surface)] hover:bg-[var(--court-control-hover)] text-[var(--court-ink-secondary)] border border-[var(--court-line)]"
              title="Toggle fullscreen"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Side-by-Side Dual Team Monitor */}
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 items-stretch justify-center w-full h-full flex-1 min-h-0">
          {renderSidePanel(leftTeam)}

          {/* Center Clock Column */}
          <div className="flex-[0.9] lg:flex-1 min-w-0 h-full flex flex-col justify-between items-center p-5 rounded-2xl bg-[var(--court-surface)] border border-[var(--court-line)]">
            <div className="w-full flex items-center justify-between border-b border-[var(--court-line-soft)] pb-2 text-xs font-semibold shrink-0">
              <span className="text-[var(--court-ink)]">Match clock</span>
              <span className="text-[var(--court-muted)]">
                Set {state.currentSet} of {state.maxSets}
              </span>
            </div>

            <div className="flex-1 min-h-0 flex items-center justify-center my-auto w-full py-2">
              <span
                className="spectator-numeral font-black text-[clamp(4rem,8vw,10rem)] leading-none whitespace-nowrap"
                style={{
                  color: isPenaltyPhase
                    ? 'var(--signal-amber-text)'
                    : isLowTime
                    ? 'var(--drone-red)'
                    : 'var(--court-ink)',
                }}
              >
                {isLowTime ? formattedWithTenths : formattedTime}
              </span>
            </div>

            <div className="w-full pt-3 border-t border-[var(--court-line-soft)] flex justify-center shrink-0">
              <SetTracker
                currentSet={state.currentSet}
                maxSets={state.maxSets}
                completedSets={state.completedSets || []}
                teamRed={state.teamRed}
                teamBlue={state.teamBlue}
              />
            </div>
          </div>

          {renderSidePanel(rightTeam)}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--court-line-soft)] pt-2 shrink-0 text-xs text-[var(--court-muted)]">
          <span>{state.recentEvent}</span>
          <span>{state.sideSwap ? 'Orientation: Blue left / Red right' : 'Orientation: Red left / Blue right'}</span>
        </div>
      </main>

      {state.setWinnerBanner?.active && <SetWinnerTakeoverModal banner={state.setWinnerBanner} />}
    </div>
  );
};
