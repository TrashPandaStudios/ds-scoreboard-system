import React, { useState, useEffect } from 'react';
import { ScheduledMatch, ArenaSummary } from '../../types/scoreboard';
import { Calendar, Plus, PlayCircle, Trash2, UploadCloud, Clock, ShieldCheck } from 'lucide-react';

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

  // Identify the earliest match for each arena cage to badge as opening match
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
    <div className="flex flex-col gap-4 p-6 rounded-3xl bg-slate-900/90 border-2 border-slate-800 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <Calendar className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-lg font-display font-bold text-white">Tournament Match Queue</h3>
            <span className="text-xs font-mono text-slate-400">
              {queue.length} match(es) scheduled • {firstMatchIdByArena.size} cage(s) with opening lineups
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenPreload && (
            <button
              onClick={onOpenPreload}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-mono text-xs font-black flex items-center gap-1.5 shadow-md shadow-cyan-600/20 transition-all active:scale-95"
              title="Preload full tournament schedule from CSV or spreadsheet"
            >
              <UploadCloud className="w-4 h-4" />
              <span>PRELOAD / IMPORT SCHEDULE</span>
            </button>
          )}

          {onPrimeArenas && queue.length > 0 && (
            <button
              onClick={onPrimeArenas}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-600/60 text-emerald-300 font-mono text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Set all cages to their first scheduled matches right now"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>PRIME 1ST MATCHES</span>
            </button>
          )}

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-mono text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'CANCEL' : 'ADD MATCH'}</span>
          </button>
        </div>
      </div>

      {/* Quick Add Match Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddMatch}
          className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30 flex flex-col gap-3 animate-fadeIn"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-mono text-slate-400 mb-1">MATCH #</label>
              <input
                type="text"
                placeholder="e.g. M-105"
                value={matchNumber}
                onChange={(e) => setMatchNumber(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-400 mb-1">ASSIGN ARENA</label>
              <select
                value={arenaId}
                onChange={(e) => setArenaId(Number(e.target.value))}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500"
              >
                {arenas.length > 0 ? (
                  arenas.map((a) => (
                    <option key={a.arenaId} value={a.arenaId}>
                      {a.arenaName} (ID: #{a.arenaId})
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
              <label className="block text-[10px] font-mono text-slate-400 mb-1">TOURNAMENT</label>
              <input
                type="text"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono text-red-400 font-bold mb-1">RED TEAM</label>
              <input
                type="text"
                required
                placeholder="Team Red Name"
                value={teamRed}
                onChange={(e) => setTeamRed(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-red-500/40 text-xs font-mono text-white focus:outline-none focus:border-red-400"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-blue-400 font-bold mb-1">BLUE TEAM</label>
              <input
                type="text"
                required
                placeholder="Team Blue Name"
                value={teamBlue}
                onChange={(e) => setTeamBlue(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-blue-500/40 text-xs font-mono text-white focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-1">
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold"
            >
              SAVE TO QUEUE
            </button>
          </div>
        </form>
      )}

      {/* Queue List */}
      <div className="flex flex-col gap-2.5">
        {queue.map((item) => {
          const isFirstOnCage = firstMatchIdByArena.get(item.arenaId) === item.id;
          const isArmedOrActive = item.status === 'IN_PROGRESS';

          return (
            <div
              key={item.id}
              className={`flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all ${
                isArmedOrActive
                  ? 'bg-slate-950 border-cyan-500/50 shadow-md shadow-cyan-950/20'
                  : isFirstOnCage
                  ? 'bg-slate-950/90 border-emerald-500/40'
                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-800">
                  {item.matchNumber}
                </span>

                <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  Cage {item.arenaId}
                </span>

                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className="text-red-400 font-mono">{item.teamRed}</span>
                  <span className="text-slate-600 font-mono text-[10px]">VS</span>
                  <span className="text-blue-400 font-mono">{item.teamBlue}</span>
                </div>

                {isArmedOrActive && (
                  <span className="px-2 py-0.5 rounded-md bg-cyan-950 border border-cyan-600/60 text-cyan-300 text-[10px] font-mono font-black uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span>LOADED ON CAGE</span>
                  </span>
                )}

                {isFirstOnCage && !isArmedOrActive && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 text-[10px] font-mono font-black uppercase flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>1ST MATCH ON CAGE {item.arenaId}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onPushToArena(item)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-colors ${
                    isArmedOrActive
                      ? 'bg-cyan-600/30 hover:bg-cyan-600/50 border-cyan-500/60 text-cyan-200'
                      : 'bg-slate-800 hover:bg-cyan-600/30 border-slate-700 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300'
                  }`}
                  title={`Stage ${item.matchNumber} into Cage ${item.arenaId} engine`}
                >
                  <PlayCircle className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isArmedOrActive ? 'RE-ARM CAGE' : `LOAD CAGE ${item.arenaId}`}</span>
                </button>

                <button
                  onClick={() => onDeleteMatch(item.id)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
                  title="Remove match from queue"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {queue.length === 0 && (
          <div className="text-center py-10 rounded-2xl bg-slate-950/40 border border-dashed border-slate-800 flex flex-col items-center gap-3">
            <UploadCloud className="w-8 h-8 text-slate-600" />
            <div className="flex flex-col gap-1">
              <span className="text-xs font-mono text-slate-400 font-bold">No tournament matches loaded yet.</span>
              <span className="text-[11px] font-mono text-slate-500">
                Click "PRELOAD / IMPORT SCHEDULE" above to import teams and first matches.
              </span>
            </div>
            {onOpenPreload && (
              <button
                onClick={onOpenPreload}
                className="mt-1 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-all shadow-md shadow-cyan-600/20"
              >
                PRELOAD EVENT SCHEDULE
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
