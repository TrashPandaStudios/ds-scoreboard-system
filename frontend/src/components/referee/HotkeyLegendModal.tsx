import React from 'react';
import { X, ShieldAlert } from 'lucide-react';

interface HotkeyLegendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HotkeyLegendModal: React.FC<HotkeyLegendModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const hotkeys = [
    { key: 'Space', desc: 'Start / pause match clock' },
    { key: 'W', desc: 'Blue score +1' },
    { key: 'S', desc: 'Blue score -1' },
    { key: 'E', desc: 'Blue penalty +1' },
    { key: 'D', desc: 'Blue penalty -1' },
    { key: '↑', desc: 'Red score +1' },
    { key: '↓', desc: 'Red score -1' },
    { key: 'Shift + ↑', desc: 'Red penalty +1' },
    { key: 'Shift + ↓', desc: 'Red penalty -1' },
    { key: 'B', desc: 'Trigger stadium / hardware buzzer' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ backgroundColor: 'var(--court-overlay-backdrop)' }}
    >
      <div className="w-full max-w-md rounded-2xl bg-[var(--court-surface)] border border-[var(--court-line)] shadow-2xl p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-[var(--court-muted)] hover:text-[var(--court-ink)] hover:bg-[var(--court-control-bg)]"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-[var(--court-ink)] mb-1 pr-8">Referee hotkeys</h2>
        <div
          className="flex items-center gap-2 mb-4 text-xs font-medium px-3 py-2 rounded-lg border"
          style={{
            backgroundColor: 'var(--signal-live-tint)',
            borderColor: 'var(--signal-live-border)',
            color: 'var(--signal-live-text)',
          }}
        >
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>Hotkeys pause automatically while typing in any input field.</span>
        </div>

        <div className="divide-y divide-[var(--court-line-soft)] rounded-xl border border-[var(--court-line-soft)] bg-[var(--court-subtle)] overflow-hidden">
          {hotkeys.map((h, i) => (
            <div key={i} className="flex items-center justify-between px-3.5 py-2.5">
              <span className="text-xs font-medium text-[var(--court-ink-secondary)]">{h.desc}</span>
              <kbd className="px-2 py-0.5 rounded-md bg-[var(--court-surface)] border border-[var(--court-line)] text-xs font-mono font-bold text-[var(--court-ink)]">
                {h.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-5 flex justify-end">
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
