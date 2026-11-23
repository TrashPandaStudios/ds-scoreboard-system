import React from 'react';
import { Plus, Minus, Edit3 } from 'lucide-react';
import { TeamBadge } from '../common/TeamBadge';

interface ScoreButtonGridProps {
  team: 'red' | 'blue';
  teamName: string;
  logoUrl?: string | null;
  score: number;
  pendingDelta?: number;
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
  pendingDelta = 0,
  onAddScore,
  onSubScore,
  onEditClick,
  hotkeyPlus,
  hotkeyMinus,
}) => {
  const isRed = team === 'red';

  return (
    <div
      className={`flex-1 flex flex-col p-5 sm:p-6 rounded-2xl border border-[var(--court-line)] overflow-hidden ${
        isRed ? 'spectator-red-vertical border-t-4 border-t-[var(--drone-red)]' : 'spectator-blue-vertical border-t-4 border-t-[var(--drone-blue)]'
      }`}
    >
      {/* Team Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <TeamBadge teamName={teamName} logoUrl={logoUrl} side={team} size="md" />
          <div className="min-w-0">
            <span
              className="text-xs font-semibold block"
              style={{ color: isRed ? 'var(--drone-red-text)' : 'var(--drone-blue-text)' }}
            >
              {isRed ? 'Red team' : 'Blue team'}
            </span>
            <h3 className="spectator-numeral text-2xl sm:text-3xl font-extrabold text-[var(--court-ink)] leading-tight truncate">
              {teamName}
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={onEditClick}
          className="p-2 rounded-lg bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-[var(--court-muted)] hover:text-[var(--court-ink)] border border-[var(--court-line)] transition-colors"
          title="Edit team name or override score"
        >
          <Edit3 className="w-4 h-4" />
        </button>
      </div>

      {/* Large Score Indicator */}
      <div className="my-2 flex flex-col items-center justify-center">
        <span
          className="spectator-numeral text-8xl lg:text-9xl font-black leading-none select-none"
          style={{ color: isRed ? 'var(--drone-red)' : 'var(--drone-blue)' }}
        >
          {score}
        </span>
        {pendingDelta !== 0 && (
          <span
            className="mt-1.5 px-2.5 py-0.5 rounded-full border text-xs font-semibold animate-pulse"
            style={{
              backgroundColor: 'var(--signal-amber-tint)',
              borderColor: 'var(--signal-amber-border)',
              color: 'var(--signal-amber-text)',
            }}
          >
            {pendingDelta > 0 ? `+${pendingDelta}` : pendingDelta} syncing
          </span>
        )}
      </div>

      {/* Touch Buttons */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <button
          type="button"
          onClick={onAddScore}
          className="h-24 rounded-xl flex flex-col items-center justify-center font-extrabold text-white transition-opacity hover:opacity-95 active:scale-[0.98]"
          style={{
            backgroundColor: isRed ? 'var(--drone-red-solid)' : 'var(--drone-blue-solid)',
          }}
        >
          <div className="flex items-center gap-1 text-2xl lg:text-3xl">
            <Plus className="w-7 h-7 stroke-[3]" />
            <span>1 pt</span>
          </div>
          <span className="text-xs font-mono opacity-85 mt-1">{hotkeyPlus}</span>
        </button>

        <button
          type="button"
          onClick={onSubScore}
          disabled={score <= 0}
          className="h-24 rounded-xl flex flex-col items-center justify-center font-bold bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-[var(--court-ink)] border border-[var(--court-line)] disabled:opacity-40 disabled:pointer-events-none transition-colors active:scale-[0.98]"
        >
          <div className="flex items-center gap-1 text-xl lg:text-2xl">
            <Minus className="w-6 h-6 stroke-[3]" />
            <span>1 pt</span>
          </div>
          <span className="text-xs font-mono text-[var(--court-muted)] mt-1">{hotkeyMinus}</span>
        </button>
      </div>
    </div>
  );
};
