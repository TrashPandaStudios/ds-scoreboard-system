import React, { useState } from 'react';
import { MatchRecord } from '../../types/scoreboard';
import { MatchAuditLog } from './MatchAuditLog';
import { Search, Download, Trophy, ChevronDown, ChevronUp } from 'lucide-react';

interface MatchHistoryTableProps {
  matches: MatchRecord[];
  onRefresh?: () => void;
}

export const MatchHistoryTable: React.FC<MatchHistoryTableProps> = ({ matches }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArena, setSelectedArena] = useState<string>('ALL');
  const [expandedMatchId, setExpandedMatchId] = useState<number | null>(null);

  const arenaIds = Array.from(new Set(matches.map((m) => m.arenaId))).sort((a, b) => a - b);

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
    const headers = [
      'Match ID',
      'Match Number',
      'Arena ID',
      'Team Red',
      'Team Blue',
      'Red Sets',
      'Blue Sets',
      'Winner',
      'Status',
      'Date',
    ];
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
    <div className="flex flex-col rounded-2xl bg-[var(--court-surface)] border border-[var(--court-line)] overflow-hidden">
      {/* Header & Controls */}
      <div className="px-5 py-4 bg-[var(--court-subtle)] border-b border-[var(--court-line-soft)] flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-bold text-[var(--court-ink)]">Match history &amp; audit log</h3>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-[var(--court-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search team or match"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-lg bg-[var(--court-surface)] border border-[var(--court-line)] text-xs text-[var(--court-ink)] placeholder:text-[var(--court-muted)] w-52"
            />
          </div>

          <select
            value={selectedArena}
            onChange={(e) => setSelectedArena(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[var(--court-surface)] border border-[var(--court-line)] text-xs text-[var(--court-ink)]"
          >
            <option value="ALL">All cages</option>
            {(arenaIds.length > 0 ? arenaIds : [1, 2, 3]).map((id) => (
              <option key={id} value={String(id)}>
                Cage {id}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={exportCSV}
            className="px-3 py-1.5 rounded-lg bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-[var(--court-ink)] border border-[var(--court-line)] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Matches Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[var(--court-line-soft)] text-[var(--court-muted)] bg-[var(--court-subtle)]">
              <th className="py-3 px-4 font-semibold">Match</th>
              <th className="py-3 px-4 font-semibold">Cage</th>
              <th className="py-3 px-4 font-semibold">Red team</th>
              <th className="py-3 px-4 font-semibold">Sets</th>
              <th className="py-3 px-4 font-semibold">Blue team</th>
              <th className="py-3 px-4 font-semibold">Winner</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--court-line-soft)]">
            {filteredMatches.map((m) => {
              const isExpanded = expandedMatchId === m.id;

              return (
                <React.Fragment key={m.id}>
                  <tr className="hover:bg-[var(--court-hover)] transition-colors">
                    <td className="py-3 px-4 font-bold text-[var(--court-ink)]">{m.matchNumber}</td>
                    <td className="py-3 px-4 text-[var(--court-muted)]">Cage {m.arenaId}</td>
                    <td className="py-3 px-4 font-semibold" style={{ color: 'var(--drone-red-text)' }}>
                      {m.teamRed}
                    </td>
                    <td className="py-3 px-4 spectator-numeral text-lg font-extrabold text-[var(--court-ink)]">
                      {m.redSetScore} – {m.blueSetScore}
                    </td>
                    <td className="py-3 px-4 font-semibold" style={{ color: 'var(--drone-blue-text)' }}>
                      {m.teamBlue}
                    </td>
                    <td className="py-3 px-4">
                      {m.winner ? (
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                          style={
                            m.winner === 'RED'
                              ? {
                                  backgroundColor: 'var(--drone-red-tint)',
                                  color: 'var(--drone-red-text)',
                                  borderColor: 'var(--drone-red-border)',
                                }
                              : m.winner === 'BLUE'
                              ? {
                                  backgroundColor: 'var(--drone-blue-tint)',
                                  color: 'var(--drone-blue-text)',
                                  borderColor: 'var(--drone-blue-border)',
                                }
                              : {
                                  backgroundColor: 'var(--court-control-bg)',
                                  color: 'var(--court-ink-secondary)',
                                  borderColor: 'var(--court-line)',
                                }
                          }
                        >
                          <Trophy className="w-3 h-3" />
                          <span>{m.winner === 'RED' ? 'Red' : m.winner === 'BLUE' ? 'Blue' : m.winner}</span>
                        </span>
                      ) : (
                        <span className="text-[var(--court-muted)]">–</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[var(--court-control-bg)] text-[var(--court-ink-secondary)]">
                        {m.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        aria-label={`Details for match ${m.matchNumber}`}
                        aria-expanded={isExpanded}
                        onClick={() => setExpandedMatchId(isExpanded ? null : m.id)}
                        className="p-1.5 rounded-lg bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-[var(--court-ink-secondary)] transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="bg-[var(--court-subtle)]">
                      <td colSpan={8} className="p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {m.setRecords?.map((set) => (
                            <div
                              key={set.id}
                              className="p-3 rounded-lg bg-[var(--court-surface)] border border-[var(--court-line-soft)]"
                            >
                              <div className="flex justify-between items-center mb-1.5 text-xs text-[var(--court-muted)]">
                                <span className="font-bold text-[var(--court-ink)]">Set {set.setNumber}</span>
                                <span>
                                  {set.winner === 'RED'
                                    ? 'Red won'
                                    : set.winner === 'BLUE'
                                    ? 'Blue won'
                                    : 'Draw'}
                                </span>
                              </div>
                              <div className="flex justify-between items-baseline">
                                <span className="spectator-numeral text-2xl font-extrabold text-[var(--drone-red)]">
                                  {set.redScore}
                                  <span className="text-xs font-sans text-[var(--court-muted)] ml-1">
                                    ({set.redPenalties}P)
                                  </span>
                                </span>
                                <span className="text-xs text-[var(--court-muted)]">to</span>
                                <span className="spectator-numeral text-2xl font-extrabold text-[var(--drone-blue)]">
                                  {set.blueScore}
                                  <span className="text-xs font-sans text-[var(--court-muted)] ml-1">
                                    ({set.bluePenalties}P)
                                  </span>
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        {m.notes && (
                          <p className="text-xs text-[var(--court-muted)] mt-2.5">Notes: {m.notes}</p>
                        )}
                        <MatchAuditLog matchId={m.id} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}

            {filteredMatches.length === 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-[var(--court-muted)]">
                  No match records match your filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
