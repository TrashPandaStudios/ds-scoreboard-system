import React from 'react';
import { SetSummary } from '../../types/scoreboard';

interface SetTrackerProps {
  currentSet: number;
  maxSets?: number;
  completedSets: SetSummary[];
  teamRed: string;
  teamBlue: string;
}

export const SetTracker: React.FC<SetTrackerProps> = ({
  currentSet,
  maxSets = 3,
  completedSets,
  teamRed,
  teamBlue,
}) => {
  const sets = Array.from({ length: maxSets }, (_, i) => i + 1);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Set Navigation Pills */}
      <div className="flex items-center gap-2">
        {sets.map((setNum) => {
          const isCurrent = setNum === currentSet;
          const completed = completedSets.find((s) => s.setNumber === setNum);

          return (
            <div
              key={setNum}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-mono transition-all ${
                isCurrent
                  ? 'bg-cyan-500/20 text-cyan-300 border-2 border-cyan-400 font-bold shadow-lg shadow-cyan-500/20 scale-105'
                  : completed
                  ? 'bg-slate-800 text-slate-300 border border-slate-700'
                  : 'bg-slate-900/60 text-slate-500 border border-slate-800'
              }`}
            >
              <span>SET {setNum}</span>
              {completed && (
                <span className="font-bold">
                  ({completed.redScore} - {completed.blueScore})
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Completed Sets Summary Table when available */}
      {completedSets.length > 0 && (
        <div className="flex items-center gap-4 text-xs font-mono text-slate-400 bg-slate-900/80 px-4 py-1.5 rounded-lg border border-slate-800">
          <span className="text-slate-500">History:</span>
          {completedSets.map((s) => (
            <div key={s.setNumber} className="flex items-center gap-1.5">
              <span className="text-slate-400">Set {s.setNumber}:</span>
              <span className="text-red-400 font-bold">{s.redScore}</span>
              <span>-</span>
              <span className="text-blue-400 font-bold">{s.blueScore}</span>
              <span
                className={`text-[10px] px-1 rounded font-bold ${
                  s.winner === 'RED'
                    ? 'bg-red-500/20 text-red-400'
                    : s.winner === 'BLUE'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                {s.winner}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
