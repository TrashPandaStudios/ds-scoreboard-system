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
      name: '🔴 Red Team Pilot Box HUD',
      path: `/arena/${currentArenaId}/display/red`,
      tag: 'Coach & Pilot Monitor',
      description: 'Dedicated high-contrast HUD for Red Team bench with live score, striker role, penalties, and sync clock.',
    },
    {
      id: 'monitor-blue',
      name: '🔵 Blue Team Pilot Box HUD',
      path: `/arena/${currentArenaId}/display/blue`,
      tag: 'Coach & Pilot Monitor',
      description: 'Dedicated high-contrast HUD for Blue Team bench with live score, striker role, penalties, and sync clock.',
    },
    {
      id: 'monitor-timer',
      name: '⏱️ Dedicated Stadium Jumbotron Clock',
      path: `/arena/${currentArenaId}/display/timer`,
      tag: 'Central LED Wall / Clock',
      description: 'Massive full-screen 10Hz authoritative match timer, animated phase alerts, and buzzer horn sync.',
    },
    {
      id: 'monitor-split',
      name: '👥 Split Red / Blue Telemetry Monitor',
      path: `/arena/${currentArenaId}/display/split`,
      tag: 'Dual Pit / Analyst TV',
      description: 'High-visibility side-by-side profile showing both teams, set scores, striker status, and match clock.',
    },
    {
      id: 'monitor-crowd',
      name: '📺 Main Stadium Crowd Scoreboard',
      path: `/arena/${currentArenaId}/display`,
      tag: 'Spectator Display',
      description: 'Complete crowd scoreboard with set tracking, hazard shootout banner, side-swap, and sponsor carousel.',
    },
  ];

  const overlays = [
    {
      id: 'lower-third',
      name: 'Esports Lower-Third Broadcast Bar',
      path: `/arena/${currentArenaId}/overlay/lower-third`,
      resolution: '1920 x 1080 (Custom CSS: transparent)',
      icon: Layers,
      description: 'Sleek broadcast HUD positioned at the bottom of the stream with live scores, penalties, sets, and clock.',
    },
    {
      id: 'top-bar',
      name: 'Esports Top-Bar Broadcast Bar',
      path: `/arena/${currentArenaId}/overlay/top-bar`,
      resolution: '1920 x 1080 (Custom CSS: transparent)',
      icon: Tv,
      description: 'Sleek broadcast HUD positioned at the top of the stream with live scores, penalties, sets, and clock.',
    },
    {
      id: 'penalty-alert',
      name: 'Dynamic Penalty Hazard Alert',
      path: `/arena/${currentArenaId}/overlay/penalty-alert`,
      resolution: '1920 x 1080',
      icon: AlertTriangle,
      description: 'High-visibility broadcast alert banner that automatically appears during active penalty shootout phases.',
    },
  ];

  const handleCopy = (key: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border-2 border-slate-700 shadow-2xl p-6 lg:p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pr-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
              <Layers className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-display font-black text-white">
                Arena {currentArenaId} Display &amp; Broadcast Hub
              </h2>
              <p className="text-xs font-mono text-cyan-400">DEDICATED MULTI-MONITOR OUTPUTS &amp; OBS FEEDS</p>
            </div>
          </div>

          {arenas && arenas.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">Switch Cage:</span>
              <select
                value={currentArenaId}
                onChange={(e) => {
                  const newId = Number(e.target.value);
                  setSelectedArenaId(newId);
                  onSelectArena?.(newId);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
              >
                {arenas.map((a) => (
                  <option key={a.arenaId} value={a.arenaId}>
                    {a.arenaName} (#{a.arenaId})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 p-1 rounded-2xl bg-slate-950 border border-slate-800 mb-6">
          <button
            onClick={() => setActiveTab('monitors')}
            className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
              activeTab === 'monitors'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🖥️ Dedicated Stadium &amp; Team Monitors ({dedicatedMonitors.length})
          </button>
          <button
            onClick={() => setActiveTab('obs')}
            className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
              activeTab === 'obs'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📡 OBS / vMix Overlays ({overlays.length})
          </button>
        </div>

        <div className="flex flex-col gap-3 max-h-[440px] overflow-y-auto pr-1">
          {activeTab === 'monitors'
            ? dedicatedMonitors.map((mon) => {
                const fullUrl = `${origin}${mon.path}`;
                const isCopied = copiedKey === mon.id;

                return (
                  <div
                    key={mon.id}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-2 hover:border-cyan-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-sm text-white">{mon.name}</span>
                      <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                        {mon.tag}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400">{mon.description}</p>

                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        readOnly
                        value={fullUrl}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 select-all"
                      />
                      <button
                        onClick={() => handleCopy(mon.id, fullUrl)}
                        className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
                      >
                        {isCopied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                        <span>{isCopied ? 'COPIED' : 'COPY'}</span>
                      </button>
                      <a
                        href={mon.path}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                        title="Open in new window"
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
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-2 hover:border-purple-500/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-purple-400" />
                        <span className="font-display font-bold text-sm text-white">{ov.name}</span>
                      </div>
                      <span className="text-[11px] font-mono text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800">
                        {ov.resolution}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400">{ov.description}</p>

                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        readOnly
                        value={fullUrl}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 select-all"
                      />
                      <button
                        onClick={() => handleCopy(ov.id, fullUrl)}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
                      >
                        {isCopied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                        <span>{isCopied ? 'COPIED' : 'COPY'}</span>
                      </button>
                      <a
                        href={ov.path}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                        title="Preview in new tab"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                );
              })}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-bold transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
