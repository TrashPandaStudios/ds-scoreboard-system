import React, { useState, useEffect } from 'react';
import { useArenaStore } from '../store/arenaStore';
import { useArenaWebSocket } from '../hooks/useArenaWebSocket';
import { HeaderNav } from '../components/common/HeaderNav';
import { ArenaTelemetryCard } from '../components/dashboard/ArenaTelemetryCard';
import { ObsLinksModal } from '../components/dashboard/ObsLinksModal';
import { MatchHistoryTable } from '../components/dashboard/MatchHistoryTable';
import { ScheduleQueueManager } from '../components/dashboard/ScheduleQueueManager';
import { SponsorConfigPanel } from '../components/dashboard/SponsorConfigPanel';
import { AdminIntermissionModal } from '../components/dashboard/AdminIntermissionModal';
import { AddArenaModal } from '../components/dashboard/AddArenaModal';
import { DeleteArenaConfirmModal } from '../components/dashboard/DeleteArenaConfirmModal';
import { PreloadScheduleModal } from '../components/dashboard/PreloadScheduleModal';
import { MatchRecord, ScheduledMatch, SponsorItem, ArenaSummary } from '../types/scoreboard';
import { AlertOctagon, Play, Layers, Radio, RefreshCw, Sparkles, Calendar, History, Coffee, Plus, UploadCloud } from 'lucide-react';

