import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface PenaltyPipsProps {
  count: number;
  max?: number;
  team: 'red' | 'blue';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
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

  const labelSizes = {
    sm: 'text-[11px]',
    md: 'text-xs',
    lg: 'text-sm font-bold',
  };

  const badgeSizes = {
    sm: 'px-2 py-0.5 text-xs min-w-[28px]',
    md: 'px-2.5 py-1 text-sm min-w-[34px]',
    lg: 'px-4 py-1.5 text-lg min-w-[44px]',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label && (
        <span className={`font-mono font-bold tracking-wider text-slate-400 uppercase ${labelSizes[size]}`}>
          {label}
        </span>
      )}
      <div
        className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-mono font-black tabular-nums transition-all duration-300 ${
          badgeSizes[size]
        } ${
          hasPenalties
            ? isRed
              ? 'bg-rose-950/90 text-rose-300 border border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.45)]'
              : 'bg-amber-950/90 text-amber-300 border border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.45)]'
            : 'bg-slate-800/80 text-slate-400 border border-slate-700/80'
        }`}
      >
        {hasPenalties && <AlertTriangle className={`${iconSizes[size]} animate-pulse`} />}
        <span>{count}</span>
      </div>
    </div>
  );
};
