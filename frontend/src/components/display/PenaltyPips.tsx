import React from 'react';
import { AlertTriangle } from 'lucide-react';

export interface PenaltyPipsProps {
  count: number;
  max?: number;
  team: 'red' | 'blue';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  label?: string;
  showPips?: boolean;
  className?: string;
}

export const PenaltyPips: React.FC<PenaltyPipsProps> = ({
  count,
  team,
  size = 'md',
  label = 'PENALTIES:',
  className = '',
}) => {
  const isRed = team === 'red';
  const hasPenalties = count > 0;

  const labelSizes: Record<'sm' | 'md' | 'lg' | 'xl' | '2xl', string> = {
    sm: 'text-[11px] font-mono font-bold tracking-wider',
    md: 'text-xs sm:text-sm font-mono font-bold tracking-wider',
    lg: 'text-sm sm:text-lg lg:text-xl font-mono font-black tracking-wider',
    xl: 'text-base sm:text-xl lg:text-2xl font-mono font-black tracking-widest',
    '2xl': 'text-lg sm:text-2xl lg:text-3xl font-mono font-black tracking-widest',
  };

  const badgeSizes: Record<'sm' | 'md' | 'lg' | 'xl' | '2xl', string> = {
    sm: 'px-2.5 py-0.5 text-sm sm:text-base min-w-[34px] rounded-lg border',
    md: 'px-4 sm:px-6 py-1.5 sm:py-2 text-2xl sm:text-3xl min-w-[55px] sm:min-w-[75px] rounded-xl border-2',
    lg: 'px-5 sm:px-8 py-2 sm:py-3 text-3xl sm:text-4xl lg:text-5xl min-w-[70px] sm:min-w-[100px] rounded-2xl border-2 sm:border-4',
    xl: 'px-6 sm:px-10 py-2.5 sm:py-4 text-4xl sm:text-5xl lg:text-6xl min-w-[90px] sm:min-w-[130px] rounded-2xl sm:rounded-3xl border-2 sm:border-4',
    '2xl': 'px-8 sm:px-12 py-3 sm:py-5 text-6xl sm:text-7xl lg:text-8xl min-w-[110px] sm:min-w-[160px] rounded-3xl border-4',
  };

  const iconSizes: Record<'sm' | 'md' | 'lg' | 'xl' | '2xl', string> = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4 sm:w-5 sm:h-5',
    lg: 'w-5 h-5 sm:w-7 sm:h-7',
    xl: 'w-6 h-6 sm:w-9 sm:h-9',
    '2xl': 'w-8 h-8 sm:w-12 sm:h-12',
  };

  return (
    <div className={`flex items-center gap-3 sm:gap-5 flex-wrap ${className}`}>
      {label && (
        <span
          className={`uppercase text-slate-200 select-none ${labelSizes[size]}`}
        >
          {label}
        </span>
      )}

      {/* Massive Hard Number Counter Badge - Highly Visible from 30+ feet */}
      <div
        className={`inline-flex items-center justify-center font-mono font-black tabular-nums leading-none transition-all duration-300 select-none ${
          badgeSizes[size]
        } ${
          hasPenalties
            ? isRed
              ? 'bg-gradient-to-br from-rose-950 via-red-900 to-rose-950 text-white border-rose-500 shadow-[0_0_35px_rgba(244,63,94,0.8)] animate-pulse'
              : 'bg-gradient-to-br from-amber-950 via-yellow-900 to-amber-950 text-white border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.8)] animate-pulse'
            : 'bg-slate-900/95 text-slate-200 border-slate-700/80 shadow-inner'
        }`}
      >
        {hasPenalties && (
          <AlertTriangle className={`${iconSizes[size]} shrink-0 mr-2 sm:mr-3.5 text-current animate-bounce`} />
        )}
        <span>{count}</span>
      </div>
    </div>
  );
};