export const MasterDashboard: React.FC = () => {
  const { sendCommand } = useArenaWebSocket();
  const { arenaSummaries, sponsors, setSponsors } = useArenaStore();

  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [queue, setQueue] = useState<ScheduledMatch[]>([]);
  const [selectedObsArenaId, setSelectedObsArenaId] = useState<number | null>(null);
  const [isIntermissionModalOpen, setIsIntermissionModalOpen] = useState(false);
  const [isAddArenaModalOpen, setIsAddArenaModalOpen] = useState(false);
  const [isPreloadModalOpen, setIsPreloadModalOpen] = useState(false);
  const [arenaToDelete, setArenaToDelete] = useState<ArenaSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'TELEMETRY' | 'HISTORY' | 'QUEUE' | 'SPONSORS'>('TELEMETRY');

  const nextArenaId = arenaSummaries.reduce((max, a) => Math.max(max, a.arenaId), 0) + 1;

  const fetchAllData = () => {
    fetch('/api/matches')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setMatches(data))
      .catch(() => {});

    fetch('/api/queue')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setQueue(data))
      .catch(() => {});

    fetch('/api/sponsors/all')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setSponsors(data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleEmergencyPauseAll = () => {
    fetch('/api/arenas/emergency-pause', { method: 'POST' }).catch(() => {});
  };

  const handleEmergencyResumeAll = () => {
    fetch('/api/arenas/emergency-resume', { method: 'POST' }).catch(() => {});
  };

  const handleDeleteArena = async (arenaId: number) => {
    try {
      const res = await fetch(`/api/arenas/${arenaId}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error(`Failed to delete arena (HTTP ${res.status})`);
      }
      fetchAllData();
    } catch (e) {
      console.error('Failed to delete arena:', e);
    }
  };

  const handlePrimeFirstMatches = async () => {
    try {
      const res = await fetch('/api/queue/prime-first-matches', { method: 'POST' });
      if (res.ok) {
        fetchAllData();
      }
    } catch (e) {
      console.error('Failed to prime first matches:', e);
    }
  };

  const handlePushMatchToArena = (match: ScheduledMatch) => {
    sendCommand('LOAD_MATCH', {
      arenaId: match.arenaId,
      teamRed: match.teamRed,
      teamBlue: match.teamBlue,
      matchNumber: match.matchNumber,
      tournamentName: match.tournamentName,
    });

    fetch(`/api/queue/${match.id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'IN_PROGRESS' }),
    }).then(() => fetchAllData());
  };

  const handleCreateQueueMatch = (req: {
    matchNumber: string;
    tournamentName: string;
    arenaId: number;
    teamRed: string;
    teamBlue: string;
  }) => {
    fetch('/api/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    }).then(() => fetchAllData());
  };

  const handleDeleteQueueMatch = (id: number) => {
    fetch(`/api/queue/${id}`, { method: 'DELETE' }).then(() => fetchAllData());
  };

  const handleCreateSponsor = (item: Partial<SponsorItem>) => {
    fetch('/api/sponsors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    }).then(() => fetchAllData());
  };

  const handleUpdateSponsor = (id: number, item: Partial<SponsorItem>) => {
    fetch(`/api/sponsors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    }).then(() => fetchAllData());
  };

  const handleDeleteSponsor = (id: number) => {
    fetch(`/api/sponsors/${id}`, { method: 'DELETE' }).then(() => fetchAllData());
  };

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col select-none">
      <HeaderNav variant="admin" />

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 flex-1 flex flex-col gap-8 w-full">
        {/* Master Control Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/90 border-2 border-slate-800 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Radio className="w-6 h-6 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-widest block">
                EVENT STAFF COMMAND CENTER
              </span>
              <h1 className="text-2xl font-display font-black text-white">
                Multi-Arena Master Telemetry Dashboard
              </h1>
            </div>
          </div>

          {/* Emergency Global Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsPreloadModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-black flex items-center gap-2 shadow-lg shadow-cyan-600/30 transition-all active:scale-95"
              title="Preload tournament team lineups and opening matches for all cages"
            >
              <UploadCloud className="w-4 h-4 stroke-[2.5]" />
              <span>PRELOAD EVENT</span>
            </button>

            <button
              onClick={() => setIsAddArenaModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-mono font-black flex items-center gap-2 transition-all active:scale-95"
              title="Deploy a new authoritative drone arena cage at runtime"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>ADD ARENA</span>
            </button>

            <button
              onClick={() => setIsIntermissionModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold flex items-center gap-2 transition-colors"
              title="Configure global intermission duration and per-cage overrides"
            >
              <Coffee className="w-4 h-4 text-amber-400" />
              <span>INTERMISSION CONFIG</span>
            </button>

            <button
              onClick={() => setSelectedObsArenaId(1)}
              className="px-4 py-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 text-xs font-mono font-bold flex items-center gap-2 transition-colors"
            >
              <Layers className="w-4 h-4 text-purple-400" />
              <span>OBS DISCOVERY HUB</span>
            </button>

            <button
              onClick={handleEmergencyPauseAll}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-black flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all active:scale-95"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>EMERGENCY PAUSE ALL</span>
            </button>

            <button
              onClick={handleEmergencyResumeAll}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-black flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>RESUME ALL</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('TELEMETRY')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all ${
              activeTab === 'TELEMETRY'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>LIVE CAGES ({arenaSummaries.length || 3})</span>
          </button>

          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all ${
              activeTab === 'HISTORY'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <History className="w-4 h-4" />
            <span>MATCH AUDIT LOGS</span>
          </button>

          <button
            onClick={() => setActiveTab('QUEUE')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all ${
              activeTab === 'QUEUE'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>MATCH QUEUE ({queue.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('SPONSORS')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all ${
              activeTab === 'SPONSORS'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>SPONSOR TAKEOVERS</span>
          </button>
        </div>

        {/* Tab 1: Live Cages Multi-Arena Grid */}
        {activeTab === 'TELEMETRY' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
            {arenaSummaries.map((arena) => (
              <ArenaTelemetryCard
                key={arena.arenaId}
                arena={arena}
                onToggleTimer={(aId) => sendCommand('TOGGLE_TIMER', { arenaId: aId })}
                onTriggerBuzzer={(aId) => sendCommand('TRIGGER_BUZZER', { arenaId: aId })}
                onConfigureIntermission={() => setIsIntermissionModalOpen(true)}
                onDeleteArena={(arena) => setArenaToDelete(arena)}
              />
            ))}

            {arenaSummaries.length === 0 && (
              <div className="col-span-3 py-12 text-center text-slate-500 font-mono text-sm">
                Connecting to Authoritative Arena Match Engines...
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Match History Table */}
        {activeTab === 'HISTORY' && (
          <div className="animate-fadeIn">
            <MatchHistoryTable matches={matches} onRefresh={fetchAllData} />
          </div>
        )}

        {/* Tab 3: Match Schedule Queue */}
        {activeTab === 'QUEUE' && (
          <div className="animate-fadeIn">
            <ScheduleQueueManager
              queue={queue}
              arenas={arenaSummaries}
              onPushToArena={handlePushMatchToArena}
              onCreateMatch={handleCreateQueueMatch}
              onDeleteMatch={handleDeleteQueueMatch}
              onOpenPreload={() => setIsPreloadModalOpen(true)}
              onPrimeArenas={handlePrimeFirstMatches}
            />
          </div>
        )}

        {/* Tab 4: Sponsor Manager */}
        {activeTab === 'SPONSORS' && (
          <div className="animate-fadeIn">
            <SponsorConfigPanel
              sponsors={sponsors}
              onCreateSponsor={handleCreateSponsor}
              onUpdateSponsor={handleUpdateSponsor}
              onDeleteSponsor={handleDeleteSponsor}
            />
          </div>
        )}
      </main>

      {/* OBS Links Discovery Modal */}
      <ObsLinksModal
        isOpen={selectedObsArenaId !== null}
        onClose={() => setSelectedObsArenaId(null)}
        arenaId={selectedObsArenaId || arenaSummaries[0]?.arenaId || 1}
        arenas={arenaSummaries}
        onSelectArena={(id) => setSelectedObsArenaId(id)}
      />

      {/* Admin Intermission Configuration & Override Hub */}
      <AdminIntermissionModal
        isOpen={isIntermissionModalOpen}
        onClose={() => setIsIntermissionModalOpen(false)}
        arenas={arenaSummaries}
        onSuccess={fetchAllData}
      />

      {/* Dynamic Arena Creation Modal */}
      <AddArenaModal
        isOpen={isAddArenaModalOpen}
        onClose={() => setIsAddArenaModalOpen(false)}
        onSuccess={fetchAllData}
        nextArenaId={nextArenaId}
      />

      {/* Arena Decommission Safety Confirmation Modal */}
      <DeleteArenaConfirmModal
        isOpen={arenaToDelete !== null}
        arena={arenaToDelete}
        onClose={() => setArenaToDelete(null)}
        onConfirm={handleDeleteArena}
      />

      {/* Preload Tournament Schedule & Arm Arenas Modal */}
      <PreloadScheduleModal
        isOpen={isPreloadModalOpen}
        onClose={() => setIsPreloadModalOpen(false)}
        arenas={arenaSummaries}
        onSuccess={fetchAllData}
      />
    </div>
  );
};
