import { FormEvent, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, ClipboardCheck, Moon, Sun } from 'lucide-react';
import { TeamBadge } from '../components/common/TeamBadge';
import { MatchStrikerForm } from '../components/referee/MatchStrikerForm';
import { useArenaCheckIn } from '../hooks/useArenaCheckIn';
import { useSpectatorTheme } from '../hooks/useSpectatorTheme';
import { CheckInTeam, TeamPlayer, TeamSide } from '../types/scoreboard';

const MAX_LINEUP_SIZE = 5;
const SIDES = ['red', 'blue'] as const;
const secondaryButton = 'inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--court-line)] bg-[var(--court-control-bg)] px-4 py-2 text-sm font-semibold text-[var(--court-ink)] hover:bg-[var(--court-control-hover)]';
const primaryButton = 'inline-flex min-h-11 items-center justify-center rounded-lg bg-[var(--court-active-pill-bg)] px-4 py-2 text-sm font-bold text-[var(--court-active-pill-fg)] hover:opacity-90 disabled:opacity-45';

interface LineupFormProps {
  team: CheckInTeam;
  roster: TeamPlayer[];
  busy: boolean;
  onSave: (playerIds: string[], strikerId: string | null) => Promise<void>;
}

function LineupForm({ team, roster, busy, onSave }: LineupFormProps) {
  const [playerIds, setPlayerIds] = useState(team.lineup?.players.map(({ id }) => id) ?? []);
  const [strikerId, setStrikerId] = useState(team.lineup?.strikerId ?? null);
  const selectedIds = roster.filter(({ id }) => playerIds.includes(id)).map(({ id }) => id);
  const selectedStriker = strikerId !== null && selectedIds.includes(strikerId) ? strikerId : null;
  const emptyRoster = roster.length === 0;
  const canCheckInWithoutPlayers = emptyRoster && team.lineup?.players.length !== 0;
  const canSaveLineup = selectedStriker !== null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (canCheckInWithoutPlayers || canSaveLineup) await onSave(selectedIds, selectedStriker);
  };

  return (
    <form onSubmit={submit}>
      <fieldset disabled={busy}>
        <legend className="text-lg font-bold">Flying lineup</legend>
        {!emptyRoster && (
          <p className="mt-1 text-sm text-[var(--court-muted)]">Select up to five flying players and choose one of them as striker.</p>
        )}
        {emptyRoster && (
          <p className="my-4 rounded-lg border border-[var(--signal-amber-border)] bg-[var(--signal-amber-tint)] p-3 text-sm text-[var(--signal-amber-text)]">
            {team.name} has no registered players.
            Add players in the <Link to="/master?tab=teams" className="underline underline-offset-2">team registry</Link> to record a lineup.
          </p>
        )}
        {roster.length > 0 && (
          <>
            <div className="mt-5 grid grid-cols-[minmax(0,1fr)_4.5rem_4.5rem] items-center gap-2 px-3 py-2 text-xs font-semibold text-[var(--court-muted)] sm:grid-cols-[minmax(0,1fr)_6rem_6rem]">
              <span>Player</span>
              <span className="text-center">Flying</span>
              <span className="text-center">Striker</span>
            </div>
            <ul className="divide-y divide-[var(--court-line)] rounded-xl border border-[var(--court-line)]">
              {roster.map((player) => {
                const flying = selectedIds.includes(player.id);
                const striker = selectedStriker === player.id;
                return (
                  <li key={player.id} className="grid min-h-14 grid-cols-[minmax(0,1fr)_4.5rem_4.5rem] items-center gap-2 px-3 sm:grid-cols-[minmax(0,1fr)_6rem_6rem]"
                    style={{ backgroundColor: striker ? 'var(--signal-live-tint)' : undefined }}>
                    <label htmlFor={`flying-${player.id}`} className="min-w-0 cursor-pointer break-words py-2 font-medium">{player.name}</label>
                    <label className="flex min-h-12 items-center justify-center">
                      <input
                        id={`flying-${player.id}`}
                        type="checkbox"
                        aria-label={`${player.name} flying`}
                        checked={flying}
                        disabled={!flying && selectedIds.length >= MAX_LINEUP_SIZE}
                        onChange={(event) => {
                          setPlayerIds(event.target.checked ? [...selectedIds, player.id] : selectedIds.filter((id) => id !== player.id));
                          if (!event.target.checked && striker) setStrikerId(null);
                        }}
                        className="h-5 w-5 accent-[var(--drone-blue-solid)]"
                      />
                    </label>
                    <label className="flex min-h-12 items-center justify-center">
                      <input
                        name="striker"
                        type="radio"
                        aria-label={`${player.name} as striker`}
                        checked={striker}
                        disabled={!flying}
                        onChange={() => setStrikerId(player.id)}
                        className="h-5 w-5 accent-[var(--signal-live)]"
                      />
                    </label>
                  </li>
                );
              })}
            </ul>
          </>
        )}
        {emptyRoster ? (
          canCheckInWithoutPlayers && (
            <button disabled={busy} className={primaryButton}>
              {busy ? 'Saving…' : 'Check in without players'}
            </button>
          )
        ) : (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <span role="status" className="text-sm font-semibold text-[var(--court-ink-secondary)]">
              {selectedIds.length} flying
            </span>
            <button disabled={!canSaveLineup || busy} className={primaryButton}>
              {busy ? 'Saving…' : team.lineup ? 'Save lineup' : 'Confirm check-in'}
            </button>
          </div>
        )}
      </fieldset>
    </form>
  );
}

