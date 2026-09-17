import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

interface TeamOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamRed: string;
  teamBlue: string;
  matchNumber: string;
  redScore: number;
  blueScore: number;
  redPenalties: number;
  bluePenalties: number;
  onSave: (data: {
    teamRed: string;
    teamBlue: string;
    matchNumber: string;
    redScore: number;
    blueScore: number;
    redPenalties: number;
    bluePenalties: number;
  }) => void;
}

export const TeamOverrideModal: React.FC<TeamOverrideModalProps> = ({
  isOpen,
  onClose,
  teamRed,
  teamBlue,
  matchNumber,
  redScore,
  blueScore,
  redPenalties,
  bluePenalties,
  onSave,
}) => {
  const [formRed, setFormRed] = useState(teamRed);
  const [formBlue, setFormBlue] = useState(teamBlue);
  const [formMatchNum, setFormMatchNum] = useState(matchNumber);
  const [formRedScore, setFormRedScore] = useState(redScore);
  const [formBlueScore, setFormBlueScore] = useState(blueScore);
  const [formRedPen, setFormRedPen] = useState(redPenalties);
  const [formBluePen, setFormBluePen] = useState(bluePenalties);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      teamRed: formRed,
      teamBlue: formBlue,
      matchNumber: formMatchNum,
      redScore: Number(formRedScore),
      blueScore: Number(formBlueScore),
      redPenalties: Number(formRedPen),
      bluePenalties: Number(formBluePen),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border-2 border-slate-700 shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-display font-black text-white mb-1">
          Referee Override &amp; Team Details
        </h2>
        <p className="text-xs font-mono text-slate-400 mb-6">
          Hotkeys are automatically disabled while modifying these fields.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">MATCH NUMBER</label>
            <input
              type="text"
              value={formMatchNum}
              onChange={(e) => setFormMatchNum(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Red Team Name & Score Override */}
            <div className="p-4 rounded-2xl bg-red-950/30 border border-red-500/30 flex flex-col gap-3">
              <label className="block text-xs font-mono font-bold text-red-400">RED TEAM NAME</label>
              <input
                type="text"
                value={formRed}
                onChange={(e) => setFormRed(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-red-500/40 text-white text-sm focus:border-red-400 focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400">EXACT SCORE</label>
                  <input
                    type="number"
                    min="0"
                    value={formRedScore}
                    onChange={(e) => setFormRedScore(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-center text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400">PENALTIES</label>
                  <input
                    type="number"
                    min="0"
                    max="3"
                    value={formRedPen}
                    onChange={(e) => setFormRedPen(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-center text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Blue Team Name & Score Override */}
            <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/30 flex flex-col gap-3">
              <label className="block text-xs font-mono font-bold text-blue-400">BLUE TEAM NAME</label>
              <input
                type="text"
                value={formBlue}
                onChange={(e) => setFormBlue(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-blue-500/40 text-white text-sm focus:border-blue-400 focus:outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400">EXACT SCORE</label>
                  <input
                    type="number"
                    min="0"
                    value={formBlueScore}
                    onChange={(e) => setFormBlueScore(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-center text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400">PENALTIES</label>
                  <input
                    type="number"
                    min="0"
                    max="3"
                    value={formBluePen}
                    onChange={(e) => setFormBluePen(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-center text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs font-bold transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-display font-bold text-sm flex items-center gap-2 shadow-lg shadow-cyan-600/30 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>APPLY OVERRIDES</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
