import { FormEvent, useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { staffRequest } from '../../api/staffRequest';
import { Team, TeamPlayer } from '../../types/scoreboard';

interface Props {
  team: Team;
  onClose: () => void;
}

export function TeamRosterDialog({ team, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const headingId = useId();
  const inputId = useId();
  const [players, setPlayers] = useState<TeamPlayer[] | null>(null);
  const [editing, setEditing] = useState<TeamPlayer | null>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const url = `/api/teams/${team.id}/players`;

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  useEffect(() => {
    let active = true;
    staffRequest(url)
      .then((response) => response.json())
      .then((roster: TeamPlayer[]) => { if (active) setPlayers(roster); })
      .catch(() => { if (active) setError('Could not load players. Reopen the roster to retry.'); });
    return () => { active = false; };
  }, [url]);

  const cancelEdit = () => {
    setEditing(null);
    setName('');
  };

  const savePlayer = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || busy) return;
    setBusy(true);
    setError('');
    try {
      const response = await staffRequest(editing ? `${url}/${editing.id}` : url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName }),
      });
      const saved: TeamPlayer = await response.json();
      setPlayers((current) => {
        if (!current) return current;
        return editing ? current.map((player) => player.id === saved.id ? saved : player) : [...current, saved];
      });
      cancelEdit();
    } catch {
      setError('Could not save the player. Check the connection and try again.');
    } finally {
      setBusy(false);
      input.current?.focus();
    }
  };

  const removePlayer = async (player: TeamPlayer) => {
    if (!window.confirm(`Remove "${player.name}" from ${team.name}?`)) return;
    setBusy(true);
    setError('');
    try {
      await staffRequest(`${url}/${player.id}`, { method: 'DELETE' });
      setPlayers((current) => current?.filter(({ id }) => id !== player.id) ?? null);
      if (editing?.id === player.id) cancelEdit();
    } catch {
      setError('Could not remove the player. Check the connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog
      ref={dialog}
      aria-labelledby={headingId}
      onCancel={onClose}
      className="w-[calc(100%-2rem)] max-w-xl max-h-[calc(100%-2rem)] rounded-2xl border border-[var(--court-line)] bg-[var(--court-surface)] p-5 text-[var(--court-ink)] shadow-2xl backdrop:bg-black/70 sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <h2 id={headingId} className="text-xl font-bold break-words min-w-0">{team.name} players</h2>
        <button type="button" aria-label="Close roster" onClick={onClose} className="p-2 -m-2 rounded-lg hover:bg-[var(--court-control-bg)]">
          <X className="w-5 h-5" />
        </button>
      </div>

      {error && <p role="alert" className="mt-4 text-sm text-[var(--drone-red-text)]">{error}</p>}
      {!players && !error && <p role="status" className="mt-4 text-sm text-[var(--court-muted)]">Loading players…</p>}

      {players && (
        <>
          <form onSubmit={savePlayer} className="mt-5">
            <label htmlFor={inputId} className="block mb-2 text-sm font-semibold">
              {editing ? `Edit ${editing.name}` : 'Player name'}
            </label>
            <div className="flex flex-wrap gap-2">
              <input
                ref={input}
                id={inputId}
                required
                maxLength={120}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="min-w-36 flex-1 px-3 py-2 text-sm rounded-lg bg-[var(--court-subtle)] border border-[var(--court-line)]"
              />
              <button
                disabled={busy || !name.trim()}
                className="px-3 py-2 text-sm font-semibold rounded-lg bg-[var(--court-active-pill-bg)] text-[var(--court-active-pill-fg)] disabled:opacity-50"
              >
                {editing ? 'Save name' : 'Add player'}
              </button>
              {editing && <button type="button" onClick={cancelEdit} disabled={busy} className="px-2 text-sm">Cancel</button>}
            </div>
          </form>

          {players.length === 0 ? (
            <p className="mt-5 text-sm text-[var(--court-muted)]">No players registered.</p>
          ) : (
            <ul className="mt-5 divide-y divide-[var(--court-line)] border-y border-[var(--court-line)]">
              {players.map((player) => (
                <li key={player.id} className="flex flex-wrap items-center justify-between gap-1 py-2 text-sm">
                  <span className="min-w-0 break-words">{player.name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label={`Edit ${player.name}`}
                      disabled={busy}
                      onClick={() => {
                        setEditing(player);
                        setName(player.name);
                        setError('');
                        input.current?.focus();
                      }}
                      className="px-2 py-1 text-[var(--court-accent-link)] hover:underline disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove ${player.name}`}
                      disabled={busy}
                      onClick={() => void removePlayer(player)}
                      className="px-2 py-1 text-[var(--drone-red-text)] hover:underline disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </dialog>
  );
}
