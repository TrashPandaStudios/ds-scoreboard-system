import React, { useState, useEffect, useRef } from 'react';
import { X, Check, UploadCloud, RefreshCw } from 'lucide-react';
import { TeamBadge } from '../common/TeamBadge';

interface TeamOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamRed: string;
  teamBlue: string;
  teamRedLogoUrl?: string | null;
  teamBlueLogoUrl?: string | null;
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
  teamRedLogoUrl,
  teamBlueLogoUrl,
  matchNumber,
  redScore,
  blueScore,
  redPenalties,
  bluePenalties,
  onSave,
}) => {
  const [formRed, setFormRed] = useState(teamRed);
  const [formBlue, setFormBlue] = useState(teamBlue);
  const [formRedLogo, setFormRedLogo] = useState<string | null | undefined>(teamRedLogoUrl);
  const [formBlueLogo, setFormBlueLogo] = useState<string | null | undefined>(teamBlueLogoUrl);
  const [isUploadingRed, setIsUploadingRed] = useState(false);
  const [isUploadingBlue, setIsUploadingBlue] = useState(false);

  const [formMatchNum, setFormMatchNum] = useState(matchNumber);
  const [formRedScore, setFormRedScore] = useState(redScore);
  const [formBlueScore, setFormBlueScore] = useState(blueScore);
  const [formRedPen, setFormRedPen] = useState(redPenalties);
  const [formBluePen, setFormBluePen] = useState(bluePenalties);

  const redFileInputRef = useRef<HTMLInputElement | null>(null);
  const blueFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setFormRed(teamRed);
    setFormBlue(teamBlue);
    setFormRedLogo(teamRedLogoUrl);
    setFormBlueLogo(teamBlueLogoUrl);
    setFormMatchNum(matchNumber);
    setFormRedScore(redScore);
    setFormBlueScore(blueScore);
    setFormRedPen(redPenalties);
    setFormBluePen(bluePenalties);
  }, [teamRed, teamBlue, teamRedLogoUrl, teamBlueLogoUrl, matchNumber, redScore, blueScore, redPenalties, bluePenalties]);

  if (!isOpen) return null;

  const handleUploadLogoByName = async (teamName: string, file: File, side: 'red' | 'blue') => {
    if (!file || !teamName.trim()) return;

    if (side === 'red') setIsUploadingRed(true);
    else setIsUploadingBlue(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', teamName.trim());

    try {
      const res = await fetch('/api/teams/by-name/logo', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (side === 'red') {
          setFormRedLogo(data.logoUrl);
        } else {
          setFormBlueLogo(data.logoUrl);
        }
      } else {
        alert('Failed to upload logo');
      }
    } catch (e) {
      console.error(e);
      alert('Network error uploading logo');
    } finally {
      if (side === 'red') setIsUploadingRed(false);
      else setIsUploadingBlue(false);
    }
  };

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Red Team Section */}
            <div className="p-4 rounded-2xl bg-red-950/30 border border-red-500/30 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-mono font-bold text-red-400">RED TEAM</label>
                <div className="flex items-center gap-2">
                  <TeamBadge teamName={formRed} logoUrl={formRedLogo} side="red" size="sm" />
                  <input
                    type="file"
                    ref={redFileInputRef}
                    className="hidden"
                    accept=".png,.jpg,.jpeg,.svg,.webp"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleUploadLogoByName(formRed, e.target.files[0], 'red');
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => redFileInputRef.current?.click()}
                    disabled={isUploadingRed}
                    title="Upload or replace Red Team logo"
                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-900/60 hover:bg-red-800 text-red-200 border border-red-500/40 flex items-center gap-1 cursor-pointer"
                  >
                    {isUploadingRed ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <UploadCloud className="w-3 h-3" />
                    )}
                    <span>Logo</span>
                  </button>
                </div>
              </div>

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
                    value={formRedPen}
                    onChange={(e) => setFormRedPen(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-center text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Blue Team Section */}
            <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/30 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-mono font-bold text-blue-400">BLUE TEAM</label>
                <div className="flex items-center gap-2">
                  <TeamBadge teamName={formBlue} logoUrl={formBlueLogo} side="blue" size="sm" />
                  <input
                    type="file"
                    ref={blueFileInputRef}
                    className="hidden"
                    accept=".png,.jpg,.jpeg,.svg,.webp"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleUploadLogoByName(formBlue, e.target.files[0], 'blue');
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => blueFileInputRef.current?.click()}
                    disabled={isUploadingBlue}
                    title="Upload or replace Blue Team logo"
                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-500/40 flex items-center gap-1 cursor-pointer"
                  >
                    {isUploadingBlue ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <UploadCloud className="w-3 h-3" />
                    )}
                    <span>Logo</span>
                  </button>
                </div>
              </div>

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
              className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-display font-bold text-sm flex items-center gap-2 shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
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
