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
}) => {
  const sets = Array.from({ length: maxSets }, (_, i) => i + 1);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {sets.map((setNum) => {
        const isCurrent = setNum === currentSet;
        const completed = completedSets.find((s) => s.setNumber === setNum);

        return (
          <div
            key={setNum}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold border"
            style={
              isCurrent
                ? {
                    backgroundColor: 'var(--drone-blue-tint)',
                    borderColor: 'var(--drone-blue-border)',
                    color: 'var(--drone-blue-text)',
                  }
                : completed
                ? {
                    backgroundColor: 'var(--court-surface)',
                    borderColor: 'var(--court-line)',
                    color: 'var(--court-ink)',
                  }
                : {
                    backgroundColor: 'var(--court-subtle)',
                    borderColor: 'var(--court-line-soft)',
                    color: 'var(--court-muted)',
                  }
            }
          >
            <span>Set {setNum}</span>
            {completed && (
              <span className="spectator-numeral text-base font-extrabold leading-none">
                <span style={{ color: 'var(--drone-red)' }}>{completed.redScore}</span>
                <span className="mx-1 text-[var(--court-muted)]">–</span>
                <span style={{ color: 'var(--drone-blue)' }}>{completed.blueScore}</span>
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
