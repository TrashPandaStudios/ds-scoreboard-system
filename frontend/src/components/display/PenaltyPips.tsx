import React from 'react';

interface PenaltyPipsProps {
  count: number;
  max?: number;
  team: 'red' | 'blue';
  size?: 'sm' | 'md' | 'lg';
}

export const PenaltyPips: React.FC<PenaltyPipsProps> = ({
  count,
  max = 3,
  team,
  size = 'md',
}) => {
  const pips = Array.from({ length: max }, (_, i) => i < count);

  const pipSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
  };

  const isRed = team === 'red';

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
        FOULS / PENALTIES:
      </span>
      <div className="flex items-center gap-1.5">
        {pips.map((active, idx) => (
          <div
            key={idx}
            className={`rounded-full transition-all duration-300 ${pipSizes[size]} ${
              active
                ? isRed
                  ? 'bg-rose-500 shadow-[0_0_12px_#ef4444] border-2 border-rose-300 scale-110'
                  : 'bg-amber-400 shadow-[0_0_12px_#f59e0b] border-2 border-amber-200 scale-110'
                : 'bg-slate-800 border border-slate-700'
            }`}
          />
        ))}
      </div>
      {count >= 3 && (
        <span className="text-[11px] font-mono font-black text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800 animate-pulse">
          DISQUALIFICATION WARN
        </span>
      )}
    </div>
  );
};
