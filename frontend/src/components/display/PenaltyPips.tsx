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
  label = 'Penalties',
  className = '',
}) => {
  const isRed = team === 'red';
  const hasPenalties = count > 0;

  const labelSizes: Record<'sm' | 'md' | 'lg' | 'xl' | '2xl', string> = {
    sm: 'text-xs font-semibold',
    md: 'text-xs sm:text-sm font-semibold',
    lg: 'text-sm sm:text-base font-bold',
    xl: 'text-base sm:text-xl font-bold',
    '2xl': 'text-lg sm:text-2xl font-bold',
  };

  const badgeSizes: Record<'sm' | 'md' | 'lg' | 'xl' | '2xl', string> = {
    sm: 'px-2.5 py-0.5 text-base min-w-[34px] rounded-lg border',
    md: 'px-3.5 py-1 text-2xl sm:text-3xl min-w-[52px] rounded-xl border',
    lg: 'px-4 sm:px-6 py-1.5 sm:py-2 text-3xl sm:text-4xl min-w-[68px] rounded-xl border-2',
    xl: 'px-5 sm:px-7 py-2 sm:py-3 text-4xl sm:text-5xl min-w-[84px] rounded-xl border-2',
    '2xl': 'px-6 sm:px-9 py-2.5 sm:py-4 text-6xl sm:text-7xl min-w-[110px] rounded-2xl border-2',
  };

  const iconSizes: Record<'sm' | 'md' | 'lg' | 'xl' | '2xl', string> = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5 sm:w-6 sm:h-6',
    xl: 'w-6 h-6 sm:w-8 sm:h-8',
    '2xl': 'w-8 h-8 sm:w-10 sm:h-10',
  };

  const activeStyle: React.CSSProperties = hasPenalties
    ? isRed
      ? {
          backgroundColor: 'var(--drone-red-tint)',
          borderColor: 'var(--drone-red)',
          color: 'var(--drone-red-text)',
        }
      : {
          backgroundColor: 'var(--signal-amber-tint)',
          borderColor: 'var(--signal-amber)',
          color: 'var(--signal-amber-text)',
        }
    : {
        backgroundColor: 'var(--court-control-bg)',
        borderColor: 'var(--court-line)',
        color: 'var(--court-ink-secondary)',
      };

  return (
    <div className={`flex items-center gap-2.5 sm:gap-4 flex-wrap ${className}`}>
      {label && (
        <span className={`text-[var(--court-muted)] select-none ${labelSizes[size]}`}>{label}</span>
      )}

      <div
        className={`inline-flex items-center justify-center spectator-numeral font-black leading-none select-none ${badgeSizes[size]}`}
        style={activeStyle}
      >
        {hasPenalties && <AlertTriangle className={`${iconSizes[size]} shrink-0 mr-1.5 sm:mr-2.5`} />}
        <span>{count}</span>
      </div>
    </div>
  );
};
