import React, { useState, useEffect } from 'react';
import { ScheduledMatch, ArenaSummary } from '../../types/scoreboard';
import { Plus, PlayCircle, Trash2, UploadCloud, ShieldCheck } from 'lucide-react';

interface ScheduleQueueManagerProps {
  queue: ScheduledMatch[];
  arenas?: ArenaSummary[];
  onPushToArena: (match: ScheduledMatch) => void;
  onCreateMatch: (match: {
    matchNumber: string;
    tournamentName: string;
    arenaId: number;
    teamRed: string;
    teamBlue: string;
  }) => void;
  onDeleteMatch: (id: number) => void;
  onOpenPreload?: () => void;
  onPrimeArenas?: () => void;
}

export const ScheduleQueueManager: React.FC<ScheduleQueueManagerProps> = ({
  queue,
  arenas = [],
  onPushToArena,
  onCreateMatch,
  onDeleteMatch,
  onOpenPreload,
  onPrimeArenas,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [matchNumber, setMatchNumber] = useState('');
  const [tournamentName, setTournamentName] = useState('World Drone Soccer Championship');
  const [arenaId, setArenaId] = useState(arenas[0]?.arenaId || 1);
  const [teamRed, setTeamRed] = useState('');
  const [teamBlue, setTeamBlue] = useState('');

  useEffect(() => {
    if (arenas.length > 0 && !arenas.some((a) => a.arenaId === arenaId)) {
      setArenaId(arenas[0].arenaId);
    }
  }, [arenas, arenaId]);

  const firstMatchIdByArena = new Map<number, number>();
  queue.forEach((item) => {
    if (item.status !== 'COMPLETED' && !firstMatchIdByArena.has(item.arenaId)) {
      firstMatchIdByArena.set(item.arenaId, item.id);
    }
  });

  const handleAddMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamRed || !teamBlue) return;

    onCreateMatch({
      matchNumber: matchNumber || `M-${queue.length + 101}`,
      tournamentName,
      arenaId,
      teamRed,
      teamBlue,
    });

    setMatchNumber('');
    setTeamRed('');
    setTeamBlue('');
    setShowAddForm(false);
  };

  return (
    <div className="flex flex-col rounded-2xl bg-[var(--court-surface)] border border-[var(--court-line)] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-[var(--court-subtle)] border-b border-[var(--court-line-soft)] flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[var(--court-ink)]">Tournament match queue</h3>
          <span className="text-xs text-[var(--court-muted)]">
            {queue.length} scheduled matches across {firstMatchIdByArena.size} cages
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenPreload && (
            <button
              type="button"
              onClick={onOpenPreload}
              className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--drone-blue-solid)' }}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Preload / import</span>
            </button>
          )}

          {onPrimeArenas && queue.length > 0 && (
            <button
              type="button"
              onClick={onPrimeArenas}
              className="px-3 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              style={{
                backgroundColor: 'var(--signal-live-tint)',
                borderColor: 'var(--signal-live-border)',
                color: 'var(--signal-live-text)',
              }}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Prime opening matches</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1.5 rounded-lg bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-[var(--court-ink)] border border-[var(--court-line)] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddForm ? 'Cancel' : 'Add match'}</span>
          </button>
        </div>
      </div>

      {/* Add Match Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddMatch}
          className="p-5 bg-[var(--court-subtle)] border-b border-[var(--court-line-soft)] flex flex-col gap-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--court-muted)] mb-1">Match number</label>
              <input
                type="text"
                placeholder="e.g. M-105"
                value={matchNumber}
                onChange={(e) => setMatchNumber(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--court-surface)] border border-[var(--court-line)] text-xs text-[var(--court-ink)]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--court-muted)] mb-1">Assign cage</label>
              <select
                value={arenaId}
                onChange={(e) => setArenaId(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[var(--court-surface)] border border-[var(--court-line)] text-xs text-[var(--court-ink)]"
              >
                {arenas.length > 0 ? (
                  arenas.map((a) => (
                    <option key={a.arenaId} value={a.arenaId}>
                      {a.arenaName} (#{a.arenaId})
                    </option>
                  ))
                ) : (
                  <>
                    <option value={1}>Arena 1 (Alpha)</option>
                    <option value={2}>Arena 2 (Bravo)</option>
                    <option value={3}>Arena 3 (Charlie)</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--court-muted)] mb-1">Tournament</label>
              <input
                type="text"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--court-surface)] border border-[var(--court-line)] text-xs text-[var(--court-ink)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--drone-red-text)' }}>
                Red team
              </label>
              <input
                type="text"
                required
                placeholder="Team Red name"
                value={teamRed}
                onChange={(e) => setTeamRed(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--court-surface)] border text-xs text-[var(--court-ink)]"
                style={{ borderColor: 'var(--drone-red-border)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--drone-blue-text)' }}>
                Blue team
              </label>
              <input
                type="text"
                required
                placeholder="Team Blue name"
                value={teamBlue}
                onChange={(e) => setTeamBlue(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--court-surface)] border text-xs text-[var(--court-ink)]"
                style={{ borderColor: 'var(--drone-blue-border)' }}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-white text-xs font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--drone-blue-solid)' }}
            >
              Save to queue
            </button>
          </div>
        </form>
      )}

      {/* Queue List */}
      <div className="divide-y divide-[var(--court-line-soft)]">
        {queue.map((item) => {
          const isFirstOnCage = firstMatchIdByArena.get(item.arenaId) === item.id;
          const isArmedOrActive = item.status === 'IN_PROGRESS';

          return (
            <div
              key={item.id}
              className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 hover:bg-[var(--court-hover)] transition-colors"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-[var(--court-control-bg)] border border-[var(--court-line)] text-[var(--court-ink)]">
                  {item.matchNumber}
                </span>

                <span className="text-xs text-[var(--court-muted)]">Cage {item.arenaId}</span>

                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span style={{ color: 'var(--drone-red-text)' }}>{item.teamRed}</span>
                  <span className="text-xs font-normal text-[var(--court-muted)]">vs</span>
                  <span style={{ color: 'var(--drone-blue-text)' }}>{item.teamBlue}</span>
                </div>

                {isArmedOrActive && (
                  <span
                    className="px-2 py-0.5 rounded-full border text-[11px] font-semibold inline-flex items-center gap-1"
                    style={{
                      backgroundColor: 'var(--signal-info-tint)',
                      borderColor: 'var(--signal-info-border)',
                      color: 'var(--signal-info-text)',
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--signal-info)' }} />
                    <span>Loaded on cage</span>
                  </span>
                )}

                {isFirstOnCage && !isArmedOrActive && (
                  <span
                    className="px-2 py-0.5 rounded-full border text-[11px] font-semibold inline-flex items-center gap-1"
                    style={{
                      backgroundColor: 'var(--signal-live-tint)',
                      borderColor: 'var(--signal-live-border)',
                      color: 'var(--signal-live-text)',
                    }}
                  >
                    <ShieldCheck className="w-3 h-3" />
                    <span>Next on cage {item.arenaId}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onPushToArena(item)}
                  className="px-3 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                  style={
                    isArmedOrActive
                      ? {
                          backgroundColor: 'var(--signal-info-tint)',
                          borderColor: 'var(--signal-info-border)',
                          color: 'var(--signal-info-text)',
                        }
                      : {
                          backgroundColor: 'var(--court-control-bg)',
                          borderColor: 'var(--court-line)',
                          color: 'var(--court-ink)',
                        }
                  }
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>{isArmedOrActive ? 'Re-arm cage' : `Load cage ${item.arenaId}`}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteMatch(item.id)}
                  className="p-1.5 rounded-lg bg-[var(--court-control-bg)] hover:bg-[var(--drone-red-tint)] text-[var(--court-muted)] hover:text-[var(--drone-red-text)] border border-[var(--court-line)] transition-colors"
                  title="Remove match from queue"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {queue.length === 0 && (
          <div className="py-12 px-4 text-center flex flex-col items-center gap-3">
            <UploadCloud className="w-8 h-8 text-[var(--court-muted)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--court-ink)]">No matches in the queue</p>
              <p className="text-xs text-[var(--court-muted)] mt-0.5">
                Import a CSV schedule or add matches manually to arm your flight cages.
              </p>
            </div>
            {onOpenPreload && (
              <button
                type="button"
                onClick={onOpenPreload}
                className="px-4 py-2 rounded-lg text-white text-xs font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--drone-blue-solid)' }}
              >
                Preload event schedule
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
