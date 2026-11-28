import { FormEvent, useId, useState } from 'react';
import { MatchLineup } from '../../types/scoreboard';

interface Props {
  teamName: string;
  lineup: MatchLineup;
  onSave: (strikerId: string) => Promise<void>;
}

export function MatchStrikerForm({ teamName, lineup, onSave }: Props) {
  const id = useId();
  const [selection, setSelection] = useState({ version: lineup.version, strikerId: lineup.strikerId });
  const strikerId = selection.version === lineup.version ? selection.strikerId : lineup.strikerId;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedStrikerId, setSavedStrikerId] = useState<string | null>(null);

  const changeStriker = async (event: FormEvent) => {
    event.preventDefault();
    if (saving || strikerId === null || strikerId === lineup.strikerId) return;
    setError('');
    setSavedStrikerId(null);
    setSaving(true);
    try {
      await onSave(strikerId);
      setSavedStrikerId(strikerId);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not change the striker.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={changeStriker} className="min-w-0" data-referee-hotkeys="off">
      <label htmlFor={id} className="block mb-1.5 text-sm font-semibold text-[var(--court-ink)] break-words">
        {teamName} striker
      </label>
      <div className="flex flex-wrap gap-2">
        <select
          id={id}
          value={strikerId ?? ''}
          disabled={saving}
          onChange={(event) => {
            setSelection({ version: lineup.version, strikerId: event.target.value });
            setSavedStrikerId(null);
          }}
          className="min-w-32 max-w-full flex-1 rounded-lg border border-[var(--court-line)] bg-[var(--court-subtle)] px-3 py-2.5 text-sm"
        >
          {lineup.players.map((player) => (
            <option key={player.id} value={player.id}>
              {player.name}{player.id === lineup.strikerId ? ' (current)' : ''}
            </option>
          ))}
        </select>
        <button
          disabled={saving || strikerId === null || strikerId === lineup.strikerId}
          className="rounded-lg border border-[var(--court-line)] bg-[var(--court-control-bg)] px-3 py-2.5 text-sm font-semibold hover:bg-[var(--court-control-hover)] disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Change striker'}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-[var(--drone-red-text)]" role="alert">{error}</p>}
      {savedStrikerId !== null && savedStrikerId === lineup.strikerId && (
        <p className="mt-2 text-sm text-[var(--signal-live-text)]" role="status">Striker updated.</p>
      )}
    </form>
  );
}
