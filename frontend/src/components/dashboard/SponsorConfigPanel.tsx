import React, { useState } from 'react';
import { SponsorItem } from '../../types/scoreboard';
import { Sparkles, Plus, Trash2, Eye, EyeOff } from 'lucide-react';

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
    <div className="flex flex-col gap-4 p-6 rounded-3xl bg-slate-900/90 border-2 border-slate-800 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-display font-bold text-white">Sponsor &amp; Partner Takeovers</h3>
        </div>

        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{showAdd ? 'CANCEL' : 'ADD SPONSOR'}</span>
        </button>
      </div>

      {/* Add Sponsor Form */}
      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 flex flex-col gap-3 animate-fadeIn"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono text-slate-400 mb-1">PARTNER / SPONSOR NAME</label>
              <input
                type="text"
                required
                placeholder="e.g. SkyGrid Robotics"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-400 mb-1">LOGO IMAGE URL</label>
              <input
                type="url"
                required
                placeholder="https://..."
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-mono text-slate-400 mb-1">TAGLINE / HIGHLIGHT</label>
              <input
                type="text"
                placeholder="e.g. Official Drone Soccer Spheres"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-400 mb-1">SLIDE DURATION (SEC)</label>
              <input
                type="number"
                min="3"
                max="60"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value, 10) || 8)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white text-center focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-1">
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-mono font-bold"
            >
              SAVE PARTNER
            </button>
          </div>
        </form>
      )}

      {/* Sponsors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sponsors.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 p-1 flex items-center justify-center overflow-hidden">
                <img src={item.logoUrl} alt={item.name} className="max-h-full max-w-full object-contain" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">{item.name}</span>
                <span className="text-[11px] font-mono text-slate-400 block">{item.displayDurationSec}s duration</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onUpdateSponsor(item.id, { active: !item.active })}
                className={`p-2 rounded-xl border transition-colors ${
                  item.active
                    ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
                    : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
                title={item.active ? 'Active on carousel' : 'Hidden from carousel'}
              >
                {item.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => onDeleteSponsor(item.id)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors"
                title="Remove sponsor"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