function ArenaCheckInPage({ arenaId }: { arenaId: number }) {
  const { view, loadError, refresh, save } = useArenaCheckIn(arenaId, true);
  const { theme, toggleTheme } = useSpectatorTheme();
  const [selection, setSelection] = useState<{ token: string; side: TeamSide } | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ token: string; message: string; error: boolean } | null>(null);
  const match = view?.match;
  const side = selection?.token === match?.matchToken && selection
    ? selection.side
    : match?.red.lineup && !match.blue.lineup ? 'blue' : 'red';
  const team = match?.[side];
  const otherSide = side === 'red' ? 'blue' : 'red';
  const refereeUrl = `/arena/${arenaId}/referee`;

  const selectTeam = (nextSide: TeamSide) => {
    if (!match?.matchToken) return;
    setSelection({ token: match.matchToken, side: nextSide });
    setFeedback(null);
  };

  const saveLineup = async (playerIds: string[], strikerId: string | null) => {
    if (!match?.matchToken || !team) return;
    setBusy(true);
    setFeedback(null);
    try {
      await save(match, side, strikerId, playerIds);
      setSelection({ token: match.matchToken, side });
      const message = `${team.name} checked in${playerIds.length === 0 ? ' without players' : ''}.`;
      setFeedback({ token: match.matchToken, message, error: false });
    } catch (error) {
      setFeedback({
        token: match.matchToken,
        message: error instanceof Error ? error.message : 'Could not save the lineup.',
        error: true,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app-shell min-h-screen">
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--court-line)] pb-5">
          <div>
            <p className="text-sm font-semibold text-[var(--court-muted)]">
              {match?.arenaName ?? `Arena ${arenaId}`}{match?.matchToken && match.matchNumber !== 'TBD' ? ` / Match ${match.matchNumber}` : ''}
            </p>
            <h1 className="spectator-numeral mt-1 text-4xl font-extrabold sm:text-5xl">Team check-in</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              className={secondaryButton}
            >
              {theme === 'dark' ? <Sun aria-hidden="true" className="h-4 w-4" /> : <Moon aria-hidden="true" className="h-4 w-4" />}
            </button>
            <Link to={refereeUrl} className={secondaryButton}>Referee console</Link>
          </div>
        </div>

        {loadError && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--signal-amber-border)] bg-[var(--signal-amber-tint)] p-3 text-sm">
            <p role="alert">{loadError}</p>
            <button type="button" className="font-semibold underline underline-offset-2" onClick={() => void refresh()}>Retry</button>
          </div>
        )}
        {!view && !loadError && <p role="status" className="mt-5 text-[var(--court-muted)]">Loading match…</p>}
        {match && !match.matchToken && (
          <p className="mt-5 text-[var(--court-ink-secondary)]">Load a match in the referee console to check in its teams.</p>
        )}
        {view && match?.matchToken && team && (
          <>
            <div role="group" aria-label="Match teams" className="my-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SIDES.map((option) => {
                const entry = match[option];
                const isSelected = side === option;
                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={isSelected}
                    disabled={busy}
                    onClick={() => selectTeam(option)}
                    className="flex min-w-0 items-center gap-3 rounded-xl border px-3 py-3 text-left hover:bg-[var(--court-control-hover)] focus-visible:ring-2 focus-visible:ring-[var(--court-accent-link)]"
                    style={{
                      borderColor: isSelected ? `var(--drone-${option})` : 'var(--court-line)',
                      backgroundColor: isSelected ? `var(--drone-${option}-tint)` : 'var(--court-surface)',
                    }}
                  >
                    <TeamBadge teamName={entry.name} logoUrl={entry.logoUrl} side={option} />
                    <span className="min-w-0">
                      <span className="block font-bold break-words">{entry.name}</span>
                      <span className="flex items-center gap-1 text-xs text-[var(--court-ink-secondary)]">
                        {entry.lineup && <Check aria-hidden="true" className="h-3.5 w-3.5 text-[var(--signal-live-text)]" />}
                        {entry.lineup
                          ? entry.lineup.players.length === 0 ? 'Checked in without players' : 'Checked in'
                          : match.canCheckIn ? 'Awaiting check-in' : 'Check-in skipped'}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <section className="rounded-2xl border border-[var(--court-line)] bg-[var(--court-surface)] p-4 sm:p-6">
              {match.canCheckIn ? (
                <LineupForm
                  key={`${match.matchToken}/${side}/${team.lineup?.version ?? ''}`}
                  team={team}
                  roster={side === 'red' ? view.redRoster : view.blueRoster}
                  busy={busy}
                  onSave={saveLineup}
                />
              ) : team.lineup?.strikerId ? (
                <>
                  <h2 className="text-lg font-bold">Flying lineup</h2>
                  <ul className="mt-3 divide-y divide-[var(--court-line)] border-y border-[var(--court-line)]">
                    {team.lineup.players.map((player) => (
                      <li key={player.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                        <span className="min-w-0 break-words">{player.name}</span>
                        {player.id === team.lineup?.strikerId && <span className="text-sm font-semibold text-[var(--signal-live-text)]">Striker</span>}
                      </li>
                    ))}
                  </ul>
                  {!match.matchEnded && (
                    <div className="mt-5">
                      <MatchStrikerForm
                        key={`${match.matchToken}/${side}`}
                        teamName={team.name}
                        lineup={team.lineup}
                        onSave={async (strikerId) => { await save(match, side, strikerId); }}
                      />
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-[var(--court-ink-secondary)]">
                  {team.name} {team.lineup ? 'checked in without a flying lineup.' : 'started without a checked-in lineup.'}
                </p>
              )}
            </section>

            {feedback?.token === match.matchToken && (
              <p role={feedback.error ? 'alert' : 'status'} className={`mt-4 text-sm font-semibold ${feedback.error ? 'text-[var(--drone-red-text)]' : 'text-[var(--signal-live-text)]'}`}>
                {feedback.message}
              </p>
            )}
            {match.canCheckIn && team.lineup && (
              <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                {!match[otherSide].lineup && (
                  <button type="button" disabled={busy} className={primaryButton} onClick={() => selectTeam(otherSide)}>
                    <ClipboardCheck aria-hidden="true" className="mr-2 h-4 w-4 shrink-0" />
                    Check in {match[otherSide].name}
                  </button>
                )}
                <Link to={refereeUrl} className={match[otherSide].lineup ? primaryButton : secondaryButton}>
                  Continue to referee console
                </Link>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export function ArenaCheckIn() {
  const { id } = useParams<{ id: string }>();
  const arenaId = Number(id);
  return <ArenaCheckInPage key={arenaId} arenaId={arenaId} />;
}
