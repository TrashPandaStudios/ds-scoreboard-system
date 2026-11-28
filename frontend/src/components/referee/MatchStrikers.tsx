import { useArenaCheckIn } from '../../hooks/useArenaCheckIn';
import { MatchStrikerForm } from './MatchStrikerForm';

export function MatchStrikers({ arenaId }: { arenaId: number }) {
  const { view, save, loadError } = useArenaCheckIn(arenaId, false);
  const match = view?.match;
  if (!match?.matchToken || match.matchEnded || (!match.red.lineup && !match.blue.lineup)) return null;

  return (
    <section aria-label="Match strikers" className="grid grid-cols-1 gap-4 rounded-2xl border border-[var(--court-line)] bg-[var(--court-surface)] p-4 md:grid-cols-2">
      {(['red', 'blue'] as const).map((side) => {
        const { name, lineup } = match[side];
        return lineup?.strikerId ? (
          <MatchStrikerForm
            key={`${match.matchToken}/${side}`}
            teamName={name}
            lineup={lineup}
            onSave={async (strikerId) => { await save(match, side, strikerId); }}
          />
        ) : (
          <p key={side} className="self-center text-sm text-[var(--court-muted)]">
            {name} {lineup ? 'checked in without a flying lineup.' : 'has no checked-in lineup.'}
          </p>
        );
      })}
      {loadError && <p role="status" className="text-sm text-[var(--signal-amber-text)] md:col-span-2">{loadError}</p>}
    </section>
  );
}
