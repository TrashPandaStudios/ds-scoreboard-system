import React, { useState } from 'react';
import { ScheduledMatch } from '../../types/scoreboard';
import { Calendar, Plus, PlayCircle, Trash2 } from 'lucide-react';

interface ScheduleQueueManagerProps {
  queue: ScheduledMatch[];
  onPushToArena: (match: ScheduledMatch) => void;
  onCreateMatch: (match: {
    matchNumber: string;
    tournamentName: string;
    arenaId: number;
    teamRed: string;
    teamBlue: string;
  }) => void;
  onDeleteMatch: (id: number) => void;
}

export const ScheduleQueueManager: React.FC<ScheduleQueueManagerProps> = ({
  queue,
  onPushToArena,
  onCreateMatch,
  onDeleteMatch,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [matchNumber, setMatchNumber] = useState('');
  const [tournamentName, setTournamentName] = useState('World Drone Soccer Championship');
  const [arenaId, setArenaId] = useState(1);
  const [teamRed, setTeamRed] = useState('');
  const [teamBlue, setTeamBlue] = useState('');

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
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <Calendar className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-display font-bold text-white">Tournament Match Queue</h3>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'CANCEL' : 'ADD MATCH'}</span>
        </button>
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
                <option value={1}>Arena 1 (Alpha)</option>
                <option value={2}>Arena 2 (Bravo)</option>
                <option value={3}>Arena 3 (Charlie)</option>
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
        {queue.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-800">
                {item.matchNumber}
              </span>
              <span className="text-xs font-mono text-slate-400">Cage {item.arenaId}</span>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="text-red-400">{item.teamRed}</span>
                <span className="text-slate-600 font-mono">VS</span>
                <span className="text-blue-400">{item.teamBlue}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onPushToArena(item)}
                className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
                title={`Push ${item.matchNumber} into Arena ${item.arenaId}`}
              >
                <PlayCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>LOAD INTO CAGE {item.arenaId}</span>
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
        ))}

        {queue.length === 0 && (
          <div className="text-center py-6 text-xs font-mono text-slate-500">
            No scheduled matches in queue. Click 'Add Match' above to schedule teams.
          </div>
        )}
      </div>
    </div>
  );
};
