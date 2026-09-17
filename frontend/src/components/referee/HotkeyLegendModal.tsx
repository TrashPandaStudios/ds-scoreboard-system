import React from 'react';
import { X, Keyboard, ShieldAlert } from 'lucide-react';

interface HotkeyLegendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HotkeyLegendModal: React.FC<HotkeyLegendModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const hotkeys = [
    { key: 'Space', desc: 'Start / Pause Match Clock', group: 'Timer' },
    { key: 'W', desc: 'Blue Score +1', group: 'Blue Team' },
    { key: 'S', desc: 'Blue Score -1', group: 'Blue Team' },
    { key: 'E', desc: 'Blue Penalty +1', group: 'Blue Team' },
    { key: 'D', desc: 'Blue Penalty -1', group: 'Blue Team' },
    { key: '↑ (Up Arrow)', desc: 'Red Score +1', group: 'Red Team' },
    { key: '↓ (Down Arrow)', desc: 'Red Score -1', group: 'Red Team' },
    { key: 'Shift + ↑', desc: 'Red Penalty +1', group: 'Red Team' },
    { key: 'Shift + ↓', desc: 'Red Penalty -1', group: 'Red Team' },
    { key: 'B', desc: 'Trigger Stadium / Hardware Buzzer', group: 'Buzzer' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border-2 border-slate-700 shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-1">
          <Keyboard className="w-5 h-5 text-cyan-400" />
          <h2 className="text-xl font-display font-black text-white">Referee Hotkey Legend</h2>
        </div>
        <div className="flex items-center gap-2 mb-5 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-800/60">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>Safety Active: Hotkeys automatically suppress when focused in any input field.</span>
        </div>

        <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
          {hotkeys.map((h, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800"
            >
              <span className="text-xs text-slate-300 font-medium">{h.desc}</span>
              <kbd className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-cyan-300 shadow-sm">
                {h.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
