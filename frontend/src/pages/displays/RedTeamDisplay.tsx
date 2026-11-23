import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useArenaStore } from '../../store/arenaStore';
import { useArenaWebSocket } from '../../hooks/useArenaWebSocket';
import { useAuthoritativeTimer } from '../../hooks/useAuthoritativeTimer';
import { useAudioBuzzer } from '../../hooks/useAudioBuzzer';
import { useSpectatorTheme } from '../../hooks/useSpectatorTheme';
import { HeaderNav } from '../../components/common/HeaderNav';
import { PenaltyPips } from '../../components/display/PenaltyPips';
import { SetWinnerTakeoverModal } from '../../components/display/SetWinnerTakeoverModal';
import { getSpectatorPhaseMeta } from '../../components/public/PublicLiveCard';
import { Trophy, Maximize, Minimize, AlertTriangle, Sun, Moon } from 'lucide-react';
import { TeamBadge } from '../../components/common/TeamBadge';

export const RedTeamDisplay: React.FC = () => {
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

  const phaseMeta = getSpectatorPhaseMeta(state.phase, state.timerRunning);
  const isLowTime = state.phase !== 'SUDDEN_DEATH' && currentMs <= 10000 && currentMs > 0;
  const leadDiff = state.redScore - state.blueScore;

  return (
    <div
      className={`app-shell h-screen max-h-screen w-full flex flex-col select-none overflow-hidden border-t-4 border-t-[var(--drone-red)] ${
        isBuzzerFiring ? 'buzzer-active-flash' : ''
      }`}
    >
      <HeaderNav arenaId={arenaId} variant="display" />

      <main className="spectator-red-vertical flex-1 min-h-0 h-full w-full flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--court-line)] pb-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <TeamBadge teamName={state.teamRed} logoUrl={state.teamRedLogoUrl} side="red" size="lg" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span style={{ color: 'var(--drone-red-text)' }}>Red pilot monitor</span>
                <span className="text-[var(--court-muted)]">{state.arenaName}</span>
                <span className="text-[var(--court-muted)]">Match {state.matchNumber}</span>
              </div>
              <h1 className="spectator-numeral text-3xl sm:text-5xl font-black text-[var(--court-ink)] leading-none truncate mt-0.5">
                {state.teamRed}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-3 bg-[var(--court-surface)] px-4 sm:px-5 py-2 rounded-xl border border-[var(--court-line)]">
              <div className="text-right">
                <span className="text-xs text-[var(--court-muted)] block">
                  Set {state.currentSet} of {state.maxSets}
                </span>
                <span className="text-xs font-bold block" style={{ color: phaseMeta.accentColor }}>
                  {phaseMeta.label}
                </span>
              </div>
              <span
                className="spectator-numeral text-4xl sm:text-5xl lg:text-6xl font-black leading-none"
                style={{
                  color:
                    state.phase === 'PENALTY_PHASE' || state.phase === 'SUDDEN_DEATH'
                      ? 'var(--signal-amber-text)'
                      : isLowTime
                      ? 'var(--drone-red)'
                      : 'var(--court-ink)',
                }}
              >
                {isLowTime ? formattedWithTenths : formattedTime}
              </span>
            </div>

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

        {/* Center Massive Score */}
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-center my-auto py-2">
          <div
            className="spectator-numeral font-black text-[clamp(9rem,36vh,38rem)] leading-none select-none"
            style={{ color: 'var(--drone-red)' }}
          >
            {state.redScore}
          </div>

          <div className="mt-3 flex items-center gap-3 flex-wrap justify-center">
            {leadDiff > 0 ? (
              <span
                className="px-4 py-1.5 rounded-full border text-sm font-bold"
                style={{
                  backgroundColor: 'var(--signal-live-tint)',
                  borderColor: 'var(--signal-live-border)',
                  color: 'var(--signal-live-text)',
                }}
              >
                Leading by +{leadDiff} {leadDiff === 1 ? 'goal' : 'goals'}
              </span>
            ) : leadDiff < 0 ? (
              <span
                className="px-4 py-1.5 rounded-full border text-sm font-bold"
                style={{
                  backgroundColor: 'var(--drone-red-tint)',
                  borderColor: 'var(--drone-red-border)',
                  color: 'var(--drone-red-text)',
                }}
              >
                Trailing by {Math.abs(leadDiff)} {Math.abs(leadDiff) === 1 ? 'goal' : 'goals'}
              </span>
            ) : (
              <span className="px-4 py-1.5 rounded-full border border-[var(--court-line)] bg-[var(--court-surface)] text-sm font-bold text-[var(--court-ink-secondary)]">
                Score tied
              </span>
            )}

            {state.redPenalties > 0 && (
              <span
                className="px-4 py-1.5 rounded-full border text-sm font-bold inline-flex items-center gap-1.5"
                style={{
                  backgroundColor: 'var(--signal-amber-tint)',
                  borderColor: 'var(--signal-amber-border)',
                  color: 'var(--signal-amber-text)',
                }}
              >
                <AlertTriangle className="w-4 h-4" />
                <span>
                  {state.redPenalties} active {state.redPenalties === 1 ? 'penalty' : 'penalties'}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 items-stretch gap-4 border-t border-[var(--court-line)] pt-4 shrink-0">
          <div className="flex items-center justify-center bg-[var(--court-surface)] px-5 py-4 rounded-xl border border-[var(--court-line)]">
            <PenaltyPips count={state.redPenalties} team="red" size="2xl" label="Penalties" />
          </div>

          <div className="flex items-center justify-center gap-4 bg-[var(--court-surface)] px-5 py-4 rounded-xl border border-[var(--court-line)]">
            <Trophy className="w-9 h-9 shrink-0" style={{ color: 'var(--signal-amber)' }} />
            <div>
              <span className="text-xs font-semibold text-[var(--court-muted)] block">Sets won</span>
              <span className="spectator-numeral text-6xl font-black text-[var(--court-ink)] leading-none">
                {state.redSetScore}{' '}
                <span className="text-xl font-sans font-semibold text-[var(--court-muted)]">/ 2 to win</span>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 bg-[var(--court-surface)] px-5 py-4 rounded-xl border border-[var(--court-line)]">
            <div className="min-w-0">
              <span className="text-xs font-semibold text-[var(--court-muted)] block truncate">
                Opponent: {state.teamBlue}
              </span>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="spectator-numeral text-5xl font-black text-[var(--drone-blue)] leading-none">
                  {state.blueScore} pts
                </span>
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-lg border"
                  style={
                    state.bluePenalties > 0
                      ? {
                          backgroundColor: 'var(--signal-amber-tint)',
                          borderColor: 'var(--signal-amber-border)',
                          color: 'var(--signal-amber-text)',
                        }
                      : {
                          backgroundColor: 'var(--court-control-bg)',
                          borderColor: 'var(--court-line)',
                          color: 'var(--court-muted)',
                        }
                  }
                >
                  {state.bluePenalties}P
                </span>
              </div>
            </div>
            <TeamBadge teamName={state.teamBlue} logoUrl={state.teamBlueLogoUrl} side="blue" size="lg" />
          </div>
        </div>
      </main>

      {state.setWinnerBanner?.active && <SetWinnerTakeoverModal banner={state.setWinnerBanner} />}
    </div>
  );
};
