import { useEffect, useState } from 'react';
import { staffRequest } from '../../api/staffRequest';
import { AuditLogEntry } from '../../types/scoreboard';

export function MatchAuditLog({ matchId }: { matchId: number }) {
  const [entries, setEntries] = useState<AuditLogEntry[] | null>(null);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    staffRequest(`/api/matches/${matchId}/audit-logs`)
      .then((response) => response.json())
      .then((events: AuditLogEntry[]) => {
        if (active) setEntries(events);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => { active = false; };
  }, [matchId, reload]);

  return (
    <section aria-label="Match audit log" className="mt-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h4 className="text-sm font-bold text-[var(--court-ink)]">Match audit log</h4>
        <button
          type="button"
          className="text-xs font-semibold text-[var(--court-accent-link)] hover:underline disabled:opacity-50"
          disabled={!entries && !error}
          onClick={() => {
            setEntries(null);
            setError(false);
            setReload((value) => value + 1);
          }}
        >
          Refresh log
        </button>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-[var(--drone-red-text)]">Could not load this match’s audit log.</p>
      ) : entries === null ? (
        <p role="status" className="text-sm text-[var(--court-muted)]">Loading audit log…</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-[var(--court-muted)]">No audit events are available for this match.</p>
      ) : (
        <ol className="max-h-72 overflow-y-auto rounded-lg border border-[var(--court-line)] bg-[var(--court-surface)] divide-y divide-[var(--court-line-soft)]">
          {entries.map((entry) => (
            <li key={entry.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-3 py-2">
              <time dateTime={entry.timestamp} className="tabular-nums text-[var(--court-muted)]">
                {entry.timestamp.slice(11, 19)}
              </time>
              <span className="min-w-0 break-words text-[var(--court-ink)]">{entry.description}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
