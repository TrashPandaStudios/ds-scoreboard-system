import React from 'react';
import { useAuthoritativeTimer } from '../../hooks/useAuthoritativeTimer';
import { MatchPhase } from '../../types/scoreboard';
import { Play, Pause, AlertTriangle } from 'lucide-react';

interface TabularTimerProps {
  serverRemainingMs: number;
  totalDurationMs?: number;
  timerRunning: boolean;
  phase: MatchPhase;
  size?: 'sm' | 'md' | 'lg' | 'hero';
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
    sm: 'text-3xl font-bold tracking-tight',
    md: 'text-5xl font-extrabold tracking-tight',
    lg: 'text-7xl font-black tracking-tighter',
    hero: 'text-8xl md:text-9xl font-black tracking-tighter',
  };

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Time Display with Tabular Figures */}
      <div className="relative flex items-center justify-center">
        <span
          className={`font-mono tabular-nums select-none transition-colors duration-150 ${sizeClasses[size]} ${
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
        <div className="absolute -bottom-3 flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-900/90 border border-slate-700 text-[11px] font-mono tracking-wider text-slate-300 backdrop-blur-sm shadow-md">
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
        <div className="w-full max-w-md h-2 bg-slate-800/80 rounded-full mt-6 overflow-hidden border border-slate-700/60 p-0.5">
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
