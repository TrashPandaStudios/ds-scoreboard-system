import React, { useState, useEffect } from 'react';
import { Clock, X, Check, AlertTriangle } from 'lucide-react';

interface AddArenaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  nextArenaId?: number;
}

const DURATION_PRESETS = [
  { label: '3:00 (FIDA Standard)', seconds: 180 },
  { label: '2:00 (Youth / Blitz)', seconds: 120 },
  { label: '1:30 (Speed Test)', seconds: 90 },
  { label: '5:00 (Extended)', seconds: 300 },
];

export const AddArenaModal: React.FC<AddArenaModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  nextArenaId = 4,
}) => {
  const [arenaName, setArenaName] = useState(`Arena ${nextArenaId} - Cage`);
  const [durationSeconds, setDurationSeconds] = useState<number>(180);
  const [customDurationInput, setCustomDurationInput] = useState<string>('180');
  const [isCustomDuration, setIsCustomDuration] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setArenaName(`Arena ${nextArenaId} - Delta Cage`);
      setDurationSeconds(180);
      setCustomDurationInput('180');
      setIsCustomDuration(false);
      setErrorMessage(null);
      setLoading(false);
    }
  }, [isOpen, nextArenaId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arenaName.trim()) {
      setErrorMessage('Arena name is required.');
      return;
    }

    const durationMs = durationSeconds * 1000;
    if (durationMs <= 0 || isNaN(durationMs)) {
      setErrorMessage('Please enter a valid set duration.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/arenas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: arenaName.trim(),
          durationMs,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to create arena (HTTP ${res.status})`);
      }

      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ backgroundColor: 'var(--court-overlay-backdrop)' }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-[var(--court-surface)] border border-[var(--court-line)] shadow-2xl p-6 relative">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-[var(--court-muted)] hover:text-[var(--court-ink)] hover:bg-[var(--court-control-bg)] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5 pr-8">
          <h2 className="text-xl font-bold text-[var(--court-ink)]">Add flight cage</h2>
          <p className="text-xs text-[var(--court-muted)] mt-0.5">
            Creates Cage #{nextArenaId} with dedicated stadium displays, referee console, and live timing.
          </p>
        </div>

        {errorMessage && (
          <div
            className="mb-4 p-3 rounded-lg border text-xs font-semibold flex items-center gap-2"
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-xs font-semibold text-[var(--court-ink-secondary)] mb-1.5">
              Arena name
            </label>
            <input
              type="text"
              required
              value={arenaName}
              onChange={(e) => setArenaName(e.target.value)}
              placeholder="e.g. Arena 4 - Delta Cage"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[var(--court-subtle)] border border-[var(--court-line)] text-[var(--court-ink)] text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[var(--court-ink-secondary)] inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[var(--court-muted)]" />
                <span>Default set duration</span>
              </label>
              <span className="text-xs font-semibold text-[var(--court-ink)] tabular-nums">
                {Math.floor(durationSeconds / 60)}:{(durationSeconds % 60).toString().padStart(2, '0')} ({durationSeconds}s)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2.5">
              {DURATION_PRESETS.map((preset) => {
                const selected = !isCustomDuration && durationSeconds === preset.seconds;
                return (
                  <button
                    key={preset.seconds}
                    type="button"
                    onClick={() => {
                      setDurationSeconds(preset.seconds);
                      setCustomDurationInput(preset.seconds.toString());
                      setIsCustomDuration(false);
                    }}
                    className="px-3 py-2 rounded-lg text-xs font-semibold border transition-colors"
                    style={
                      selected
                        ? {
                            backgroundColor: 'var(--drone-blue-tint)',
                            borderColor: 'var(--drone-blue-border)',
                            color: 'var(--drone-blue-text)',
                          }
                        : {
                            backgroundColor: 'var(--court-subtle)',
                            borderColor: 'var(--court-line-soft)',
                            color: 'var(--court-ink-secondary)',
                          }
                    }
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCustomDuration(!isCustomDuration)}
                className="text-xs font-semibold text-[var(--court-accent-link)] hover:underline"
              >
                Custom seconds
              </button>

              {isCustomDuration && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="10"
                    max="1800"
                    value={customDurationInput}
                    onChange={(e) => {
                      setCustomDurationInput(e.target.value);
                      const sec = parseInt(e.target.value, 10);
                      if (!isNaN(sec) && sec > 0) {
                        setDurationSeconds(sec);
                      }
                    }}
                    className="w-24 px-2.5 py-1 rounded-lg bg-[var(--court-subtle)] border border-[var(--court-line)] text-xs text-[var(--court-ink)] tabular-nums"
                  />
                  <span className="text-xs text-[var(--court-muted)]">sec</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--court-line-soft)]">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-[var(--court-ink-secondary)] text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg text-white text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
              style={{ backgroundColor: 'var(--drone-blue-solid)' }}
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Creating...' : `Create cage #${nextArenaId}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
