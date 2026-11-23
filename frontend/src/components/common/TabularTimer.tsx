import React from 'react';
import { useAuthoritativeTimer } from '../../hooks/useAuthoritativeTimer';
import { MatchPhase } from '../../types/scoreboard';
import { Play, Pause, AlertTriangle } from 'lucide-react';

interface TabularTimerProps {
  serverRemainingMs: number;
  totalDurationMs?: number;
  timerRunning: boolean;
  phase: MatchPhase;
  size?: 'sm' | 'md' | 'lg' | 'hero' | 'stadium';
  showProgressBar?: boolean;
}

export const TabularTimer: React.FC<TabularTimerProps> = ({
  serverRemainingMs,
  totalDurationMs = 180000,
  timerRunning,
  phase,
  size = 'hero',
  showProgressBar = true,
}) => {
  const { formattedTime, formattedWithTenths, progressPercent, currentMs } = useAuthoritativeTimer({
    serverRemainingMs,
    totalDurationMs,
    timerRunning,
    phase,
  });

  const isSuddenDeath = phase === 'SUDDEN_DEATH';
  const isLowTime = !isSuddenDeath && currentMs <= 10000 && currentMs > 0;
  const isZero = !isSuddenDeath && currentMs <= 0;
  const isPenaltyPhase = phase === 'PENALTY_PHASE';

  const sizeClasses = {
    sm: 'text-3xl sm:text-4xl font-extrabold',
    md: 'text-4xl sm:text-5xl lg:text-6xl font-black',
    lg: 'text-5xl sm:text-6xl lg:text-7xl font-black',
    hero: 'text-6xl sm:text-7xl xl:text-8xl font-black',
    stadium: 'text-[clamp(4.5rem,9vw,13rem)] font-black',
  };

  const clockColor = isSuddenDeath || isPenaltyPhase
    ? 'var(--signal-amber-text)'
    : isZero || isLowTime
    ? 'var(--drone-red)'
    : timerRunning
    ? 'var(--court-ink)'
    : 'var(--court-ink-secondary)';

  const barColor = isPenaltyPhase || isSuddenDeath
    ? 'var(--signal-amber)'
    : isLowTime || isZero
    ? 'var(--drone-red)'
    : timerRunning
    ? 'var(--signal-live)'
    : 'var(--drone-blue)';

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-col items-center justify-center">
        <span
          className={`spectator-numeral leading-none select-none whitespace-nowrap transition-colors duration-150 ${sizeClasses[size]}`}
          style={{ color: clockColor }}
        >
          {isLowTime || phase === 'COUNTDOWN' ? formattedWithTenths : formattedTime}
        </span>

        {/* Status Pill */}
        <div
          className={`mt-2.5 sm:mt-3 inline-flex items-center gap-1.5 ${
            size === 'stadium' ? 'px-3.5 py-1 text-xs' : 'px-3 py-0.5 text-xs'
          } rounded-full border font-semibold`}
          style={
            timerRunning
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
                  backgroundColor: 'var(--court-control-bg)',
                  borderColor: 'var(--court-line)',
                  color: 'var(--court-muted)',
                }
          }
        >
          {timerRunning ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--signal-live)' }} />
              <Play className="w-2.5 h-2.5 fill-current" />
              <span>Running</span>
            </>
          ) : isZero ? (
            <>
              <AlertTriangle className="w-3 h-3" />
              <span>Time expired</span>
            </>
          ) : (
            <>
              <Pause className="w-2.5 h-2.5 fill-current" />
              <span>Paused</span>
            </>
          )}
        </div>
      </div>

      {/* Synchronized Progress Bar */}
      {showProgressBar && (
        <div
          className={`w-full ${
            size === 'stadium' ? 'max-w-[280px] sm:max-w-[340px] xl:max-w-[420px]' : 'max-w-[240px] xl:max-w-[300px]'
          } h-2 bg-[var(--court-line-soft)] rounded-full mt-3 sm:mt-4 overflow-hidden`}
        >
          <div
            className="h-full rounded-full transition-all duration-100 ease-linear"
            style={{ width: `${progressPercent}%`, backgroundColor: barColor }}
          />
        </div>
      )}
    </div>
  );
};
