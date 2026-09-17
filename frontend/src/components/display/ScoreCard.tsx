import React from 'react';
import { PenaltyPips } from './PenaltyPips';
import { Shield, Target, Trophy } from 'lucide-react';

interface ScoreCardProps {
  team: 'red' | 'blue';
  teamName: string;
  score: number;
  setScore: number;
  penalties: number;
  isWinning?: boolean;
  align?: 'left' | 'right';
}

export const ScoreCard: React.FC<ScoreCardProps> = ({
  team,
  teamName,
  score,
  setScore,
  penalties,
  isWinning = false,
  align = 'left',
}) => {
  const isRed = team === 'red';

  return (
    <div
      className={`relative flex-1 flex flex-col justify-between p-6 lg:p-8 rounded-3xl overflow-hidden transition-all duration-300 ${
        isRed
          ? 'bg-gradient-to-b from-red-950/40 via-slate-900/90 to-slate-950/95 border-2 border-red-500/40 box-glow-red'
          : 'bg-gradient-to-b from-blue-950/40 via-slate-900/90 to-slate-950/95 border-2 border-blue-500/40 box-glow-blue'
      }`}
    >
      {/* Top Banner: Team Header & Striker Role */}
      <div className={`flex items-center justify-between gap-4 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
              isRed
                ? 'bg-gradient-to-tr from-red-600 to-rose-400 text-white shadow-red-500/30'
                : 'bg-gradient-to-tr from-blue-600 to-sky-400 text-white shadow-blue-500/30'
            }`}
          >
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-mono font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                  isRed
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                }`}
              >
                {isRed ? 'RED TEAM' : 'BLUE TEAM'}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                <Target className="w-3 h-3 text-cyan-400" />
                <span>STRIKER #1</span>
              </span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-display font-extrabold text-white tracking-wide mt-1">
              {teamName}
            </h2>
          </div>
        </div>

        {/* Sets Won Trophy Badge */}
        <div className="flex flex-col items-center bg-slate-900/90 px-4 py-2 rounded-2xl border border-slate-800 shadow-inner">
          <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400 uppercase font-semibold">
            <Trophy className="w-3.5 h-3.5" />
            <span>SETS WON</span>
          </div>
          <span className="text-2xl font-mono font-black text-white">{setScore}</span>
        </div>
      </div>

      {/* Center: Massive Integer Score Display */}
      <div className="my-6 flex items-center justify-center">
        <div
          className={`font-display font-black text-8xl lg:text-9xl tracking-tight select-none tabular-nums transition-transform duration-200 hover:scale-105 ${
            isRed ? 'text-red-500 glow-red' : 'text-blue-400 glow-blue'
          }`}
        >
          {score}
        </div>
      </div>

      {/* Bottom: Penalty Counters */}
      <div className={`flex items-center justify-between border-t border-slate-800/80 pt-4 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
        <PenaltyPips count={penalties} team={team} size="md" />
        {isWinning && (
          <span
            className={`text-xs font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
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
