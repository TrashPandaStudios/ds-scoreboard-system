import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  Plus,
  Trash2,
  Copy,
  Download,
  Layers,
  PlayCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { ArenaSummary, PreloadResultDTO, MatchScheduleInput } from '../../types/scoreboard';

interface PreloadScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  arenas?: ArenaSummary[];
  onSuccess?: () => void;
}

const SAMPLE_CSV = `Match,Cage,Red Team,Blue Team,Time,Tournament
M-101,1,Red Phoenix,Blue Comets,09:00,World Drone Soccer Championship
M-102,2,Thunder Hawks,Cyber Vipers,09:00,World Drone Soccer Championship
M-103,3,Nova Strikers,Shadow Drones,09:00,World Drone Soccer Championship
M-104,1,Solar Flares,Apex Predators,09:25,World Drone Soccer Championship
M-105,2,Hyperion Aero,Titanium Wings,09:25,World Drone Soccer Championship
M-106,3,Velocity Drone,Skyline Strikers,09:25,World Drone Soccer Championship`;

export const PreloadScheduleModal: React.FC<PreloadScheduleModalProps> = ({
  isOpen,
  onClose,
  arenas = [],
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'CSV' | 'MANUAL'>('CSV');
  const [csvText, setCsvText] = useState<string>(SAMPLE_CSV);
  const [tournamentName, setTournamentName] = useState<string>('World Drone Soccer Championship');
  const [autoLoadArenas, setAutoLoadArenas] = useState<boolean>(true);
  const [clearExisting, setClearExisting] = useState<boolean>(true);

  const [manualMatches, setManualMatches] = useState<MatchScheduleInput[]>([
    { matchNumber: 'M-101', arenaId: 1, teamRed: 'Red Phoenix', teamBlue: 'Blue Comets', scheduledTime: '09:00' },
    { matchNumber: 'M-102', arenaId: 2, teamRed: 'Thunder Hawks', teamBlue: 'Cyber Vipers', scheduledTime: '09:00' },
    { matchNumber: 'M-103', arenaId: 3, teamRed: 'Nova Strikers', teamBlue: 'Shadow Drones', scheduledTime: '09:00' },
  ]);

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultSummary, setResultSummary] = useState<PreloadResultDTO | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setResultSummary(null);
      setLoading(false);
      setCopiedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const parsePreviewMatches = (): { matches: MatchScheduleInput[]; warnings: string[] } => {
    if (activeTab === 'MANUAL') {
      const warnings: string[] = [];
      manualMatches.forEach((m, idx) => {
        if (!m.teamRed?.trim() || !m.teamBlue?.trim()) {
          warnings.push(`Row ${idx + 1}: Red and Blue team names are required.`);
        }
      });
      return { matches: manualMatches, warnings };
    }

    const warnings: string[] = [];
    if (!csvText.trim()) return { matches: [], warnings };

    const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return { matches: [], warnings };

    const delimiter = lines[0].includes('\t') ? '\t' : lines[0].includes(';') && !lines[0].includes(',') ? ';' : ',';
    const headerParts = lines[0].split(delimiter).map((h) => h.toLowerCase().trim().replace(/^"|"$/g, ''));

    let matchIdx = -1,
      cageIdx = -1,
      redIdx = -1,
      blueIdx = -1,
      timeIdx = -1;

    headerParts.forEach((h, i) => {
      if (h.includes('match')) matchIdx = i;
      else if (h.includes('cage') || h.includes('arena') || h.includes('court') || h.includes('pitch')) cageIdx = i;
      else if (h.includes('red') || h.includes('team1') || h.includes('team 1')) redIdx = i;
      else if (h.includes('blue') || h.includes('team2') || h.includes('team 2')) blueIdx = i;
      else if (h.includes('time') || h.includes('sched') || h.includes('start')) timeIdx = i;
    });

    const hasHeader = matchIdx !== -1 || cageIdx !== -1 || redIdx !== -1 || blueIdx !== -1;
    const startLine = hasHeader ? 1 : 0;
    if (!hasHeader) {
      matchIdx = 0;
      cageIdx = 1;
      redIdx = 2;
      blueIdx = 3;
      timeIdx = 4;
    }

    const parsed: MatchScheduleInput[] = [];

    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('#')) continue;

      const regex = new RegExp(`${delimiter}(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)`);
      const cols = line.split(regex).map((c) => c.replace(/^"|"$/g, '').trim());

      const matchNumber = cols[matchIdx] || `M-${parsed.length + 101}`;
      const cageStr = cols[cageIdx] || '1';
      const teamRed = cols[redIdx] || '';
      const teamBlue = cols[blueIdx] || '';
      const scheduledTime = cols[timeIdx] || '';

      const arenaMatch = cageStr.match(/\d+/);
      const arenaId = arenaMatch ? parseInt(arenaMatch[0], 10) : 1;

      if (!teamRed || !teamBlue) {
        warnings.push(`Line ${i + 1}: Missing Red or Blue team.`);
      }

      parsed.push({
        matchNumber,
        arenaId,
        teamRed,
        teamBlue,
        scheduledTime,
        tournamentName,
      });
    }

    return { matches: parsed, warnings };
  };

  const { matches: previewMatches, warnings: previewWarnings } = parsePreviewMatches();

  const firstMatchIdsByArena = new Set<string>();
  const seenArenas = new Set<number>();
  previewMatches.forEach((m) => {
    const aId = m.arenaId || 1;
    if (!seenArenas.has(aId)) {
      seenArenas.add(aId);
      firstMatchIdsByArena.add(`${aId}-${m.matchNumber}`);
    }
  });

  const uniqueTeamsCount = new Set([
    ...previewMatches.map((m) => m.teamRed?.trim()).filter(Boolean),
    ...previewMatches.map((m) => m.teamBlue?.trim()).filter(Boolean),
  ]).size;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) setCsvText(text);
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'drone_soccer_schedule_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(SAMPLE_CSV);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  const handleAddManualRow = () => {
    const nextMatchNum = `M-${manualMatches.length + 101}`;
    const nextArenaId = (manualMatches.length % (arenas.length || 3)) + 1;
    setManualMatches([
      ...manualMatches,
      { matchNumber: nextMatchNum, arenaId: nextArenaId, teamRed: '', teamBlue: '', scheduledTime: '09:00' },
    ]);
  };

  const handleRemoveManualRow = (index: number) => {
    setManualMatches(manualMatches.filter((_, idx) => idx !== index));
  };

  const handleManualChange = (index: number, field: keyof MatchScheduleInput, value: any) => {
    const updated = [...manualMatches];
    updated[index] = { ...updated[index], [field]: value };
    setManualMatches(updated);
  };

  const handleSubmitPreload = async () => {
    if (previewMatches.length === 0) {
      setErrorMessage('Please provide at least one scheduled match.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/queue/preload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matches: previewMatches,
          clearExisting,
          autoLoadArenas,
          defaultTournamentName: tournamentName,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Preload failed (HTTP ${res.status})`);
      }

      const data: PreloadResultDTO = await res.json();
      setResultSummary(data);
      onSuccess?.();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to preload tournament data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 backdrop-blur-sm overflow-y-auto"
      style={{ backgroundColor: 'var(--court-overlay-backdrop)' }}
    >
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-[var(--court-surface)] border border-[var(--court-line)] shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--court-line-soft)] bg-[var(--court-subtle)] shrink-0">
          <div>
            <h2 className="text-xl font-bold text-[var(--court-ink)]">Preload tournament schedule</h2>
            <p className="text-xs text-[var(--court-muted)] mt-0.5">
              Import matches from CSV or build the lineup manually and arm opening cages.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-[var(--court-muted)] hover:text-[var(--court-ink)] hover:bg-[var(--court-control-bg)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
          {resultSummary ? (
            <div className="flex flex-col items-center justify-center py-6 text-center gap-5">
              <div
                className="w-14 h-14 rounded-2xl border flex items-center justify-center"
                style={{
                  backgroundColor: 'var(--signal-live-tint)',
                  borderColor: 'var(--signal-live-border)',
                  color: 'var(--signal-live-text)',
                }}
              >
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="max-w-lg">
                <h3 className="text-xl font-bold text-[var(--court-ink)]">Schedule loaded</h3>
                <p className="text-xs text-[var(--court-muted)] mt-1">
                  {resultSummary.message ||
                    `Loaded ${resultSummary.totalMatchesLoaded} matches and armed ${resultSummary.totalArenasPrimed} cages.`}
                </p>
              </div>

              {resultSummary.primedArenas && resultSummary.primedArenas.length > 0 && (
                <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-left">
                  {resultSummary.primedArenas.map((pa) => (
                    <div
                      key={pa.arenaId}
                      className="p-4 rounded-xl bg-[var(--court-subtle)] border border-[var(--court-line-soft)] flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[var(--court-ink)]">Cage {pa.arenaId}</span>
                        <span className="font-semibold text-[var(--court-accent-link)]">{pa.matchNumber}</span>
                      </div>
                      <div className="text-xs font-semibold">
                        <span style={{ color: 'var(--drone-red-text)' }}>{pa.teamRed}</span>
                        <span className="text-[var(--court-muted)] mx-1.5">vs</span>
                        <span style={{ color: 'var(--drone-blue-text)' }}>{pa.teamBlue}</span>
                      </div>
                      <span
                        className="text-[11px] font-semibold inline-flex items-center gap-1 mt-1"
                        style={{ color: 'var(--signal-live-text)' }}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Armed at 03:00</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-lg text-white text-xs font-semibold"
                style={{ backgroundColor: 'var(--drone-blue-solid)' }}
              >
                Back to Admin Panel
              </button>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div
                  className="p-3 rounded-xl border text-xs font-semibold flex items-center gap-2"
                  style={{
                    backgroundColor: 'var(--drone-red-tint)',
                    borderColor: 'var(--drone-red-border)',
                    color: 'var(--drone-red-text)',
                  }}
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Tournament Name & Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-[var(--court-subtle)] border border-[var(--court-line-soft)]">
                <div>
                  <label className="block text-xs font-semibold text-[var(--court-ink-secondary)] mb-1">
                    Tournament title
                  </label>
                  <input
                    type="text"
                    value={tournamentName}
                    onChange={(e) => setTournamentName(e.target.value)}
                    placeholder="e.g. FIDA National Championship"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--court-surface)] border border-[var(--court-line)] text-[var(--court-ink)] text-xs"
                  />
                </div>

                <div className="sm:col-span-2 flex flex-col justify-center gap-2 text-xs text-[var(--court-ink-secondary)]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoLoadArenas}
                      onChange={(e) => setAutoLoadArenas(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="font-semibold text-[var(--court-ink)]">
                      Auto-load each cage with its opening match
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={clearExisting}
                      onChange={(e) => setClearExisting(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <span>Clear existing queue before import</span>
                  </label>
                </div>
              </div>

              {/* Mode Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--court-line-soft)] pb-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('CSV')}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                    style={
                      activeTab === 'CSV'
                        ? {
                            backgroundColor: 'var(--court-active-pill-bg)',
                            color: 'var(--court-active-pill-fg)',
                          }
                        : { color: 'var(--court-muted)' }
                    }
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>CSV import</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('MANUAL')}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                    style={
                      activeTab === 'MANUAL'
                        ? {
                            backgroundColor: 'var(--court-active-pill-bg)',
                            color: 'var(--court-active-pill-fg)',
                          }
                        : { color: 'var(--court-muted)' }
                    }
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Manual builder</span>
                  </button>
                </div>

                {activeTab === 'CSV' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyTemplate}
                      className="px-2.5 py-1.5 rounded-lg bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-[var(--court-ink-secondary)] text-xs font-semibold inline-flex items-center gap-1.5 border border-[var(--court-line)]"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedSuccess ? 'Copied' : 'Copy template'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="px-2.5 py-1.5 rounded-lg bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-[var(--court-accent-link)] text-xs font-semibold inline-flex items-center gap-1.5 border border-[var(--court-line)]"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download CSV</span>
                    </button>
                  </div>
                )}
              </div>

              {/* CSV Tab */}
              {activeTab === 'CSV' && (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center justify-between text-xs text-[var(--court-muted)]">
                    <span>
                      Paste CSV rows below or{' '}
                      <label className="text-[var(--court-accent-link)] underline cursor-pointer">
                        browse a file
                        <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
                      </label>
                    </span>
                    <span>Columns: Match, Cage, Red Team, Blue Team, Time</span>
                  </div>

                  <textarea
                    rows={6}
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    placeholder="Paste CSV rows here..."
                    className="w-full px-3.5 py-3 rounded-xl bg-[var(--court-subtle)] border border-[var(--court-line)] text-[var(--court-ink)] font-mono text-xs leading-relaxed"
                  />
                </div>
              )}

              {/* Manual Tab */}
              {activeTab === 'MANUAL' && (
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--court-muted)]">Configure matches per cage:</span>
                    <button
                      type="button"
                      onClick={handleAddManualRow}
                      className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold inline-flex items-center gap-1"
                      style={{ backgroundColor: 'var(--drone-blue-solid)' }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add row</span>
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                    {manualMatches.map((row, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg bg-[var(--court-subtle)] border border-[var(--court-line-soft)]"
                      >
                        <div className="col-span-2">
                          <input
                            type="text"
                            placeholder="Match #"
                            value={row.matchNumber || ''}
                            onChange={(e) => handleManualChange(idx, 'matchNumber', e.target.value)}
                            className="w-full px-2 py-1.5 rounded bg-[var(--court-surface)] border border-[var(--court-line)] text-xs text-[var(--court-ink)]"
                          />
                        </div>
                        <div className="col-span-2">
                          <select
                            value={row.arenaId || 1}
                            onChange={(e) => handleManualChange(idx, 'arenaId', parseInt(e.target.value, 10))}
                            className="w-full px-2 py-1.5 rounded bg-[var(--court-surface)] border border-[var(--court-line)] text-xs text-[var(--court-ink)]"
                          >
                            {(arenas.length > 0
                              ? arenas
                              : [
                                  { arenaId: 1, arenaName: 'Arena 1' },
                                  { arenaId: 2, arenaName: 'Arena 2' },
                                  { arenaId: 3, arenaName: 'Arena 3' },
                                ]
                            ).map((a) => (
                              <option key={a.arenaId} value={a.arenaId}>
                                Cage {a.arenaId}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-3">
                          <input
                            type="text"
                            placeholder="Red team"
                            value={row.teamRed || ''}
                            onChange={(e) => handleManualChange(idx, 'teamRed', e.target.value)}
                            className="w-full px-2 py-1.5 rounded bg-[var(--court-surface)] border text-xs text-[var(--court-ink)]"
                            style={{ borderColor: 'var(--drone-red-border)' }}
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="text"
                            placeholder="Blue team"
                            value={row.teamBlue || ''}
                            onChange={(e) => handleManualChange(idx, 'teamBlue', e.target.value)}
                            className="w-full px-2 py-1.5 rounded bg-[var(--court-surface)] border text-xs text-[var(--court-ink)]"
                            style={{ borderColor: 'var(--drone-blue-border)' }}
                          />
                        </div>
                        <div className="col-span-1">
                          <input
                            type="text"
                            placeholder="09:00"
                            value={row.scheduledTime || ''}
                            onChange={(e) => handleManualChange(idx, 'scheduledTime', e.target.value)}
                            className="w-full px-1.5 py-1.5 rounded bg-[var(--court-surface)] border border-[var(--court-line)] text-xs text-[var(--court-ink)] text-center tabular-nums"
                          />
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveManualRow(idx)}
                            className="p-1 text-[var(--court-muted)] hover:text-[var(--drone-red-text)]"
                            title="Remove row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview Table */}
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-[var(--court-ink)]">Schedule preview</span>
                  <div className="flex items-center gap-3 text-[var(--court-muted)] tabular-nums">
                    <span>Matches: <strong className="text-[var(--court-ink)]">{previewMatches.length}</strong></span>
                    <span>Teams: <strong className="text-[var(--court-ink)]">{uniqueTeamsCount}</strong></span>
                    <span>Cages: <strong className="text-[var(--court-ink)]">{seenArenas.size}</strong></span>
                  </div>
                </div>

                {previewWarnings.length > 0 && (
                  <div
                    className="p-2.5 rounded-lg border text-xs flex items-center gap-2"
                    style={{
                      backgroundColor: 'var(--signal-amber-tint)',
                      borderColor: 'var(--signal-amber-border)',
                      color: 'var(--signal-amber-text)',
                    }}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{previewWarnings[0]}</span>
                  </div>
                )}

                <div className="rounded-xl border border-[var(--court-line-soft)] bg-[var(--court-subtle)] overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--court-surface)] text-[var(--court-muted)] sticky top-0 border-b border-[var(--court-line-soft)]">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Match</th>
                        <th className="px-3 py-2 font-semibold">Cage</th>
                        <th className="px-3 py-2 font-semibold">Red team</th>
                        <th className="px-3 py-2 font-semibold">Blue team</th>
                        <th className="px-3 py-2 font-semibold">Time</th>
                        <th className="px-3 py-2 font-semibold text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--court-line-soft)]">
                      {previewMatches.map((item, idx) => {
                        const aId = item.arenaId || 1;
                        const isFirstOnCage = firstMatchIdsByArena.has(`${aId}-${item.matchNumber}`);
                        return (
                          <tr key={idx}>
                            <td className="px-3 py-2 font-bold text-[var(--court-ink)]">{item.matchNumber}</td>
                            <td className="px-3 py-2 text-[var(--court-muted)]">Cage {aId}</td>
                            <td className="px-3 py-2 font-semibold" style={{ color: 'var(--drone-red-text)' }}>
                              {item.teamRed || '–'}
                            </td>
                            <td className="px-3 py-2 font-semibold" style={{ color: 'var(--drone-blue-text)' }}>
                              {item.teamBlue || '–'}
                            </td>
                            <td className="px-3 py-2 text-[var(--court-muted)] tabular-nums">
                              {item.scheduledTime ? (
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {item.scheduledTime}
                                </span>
                              ) : (
                                '–'
                              )}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {isFirstOnCage ? (
                                <span
                                  className="px-2 py-0.5 rounded-full border text-[11px] font-semibold inline-flex items-center gap-1"
                                  style={{
                                    backgroundColor: 'var(--signal-live-tint)',
                                    borderColor: 'var(--signal-live-border)',
                                    color: 'var(--signal-live-text)',
                                  }}
                                >
                                  <PlayCircle className="w-3 h-3" />
                                  <span>Opening match</span>
                                </span>
                              ) : (
                                <span className="text-[var(--court-muted)]">Queued</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {previewMatches.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-[var(--court-muted)]">
                            No matches parsed yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!resultSummary && (
          <div className="px-6 py-4 border-t border-[var(--court-line-soft)] bg-[var(--court-subtle)] flex flex-wrap items-center justify-between gap-3 shrink-0">
            <span className="text-xs text-[var(--court-muted)]">
              {autoLoadArenas
                ? `Arms ${seenArenas.size} cage(s) immediately with opening lineups.`
                : 'Populates queue without modifying active cages.'}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-[var(--court-ink-secondary)] text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading || previewMatches.length === 0}
                onClick={handleSubmitPreload}
                className="px-4 py-2 rounded-lg text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
                style={{ backgroundColor: 'var(--drone-blue-solid)' }}
              >
                <UploadCloud className="w-4 h-4" />
                <span>{loading ? 'Loading...' : 'Preload & arm cages'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
