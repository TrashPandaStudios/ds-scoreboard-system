import React, { useState, useEffect } from 'react';
import { X, Copy, Check, ExternalLink, Layers, Tv, AlertTriangle } from 'lucide-react';
import { ArenaSummary } from '../../types/scoreboard';

interface ObsLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  arenaId: number;
  arenas?: ArenaSummary[];
  onSelectArena?: (id: number) => void;
}

export const ObsLinksModal: React.FC<ObsLinksModalProps> = ({
  isOpen,
  onClose,
  arenaId,
  arenas,
  onSelectArena,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'monitors' | 'obs'>('monitors');
  const [selectedArenaId, setSelectedArenaId] = useState<number>(arenaId);

  useEffect(() => {
    setSelectedArenaId(arenaId);
  }, [arenaId]);

  if (!isOpen) return null;

  const currentArenaId = selectedArenaId;
  const origin = window.location.origin;

  const dedicatedMonitors = [
    {
      id: 'monitor-red',
      name: 'Red Team Pilot Box HUD',
      path: `/arena/${currentArenaId}/display/red`,
      tag: 'Pilot monitor',
      description: 'Dedicated high-contrast HUD for Red Team bench with live score, penalties, and sync clock.',
    },
    {
      id: 'monitor-blue',
      name: 'Blue Team Pilot Box HUD',
      path: `/arena/${currentArenaId}/display/blue`,
      tag: 'Pilot monitor',
      description: 'Dedicated high-contrast HUD for Blue Team bench with live score, penalties, and sync clock.',
    },
    {
      id: 'monitor-timer',
      name: 'Dedicated Stadium Clock',
      path: `/arena/${currentArenaId}/display/timer`,
      tag: 'Central LED wall',
      description: 'Full-screen authoritative match timer, phase alerts, and synchronized buzzer flash.',
    },
    {
      id: 'monitor-split',
      name: 'Split Red / Blue Telemetry Monitor',
      path: `/arena/${currentArenaId}/display/split`,
      tag: 'Dual pit TV',
      description: 'Side-by-side layout showing both teams, set scores, penalties, and live clock.',
    },
    {
      id: 'monitor-crowd',
      name: 'Main Stadium Crowd Scoreboard',
      path: `/arena/${currentArenaId}/display`,
      tag: 'Spectator display',
      description: 'Full crowd scoreboard with set tracking, phase alerts, side-swap, and sponsor carousel.',
    },
  ];

  const overlays = [
    {
      id: 'lower-third',
      name: 'Lower-Third Broadcast Bar',
      path: `/arena/${currentArenaId}/overlay/lower-third`,
      resolution: '1920 × 1080 transparent',
      icon: Layers,
      description: 'Bottom stream overlay with live scores, penalties, sets, and authoritative clock.',
    },
    {
      id: 'top-bar',
      name: 'Top-Bar Broadcast Bar',
      path: `/arena/${currentArenaId}/overlay/top-bar`,
      resolution: '1920 × 1080 transparent',
      icon: Tv,
      description: 'Top stream overlay mirroring the lower-third score bar.',
    },
    {
      id: 'penalty-alert',
      name: 'Penalty Shootout Alert',
      path: `/arena/${currentArenaId}/overlay/penalty-alert`,
      resolution: '1920 × 1080 transparent',
      icon: AlertTriangle,
      description: 'Transparent broadcast alert banner that appears automatically during penalty shootouts.',
    },
  ];

  const handleCopy = (key: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ backgroundColor: 'var(--court-overlay-backdrop)' }}
    >
      <div className="w-full max-w-2xl rounded-2xl bg-[var(--court-surface)] border border-[var(--court-line)] shadow-2xl p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-[var(--court-muted)] hover:text-[var(--court-ink)] hover:bg-[var(--court-control-bg)]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pr-10">
          <div>
            <h2 className="text-xl font-bold text-[var(--court-ink)]">
              Cage {currentArenaId} displays &amp; OBS links
            </h2>
            <p className="text-xs text-[var(--court-muted)] mt-0.5">
              Copy URLs for stadium monitors or OBS Browser Sources.
            </p>
          </div>

          {arenas && arenas.length > 1 && (
            <select
              value={currentArenaId}
              onChange={(e) => {
                const newId = Number(e.target.value);
                setSelectedArenaId(newId);
                onSelectArena?.(newId);
              }}
              className="px-3 py-1.5 rounded-lg bg-[var(--court-subtle)] border border-[var(--court-line)] text-xs font-semibold text-[var(--court-ink)]"
            >
              {arenas.map((a) => (
                <option key={a.arenaId} value={a.arenaId}>
                  {a.arenaName} (#{a.arenaId})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1.5 p-1 rounded-xl bg-[var(--court-subtle)] border border-[var(--court-line-soft)] mb-5">
          <button
            type="button"
            onClick={() => setActiveTab('monitors')}
            className="flex-1 py-2 rounded-lg text-xs font-semibold transition-colors"
            style={
              activeTab === 'monitors'
                ? {
                    backgroundColor: 'var(--court-active-pill-bg)',
                    color: 'var(--court-active-pill-fg)',
                  }
                : { color: 'var(--court-muted)' }
            }
          >
            Stadium &amp; team monitors ({dedicatedMonitors.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('obs')}
            className="flex-1 py-2 rounded-lg text-xs font-semibold transition-colors"
            style={
              activeTab === 'obs'
                ? {
                    backgroundColor: 'var(--court-active-pill-bg)',
                    color: 'var(--court-active-pill-fg)',
                  }
                : { color: 'var(--court-muted)' }
            }
          >
            OBS / vMix overlays ({overlays.length})
          </button>
        </div>

        <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
          {activeTab === 'monitors'
            ? dedicatedMonitors.map((mon) => {
                const fullUrl = `${origin}${mon.path}`;
                const isCopied = copiedKey === mon.id;

                return (
                  <div
                    key={mon.id}
                    className="p-3.5 rounded-xl bg-[var(--court-subtle)] border border-[var(--court-line-soft)] flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-[var(--court-ink)]">{mon.name}</span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[var(--court-control-bg)] text-[var(--court-muted)]">
                        {mon.tag}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--court-muted)]">{mon.description}</p>

                    <div className="flex items-center gap-2 mt-0.5">
                      <input
                        type="text"
                        readOnly
                        value={fullUrl}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--court-surface)] border border-[var(--court-line)] text-xs text-[var(--court-ink-secondary)] select-all"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopy(mon.id, fullUrl)}
                        className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold inline-flex items-center gap-1.5"
                        style={{ backgroundColor: 'var(--drone-blue-solid)' }}
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'Copied' : 'Copy'}</span>
                      </button>
                      <a
                        href={mon.path}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-[var(--court-ink-secondary)] border border-[var(--court-line)]"
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                );
              })
            : overlays.map((ov) => {
                const fullUrl = `${origin}${ov.path}`;
                const Icon = ov.icon;
                const isCopied = copiedKey === ov.id;

                return (
                  <div
                    key={ov.id}
                    className="p-3.5 rounded-xl bg-[var(--court-subtle)] border border-[var(--court-line-soft)] flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" style={{ color: 'var(--signal-intermission)' }} />
                        <span className="font-bold text-sm text-[var(--court-ink)]">{ov.name}</span>
                      </div>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[var(--court-control-bg)] text-[var(--court-muted)]">
                        {ov.resolution}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--court-muted)]">{ov.description}</p>

                    <div className="flex items-center gap-2 mt-0.5">
                      <input
                        type="text"
                        readOnly
                        value={fullUrl}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--court-surface)] border border-[var(--court-line)] text-xs text-[var(--court-ink-secondary)] select-all"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopy(ov.id, fullUrl)}
                        className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold inline-flex items-center gap-1.5"
                        style={{ backgroundColor: 'var(--drone-blue-solid)' }}
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'Copied' : 'Copy'}</span>
                      </button>
                      <a
                        href={ov.path}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-[var(--court-ink-secondary)] border border-[var(--court-line)]"
                        title="Preview in new tab"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                );
              })}
        </div>

        <div className="mt-5 pt-4 border-t border-[var(--court-line-soft)] flex justify-end">
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
