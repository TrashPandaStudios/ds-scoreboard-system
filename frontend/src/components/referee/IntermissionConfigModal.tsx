import React, { useState, useEffect } from 'react';
import { Coffee, Clock, Check, X, Play, RotateCcw } from 'lucide-react';

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
  { label: '45 SEC', seconds: 45 },
  { label: '60 SEC (1 MIN)', seconds: 60 },
  { label: '90 SEC (1.5 MIN)', seconds: 90 },
  { label: '120 SEC (2 MIN)', seconds: 120 },
  { label: '180 SEC (3 MIN)', seconds: 180 },
  { label: '300 SEC (5 MIN)', seconds: 300 },
];

export const IntermissionConfigModal: React.FC<IntermissionConfigModalProps> = ({
  isOpen,
  onClose,
  arenaId,
  arenaName,
  currentDurationMs,
  isIntermissionActive = false,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn select-none">
      <div className="relative w-full max-w-lg p-6 lg:p-8 rounded-3xl bg-slate-900/95 border-2 border-slate-700/80 shadow-2xl flex flex-col gap-6 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md shadow-amber-500/10">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold tracking-widest text-amber-400 uppercase block">
                REFEREE ARENA CONFIGURATION
              </span>
              <h2 className="text-xl font-display font-black text-white">
                Intermission Break Time — {arenaName}
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

        {/* Current & Target Duration Display */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
          <div className="flex flex-col">
            <span className="text-xs font-mono text-slate-400">Current Arena Setting:</span>
            <span className="text-sm font-mono font-bold text-slate-200">
              {currentTotalSeconds}s ({formatDisplayTime(currentTotalSeconds)})
            </span>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono text-amber-400">Selected Break Duration:</span>
            <div className="text-2xl font-mono font-black text-amber-300 tabular-nums">
              {formatDisplayTime(selectedSeconds)}{' '}
              <span className="text-xs text-slate-400 font-normal">({selectedSeconds}s)</span>
            </div>
          </div>
        </div>

        {/* Presets Grid */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-mono text-slate-400 uppercase font-bold tracking-wider">
            Quick Duration Presets:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {PRESETS.map((preset) => {
              const isSelected = selectedSeconds === preset.seconds;
              return (
                <button
                  key={preset.seconds}
                  type="button"
                  onClick={() => handleSelectPreset(preset.seconds)}
                  className={`py-3 px-3 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-1.5 border transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/80'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 opacity-70" />
                  <span>{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Input */}
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
          <span className="text-xs font-mono text-slate-400 uppercase font-bold tracking-wider">
            Custom Intermission Time:
          </span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-2 rounded-xl border border-slate-700 focus-within:border-amber-500">
              <input
                type="number"
                min="0"
                max="59"
                value={customMin}
                onChange={(e) => handleCustomChange(e.target.value, customSec)}
                className="w-12 bg-transparent text-center font-mono font-bold text-sm text-white focus:outline-none"
                placeholder="0"
              />
              <span className="text-slate-500 font-mono font-bold">m</span>
              <span className="text-slate-600 font-bold">:</span>
              <input
                type="number"
                min="0"
                max="59"
                value={customSec}
                onChange={(e) => handleCustomChange(customMin, e.target.value)}
                className="w-12 bg-transparent text-center font-mono font-bold text-sm text-white focus:outline-none"
                placeholder="00"
              />
              <span className="text-slate-500 font-mono font-bold">s</span>
            </div>
            <span className="text-xs font-mono text-slate-500">
              Applies to upcoming set transitions &amp; break phases
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
          {onStartIntermission && (
            <button
              type="button"
              onClick={() => {
                onSaveDuration(selectedSeconds * 1000);
                onStartIntermission();
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold flex items-center gap-2 transition-all active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>SAVE &amp; START BREAK NOW</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold transition-colors"
            >
              CANCEL
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-mono font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>APPLY SETTING</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
