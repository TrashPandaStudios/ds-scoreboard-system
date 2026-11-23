import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useArenaStore } from '../../store/arenaStore';
import { useArenaWebSocket } from '../../hooks/useArenaWebSocket';
import { useAuthoritativeTimer } from '../../hooks/useAuthoritativeTimer';
import { useAudioBuzzer } from '../../hooks/useAudioBuzzer';
import { useSpectatorTheme } from '../../hooks/useSpectatorTheme';
import { HeaderNav } from '../../components/common/HeaderNav';
import { PhaseAlertBanner } from '../../components/display/PhaseAlertBanner';
import { SetWinnerTakeoverModal } from '../../components/display/SetWinnerTakeoverModal';
import { Play, Pause, AlertTriangle, Maximize, Minimize, Sun, Moon } from 'lucide-react';
import { TeamBadge } from '../../components/common/TeamBadge';

export const DedicatedTimerDisplay: React.FC = () => {
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
  };

  const { formattedTime, formattedWithTenths, progressPercent, currentMs } = useAuthoritativeTimer({
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

  const isSuddenDeath = state.phase === 'SUDDEN_DEATH';
  const isPenaltyPhase = state.phase === 'PENALTY_PHASE';
  const isLowTime = !isSuddenDeath && currentMs <= 10000 && currentMs > 0;
  const isZero = !isSuddenDeath && currentMs <= 0;

  return (
    <div
      className={`app-shell h-screen max-h-screen w-full flex flex-col select-none overflow-hidden ${
        isBuzzerFiring ? 'buzzer-active-flash' : ''
      }`}
    >
      <HeaderNav arenaId={arenaId} variant="display" />

      <main className="flex-1 min-h-0 h-full w-full flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--court-line)] pb-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-sm sm:text-base font-bold text-[var(--court-ink)]">{state.arenaName}</span>
            <span className="text-xs sm:text-sm text-[var(--court-muted)] hidden sm:inline truncate">
              {state.tournamentName}
            </span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-[var(--court-surface)] border border-[var(--court-line)]">
              Match {state.matchNumber}
            </span>
          </div>

          <div className="flex-1 max-w-lg mx-auto">
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

        {/* Center Gigantic Clock */}
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-center my-auto py-2">
          <span
            className="spectator-numeral leading-none select-none text-[clamp(8rem,36vh,38rem)] font-black"
            style={{
              color:
                isZero || isLowTime
                  ? 'var(--drone-red)'
                  : isPenaltyPhase || isSuddenDeath
                  ? 'var(--signal-amber-text)'
                  : 'var(--court-ink)',
            }}
          >
            {isLowTime || state.phase === 'COUNTDOWN' ? formattedWithTenths : formattedTime}
          </span>

          <div
            className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs sm:text-sm font-bold"
            style={
              state.timerRunning
                ? {
                    backgroundColor: 'var(--signal-live-tint)',
                    borderColor: 'var(--signal-live-border)',
                    color: 'var(--signal-live-text)',
                  }
                : isZero
                ? {
                    backgroundColor: 'var(--drone-red-tint)',
                    borderColor: 'var(--drone-red-border)',
                    color: 'var(--drone-red-text)',
                  }
                : {
                    backgroundColor: 'var(--court-surface)',
                    borderColor: 'var(--court-line)',
                    color: 'var(--court-muted)',
                  }
            }
          >
            {state.timerRunning ? (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Clock running</span>
              </>
            ) : isZero ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Time expired</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Clock paused</span>
              </>
            )}
          </div>

          <div className="w-full max-w-4xl h-3 bg-[var(--court-line-soft)] rounded-full mt-6 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-100 ease-linear"
              style={{
                width: `${progressPercent}%`,
                backgroundColor:
                  isPenaltyPhase || isSuddenDeath
                    ? 'var(--signal-amber)'
                    : isLowTime || isZero
                    ? 'var(--drone-red)'
                    : 'var(--signal-live)',
              }}
            />
          </div>
        </div>

        {/* Bottom Score Summary Strip */}
        <div className="grid grid-cols-3 items-center gap-4 border-t border-[var(--court-line)] pt-4 shrink-0">
          {/* Red Team */}
          <div className="flex items-center gap-3 min-w-0">
            <TeamBadge teamName={state.teamRed} logoUrl={state.teamRedLogoUrl} side="red" size="md" />
            <div className="min-w-0">
              <span className="text-xs font-semibold block truncate" style={{ color: 'var(--drone-red-text)' }}>
                Red ({state.redSetScore} sets)
              </span>
              <span className="spectator-numeral text-2xl sm:text-3xl font-black text-[var(--court-ink)] truncate block leading-none">
                {state.teamRed}
              </span>
            </div>
            <span className="spectator-numeral text-4xl sm:text-5xl font-black text-[var(--drone-red)] ml-auto shrink-0">
              {state.redScore}
            </span>
          </div>

          {/* Center Set Badge */}
          <div className="flex justify-center">
            <span className="px-4 py-1.5 rounded-xl bg-[var(--court-surface)] border border-[var(--court-line)] text-xs sm:text-sm font-bold text-[var(--court-ink)]">
              Set {state.currentSet} of {state.maxSets}
            </span>
          </div>

          {/* Blue Team */}
          <div className="flex items-center justify-end gap-3 min-w-0 text-right">
            <span className="spectator-numeral text-4xl sm:text-5xl font-black text-[var(--drone-blue)] mr-auto shrink-0">
              {state.blueScore}
            </span>
            <div className="min-w-0">
              <span className="text-xs font-semibold block truncate" style={{ color: 'var(--drone-blue-text)' }}>
                Blue ({state.blueSetScore} sets)
              </span>
              <span className="spectator-numeral text-2xl sm:text-3xl font-black text-[var(--court-ink)] truncate block leading-none">
                {state.teamBlue}
              </span>
            </div>
            <TeamBadge teamName={state.teamBlue} logoUrl={state.teamBlueLogoUrl} side="blue" size="md" />
          </div>
        </div>
      </main>

      {state.setWinnerBanner?.active && <SetWinnerTakeoverModal banner={state.setWinnerBanner} />}
    </div>
  );
};
