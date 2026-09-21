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
  });

  const isLowTime = currentMs <= 10000 && currentMs > 0;
  const isZero = currentMs <= 0;
  const isPenaltyPhase = phase === 'PENALTY_PHASE';

  // Size configurations
  const sizeClasses = {
    sm: 'text-2xl sm:text-3xl font-bold tracking-tight',
    md: 'text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight',
    lg: 'text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight',
    hero: 'text-5xl sm:text-6xl xl:text-7xl font-black tracking-tight',
    stadium: 'text-[clamp(3.8rem,7.5vw,11rem)] font-black tracking-tight',
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* Time Display with Tabular Figures */}
      <div className="flex flex-col items-center justify-center">
        <span
          className={`font-mono tabular-nums leading-none select-none whitespace-nowrap transition-colors duration-150 ${sizeClasses[size]} ${
            isZero
              ? 'text-rose-500 animate-pulse glow-red'
              : isPenaltyPhase
              ? 'text-amber-400 glow-amber'
              : isLowTime
              ? 'text-rose-400 glow-red animate-pulse-fast'
              : timerRunning
              ? 'text-white'
              : 'text-slate-300 opacity-90'
          }`}
        >
          {isLowTime || phase === 'COUNTDOWN' ? formattedWithTenths : formattedTime}
        </span>

        {/* Status Pill Badge */}
        <div className={`mt-2.5 sm:mt-3 flex items-center gap-1.5 ${size === 'stadium' ? 'px-3.5 sm:px-4 py-1 text-xs' : 'px-3 py-0.5 text-[11px]'} rounded-full bg-slate-900/90 border border-slate-700 font-mono tracking-wider text-slate-300 backdrop-blur-sm shadow-md`}>
          {timerRunning ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <Play className="w-2.5 h-2.5 text-emerald-400 fill-emerald-400" />
              <span className="text-emerald-300 font-semibold">RUNNING</span>
            </>
          ) : isZero ? (
            <>
              <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
              <span className="text-rose-400 font-bold">TIME EXPIRED</span>
            </>
          ) : (
            <>
              <Pause className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
              <span className="text-amber-300 font-semibold">PAUSED</span>
            </>
          )}
        </div>
      </div>

      {/* Synchronized Progress Track Bar */}
      {showProgressBar && (
        <div className={`w-full ${size === 'stadium' ? 'max-w-[280px] sm:max-w-[340px] xl:max-w-[420px]' : 'max-w-[240px] xl:max-w-[280px]'} h-2 sm:h-2.5 bg-slate-800/80 rounded-full mt-3 sm:mt-4 overflow-hidden border border-slate-700/60 p-0.5`}>
          <div
            className={`h-full rounded-full transition-all duration-100 ease-linear ${
              isPenaltyPhase
                ? 'bg-amber-400 box-glow-amber'
                : isLowTime
                ? 'bg-rose-500 box-glow-red'
                : 'bg-gradient-to-r from-cyan-500 to-blue-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </div>
  );
};
