import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useArenaStore } from '../store/arenaStore';
import { useArenaWebSocket } from '../hooks/useArenaWebSocket';
import { HeaderNav } from '../components/common/HeaderNav';
import { AddArenaModal } from '../components/dashboard/AddArenaModal';
import { DeleteArenaConfirmModal, DeletableArenaInfo } from '../components/dashboard/DeleteArenaConfirmModal';
import { TeamBadge } from '../components/common/TeamBadge';
import { getSpectatorPhaseMeta } from '../components/public/PublicLiveCard';
import { useAuthoritativeTimer } from '../hooks/useAuthoritativeTimer';
import { ArenaSummary } from '../types/scoreboard';
import { Tv, Sliders, Plus, Trash2, LayoutDashboard, Globe, ExternalLink } from 'lucide-react';

const HubCageRow: React.FC<{
  cageId: number;
  cageName: string;
  summary?: ArenaSummary;
  onDelete: (target: DeletableArenaInfo) => void;
}> = ({ cageId, cageName, summary, onDelete }) => {
  const { formattedTime } = useAuthoritativeTimer({
    serverRemainingMs: summary?.timeRemainingMs ?? 180000,
    totalDurationMs: summary?.totalSetDurationMs ?? 180000,
    timerRunning: summary?.timerRunning ?? false,
    phase: summary?.phase ?? 'IDLE',
  });

  const phaseMeta = getSpectatorPhaseMeta(summary?.phase ?? 'IDLE', summary?.timerRunning ?? false);

  return (
    <div className="rounded-2xl bg-[var(--court-surface)] border border-[var(--court-line)] overflow-hidden flex flex-col">
      {/* Cage Header Strip */}
      <div className="px-5 py-3.5 bg-[var(--court-subtle)] border-b border-[var(--court-line-soft)] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[var(--court-control-bg)] border border-[var(--court-line)] text-[var(--court-ink)]">
            Cage {cageId}
          </span>
          <h3 className="text-base font-bold text-[var(--court-ink)] truncate">{cageName}</h3>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border"
            style={phaseMeta.pillStyle}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${phaseMeta.pulse ? 'animate-pulse' : ''}`}
              style={{ backgroundColor: phaseMeta.dotColor }}
            />
            {phaseMeta.label}
          </span>

          <button
            type="button"
            onClick={() =>
              onDelete(
                summary || {
                  arenaId: cageId,
                  arenaName: cageName,
                }
              )
            }
            className="p-1.5 rounded-lg text-[var(--court-muted)] hover:text-[var(--drone-red-text)] hover:bg-[var(--drone-red-tint)] transition-colors"
            title={`Remove ${cageName}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Live Split Match Preview */}
      {summary ? (
        <div className="px-5 py-4 border-b border-[var(--court-line-soft)]">
          <div className="flex items-center justify-between text-xs text-[var(--court-muted)] mb-3">
            <span>
              Match {summary.matchNumber} — Set {summary.currentSet} of {summary.maxSets}
            </span>
            <span className="spectator-numeral text-lg font-extrabold text-[var(--court-ink)]">
              {formattedTime}
            </span>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <TeamBadge teamName={summary.teamRed} logoUrl={summary.teamRedLogoUrl} side="red" size="sm" />
              <div className="min-w-0">
                <div className="text-sm font-bold text-[var(--court-ink)] truncate">{summary.teamRed}</div>
                <div className="text-[11px] text-[var(--court-muted)] tabular-nums">
                  {summary.redSetScore} {summary.redSetScore === 1 ? 'set' : 'sets'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--court-control-bg)] border border-[var(--court-line-soft)]">
              <span className="spectator-numeral text-2xl font-black text-[var(--drone-red)]">
                {summary.redScore}
              </span>
              <span className="text-xs text-[var(--court-muted)]">–</span>
              <span className="spectator-numeral text-2xl font-black text-[var(--drone-blue)]">
                {summary.blueScore}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 min-w-0 text-right">
              <div className="min-w-0">
                <div className="text-sm font-bold text-[var(--court-ink)] truncate">{summary.teamBlue}</div>
                <div className="text-[11px] text-[var(--court-muted)] tabular-nums">
                  {summary.blueSetScore} {summary.blueSetScore === 1 ? 'set' : 'sets'}
                </div>
              </div>
              <TeamBadge teamName={summary.teamBlue} logoUrl={summary.teamBlueLogoUrl} side="blue" size="sm" />
            </div>
          </div>
        </div>
      ) : (
        <div className="px-5 py-6 border-b border-[var(--court-line-soft)] text-xs text-[var(--court-muted)]">
          Ready for match assignment
        </div>
      )}

      {/* Action Launchers */}
      <div className="p-4 flex flex-col gap-3 mt-auto">
        <div className="grid grid-cols-2 gap-2">
          <Link
            to={`/arena/${cageId}/display`}
            className="py-2 px-3 rounded-lg bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] border border-[var(--court-line)] text-xs font-semibold text-[var(--court-ink)] inline-flex items-center justify-center gap-1.5 transition-colors"
          >
            <Tv className="w-3.5 h-3.5 text-[var(--court-accent-link)]" />
            <span>Stadium display</span>
          </Link>

          <Link
            to={`/arena/${cageId}/referee`}
            className="py-2 px-3 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90"
            style={{
              backgroundColor: 'var(--court-active-pill-bg)',
              color: 'var(--court-active-pill-fg)',
            }}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Referee desk</span>
          </Link>
        </div>

        {/* Dedicated Monitor Links */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium text-[var(--court-muted)]">Dedicated monitors</span>
          <div className="grid grid-cols-2 gap-1.5">
            <Link
              to={`/arena/${cageId}/display/red`}
              target="_blank"
              className="py-1.5 px-2.5 rounded-lg border text-xs font-semibold inline-flex items-center justify-between transition-colors"
              style={{
                backgroundColor: 'var(--drone-red-tint)',
                borderColor: 'var(--drone-red-border)',
                color: 'var(--drone-red-text)',
              }}
            >
              <span>Red HUD</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </Link>
            <Link
              to={`/arena/${cageId}/display/blue`}
              target="_blank"
              className="py-1.5 px-2.5 rounded-lg border text-xs font-semibold inline-flex items-center justify-between transition-colors"
              style={{
                backgroundColor: 'var(--drone-blue-tint)',
                borderColor: 'var(--drone-blue-border)',
                color: 'var(--drone-blue-text)',
              }}
            >
              <span>Blue HUD</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </Link>
            <Link
              to={`/arena/${cageId}/display/timer`}
              target="_blank"
              className="py-1.5 px-2.5 rounded-lg border text-xs font-semibold inline-flex items-center justify-between transition-colors"
              style={{
                backgroundColor: 'var(--signal-amber-tint)',
                borderColor: 'var(--signal-amber-border)',
                color: 'var(--signal-amber-text)',
              }}
            >
              <span>Big clock</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </Link>
            <Link
              to={`/arena/${cageId}/display/split`}
              target="_blank"
              className="py-1.5 px-2.5 rounded-lg border text-xs font-semibold inline-flex items-center justify-between transition-colors"
              style={{
                backgroundColor: 'var(--signal-intermission-tint)',
                borderColor: 'var(--signal-intermission-border)',
                color: 'var(--signal-intermission-text)',
              }}
            >
              <span>Split teams</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </Link>
            <Link
              to={`/live/arena/${cageId}/display`}
              target="_blank"
              className="col-span-2 py-1.5 px-2.5 rounded-lg border text-xs font-semibold inline-flex items-center justify-between transition-colors"
              style={{
                backgroundColor: 'var(--signal-live-tint)',
                borderColor: 'var(--signal-live-border)',
                color: 'var(--signal-live-text)',
              }}
            >
              <span>Public arena info display (current + queue)</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </Link>
          </div>
        </div>

        {/* OBS Overlays */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium text-[var(--court-muted)]">OBS overlays</span>
          <div className="grid grid-cols-3 gap-1.5">
            <Link
              to={`/arena/${cageId}/overlay/lower-third`}
              target="_blank"
              className="py-1.5 px-2 rounded-lg bg-[var(--court-subtle)] hover:bg-[var(--court-control-hover)] border border-[var(--court-line-soft)] text-[11px] font-semibold text-[var(--court-ink-secondary)] text-center transition-colors"
            >
              Lower third
            </Link>
            <Link
              to={`/arena/${cageId}/overlay/top-bar`}
              target="_blank"
              className="py-1.5 px-2 rounded-lg bg-[var(--court-subtle)] hover:bg-[var(--court-control-hover)] border border-[var(--court-line-soft)] text-[11px] font-semibold text-[var(--court-ink-secondary)] text-center transition-colors"
            >
              Top bar
            </Link>
            <Link
              to={`/arena/${cageId}/overlay/penalty-alert`}
              target="_blank"
              className="py-1.5 px-2 rounded-lg bg-[var(--court-subtle)] hover:bg-[var(--court-control-hover)] border border-[var(--court-line-soft)] text-[11px] font-semibold text-[var(--court-ink-secondary)] text-center transition-colors"
            >
              Penalty alert
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export const HubHome: React.FC = () => {
  useArenaWebSocket();
  const { arenaSummaries } = useArenaStore();
  const [isAddArenaModalOpen, setIsAddArenaModalOpen] = useState(false);
  const [arenaToDelete, setArenaToDelete] = useState<DeletableArenaInfo | null>(null);

  const nextArenaId = arenaSummaries.reduce((max, a) => Math.max(max, a.arenaId), 0) + 1;

  const handleDeleteArena = async (arenaId: number) => {
    try {
      await fetch(`/api/arenas/${arenaId}`, { method: 'DELETE' });
    } catch (e) {
      console.error('Failed to delete arena:', e);
    }
  };

  useEffect(() => {
    document.title = 'Drone Soccer Arena Hub';
  }, []);

  const defaultArenas = [
    { id: 1, name: 'Arena 1 - Alpha Cage' },
    { id: 2, name: 'Arena 2 - Bravo Cage' },
    { id: 3, name: 'Arena 3 - Charlie Cage' },
  ];

  const displayedArenas =
    arenaSummaries.length > 0
      ? [...arenaSummaries]
          .sort((a, b) => a.arenaId - b.arenaId)
          .map((s) => ({ id: s.arenaId, name: s.arenaName }))
      : defaultArenas;

  return (
    <div className="app-shell min-h-screen flex flex-col select-none">
      <HeaderNav variant="client" />

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8 flex-1 w-full flex flex-col gap-6">
        {/* Compact Left-Aligned Page Bar */}
        <div className="flex flex-wrap items-end justify-between gap-4 pb-5 border-b border-[var(--court-line)]">
          <div>
            <h1 className="spectator-numeral text-3xl sm:text-4xl font-black text-[var(--court-ink)] leading-none">
              Active flight cages ({displayedArenas.length})
            </h1>
            <p className="text-sm text-[var(--court-muted)] mt-1.5">
              Launch stadium scoreboards, referee consoles, dedicated pilot monitors, and broadcast overlays.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/live"
              target="_blank"
              className="px-3.5 py-2 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              style={{
                backgroundColor: 'var(--signal-live-tint)',
                borderColor: 'var(--signal-live-border)',
                color: 'var(--signal-live-text)',
              }}
            >
              <Globe className="w-4 h-4" />
              <span>Public live portal</span>
            </Link>

            <Link
              to="/master"
              className="px-3.5 py-2 rounded-lg bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] border border-[var(--court-line)] text-xs font-semibold text-[var(--court-ink)] inline-flex items-center gap-1.5 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-[var(--court-accent-link)]" />
              <span>Admin panel</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsAddArenaModalOpen(true)}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-opacity hover:opacity-90"
              style={{
                backgroundColor: 'var(--court-active-pill-bg)',
                color: 'var(--court-active-pill-fg)',
              }}
            >
              <Plus className="w-4 h-4" />
              <span>Add arena</span>
            </button>
          </div>
        </div>

        {/* Arenas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedArenas.map((cage) => (
            <HubCageRow
              key={cage.id}
              cageId={cage.id}
              cageName={cage.name}
              summary={arenaSummaries.find((s) => s.arenaId === cage.id)}
              onDelete={(target) => setArenaToDelete(target)}
            />
          ))}
        </div>
      </main>

      <AddArenaModal
        isOpen={isAddArenaModalOpen}
        onClose={() => setIsAddArenaModalOpen(false)}
        nextArenaId={nextArenaId}
      />

      <DeleteArenaConfirmModal
        isOpen={arenaToDelete !== null}
        arena={arenaToDelete}
        onClose={() => setArenaToDelete(null)}
        onConfirm={handleDeleteArena}
      />
    </div>
  );
};
