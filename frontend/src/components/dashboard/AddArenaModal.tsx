import React, { useState, useEffect } from 'react';
import { PlusCircle, Clock, X, Check, Shield, AlertTriangle } from 'lucide-react';

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
      setErrorMessage('Please enter a valid match set duration.');
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
          durationMs: durationMs,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to create arena (HTTP ${res.status})`);
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border-2 border-slate-700 shadow-2xl p-6 lg:p-8 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <PlusCircle className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-widest block">
              SYSTEM EXPANSION
            </span>
            <h2 className="text-xl font-display font-black text-white">Deploy New Drone Arena</h2>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-600/50 text-rose-200 text-xs font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Cage Name Input */}
          <div>
            <label className="block text-xs font-mono text-slate-300 font-bold mb-1.5 uppercase">
              Arena Name / Flight Cage Identifier
            </label>
            <input
              type="text"
              required
              value={arenaName}
              onChange={(e) => setArenaName(e.target.value)}
              placeholder="e.g. Arena 4 - Delta Cage"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            />
            <span className="text-[11px] font-mono text-slate-500 mt-1 block">
              Will be automatically assigned unique ID #{nextArenaId} and instant WebSocket broadcast topics.
            </span>
          </div>

          {/* Set Duration Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono text-slate-300 font-bold uppercase flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Default Set Duration</span>
              </label>
              <span className="text-xs font-mono text-cyan-400 font-bold">
                {Math.floor(durationSeconds / 60)}:{(durationSeconds % 60).toString().padStart(2, '0')} ({durationSeconds}s)
              </span>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-2 gap-2 mb-2.5">
              {DURATION_PRESETS.map((preset) => (
                <button
                  key={preset.seconds}
                  type="button"
                  onClick={() => {
                    setDurationSeconds(preset.seconds);
                    setCustomDurationInput(preset.seconds.toString());
                    setIsCustomDuration(false);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-mono font-bold border transition-all ${
                    !isCustomDuration && durationSeconds === preset.seconds
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom duration toggle */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCustomDuration(!isCustomDuration)}
                className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg border transition-all ${
                  isCustomDuration
                    ? 'bg-purple-600/30 text-purple-300 border-purple-500/50'
                    : 'text-slate-500 hover:text-slate-300 border-transparent'
                }`}
              >
                Custom seconds...
              </button>

              {isCustomDuration && (
                <div className="flex items-center gap-2 flex-1">
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
                    className="w-24 px-2.5 py-1 rounded-lg bg-slate-950 border border-purple-500/40 text-xs font-mono text-purple-300 focus:outline-none"
                  />
                  <span className="text-xs font-mono text-slate-400">sec</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Details Callout */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-400 text-xs font-mono flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p>
              Once deployed, this arena will immediately be accessible via dedicated Display, Referee, and OBS Overlay routes, and will synchronize at 10 Hz with the authoritative clock.
            </p>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-black flex items-center gap-2 shadow-lg shadow-cyan-600/30 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <span>INITIALIZING ENGINE...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>INITIALIZE ARENA #{nextArenaId}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
