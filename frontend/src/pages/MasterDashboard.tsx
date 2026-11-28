import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { TeamsManagementPanel } from '../components/dashboard/TeamsManagementPanel';
import {
  MatchRecord,
  ScheduledMatch,
  SponsorItem,
  ArenaSummary,
  PublicPortalSystemStatus,
} from '../types/scoreboard';
import {
  AlertOctagon,
  Play,
  Layers,
  Coffee,
  Plus,
  UploadCloud,
  Globe,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

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
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'TELEMETRY' | 'HISTORY' | 'QUEUE' | 'SPONSORS' | 'TEAMS'>(
    searchParams.get('tab') === 'teams' ? 'TEAMS' : 'TELEMETRY'
  );
  const [publicPortalStatus, setPublicPortalStatus] = useState<PublicPortalSystemStatus | null>(null);
  const [copiedPublicUrl, setCopiedPublicUrl] = useState(false);

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

    fetch('/api/system/public-portal')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setPublicPortalStatus(data))
      .catch(() => {});
  };

  useEffect(() => {
    document.title = 'Drone Soccer Admin — Tournament Command';
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

  const sortedArenas = [...arenaSummaries].sort((a, b) => a.arenaId - b.arenaId);

  return (
    <div className="app-shell min-h-screen flex flex-col select-none">
      <HeaderNav variant="admin" />

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 sm:py-8 flex-1 flex flex-col gap-6 w-full">
        {/* Command Toolbar */}
        <section className="p-5 rounded-2xl bg-[var(--court-surface)] border border-[var(--court-line)] flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="spectator-numeral text-3xl font-black text-[var(--court-ink)] leading-none">
                Multi-arena control
              </h1>
              <p className="text-xs text-[var(--court-muted)] mt-1">
                Manage active cages, tournament schedules, sponsors, teams, and public broadcasts.
              </p>
            </div>

            {/* Emergency Global Clock Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleEmergencyPauseAll}
                className="px-3.5 py-2 rounded-lg text-white text-xs font-bold inline-flex items-center gap-1.5 transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--drone-red-solid)' }}
              >
                <AlertOctagon className="w-4 h-4" />
                <span>Pause all cages</span>
              </button>

              <button
                type="button"
                onClick={handleEmergencyResumeAll}
                className="px-3.5 py-2 rounded-lg text-white text-xs font-bold inline-flex items-center gap-1.5 transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--signal-live-solid)' }}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume all</span>
              </button>
            </div>
          </div>

          {/* Secondary Action Strip */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[var(--court-line-soft)]">
            <button
              type="button"
              onClick={() => setIsPreloadModalOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-opacity hover:opacity-90"
              style={{
                backgroundColor: 'var(--drone-blue-solid)',
                color: '#FFFFFF',
              }}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Preload schedule</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddArenaModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] border border-[var(--court-line)] text-xs font-semibold text-[var(--court-ink)] inline-flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add arena</span>
            </button>

            <button
              type="button"
              onClick={() => setIsIntermissionModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] border border-[var(--court-line)] text-xs font-semibold text-[var(--court-ink)] inline-flex items-center gap-1.5 transition-colors"
            >
              <Coffee className="w-3.5 h-3.5" style={{ color: 'var(--signal-amber)' }} />
              <span>Intermission settings</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedObsArenaId(sortedArenas[0]?.arenaId || 1)}
              className="px-3 py-1.5 rounded-lg bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] border border-[var(--court-line)] text-xs font-semibold text-[var(--court-ink)] inline-flex items-center gap-1.5 transition-colors"
            >
              <Layers className="w-3.5 h-3.5" style={{ color: 'var(--signal-intermission)' }} />
              <span>Displays &amp; OBS</span>
            </button>

            <a
              href={publicPortalStatus?.publicSiteUrl || '/live'}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              style={
                publicPortalStatus?.tunnelConfigured
                  ? {
                      backgroundColor: 'var(--signal-live-tint)',
                      borderColor: 'var(--signal-live-border)',
                      color: 'var(--signal-live-text)',
                    }
                  : {
                      backgroundColor: 'var(--court-control-bg)',
                      borderColor: 'var(--court-line)',
                      color: 'var(--court-ink)',
                    }
              }
              title={
                publicPortalStatus?.tunnelConfigured
                  ? `Cloudflare Tunnel active on port ${publicPortalStatus.publicPort}`
                  : `Public spectator portal on port ${publicPortalStatus?.publicPort ?? 8081}`
              }
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{publicPortalStatus?.tunnelConfigured ? 'Public live (Tunnel on)' : 'Public live portal'}</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>

            {publicPortalStatus?.publicSiteUrl && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(publicPortalStatus.publicSiteUrl).catch(() => {});
                  setCopiedPublicUrl(true);
                  window.setTimeout(() => setCopiedPublicUrl(false), 2000);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] border border-[var(--court-line)] text-xs font-semibold text-[var(--court-ink-secondary)] inline-flex items-center gap-1.5 transition-colors"
                title={`Copy public URL: ${publicPortalStatus.publicSiteUrl}`}
              >
                {copiedPublicUrl ? (
                  <Check className="w-3.5 h-3.5" style={{ color: 'var(--signal-live)' }} />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedPublicUrl ? 'Copied' : 'Copy URL'}</span>
              </button>
            )}
          </div>
        </section>

        {/* Underline Tab Navigation */}
        <nav className="flex items-center gap-6 border-b border-[var(--court-line)] overflow-x-auto" aria-label="Admin sections">
          {(
            [
              { id: 'TELEMETRY', label: 'Live cages', count: sortedArenas.length },
              { id: 'HISTORY', label: 'Match history', count: matches.length },
              { id: 'QUEUE', label: 'Match queue', count: queue.length },
              { id: 'SPONSORS', label: 'Sponsors', count: sponsors.length },
              { id: 'TEAMS', label: 'Teams' },
            ] as const
          ).map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-2.5 border-b-2 text-sm font-semibold whitespace-nowrap inline-flex items-center gap-2 -mb-px transition-colors ${
                  active
                    ? 'border-[var(--court-ink)] text-[var(--court-ink)]'
                    : 'border-transparent text-[var(--court-muted)] hover:text-[var(--court-ink-secondary)]'
                }`}
              >
                <span>{tab.label}</span>
                {'count' in tab && (
                  <span
                    className="px-1.5 py-0.5 rounded-md text-xs tabular-nums"
                    style={
                      active
                        ? {
                            backgroundColor: 'var(--court-active-pill-bg)',
                            color: 'var(--court-active-pill-fg)',
                          }
                        : {
                            backgroundColor: 'var(--court-control-bg)',
                            color: 'var(--court-muted)',
                          }
                    }
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Tab 1: Live Cages Multi-Arena Grid */}
        {activeTab === 'TELEMETRY' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sortedArenas.map((arena) => (
              <ArenaTelemetryCard
                key={arena.arenaId}
                arena={arena}
                onToggleTimer={(aId) =>
                  sendCommand(arena.timerRunning ? 'PAUSE_TIMER' : 'START_TIMER', { arenaId: aId })
                }
                onTriggerBuzzer={(aId) => sendCommand('TRIGGER_BUZZER', { arenaId: aId })}
                onConfigureIntermission={() => setIsIntermissionModalOpen(true)}
                onDeleteArena={(target) => setArenaToDelete(target)}
              />
            ))}

            {sortedArenas.length === 0 && (
              <div className="col-span-full py-12 text-center text-sm text-[var(--court-muted)] rounded-2xl bg-[var(--court-surface)] border border-[var(--court-line)]">
                Connecting to active arena engines...
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Match History */}
        {activeTab === 'HISTORY' && <MatchHistoryTable matches={matches} onRefresh={fetchAllData} />}

        {/* Tab 3: Match Queue */}
        {activeTab === 'QUEUE' && (
          <ScheduleQueueManager
            queue={queue}
            arenas={sortedArenas}
            onPushToArena={handlePushMatchToArena}
            onCreateMatch={handleCreateQueueMatch}
            onDeleteMatch={handleDeleteQueueMatch}
            onOpenPreload={() => setIsPreloadModalOpen(true)}
            onPrimeArenas={handlePrimeFirstMatches}
          />
        )}

        {/* Tab 4: Sponsors */}
        {activeTab === 'SPONSORS' && (
          <SponsorConfigPanel
            sponsors={sponsors}
            onCreateSponsor={handleCreateSponsor}
            onUpdateSponsor={handleUpdateSponsor}
            onDeleteSponsor={handleDeleteSponsor}
          />
        )}

        {/* Tab 5: Teams */}
        {activeTab === 'TEAMS' && <TeamsManagementPanel />}
      </main>

      {/* Modals */}
      <ObsLinksModal
        isOpen={selectedObsArenaId !== null}
        onClose={() => setSelectedObsArenaId(null)}
        arenaId={selectedObsArenaId || sortedArenas[0]?.arenaId || 1}
        arenas={sortedArenas}
        onSelectArena={(id) => setSelectedObsArenaId(id)}
        publicSiteUrl={publicPortalStatus?.publicSiteUrl}
      />

      <AdminIntermissionModal
        isOpen={isIntermissionModalOpen}
        onClose={() => setIsIntermissionModalOpen(false)}
        arenas={sortedArenas}
        onSuccess={fetchAllData}
      />

      <AddArenaModal
        isOpen={isAddArenaModalOpen}
        onClose={() => setIsAddArenaModalOpen(false)}
        onSuccess={fetchAllData}
        nextArenaId={nextArenaId}
      />

      <DeleteArenaConfirmModal
        isOpen={arenaToDelete !== null}
        arena={arenaToDelete}
        onClose={() => setArenaToDelete(null)}
        onConfirm={handleDeleteArena}
      />

      <PreloadScheduleModal
        isOpen={isPreloadModalOpen}
        onClose={() => setIsPreloadModalOpen(false)}
        arenas={sortedArenas}
        onSuccess={fetchAllData}
      />
    </div>
  );
};
