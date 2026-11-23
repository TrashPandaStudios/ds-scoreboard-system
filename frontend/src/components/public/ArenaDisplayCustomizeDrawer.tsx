import React, { useState } from 'react';
import {
  ArenaDisplayElement,
  ArenaDisplayPresetId,
  ArenaDisplayVisibility,
  DISPLAY_PRESETS,
} from '../../hooks/useArenaDisplayConfig';
import { SpectatorTheme } from '../../hooks/useSpectatorTheme';
import { X, Copy, Check, RotateCcw, Monitor, Eye, EyeOff } from 'lucide-react';

interface ArenaDisplayCustomizeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  arenaName: string;
  visibility: ArenaDisplayVisibility;
  upcomingLimit: number;
  themeOverride: SpectatorTheme | null;
  onToggleElement: (key: ArenaDisplayElement) => void;
  onApplyPreset: (presetId: ArenaDisplayPresetId) => void;
  onSetUpcomingLimit: (limit: number) => void;
  onSetThemeOverride: (theme: SpectatorTheme | null) => void;
  onResetDefaults: () => void;
  shareUrl: string;
}

const ELEMENT_CONTROLS: {
  key: ArenaDisplayElement;
  label: string;
  description: string;
  group: 'sections' | 'currentDetails' | 'chrome';
}[] = [
  {
    key: 'current',
    label: 'Current match',
    description: 'Live scoreboard for the match currently running in this cage.',
    group: 'sections',
  },
  {
    key: 'next',
    label: 'Next match (On deck)',
    description: 'Highlighted spotlight card for the very next queued match.',
    group: 'sections',
  },
  {
    key: 'upcoming',
    label: 'Upcoming matches queue',
    description: 'List of scheduled upcoming matches waiting on this cage.',
    group: 'sections',
  },
  {
    key: 'sets',
    label: 'Set-by-set breakdown',
    description: 'Individual set scores for the active match.',
    group: 'sections',
  },
  {
    key: 'recent',
    label: 'Recent match results',
    description: 'Earlier completed matches recorded on this cage.',
    group: 'sections',
  },
  {
    key: 'sponsors',
    label: 'Event partners strip',
    description: 'Active tournament sponsor bar at the bottom of the screen.',
    group: 'sections',
  },
  {
    key: 'clock',
    label: 'Live match clock',
    description: 'Countdown timer and progress bar inside Current Match.',
    group: 'currentDetails',
  },
  {
    key: 'scores',
    label: 'Live scores & penalties',
    description: 'Points, set pips, and penalty badges inside Current Match.',
    group: 'currentDetails',
  },
  {
    key: 'header',
    label: 'Arena header bar',
    description: 'Top bar with cage title, tournament name, and connection badge.',
    group: 'chrome',
  },
  {
    key: 'controls',
    label: 'Interactive toolbar buttons',
    description: 'Hide for clean unattended TV / kiosk displays (press C to reopen).',
    group: 'chrome',
  },
];

const LIMIT_OPTIONS = [
  { value: 3, label: '3' },
  { value: 5, label: '5' },
  { value: 8, label: '8' },
  { value: 12, label: '12' },
  { value: 0, label: 'All' },
];

