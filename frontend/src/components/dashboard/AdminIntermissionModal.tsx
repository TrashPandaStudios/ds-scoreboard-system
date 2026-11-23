import React, { useState, useEffect } from 'react';
import { X, RotateCcw, CheckCircle2, Zap } from 'lucide-react';
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
  { label: '60s', seconds: 60 },
  { label: '90s', seconds: 90 },
  { label: '120s', seconds: 120 },
  { label: '180s', seconds: 180 },
  { label: '300s', seconds: 300 },
];

export const AdminIntermissionModal: React.FC<AdminIntermissionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [globalDefaultMs, setGlobalDefaultMs] = useState<number>(90000);
  const [targetGlobalSeconds, setTargetGlobalSeconds] = useState<number>(90);
  const [arenaConfigs, setArenaConfigs] = useState<ArenaConfigItem[]>([]);
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

  const handleSaveGlobal = async (forceOverrideAll: boolean) => {
    setLoading(true);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/arenas/config/intermission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultIntermissionDurationMs: targetGlobalSeconds * 1000,
          overrideAllArenas: forceOverrideAll,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setGlobalDefaultMs(data.defaultIntermissionDurationMs);
        if (data.arenas) setArenaConfigs(data.arenas);
        setSuccessMsg(
          forceOverrideAll
            ? `Default set to ${targetGlobalSeconds}s and applied to all cages.`
            : `Default intermission updated to ${targetGlobalSeconds}s.`
        );
        onSuccess?.();
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
        setSuccessMsg(`Cage ${arenaId} intermission set to ${durationSeconds}s.`);
        onSuccess?.();
      }
    } catch (e) {
      console.error(`Error overriding arena ${arenaId} intermission:`, e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm select-none"
      style={{ backgroundColor: 'var(--court-overlay-backdrop)' }}
    >
      <div className="relative w-full max-w-2xl p-6 rounded-2xl bg-[var(--court-surface)] border border-[var(--court-line)] shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--court-line-soft)] pb-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--court-ink)]">Intermission settings</h2>
            <p className="text-xs text-[var(--court-muted)] mt-0.5">
              Set the tournament default break time or override individual cages.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--court-muted)] hover:text-[var(--court-ink)] hover:bg-[var(--court-control-bg)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMsg && (
          <div
            className="flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold"
            style={{
              backgroundColor: 'var(--signal-live-tint)',
              borderColor: 'var(--signal-live-border)',
              color: 'var(--signal-live-text)',
            }}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Global Default */}
        <div className="flex flex-col gap-4 p-4 rounded-xl bg-[var(--court-subtle)] border border-[var(--court-line-soft)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-bold text-[var(--court-ink)]">Tournament default</span>
            <span className="text-xs text-[var(--court-muted)] tabular-nums">
              Current default: <strong className="text-[var(--court-ink)]">{Math.round(globalDefaultMs / 1000)}s ({formatSecs(Math.round(globalDefaultMs / 1000))})</strong>
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {GLOBAL_PRESETS.map((p) => {
              const isSelected = targetGlobalSeconds === p.seconds;
              return (
                <button
                  key={p.seconds}
                  type="button"
                  onClick={() => setTargetGlobalSeconds(p.seconds)}
                  className="py-2 px-2 rounded-lg text-xs font-semibold border transition-colors tabular-nums"
                  style={
                    isSelected
                      ? {
                          backgroundColor: 'var(--signal-amber-tint)',
                          borderColor: 'var(--signal-amber-border)',
                          color: 'var(--signal-amber-text)',
                        }
                      : {
                          backgroundColor: 'var(--court-surface)',
                          borderColor: 'var(--court-line)',
                          color: 'var(--court-ink-secondary)',
                        }
                  }
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--court-line-soft)]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--court-muted)]">Target:</span>
              <input
                type="number"
                min="10"
                max="600"
                value={targetGlobalSeconds}
                onChange={(e) => setTargetGlobalSeconds(parseInt(e.target.value, 10) || 10)}
                className="w-20 px-2 py-1.5 rounded-lg bg-[var(--court-surface)] border border-[var(--court-line)] text-[var(--court-ink)] font-bold text-center text-xs tabular-nums"
              />
              <span className="text-xs text-[var(--court-muted)] tabular-nums">
                sec ({formatSecs(targetGlobalSeconds)})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSaveGlobal(false)}
                className="px-3.5 py-2 rounded-lg bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-[var(--court-ink)] text-xs font-semibold border border-[var(--court-line)] disabled:opacity-50"
              >
                Save default
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleSaveGlobal(true)}
                className="px-3.5 py-2 rounded-lg text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
                style={{ backgroundColor: 'var(--signal-amber-solid)' }}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Apply to all cages</span>
              </button>
            </div>
          </div>
        </div>

        {/* Per-Arena Overrides */}
        <div className="flex flex-col gap-2.5">
          <h3 className="text-xs font-semibold text-[var(--court-muted)]">Per-cage overrides</h3>

          {arenaConfigs.length > 0 ? (
            arenaConfigs.map((arena) => {
              const durationSecs = Math.round(arena.intermissionDurationMs / 1000);
              const isDiffFromGlobal = durationSecs !== Math.round(globalDefaultMs / 1000);

              return (
                <div
                  key={arena.arenaId}
                  className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[var(--court-subtle)] border border-[var(--court-line-soft)]"
                >
                  <div>
                    <span className="text-sm font-bold text-[var(--court-ink)] block">{arena.arenaName}</span>
                    <div className="flex items-center gap-2 text-xs text-[var(--court-muted)] mt-0.5 tabular-nums">
                      <span>
                        {durationSecs}s ({formatSecs(durationSecs)})
                      </span>
                      {isDiffFromGlobal && (
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                          style={{
                            backgroundColor: 'var(--signal-intermission-tint)',
                            borderColor: 'var(--signal-intermission-border)',
                            color: 'var(--signal-intermission-text)',
                          }}
                        >
                          Custom
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {[60, 90, 120, 180].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        disabled={loading}
                        onClick={() => handleArenaOverride(arena.arenaId, sec)}
                        className="px-2.5 py-1 rounded-md text-xs font-semibold border tabular-nums transition-colors"
                        style={
                          durationSecs === sec
                            ? {
                                backgroundColor: 'var(--signal-amber-tint)',
                                borderColor: 'var(--signal-amber-border)',
                                color: 'var(--signal-amber-text)',
                              }
                            : {
                                backgroundColor: 'var(--court-surface)',
                                borderColor: 'var(--court-line)',
                                color: 'var(--court-ink-secondary)',
                              }
                        }
                      >
                        {sec}s
                      </button>
                    ))}

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleArenaOverride(arena.arenaId, Math.round(globalDefaultMs / 1000))}
                      className="px-2.5 py-1 rounded-md bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-[var(--court-ink-secondary)] border border-[var(--court-line)] text-xs font-semibold inline-flex items-center gap-1"
                      title="Reset to default"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-6 text-center text-xs text-[var(--court-muted)]">No active cages reported.</div>
          )}
        </div>

        <div className="flex justify-end pt-3 border-t border-[var(--court-line-soft)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-[var(--court-ink)] text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
