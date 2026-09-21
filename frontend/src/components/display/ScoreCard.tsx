import React from 'react';
import { PenaltyPips } from './PenaltyPips';
import { Target, Trophy } from 'lucide-react';
import { TeamBadge } from '../common/TeamBadge';

interface ScoreCardProps {
  team: 'red' | 'blue';
  teamName: string;
  logoUrl?: string | null;
  score: number;
  setScore: number;
  penalties: number;
  isWinning?: boolean;
  align?: 'left' | 'right';
}

export const ScoreCard: React.FC<ScoreCardProps> = ({
  team,
  teamName,
  logoUrl,
  score,
  setScore,
  penalties,
  isWinning = false,
  align = 'left',
}) => {
  const isRed = team === 'red';

  return (
    <div
      className={`relative flex-1 h-full min-h-0 w-full flex flex-col justify-between p-4 sm:p-6 lg:p-7 rounded-3xl overflow-hidden transition-all duration-300 ${
        isRed
          ? 'bg-gradient-to-b from-red-950/40 via-slate-900/90 to-slate-950/95 border-2 border-red-500/40 box-glow-red'
          : 'bg-gradient-to-b from-blue-950/40 via-slate-900/90 to-slate-950/95 border-2 border-blue-500/40 box-glow-blue'
      }`}
    >
      {/* Top Banner: Team Header & Striker Role */}
      <div className={`flex items-center justify-between gap-3 sm:gap-4 shrink-0 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <TeamBadge
            teamName={teamName}
            logoUrl={logoUrl}
            side={team}
            size="lg"
            className="rounded-2xl shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span
                className={`text-[10px] sm:text-xs font-mono font-black uppercase tracking-widest px-2 sm:px-2.5 py-0.5 rounded-full ${
                  isRed
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                }`}
              >
                {isRed ? 'RED TEAM' : 'BLUE TEAM'}
              </span>
              <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-mono text-slate-400 bg-slate-800/80 px-1.5 sm:px-2 py-0.5 rounded border border-slate-700">
                <Target className="w-3 h-3 text-cyan-400 shrink-0" />
                <span>STRIKER #1</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-display font-extrabold text-white tracking-wide mt-1 truncate">
              {teamName}
            </h2>
          </div>
        </div>

        {/* Sets Won Trophy Badge */}
        <div className="flex flex-col items-center bg-slate-900/90 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl border border-slate-800 shadow-inner shrink-0">
          <div className="flex items-center gap-1 text-[10px] sm:text-xs font-mono text-amber-400 uppercase font-semibold">
            <Trophy className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
            <span>SETS</span>
          </div>
          <span className="text-xl sm:text-2xl font-mono font-black text-white leading-tight">{setScore}</span>
        </div>
      </div>

      {/* Center: Massive Integer Score Display */}
      <div className="flex-1 min-h-0 flex items-center justify-center my-auto w-full py-2">
        <div
          className={`font-display font-black text-[clamp(6rem,14vw,22rem)] leading-none select-none tabular-nums transition-transform duration-200 hover:scale-105 ${
            isRed ? 'text-red-500 glow-red' : 'text-blue-400 glow-blue'
          }`}
        >
          {score}
        </div>
      </div>

      {/* Bottom: Penalty Counters */}
      <div className={`flex items-center justify-between border-t border-slate-800/80 pt-3 lg:pt-4 shrink-0 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
        <PenaltyPips count={penalties} team={team} size="md" />
        {isWinning && (
          <span
            className={`text-[10px] sm:text-xs font-mono font-bold px-2.5 sm:px-3 py-1 rounded-full uppercase tracking-wider ${
              isRed ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
            }`}
          >
            ● LEADING SET
          </span>
        )}
      </div>
    </div>
  );
};