export const ArenaDisplayCustomizeDrawer: React.FC<ArenaDisplayCustomizeDrawerProps> = ({
  isOpen,
  onClose,
  arenaName,
  visibility,
  upcomingLimit,
  themeOverride,
  onToggleElement,
  onApplyPreset,
  onSetUpcomingLimit,
  onSetThemeOverride,
  onResetDefaults,
  shareUrl,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyUrl = () => {
    navigator.clipboard?.writeText(shareUrl).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const renderGroup = (title: string, group: 'sections' | 'currentDetails' | 'chrome') => {
    const items = ELEMENT_CONTROLS.filter((item) => item.group === group);
    return (
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--court-muted)]">
          {title}
        </h3>
        <div className="rounded-xl border border-[var(--court-line-soft)] bg-[var(--court-subtle)] divide-y divide-[var(--court-line-soft)] overflow-hidden">
          {items.map((item) => {
            const active = visibility[item.key];
            const disabled = group === 'currentDetails' && !visibility.current;
            return (
              <button
                key={item.key}
                type="button"
                disabled={disabled}
                onClick={() => onToggleElement(item.key)}
                className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-3 transition-colors ${
                  disabled
                    ? 'opacity-45 cursor-not-allowed'
                    : 'hover:bg-[var(--court-hover)] cursor-pointer'
                }`}
                aria-pressed={active}
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[var(--court-ink)] flex items-center gap-1.5">
                    {active ? (
                      <Eye className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--signal-live)' }} />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 shrink-0 text-[var(--court-muted)]" />
                    )}
                    <span>{item.label}</span>
                  </div>
                  <p className="text-xs text-[var(--court-muted)] mt-0.5 leading-snug">
                    {item.description}
                  </p>
                </div>

                <span
                  className="w-10 h-5 rounded-full p-0.5 shrink-0 transition-colors flex items-center"
                  style={{
                    backgroundColor: active ? 'var(--signal-live)' : 'var(--court-line)',
                    justifyContent: active ? 'flex-end' : 'flex-start',
                  }}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end backdrop-blur-sm"
      style={{ backgroundColor: 'var(--court-overlay-backdrop)' }}
      onClick={onClose}
    >
      <aside
        className="w-full max-w-md h-full bg-[var(--court-surface)] border-l border-[var(--court-line)] shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
        aria-label="Customize arena display"
      >
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-[var(--court-line)] flex items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[var(--court-ink)] flex items-center gap-2">
              <Monitor className="w-4 h-4 text-[var(--court-accent-link)] shrink-0" />
              <span className="truncate">Customize display</span>
            </h2>
            <p className="text-xs text-[var(--court-muted)] truncate mt-0.5">
              {arenaName} — changes update the URL automatically
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close customize panel"
            className="p-1.5 rounded-lg text-[var(--court-muted)] hover:text-[var(--court-ink)] hover:bg-[var(--court-control-bg)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
          {/* Quick Presets */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--court-muted)]">
              Tournament display presets
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(DISPLAY_PRESETS) as ArenaDisplayPresetId[]).map((presetId) => {
                const preset = DISPLAY_PRESETS[presetId];
                return (
                  <button
                    key={presetId}
                    type="button"
                    onClick={() => onApplyPreset(presetId)}
                    className="p-3 rounded-xl border border-[var(--court-line)] bg-[var(--court-subtle)] hover:bg-[var(--court-hover)] text-left transition-colors flex flex-col gap-1"
                  >
                    <span className="text-xs font-bold text-[var(--court-ink)]">{preset.label}</span>
                    <span className="text-[11px] text-[var(--court-muted)] leading-snug">
                      {preset.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {renderGroup('Visible sections', 'sections')}
          {renderGroup('Current match details', 'currentDetails')}
          {renderGroup('Signage & kiosk options', 'chrome')}

          {/* Upcoming Matches Limit */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--court-muted)]">
              Max upcoming matches shown
            </h3>
            <div className="grid grid-cols-5 gap-1.5">
              {LIMIT_OPTIONS.map((opt) => {
                const active = upcomingLimit === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onSetUpcomingLimit(opt.value)}
                    className="py-1.5 rounded-lg text-xs font-semibold border transition-colors"
                    style={
                      active
                        ? {
                            backgroundColor: 'var(--court-active-pill-bg)',
                            color: 'var(--court-active-pill-fg)',
                            borderColor: 'var(--court-active-pill-bg)',
                          }
                        : {
                            backgroundColor: 'var(--court-subtle)',
                            color: 'var(--court-ink-secondary)',
                            borderColor: 'var(--court-line)',
                          }
                    }
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Theme Override */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--court-muted)]">
              Display theme
            </h3>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { value: null, label: 'Device' },
                  { value: 'dark', label: 'Dark' },
                  { value: 'light', label: 'Light' },
                ] as const
              ).map((opt) => {
                const active = themeOverride === opt.value;
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => onSetThemeOverride(opt.value)}
                    className="py-1.5 rounded-lg text-xs font-semibold border transition-colors"
                    style={
                      active
                        ? {
                            backgroundColor: 'var(--court-active-pill-bg)',
                            color: 'var(--court-active-pill-fg)',
                            borderColor: 'var(--court-active-pill-bg)',
                          }
                        : {
                            backgroundColor: 'var(--court-subtle)',
                            color: 'var(--court-ink-secondary)',
                            borderColor: 'var(--court-line)',
                          }
                    }
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Copyable Display URL */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--court-muted)]">
              Shareable display URL
            </h3>
            <p className="text-[11px] text-[var(--court-muted)]">
              Open this link on any venue TV, tablet, or monitor to restore these exact visibility settings.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                aria-label="Shareable display URL"
                className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-[var(--court-subtle)] border border-[var(--court-line)] text-xs text-[var(--court-ink-secondary)] select-all"
              />
              <button
                type="button"
                onClick={handleCopyUrl}
                className="px-3 py-2 rounded-lg text-white text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--drone-blue-solid)' }}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="px-5 py-3.5 border-t border-[var(--court-line)] flex items-center justify-between gap-2 shrink-0 bg-[var(--court-subtle)]">
          <button
            type="button"
            onClick={onResetDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--court-line)] bg-[var(--court-surface)] hover:bg-[var(--court-control-hover)] text-xs font-semibold text-[var(--court-ink-secondary)] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset defaults</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90"
            style={{
              backgroundColor: 'var(--court-active-pill-bg)',
              color: 'var(--court-active-pill-fg)',
            }}
          >
            Done
          </button>
        </div>
      </aside>
    </div>
  );
};
