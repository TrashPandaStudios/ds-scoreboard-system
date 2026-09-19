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
  Sparkles,
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

  // Manual matches state
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

  // Real-time client-side parsing of CSV text for live preview
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

      // regex split supporting quotes
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
        warnings.push(`Line ${i + 1} ("${line.substring(0, 30)}..."): Missing Team Red or Team Blue.`);
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

  // Determine which matches are the first match for each arena
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
      if (text) {
        setCsvText(text);
      }
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
    const nextArenaId = ((manualMatches.length) % (arenas.length || 3)) + 1;
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
      const payload = {
        matches: previewMatches,
        clearExisting,
        autoLoadArenas,
        defaultTournamentName: tournamentName,
      };

      const res = await fetch('/api/queue/preload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Preload failed with HTTP ${res.status}`);
      }

      const data: PreloadResultDTO = await res.json();
      setResultSummary(data);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to preload tournament data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border-2 border-slate-700 shadow-2xl relative overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <UploadCloud className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-widest block">
                EVENT TOURNAMENT INITIALIZATION
              </span>
              <h2 className="text-xl font-display font-black text-white">Preload Tournament Match Data</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          {/* Success Screen */}
          {resultSummary ? (
            <div className="flex flex-col items-center justify-center py-6 text-center animate-fadeIn gap-6">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>

              <div className="flex flex-col gap-1 max-w-lg">
                <h3 className="text-2xl font-display font-black text-white">Event Lineup Successfully Primed!</h3>
                <p className="text-xs font-mono text-slate-400">
                  {resultSummary.message ||
                    `Preloaded ${resultSummary.totalMatchesLoaded} matches and armed ${resultSummary.totalArenasPrimed} cages for the tournament opening.`}
                </p>
              </div>

              {/* Primed Arenas Summary Grid */}
              {resultSummary.primedArenas && resultSummary.primedArenas.length > 0 && (
                <div className="w-full max-w-2xl flex flex-col gap-2.5">
                  <span className="text-xs font-mono text-cyan-400 font-bold tracking-wider uppercase text-left">
                    ARENAS READY AT EVENT START (03:00 / SET 1):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {resultSummary.primedArenas.map((pa) => (
                      <div
                        key={pa.arenaId}
                        className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/40 flex flex-col gap-2 text-left shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono font-black text-emerald-400">
                            CAGE {pa.arenaId}
                          </span>
                          <span className="text-[10px] font-mono bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 text-cyan-300">
                            {pa.matchNumber}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5 text-xs font-semibold">
                          <span className="text-red-400 font-mono">{pa.teamRed}</span>
                          <span className="text-slate-500 text-[10px] font-mono">VS</span>
                          <span className="text-blue-400 font-mono">{pa.teamBlue}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mt-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span>Arming Complete</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-mono text-xs font-black shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
                >
                  RETURN TO MASTER DASHBOARD
                </button>
              </div>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-600/50 text-rose-200 text-xs font-mono flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Tournament Name & Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-mono text-slate-400 font-bold mb-1.5 uppercase">
                    TOURNAMENT / EVENT TITLE
                  </label>
                  <input
                    type="text"
                    value={tournamentName}
                    onChange={(e) => setTournamentName(e.target.value)}
                    placeholder="e.g. FIDA National Championship"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="sm:col-span-2 flex flex-col justify-center gap-2">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-mono text-slate-300">
                    <input
                      type="checkbox"
                      checked={autoLoadArenas}
                      onChange={(e) => setAutoLoadArenas(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 text-cyan-600 focus:ring-cyan-500 bg-slate-900"
                    />
                    <span className="font-bold text-cyan-300">
                      Auto-load each arena with its 1st match
                    </span>
                    <span className="text-[10px] text-slate-500 hidden md:inline">
                      (Sets scoreboard, timer 03:00, and teams ready to play)
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-mono text-slate-300">
                    <input
                      type="checkbox"
                      checked={clearExisting}
                      onChange={(e) => setClearExisting(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 text-cyan-600 focus:ring-cyan-500 bg-slate-900"
                    />
                    <span>Clear existing queue before import</span>
                    <span className="text-[10px] text-slate-500 hidden md:inline">
                      (Removes stale test/demo matches)
                    </span>
                  </label>
                </div>
              </div>

              {/* Mode Tabs */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('CSV')}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all ${
                      activeTab === 'CSV'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>SPREADSHEET / CSV IMPORT</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('MANUAL')}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all ${
                      activeTab === 'MANUAL'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>INTERACTIVE BUILDER</span>
                  </button>
                </div>

                {activeTab === 'CSV' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyTemplate}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono flex items-center gap-1.5 transition-colors"
                      title="Copy standard CSV structure to clipboard"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedSuccess ? 'COPIED!' : 'COPY TEMPLATE'}</span>
                    </button>

                    <button
                      onClick={handleDownloadTemplate}
                      className="px-2.5 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800 text-[11px] font-mono flex items-center gap-1.5 transition-colors"
                      title="Download sample .csv template file"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>DOWNLOAD .CSV</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Tab 1: CSV Textarea & File Dropzone */}
              {activeTab === 'CSV' && (
                <div className="flex flex-col gap-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                      <span>Paste CSV / Spreadsheet cells below or</span>
                      <label className="text-cyan-400 underline cursor-pointer hover:text-cyan-300">
                        <span>browse file</span>
                        <input
                          type="file"
                          accept=".csv,.txt"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </label>
                    <span className="text-[10px] font-mono text-slate-500">
                      Columns: Match, Cage, Red Team, Blue Team, Time
                    </span>
                  </div>

                  <textarea
                    rows={6}
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    placeholder="Paste CSV rows here..."
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-cyan-500/60 leading-relaxed font-mono"
                  />
                </div>
              )}

              {/* Tab 2: Manual Row Editor */}
              {activeTab === 'MANUAL' && (
                <div className="flex flex-col gap-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-400">
                      Manually configure opening matches and lineup per cage:
                    </span>
                    <button
                      type="button"
                      onClick={handleAddManualRow}
                      className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>ADD ROW</span>
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                    {manualMatches.map((row, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-12 gap-2 items-center p-2 rounded-xl bg-slate-950 border border-slate-800"
                      >
                        <div className="col-span-2">
                          <input
                            type="text"
                            placeholder="Match #"
                            value={row.matchNumber || ''}
                            onChange={(e) => handleManualChange(idx, 'matchNumber', e.target.value)}
                            className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-white"
                          />
                        </div>
                        <div className="col-span-2">
                          <select
                            value={row.arenaId || 1}
                            onChange={(e) => handleManualChange(idx, 'arenaId', parseInt(e.target.value, 10))}
                            className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300"
                          >
                            {(arenas.length > 0 ? arenas : [{ arenaId: 1, arenaName: 'Arena 1' }, { arenaId: 2, arenaName: 'Arena 2' }, { arenaId: 3, arenaName: 'Arena 3' }]).map((a) => (
                              <option key={a.arenaId} value={a.arenaId}>
                                Cage {a.arenaId}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-3">
                          <input
                            type="text"
                            placeholder="Red Team"
                            value={row.teamRed || ''}
                            onChange={(e) => handleManualChange(idx, 'teamRed', e.target.value)}
                            className="w-full px-2 py-1 rounded bg-slate-900 border border-red-500/40 text-xs font-mono text-red-300 placeholder-red-500/30"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="text"
                            placeholder="Blue Team"
                            value={row.teamBlue || ''}
                            onChange={(e) => handleManualChange(idx, 'teamBlue', e.target.value)}
                            className="w-full px-2 py-1 rounded bg-slate-900 border border-blue-500/40 text-xs font-mono text-blue-300 placeholder-blue-500/30"
                          />
                        </div>
                        <div className="col-span-1">
                          <input
                            type="text"
                            placeholder="09:00"
                            value={row.scheduledTime || ''}
                            onChange={(e) => handleManualChange(idx, 'scheduledTime', e.target.value)}
                            className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 text-center"
                          />
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveManualRow(idx)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
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

              {/* Live Preview Header & Summary Cards */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>DETECTED SCHEDULE PREVIEW</span>
                  </span>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-slate-400">
                      Matches: <b className="text-white">{previewMatches.length}</b>
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400">
                      Teams: <b className="text-cyan-400">{uniqueTeamsCount}</b>
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400">
                      Cages: <b className="text-purple-400">{seenArenas.size}</b>
                    </span>
                  </div>
                </div>

                {previewWarnings.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-600/40 text-amber-300 text-[11px] font-mono flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>{previewWarnings[0]}</span>
                  </div>
                )}

                {/* Parsed Matches Table */}
                <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden max-h-52 overflow-y-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-900/90 text-[10px] text-slate-400 uppercase sticky top-0 border-b border-slate-800">
                      <tr>
                        <th className="px-3 py-2">Match</th>
                        <th className="px-3 py-2">Cage</th>
                        <th className="px-3 py-2">Red Team</th>
                        <th className="px-3 py-2 text-center">VS</th>
                        <th className="px-3 py-2">Blue Team</th>
                        <th className="px-3 py-2">Time</th>
                        <th className="px-3 py-2 text-right">Start Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {previewMatches.map((item, idx) => {
                        const aId = item.arenaId || 1;
                        const isFirstOnCage = firstMatchIdsByArena.has(`${aId}-${item.matchNumber}`);

                        return (
                          <tr
                            key={idx}
                            className={`hover:bg-slate-900/40 transition-colors ${
                              isFirstOnCage ? 'bg-cyan-950/10' : ''
                            }`}
                          >
                            <td className="px-3 py-2 font-bold text-cyan-400">{item.matchNumber}</td>
                            <td className="px-3 py-2 text-slate-400">Cage {aId}</td>
                            <td className="px-3 py-2 font-semibold text-red-400">{item.teamRed || '—'}</td>
                            <td className="px-3 py-2 text-center text-slate-600">vs</td>
                            <td className="px-3 py-2 font-semibold text-blue-400">{item.teamBlue || '—'}</td>
                            <td className="px-3 py-2 text-slate-400 flex items-center gap-1">
                              {item.scheduledTime ? (
                                <>
                                  <Clock className="w-3 h-3 text-slate-500" />
                                  <span>{item.scheduledTime}</span>
                                </>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {isFirstOnCage ? (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 text-[10px] font-black uppercase inline-flex items-center gap-1">
                                  <PlayCircle className="w-3 h-3 text-emerald-400" />
                                  <span>1ST MATCH ON CAGE {aId}</span>
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500 font-mono">Queued</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}

                      {previewMatches.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-slate-500 font-mono text-xs">
                            No match data parsed. Paste CSV rows above or use the interactive builder.
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

        {/* Modal Footer */}
        {!resultSummary && (
          <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>
                {autoLoadArenas
                  ? `Will immediately arm ${seenArenas.size} arena(s) for start`
                  : 'Will populate queue without loading arenas'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold transition-colors"
              >
                CANCEL
              </button>

              <button
                type="button"
                disabled={loading || previewMatches.length === 0}
                onClick={handleSubmitPreload}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-black flex items-center gap-2 shadow-lg shadow-cyan-600/30 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <span>ARMING ARENAS & PRELOADING...</span>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>PRELOAD & ARM ARENAS</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
