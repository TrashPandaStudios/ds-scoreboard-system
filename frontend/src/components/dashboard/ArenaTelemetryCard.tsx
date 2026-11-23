import React from 'react';
import { Link } from 'react-router-dom';
import { ArenaSummary } from '../../types/scoreboard';
import { useAuthoritativeTimer } from '../../hooks/useAuthoritativeTimer';
import { getSpectatorPhaseMeta } from '../public/PublicLiveCard';
import { TeamBadge } from '../common/TeamBadge';
import { Play, Pause, Tv, Sliders, Volume2, Layers, Coffee, Trash2 } from 'lucide-react';

interface ArenaTelemetryCardProps {
  arena: ArenaSummary;
  onToggleTimer: (arenaId: number) => void;
  onTriggerBuzzer: (arenaId: number) => void;
  onConfigureIntermission?: (arenaId: number) => void;
  onDeleteArena?: (arena: ArenaSummary) => void;
}

export const ArenaTelemetryCard: React.FC<ArenaTelemetryCardProps> = ({
  arena,
  onToggleTimer,
  onTriggerBuzzer,
  onConfigureIntermission,
  onDeleteArena,
}) => {
  const { formattedTime } = useAuthoritativeTimer({
    serverRemainingMs: arena.timeRemainingMs,
    totalDurationMs: arena.totalSetDurationMs ?? 180000,
    timerRunning: arena.timerRunning,
    phase: arena.phase,
  });

  const phaseMeta = getSpectatorPhaseMeta(arena.phase, arena.timerRunning);

  return (
    <div className="flex flex-col justify-between rounded-2xl bg-[var(--court-surface)] border border-[var(--court-line)] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 bg-[var(--court-subtle)] border-b border-[var(--court-line-soft)] flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-bold text-[var(--court-ink)] truncate">{arena.arenaName}</div>
          <div className="text-xs text-[var(--court-muted)]">
            Match {arena.matchNumber} — Set {arena.currentSet} of {arena.maxSets}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onConfigureIntermission && (
            <button
              type="button"
              onClick={() => onConfigureIntermission(arena.arenaId)}
              className="px-2 py-0.5 rounded-md text-xs font-semibold border inline-flex items-center gap-1 transition-colors"
              style={{
                backgroundColor: 'var(--signal-amber-tint)',
                borderColor: 'var(--signal-amber-border)',
                color: 'var(--signal-amber-text)',
              }}
              title="Configure intermission duration"
            >
              <Coffee className="w-3 h-3" />
              <span>{Math.round((arena.intermissionDurationMs || 90000) / 1000)}s</span>
            </button>
          )}

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

          {onDeleteArena && (
            <button
              type="button"
              onClick={() => onDeleteArena(arena)}
              className="p-1 rounded-lg text-[var(--court-muted)] hover:text-[var(--drone-red-text)] hover:bg-[var(--drone-red-tint)] transition-colors"
              title={`Decommission ${arena.arenaName}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Center: Split Scores & Clock */}
      <div className="p-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        {/* Red Team */}
        <div
          className="flex flex-col items-center text-center p-3 rounded-xl border"
          style={{
            backgroundColor: 'var(--drone-red-tint)',
            borderColor: 'var(--drone-red-border)',
          }}
        >
          <TeamBadge teamName={arena.teamRed} logoUrl={arena.teamRedLogoUrl} side="red" size="sm" />
          <span className="text-xs font-bold text-[var(--court-ink)] truncate max-w-full mt-1.5">
            {arena.teamRed}
          </span>
          <span className="spectator-numeral text-5xl font-black text-[var(--drone-red)] leading-none mt-1">
            {arena.redScore}
          </span>
          <span className="text-[11px] text-[var(--court-muted)] mt-1 tabular-nums">
            {arena.redSetScore} {arena.redSetScore === 1 ? 'set' : 'sets'}
          </span>
        </div>

        {/* Clock & Play/Pause */}
        <div className="flex flex-col items-center justify-center px-1">
          <span className="spectator-numeral text-3xl font-black text-[var(--court-ink)] leading-none">
            {formattedTime}
          </span>
          <button
            type="button"
            onClick={() => onToggleTimer(arena.arenaId)}
            className="mt-2.5 p-2 rounded-lg border transition-colors"
            style={
              arena.timerRunning
                ? {
                    backgroundColor: 'var(--signal-amber-tint)',
                    borderColor: 'var(--signal-amber-border)',
                    color: 'var(--signal-amber-text)',
                  }
                : {
                    backgroundColor: 'var(--signal-live-tint)',
                    borderColor: 'var(--signal-live-border)',
                    color: 'var(--signal-live-text)',
                  }
            }
            title={arena.timerRunning ? 'Pause timer' : 'Start timer'}
          >
            {arena.timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>

        {/* Blue Team */}
        <div
          className="flex flex-col items-center text-center p-3 rounded-xl border"
          style={{
            backgroundColor: 'var(--drone-blue-tint)',
            borderColor: 'var(--drone-blue-border)',
          }}
        >
          <TeamBadge teamName={arena.teamBlue} logoUrl={arena.teamBlueLogoUrl} side="blue" size="sm" />
          <span className="text-xs font-bold text-[var(--court-ink)] truncate max-w-full mt-1.5">
            {arena.teamBlue}
          </span>
          <span className="spectator-numeral text-5xl font-black text-[var(--drone-blue)] leading-none mt-1">
            {arena.blueScore}
          </span>
          <span className="text-[11px] text-[var(--court-muted)] mt-1 tabular-nums">
            {arena.blueSetScore} {arena.blueSetScore === 1 ? 'set' : 'sets'}
          </span>
        </div>
      </div>

      {/* Bottom Shortcuts */}
      <div className="grid grid-cols-4 gap-1.5 px-4 py-3 bg-[var(--court-subtle)] border-t border-[var(--court-line-soft)]">
        <Link
          to={`/arena/${arena.arenaId}/display`}
          className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-[var(--court-ink-secondary)] hover:text-[var(--court-ink)] transition-colors text-[11px] font-semibold"
        >
          <Tv className="w-4 h-4 text-[var(--court-accent-link)]" />
          <span>Display</span>
        </Link>

        <Link
          to={`/arena/${arena.arenaId}/referee`}
          target="_blank"
          className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-[var(--court-ink-secondary)] hover:text-[var(--court-ink)] transition-colors text-[11px] font-semibold"
        >
          <Sliders className="w-4 h-4" style={{ color: 'var(--signal-intermission)' }} />
          <span>Referee</span>
        </Link>

        <Link
          to={`/arena/${arena.arenaId}/overlay/lower-third`}
          target="_blank"
          className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-[var(--court-ink-secondary)] hover:text-[var(--court-ink)] transition-colors text-[11px] font-semibold"
        >
          <Layers className="w-4 h-4" style={{ color: 'var(--signal-live)' }} />
          <span>OBS</span>
        </Link>

        <button
          type="button"
          onClick={() => onTriggerBuzzer(arena.arenaId)}
          className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg border transition-colors text-[11px] font-semibold"
          style={{
            backgroundColor: 'var(--drone-red-tint)',
            borderColor: 'var(--drone-red-border)',
            color: 'var(--drone-red-text)',
          }}
          title="Fire buzzer on this arena"
        >
          <Volume2 className="w-4 h-4" />
          <span>Buzzer</span>
        </button>
      </div>
    </div>
  );
};
