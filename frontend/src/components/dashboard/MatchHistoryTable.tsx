import React, { useState } from 'react';
import { MatchRecord } from '../../types/scoreboard';
import { Search, Download, Trophy, ChevronDown, ChevronUp, History } from 'lucide-react';

interface MatchHistoryTableProps {
  matches: MatchRecord[];
  onRefresh?: () => void;
}

export const MatchHistoryTable: React.FC<MatchHistoryTableProps> = ({ matches }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArena, setSelectedArena] = useState<string>('ALL');
  const [expandedMatchId, setExpandedMatchId] = useState<number | null>(null);

  const filteredMatches = matches.filter((m) => {
    const matchesSearch =
      m.matchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.teamRed.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.teamBlue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.tournamentName && m.tournamentName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesArena = selectedArena === 'ALL' || m.arenaId.toString() === selectedArena;

    return matchesSearch && matchesArena;
  });

  const exportCSV = () => {
    const headers = ['Match ID', 'Match Number', 'Arena ID', 'Team Red', 'Team Blue', 'Red Sets', 'Blue Sets', 'Winner', 'Status', 'Date'];
    const rows = filteredMatches.map((m) => [
      m.id,
      m.matchNumber,
      m.arenaId,
      `"${m.teamRed}"`,
      `"${m.teamBlue}"`,
      m.redSetScore,
      m.blueSetScore,
      m.winner || 'IN_PROGRESS',
      m.status,
      m.createdAt,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `drone_soccer_matches_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-4 p-6 rounded-3xl bg-slate-900/90 border-2 border-slate-800 shadow-xl">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <History className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-display font-bold text-white">Match History &amp; Auditing Log</h3>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search team or match..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-500 w-52"
            />
          </div>

          {/* Arena Filter */}
          <select
            value={selectedArena}
            onChange={(e) => setSelectedArena(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Arenas</option>
            <option value="1">Arena 1</option>
            <option value="2">Arena 2</option>
            <option value="3">Arena 3</option>
          </select>

          {/* CSV Export */}
          <button
            onClick={exportCSV}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT CSV</span>
          </button>
        </div>
      </div>

      {/* Matches Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">Match #</th>
              <th className="py-3 px-4">Arena</th>
              <th className="py-3 px-4">Red Team</th>
              <th className="py-3 px-4">Sets</th>
              <th className="py-3 px-4">Blue Team</th>
              <th className="py-3 px-4">Winner</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredMatches.map((m) => {
              const isExpanded = expandedMatchId === m.id;

              return (
                <React.Fragment key={m.id}>
                  <tr className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-cyan-400">{m.matchNumber}</td>
                    <td className="py-3.5 px-4 text-slate-300">Cage {m.arenaId}</td>
                    <td className="py-3.5 px-4 font-bold text-red-400">{m.teamRed}</td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      {m.redSetScore} - {m.blueSetScore}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-blue-400">{m.teamBlue}</td>
                    <td className="py-3.5 px-4">
                      {m.winner ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            m.winner === 'RED'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                              : m.winner === 'BLUE'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          <Trophy className="w-3 h-3" />
                          <span>{m.winner}</span>
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                        {m.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setExpandedMatchId(isExpanded ? null : m.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Set Breakdown Row */}
                  {isExpanded && m.setRecords && m.setRecords.length > 0 && (
                    <tr className="bg-slate-950/60">
                      <td colSpan={8} className="p-4">
                        <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                            Set-by-Set Granular Breakdown:
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {m.setRecords.map((set) => (
                              <div
                                key={set.id}
                                className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                              >
                                <div className="flex justify-between items-center mb-1 text-slate-400">
                                  <span className="font-bold">SET {set.setNumber}</span>
                                  <span>Winner: {set.winner}</span>
                                </div>
                                <div className="flex justify-between items-center font-bold text-sm">
                                  <span className="text-red-400">
                                    {set.redScore} pts ({set.redPenalties} penalties)
                                  </span>
                                  <span className="text-slate-600">vs</span>
                                  <span className="text-blue-400">
                                    {set.blueScore} pts ({set.bluePenalties} penalties)
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                          {m.notes && <p className="text-xs text-slate-400 mt-2 italic">Notes: {m.notes}</p>}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}

            {filteredMatches.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  No match records matching your filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
