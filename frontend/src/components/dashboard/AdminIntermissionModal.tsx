import React, { useState, useEffect } from 'react';
import { Coffee, Clock, Check, X, ShieldAlert, RotateCcw, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';
import { ArenaSummary } from '../../types/scoreboard';

interface AdminIntermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  arenas: ArenaSummary[];
  onSuccess?: () => void;
}

interface ArenaConfigItem {
  arenaId: number;
  arenaName: string;
  intermissionDurationMs: number;
}

const GLOBAL_PRESETS = [
  { label: '45s', seconds: 45 },
  { label: '60s (1m)', seconds: 60 },
  { label: '90s (1.5m)', seconds: 90 },
  { label: '120s (2m)', seconds: 120 },
  { label: '180s (3m)', seconds: 180 },
  { label: '300s (5m)', seconds: 300 },
];

export const AdminIntermissionModal: React.FC<AdminIntermissionModalProps> = ({
  isOpen,
  onClose,
  arenas,
  onSuccess,
}) => {
  const [globalDefaultMs, setGlobalDefaultMs] = useState<number>(90000);
  const [targetGlobalSeconds, setTargetGlobalSeconds] = useState<number>(90);
  const [arenaConfigs, setArenaConfigs] = useState<ArenaConfigItem[]>([]);
  const [overrideAll, setOverrideAll] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchConfig = () => {
    setLoading(true);
    fetch('/api/arenas/config/intermission')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          const defaultMs = data.defaultIntermissionDurationMs || 90000;
          setGlobalDefaultMs(defaultMs);
          setTargetGlobalSeconds(Math.round(defaultMs / 1000));
          if (data.arenas) {
            setArenaConfigs(data.arenas);
          }
        }
      })
      .catch((e) => console.error('Failed to fetch intermission config:', e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      fetchConfig();
      setSuccessMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatSecs = (s: number) => {
    const m = Math.floor(s / 60);
    const remainder = s % 60;
    return `${m}:${remainder.toString().padStart(2, '0')}`;
  };

  const handleSaveGlobal = async (forceOverrideAll?: boolean) => {
    setLoading(true);
    setSuccessMsg(null);
    const doOverride = forceOverrideAll !== undefined ? forceOverrideAll : overrideAll;
    try {
      const res = await fetch('/api/arenas/config/intermission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultIntermissionDurationMs: targetGlobalSeconds * 1000,
          overrideAllArenas: doOverride,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setGlobalDefaultMs(data.defaultIntermissionDurationMs);
        if (data.arenas) setArenaConfigs(data.arenas);
        setSuccessMsg(
          doOverride
            ? `Global default set to ${targetGlobalSeconds}s & forced across ALL cages!`
            : `Global default intermission updated to ${targetGlobalSeconds}s.`
        );
        if (onSuccess) onSuccess();
      }
    } catch (e) {
      console.error('Error saving global intermission config:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleArenaOverride = async (arenaId: number, durationSeconds: number) => {
    setLoading(true);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/arenas/${arenaId}/intermission-duration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          durationMs: durationSeconds * 1000,
          adminOverride: true,
        }),
      });

      if (res.ok) {
        setArenaConfigs((prev) =>
          prev.map((item) =>
            item.arenaId === arenaId ? { ...item, intermissionDurationMs: durationSeconds * 1000 } : item
          )
        );
        setSuccessMsg(`Arena ${arenaId} intermission duration overridden to ${durationSeconds}s.`);
        if (onSuccess) onSuccess();
      }
    } catch (e) {
      console.error(`Error overriding arena ${arenaId} intermission:`, e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-2xl p-6 lg:p-8 rounded-3xl bg-slate-900/95 border-2 border-slate-700/80 shadow-2xl flex flex-col gap-6 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
              <Coffee className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase block">
                ADMIN TOURNAMENT SETTINGS
              </span>
              <h2 className="text-2xl font-display font-black text-white">
                Intermission Duration &amp; Override Hub
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {successMsg && (
          <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Section 1: Global Tournament Default Configuration */}
        <div className="flex flex-col gap-4 p-5 rounded-2xl bg-slate-950/70 border border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider block">
                GLOBAL TOURNAMENT DEFAULT
              </span>
              <span className="text-sm font-semibold text-white">
                Default time for all new arenas &amp; resets:
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">Current Server Default:</span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 font-mono text-xs font-bold text-amber-300">
                {Math.round(globalDefaultMs / 1000)}s ({formatSecs(Math.round(globalDefaultMs / 1000))})
              </span>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {GLOBAL_PRESETS.map((p) => {
              const isSelected = targetGlobalSeconds === p.seconds;
              return (
                <button
                  key={p.seconds}
                  type="button"
                  onClick={() => setTargetGlobalSeconds(p.seconds)}
                  className={`py-2 px-2 rounded-xl font-mono text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Custom seconds selector & Action */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">Selected Target:</span>
              <input
                type="number"
                min="10"
                max="600"
                value={targetGlobalSeconds}
                onChange={(e) => setTargetGlobalSeconds(parseInt(e.target.value, 10) || 10)}
                className="w-20 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-amber-300 font-mono font-bold text-center text-sm focus:outline-none focus:border-amber-500"
              />
              <span className="text-xs font-mono text-slate-400">
                seconds ({formatSecs(targetGlobalSeconds)})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSaveGlobal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs font-bold border border-slate-700 transition-colors disabled:opacity-50"
              >
                SAVE DEFAULT
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleSaveGlobal(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-mono text-xs font-black flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
                title="Save default and forcefully override all active arenas"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>OVERRIDE ALL ARENAS</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Per-Arena Intermission Override Grid */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase font-bold tracking-wider">
              PER-ARENA ACTIVE CAGES (LIVE OVERRIDES)
            </span>
            <span className="text-xs font-mono text-slate-500">
              Admin changes override referee panel settings immediately
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            {arenaConfigs.length > 0 ? (
              arenaConfigs.map((arena) => {
                const durationSecs = Math.round(arena.intermissionDurationMs / 1000);
                const isDiffFromGlobal = durationSecs !== Math.round(globalDefaultMs / 1000);

                return (
                  <div
                    key={arena.arenaId}
                    className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800 hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-cyan-950/60 border border-cyan-700/50 flex items-center justify-center text-cyan-400 font-mono text-xs font-bold">
                        {arena.arenaId}
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-white block">
                          {arena.arenaName}
                        </span>
                        <div className="flex items-center gap-2 text-xs font-mono">
                          <span className="text-slate-400">Duration:</span>
                          <span className="font-bold text-amber-300">
                            {durationSecs}s ({formatSecs(durationSecs)})
                          </span>
                          {isDiffFromGlobal ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/60 border border-purple-700/60 text-purple-300 font-bold">
                              CUSTOM REF BREAK
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                              DEFAULT
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quick Override Actions for this Arena */}
                    <div className="flex items-center gap-2 ml-auto">
                      {/* Presets */}
                      {[60, 90, 120, 180].map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          disabled={loading}
                          onClick={() => handleArenaOverride(arena.arenaId, sec)}
                          className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                            durationSecs === sec
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          {sec}s
                        </button>
                      ))}

                      {/* Reset to Tournament Default */}
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() =>
                          handleArenaOverride(arena.arenaId, Math.round(globalDefaultMs / 1000))
                        }
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono font-bold flex items-center gap-1 transition-colors"
                        title="Reset this arena to global tournament default"
                      >
                        <RotateCcw className="w-3 h-3 text-cyan-400" />
                        <span>Reset</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-6 text-center text-slate-500 font-mono text-xs">
                No active cages reported. Initializing...
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
