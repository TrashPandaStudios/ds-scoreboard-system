import React from 'react';
import { Link } from 'react-router-dom';
import { ArenaSummary } from '../../types/scoreboard';
import { useAuthoritativeTimer } from '../../hooks/useAuthoritativeTimer';
import { Play, Pause, Tv, Sliders, Volume2, Layers, AlertCircle, Coffee, Trash2 } from 'lucide-react';

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
    timerRunning: arena.timerRunning,
  });

  const isPenaltyPhase = arena.phase === 'PENALTY_PHASE';

  return (
    <div className="flex flex-col justify-between p-6 rounded-3xl bg-slate-900/90 border-2 border-slate-800 hover:border-slate-700 transition-all shadow-xl">
      {/* Top: Arena Name & Match Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div>
          <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider block">
            {arena.arenaName}
          </span>
          <span className="text-sm font-semibold text-white">
            {arena.matchNumber} (Set {arena.currentSet}/{arena.maxSets})
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {onConfigureIntermission && (
            <button
              onClick={() => onConfigureIntermission(arena.arenaId)}
              className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-950/60 hover:bg-amber-900/80 border border-amber-600/40 text-amber-300 flex items-center gap-1 transition-colors"
              title="Click to configure or override intermission duration for this cage"
            >
              <Coffee className="w-2.5 h-2.5 text-amber-400" />
              <span>Break: {Math.round((arena.intermissionDurationMs || 90000) / 1000)}s</span>
            </button>
          )}

          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
              isPenaltyPhase
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                : arena.timerRunning
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {arena.phase}
          </span>

          {onDeleteArena && (
            <button
              onClick={() => onDeleteArena(arena)}
              className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/50 border border-transparent hover:border-rose-700/50 transition-colors"
              title={`Decommission ${arena.arenaName}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Center: Live Match Telemetry Scores & Clock */}
      <div className="grid grid-cols-3 items-center gap-2 my-2">
        {/* Red Team */}
        <div className="flex flex-col items-center p-3 rounded-2xl bg-red-950/30 border border-red-500/20">
          <span className="text-[11px] font-mono text-red-400 font-bold truncate max-w-full">
            {arena.teamRed}
          </span>
          <span className="font-display font-black text-4xl text-red-500 tabular-nums">
            {arena.redScore}
          </span>
          <span className="text-[10px] font-mono text-slate-400 mt-1">Sets: {arena.redSetScore}</span>
        </div>

        {/* Center Clock & Quick Pause */}
        <div className="flex flex-col items-center justify-center">
          <span className="font-mono font-black text-2xl lg:text-3xl text-white tabular-nums">
            {formattedTime}
          </span>
          <button
            onClick={() => onToggleTimer(arena.arenaId)}
            className={`mt-2 p-2 rounded-xl border transition-all active:scale-95 ${
              arena.timerRunning
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
            }`}
            title={arena.timerRunning ? 'Pause timer' : 'Start timer'}
          >
            {arena.timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>

        {/* Blue Team */}
        <div className="flex flex-col items-center p-3 rounded-2xl bg-blue-950/30 border border-blue-500/20">
          <span className="text-[11px] font-mono text-blue-400 font-bold truncate max-w-full">
            {arena.teamBlue}
          </span>
          <span className="font-display font-black text-4xl text-blue-400 tabular-nums">
            {arena.blueScore}
          </span>
          <span className="text-[10px] font-mono text-slate-400 mt-1">Sets: {arena.blueSetScore}</span>
        </div>
      </div>

      {/* Bottom: Action Shortcuts */}
      <div className="grid grid-cols-4 gap-2 pt-4 mt-2 border-t border-slate-800">
        <Link
          to={`/arena/${arena.arenaId}/display`}
          className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[10px] font-mono"
        >
          <Tv className="w-4 h-4 text-cyan-400" />
          <span>DISPLAY</span>
        </Link>

        <Link
          to={`/arena/${arena.arenaId}/referee`}
          target="_blank"
          className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[10px] font-mono"
        >
          <Sliders className="w-4 h-4 text-purple-400" />
          <span>REFEREE</span>
        </Link>

        <Link
          to={`/arena/${arena.arenaId}/overlay/lower-third`}
          target="_blank"
          className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[10px] font-mono"
        >
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>OBS</span>
        </Link>

        <button
          onClick={() => onTriggerBuzzer(arena.arenaId)}
          className="flex flex-col items-center gap-1 p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 transition-colors text-[10px] font-mono"
          title="Fire buzzer on this arena"
        >
          <Volume2 className="w-4 h-4 text-rose-400" />
          <span>BUZZER</span>
        </button>
      </div>
    </div>
  );
};
