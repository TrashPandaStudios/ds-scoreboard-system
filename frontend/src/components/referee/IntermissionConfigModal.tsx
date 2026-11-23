import React, { useState, useEffect } from 'react';
import { Clock, Check, X, Play } from 'lucide-react';

interface IntermissionConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  arenaId: number;
  arenaName: string;
  currentDurationMs: number;
  isIntermissionActive?: boolean;
  onSaveDuration: (durationMs: number) => void;
  onStartIntermission?: () => void;
}

const PRESETS = [
  { label: '45s', seconds: 45 },
  { label: '60s (1m)', seconds: 60 },
  { label: '90s (1.5m)', seconds: 90 },
  { label: '120s (2m)', seconds: 120 },
  { label: '180s (3m)', seconds: 180 },
  { label: '300s (5m)', seconds: 300 },
];

export const IntermissionConfigModal: React.FC<IntermissionConfigModalProps> = ({
  isOpen,
  onClose,
  arenaName,
  currentDurationMs,
  onSaveDuration,
  onStartIntermission,
}) => {
  const currentTotalSeconds = Math.round((currentDurationMs || 90000) / 1000);
  const [selectedSeconds, setSelectedSeconds] = useState<number>(currentTotalSeconds);
  const [customMin, setCustomMin] = useState<string>('');
  const [customSec, setCustomSec] = useState<string>('');

  useEffect(() => {
    const secs = Math.round((currentDurationMs || 90000) / 1000);
    setSelectedSeconds(secs);
    setCustomMin(Math.floor(secs / 60).toString());
    setCustomSec((secs % 60).toString().padStart(2, '0'));
  }, [currentDurationMs, isOpen]);

  if (!isOpen) return null;

  const handleCustomChange = (mins: string, secs: string) => {
    setCustomMin(mins);
    setCustomSec(secs);
    const m = parseInt(mins, 10) || 0;
    const s = parseInt(secs, 10) || 0;
    const total = m * 60 + s;
    if (total > 0) {
      setSelectedSeconds(total);
    }
  };

  const handleSelectPreset = (seconds: number) => {
    setSelectedSeconds(seconds);
    setCustomMin(Math.floor(seconds / 60).toString());
    setCustomSec((seconds % 60).toString().padStart(2, '0'));
  };

  const handleSave = () => {
    if (selectedSeconds > 0) {
      onSaveDuration(selectedSeconds * 1000);
      onClose();
    }
  };

  const formatDisplayTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm select-none"
      style={{ backgroundColor: 'var(--court-overlay-backdrop)' }}
    >
      <div className="relative w-full max-w-lg p-6 rounded-2xl bg-[var(--court-surface)] border border-[var(--court-line)] shadow-2xl flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--court-line-soft)] pb-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--court-ink)]">Intermission break</h2>
            <p className="text-xs text-[var(--court-muted)] mt-0.5">{arenaName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--court-muted)] hover:text-[var(--court-ink)] hover:bg-[var(--court-control-bg)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--court-subtle)] border border-[var(--court-line-soft)]">
          <div>
            <span className="text-xs text-[var(--court-muted)] block">Current setting</span>
            <span className="text-sm font-bold text-[var(--court-ink)] tabular-nums">
              {currentTotalSeconds}s ({formatDisplayTime(currentTotalSeconds)})
            </span>
          </div>

          <div className="text-right">
            <span className="text-xs text-[var(--court-muted)] block">Selected break</span>
            <div
              className="spectator-numeral text-3xl font-black leading-none mt-0.5"
              style={{ color: 'var(--signal-amber-text)' }}
            >
              {formatDisplayTime(selectedSeconds)}{' '}
              <span className="text-xs font-sans font-medium text-[var(--court-muted)]">({selectedSeconds}s)</span>
            </div>
          </div>
        </div>

        {/* Presets */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-[var(--court-muted)]">Quick presets</span>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((preset) => {
              const isSelected = selectedSeconds === preset.seconds;
              return (
                <button
                  key={preset.seconds}
                  type="button"
                  onClick={() => handleSelectPreset(preset.seconds)}
                  className="py-2.5 px-3 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 border tabular-nums transition-colors"
                  style={
                    isSelected
                      ? {
                          backgroundColor: 'var(--signal-amber-tint)',
                          borderColor: 'var(--signal-amber-border)',
                          color: 'var(--signal-amber-text)',
                        }
                      : {
                          backgroundColor: 'var(--court-control-bg)',
                          borderColor: 'var(--court-line)',
                          color: 'var(--court-ink-secondary)',
                        }
                  }
                >
                  <Clock className="w-3.5 h-3.5 opacity-70" />
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Time */}
        <div className="flex flex-col gap-2 pt-3 border-t border-[var(--court-line-soft)]">
          <span className="text-xs font-semibold text-[var(--court-muted)]">Custom duration</span>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 bg-[var(--court-subtle)] px-3 py-2 rounded-lg border border-[var(--court-line)]">
              <input
                type="number"
                min="0"
                max="59"
                value={customMin}
                onChange={(e) => handleCustomChange(e.target.value, customSec)}
                className="w-12 bg-transparent text-center font-bold text-sm text-[var(--court-ink)] tabular-nums focus:outline-none"
                placeholder="0"
              />
              <span className="text-xs text-[var(--court-muted)]">m</span>
              <span className="text-[var(--court-muted)]">:</span>
              <input
                type="number"
                min="0"
                max="59"
                value={customSec}
                onChange={(e) => handleCustomChange(customMin, e.target.value)}
                className="w-12 bg-transparent text-center font-bold text-sm text-[var(--court-ink)] tabular-nums focus:outline-none"
                placeholder="00"
              />
              <span className="text-xs text-[var(--court-muted)]">s</span>
            </div>
            <span className="text-xs text-[var(--court-muted)]">Applies to upcoming breaks on this cage.</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-[var(--court-line-soft)]">
          {onStartIntermission && (
            <button
              type="button"
              onClick={() => {
                onSaveDuration(selectedSeconds * 1000);
                onStartIntermission();
                onClose();
              }}
              className="px-3.5 py-2 rounded-lg border text-xs font-semibold inline-flex items-center gap-1.5"
              style={{
                backgroundColor: 'var(--signal-intermission-tint)',
                borderColor: 'var(--signal-intermission-border)',
                color: 'var(--signal-intermission-text)',
              }}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Save &amp; start break</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-[var(--court-ink-secondary)] text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-lg text-white text-xs font-semibold inline-flex items-center gap-1.5"
              style={{ backgroundColor: 'var(--signal-amber-solid)' }}
            >
              <Check className="w-4 h-4" />
              <span>Apply setting</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
