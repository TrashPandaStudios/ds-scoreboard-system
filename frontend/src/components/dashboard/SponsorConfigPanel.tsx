import React, { useState } from 'react';
import { SponsorItem } from '../../types/scoreboard';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';

interface SponsorConfigPanelProps {
  sponsors: SponsorItem[];
  onCreateSponsor: (sponsor: Partial<SponsorItem>) => void;
  onUpdateSponsor: (id: number, sponsor: Partial<SponsorItem>) => void;
  onDeleteSponsor: (id: number) => void;
}

export const SponsorConfigPanel: React.FC<SponsorConfigPanelProps> = ({
  sponsors,
  onCreateSponsor,
  onUpdateSponsor,
  onDeleteSponsor,
}) => {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [tagline, setTagline] = useState('');
  const [duration, setDuration] = useState(8);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !logoUrl) return;

    onCreateSponsor({
      name,
      logoUrl,
      tagline,
      displayDurationSec: duration,
      active: true,
      orderIndex: sponsors.length,
    });

    setName('');
    setLogoUrl('');
    setTagline('');
    setShowAdd(false);
  };

  return (
    <div className="flex flex-col rounded-2xl bg-[var(--court-surface)] border border-[var(--court-line)] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-[var(--court-subtle)] border-b border-[var(--court-line-soft)] flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[var(--court-ink)]">Sponsors &amp; intermission banners</h3>
          <span className="text-xs text-[var(--court-muted)]">
            Active sponsors rotate during stadium intermissions and appear on the public portal.
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-opacity hover:opacity-90"
          style={{
            backgroundColor: 'var(--court-active-pill-bg)',
            color: 'var(--court-active-pill-fg)',
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAdd ? 'Cancel' : 'Add sponsor'}</span>
        </button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="p-5 bg-[var(--court-subtle)] border-b border-[var(--court-line-soft)] flex flex-col gap-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--court-muted)] mb-1">Sponsor name</label>
              <input
                type="text"
                required
                placeholder="e.g. SkyGrid Robotics"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--court-surface)] border border-[var(--court-line)] text-xs text-[var(--court-ink)]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--court-muted)] mb-1">Logo image URL</label>
              <input
                type="url"
                required
                placeholder="https://..."
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--court-surface)] border border-[var(--court-line)] text-xs text-[var(--court-ink)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[var(--court-muted)] mb-1">Tagline</label>
              <input
                type="text"
                placeholder="e.g. Official Drone Soccer Spheres"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--court-surface)] border border-[var(--court-line)] text-xs text-[var(--court-ink)]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--court-muted)] mb-1">
                Slide duration (sec)
              </label>
              <input
                type="number"
                min="3"
                max="60"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value, 10) || 8)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--court-surface)] border border-[var(--court-line)] text-xs text-[var(--court-ink)] text-center tabular-nums"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-white text-xs font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--drone-blue-solid)' }}
            >
              Save partner
            </button>
          </div>
        </form>
      )}

      {/* Sponsors List */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        {sponsors.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--court-subtle)] border border-[var(--court-line-soft)]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-lg bg-[var(--court-surface)] border border-[var(--court-line)] p-1.5 flex items-center justify-center overflow-hidden shrink-0">
                <img src={item.logoUrl} alt={item.name} className="max-h-full max-w-full object-contain" />
              </div>
              <div className="min-w-0">
                <span className="text-sm font-bold text-[var(--court-ink)] block truncate">{item.name}</span>
                <span className="text-xs text-[var(--court-muted)] block tabular-nums">
                  {item.displayDurationSec}s slide
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onUpdateSponsor(item.id, { active: !item.active })}
                className="p-2 rounded-lg border transition-colors"
                style={
                  item.active
                    ? {
                        backgroundColor: 'var(--signal-live-tint)',
                        borderColor: 'var(--signal-live-border)',
                        color: 'var(--signal-live-text)',
                      }
                    : {
                        backgroundColor: 'var(--court-control-bg)',
                        borderColor: 'var(--court-line)',
                        color: 'var(--court-muted)',
                      }
                }
                title={item.active ? 'Visible on displays' : 'Hidden from displays'}
              >
                {item.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => onDeleteSponsor(item.id)}
                className="p-2 rounded-lg bg-[var(--court-control-bg)] hover:bg-[var(--drone-red-tint)] text-[var(--court-muted)] hover:text-[var(--drone-red-text)] border border-[var(--court-line)] transition-colors"
                title="Remove sponsor"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {sponsors.length === 0 && (
          <div className="col-span-full py-8 text-center text-xs text-[var(--court-muted)]">
            No sponsors configured yet.
          </div>
        )}
      </div>
    </div>
  );
};
