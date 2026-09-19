import React from 'react';
import { Plus, Minus, Edit3 } from 'lucide-react';
import { TeamBadge } from '../common/TeamBadge';

interface ScoreButtonGridProps {
  team: 'red' | 'blue';
  teamName: string;
  logoUrl?: string | null;
  score: number;
  onAddScore: () => void;
  onSubScore: () => void;
  onEditClick: () => void;
  hotkeyPlus: string;
  hotkeyMinus: string;
}

export const ScoreButtonGrid: React.FC<ScoreButtonGridProps> = ({
  team,
  teamName,
  logoUrl,
  score,
  onAddScore,
  onSubScore,
  onEditClick,
  hotkeyPlus,
  hotkeyMinus,
}) => {
  const isRed = team === 'red';

  return (
    <div
      className={`flex-1 flex flex-col p-6 rounded-3xl border-2 transition-all ${
        isRed
          ? 'bg-gradient-to-b from-red-950/40 via-slate-900 to-slate-950 border-red-500/40 shadow-lg shadow-red-500/10'
          : 'bg-gradient-to-b from-blue-950/40 via-slate-900 to-slate-950 border-blue-500/40 shadow-lg shadow-blue-500/10'
      }`}
    >
      {/* Team Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <TeamBadge
            teamName={teamName}
            logoUrl={logoUrl}
            side={team}
            size="md"
          />
          <div>
            <span
              className={`text-xs font-mono font-bold uppercase tracking-wider block ${
                isRed ? 'text-red-400' : 'text-blue-400'
              }`}
            >
              {isRed ? 'RED TEAM' : 'BLUE TEAM'}
            </span>
            <h3 className="text-xl font-display font-bold text-white">{teamName}</h3>
          </div>
        </div>

        <button
          onClick={onEditClick}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
          title="Click to edit team name or override score"
        >
          <Edit3 className="w-4 h-4" />
        </button>
      </div>

      {/* Large Score Indicator */}
      <div className="my-2 flex items-center justify-center">
        <span
          className={`font-display font-black text-7xl lg:text-8xl tabular-nums select-none ${
            isRed ? 'text-red-500 glow-red' : 'text-blue-400 glow-blue'
          }`}
        >
          {score}
        </span>
      </div>

      {/* Touch Buttons */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        {/* +1 Score Button */}
        <button
          onClick={onAddScore}
          className={`h-24 rounded-2xl flex flex-col items-center justify-center font-black transition-all active:scale-95 shadow-lg ${
            isRed
              ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
          }`}
        >
          <div className="flex items-center gap-1.5 text-2xl lg:text-3xl">
            <Plus className="w-7 h-7 stroke-[3]" />
            <span>1 PT</span>
          </div>
          <span className="text-[11px] font-mono opacity-80 mt-1 uppercase font-semibold">
            KEY: [{hotkeyPlus}]
          </span>
        </button>

        {/* -1 Score Button */}
        <button
          onClick={onSubScore}
          disabled={score <= 0}
          className="h-24 rounded-2xl flex flex-col items-center justify-center font-bold bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-95"
        >
          <div className="flex items-center gap-1.5 text-xl lg:text-2xl">
            <Minus className="w-6 h-6 stroke-[3]" />
            <span>1 PT</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400 mt-1 uppercase">
            KEY: [{hotkeyMinus}]
          </span>
        </button>
      </div>
    </div>
  );
};
