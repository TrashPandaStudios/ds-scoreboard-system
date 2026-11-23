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
  }, [
    teamRed,
    teamBlue,
    teamRedLogoUrl,
    teamBlueLogoUrl,
    matchNumber,
    redScore,
    blueScore,
    redPenalties,
    bluePenalties,
  ]);

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
        if (side === 'red') setFormRedLogo(data.logoUrl);
        else setFormBlueLogo(data.logoUrl);
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ backgroundColor: 'var(--court-overlay-backdrop)' }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-[var(--court-surface)] border border-[var(--court-line)] shadow-2xl p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-[var(--court-muted)] hover:text-[var(--court-ink)] hover:bg-[var(--court-control-bg)]"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-[var(--court-ink)] mb-1 pr-8">Manual overrides</h2>
        <p className="text-xs text-[var(--court-muted)] mb-5">
          Hotkeys are disabled while editing these fields.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--court-ink-secondary)] mb-1">
              Match number
            </label>
            <input
              type="text"
              value={formMatchNum}
              onChange={(e) => setFormMatchNum(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-[var(--court-subtle)] border border-[var(--court-line)] text-[var(--court-ink)] text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Red Team */}
            <div
              className="p-4 rounded-xl border flex flex-col gap-3"
              style={{ backgroundColor: 'var(--drone-red-tint)', borderColor: 'var(--drone-red-border)' }}
            >
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold" style={{ color: 'var(--drone-red-text)' }}>
                  Red team
                </label>
                <div className="flex items-center gap-1.5">
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
                    className="text-[11px] font-semibold px-2 py-1 rounded-md bg-[var(--court-surface)] border border-[var(--court-line)] text-[var(--court-ink)] inline-flex items-center gap-1"
                  >
                    {isUploadingRed ? <RefreshCw className="w-3 h-3 animate-spin" /> : <UploadCloud className="w-3 h-3" />}
                    <span>Logo</span>
                  </button>
                </div>
              </div>

              <input
                type="text"
                value={formRed}
                onChange={(e) => setFormRed(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--court-surface)] border border-[var(--court-line)] text-[var(--court-ink)] text-sm"
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-[var(--court-muted)] mb-1">Score</label>
                  <input
                    type="number"
                    min="0"
                    value={formRedScore}
                    onChange={(e) => setFormRedScore(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--court-surface)] border border-[var(--court-line)] text-[var(--court-ink)] text-center text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[var(--court-muted)] mb-1">Penalties</label>
                  <input
                    type="number"
                    min="0"
                    value={formRedPen}
                    onChange={(e) => setFormRedPen(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--court-surface)] border border-[var(--court-line)] text-[var(--court-ink)] text-center text-sm tabular-nums"
                  />
                </div>
              </div>
            </div>

            {/* Blue Team */}
            <div
              className="p-4 rounded-xl border flex flex-col gap-3"
              style={{ backgroundColor: 'var(--drone-blue-tint)', borderColor: 'var(--drone-blue-border)' }}
            >
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold" style={{ color: 'var(--drone-blue-text)' }}>
                  Blue team
                </label>
                <div className="flex items-center gap-1.5">
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
                    className="text-[11px] font-semibold px-2 py-1 rounded-md bg-[var(--court-surface)] border border-[var(--court-line)] text-[var(--court-ink)] inline-flex items-center gap-1"
                  >
                    {isUploadingBlue ? <RefreshCw className="w-3 h-3 animate-spin" /> : <UploadCloud className="w-3 h-3" />}
                    <span>Logo</span>
                  </button>
                </div>
              </div>

              <input
                type="text"
                value={formBlue}
                onChange={(e) => setFormBlue(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--court-surface)] border border-[var(--court-line)] text-[var(--court-ink)] text-sm"
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-[var(--court-muted)] mb-1">Score</label>
                  <input
                    type="number"
                    min="0"
                    value={formBlueScore}
                    onChange={(e) => setFormBlueScore(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--court-surface)] border border-[var(--court-line)] text-[var(--court-ink)] text-center text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[var(--court-muted)] mb-1">Penalties</label>
                  <input
                    type="number"
                    min="0"
                    value={formBluePen}
                    onChange={(e) => setFormBluePen(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--court-surface)] border border-[var(--court-line)] text-[var(--court-ink)] text-center text-sm tabular-nums"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--court-line-soft)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-[var(--court-ink-secondary)] text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-white text-xs font-semibold inline-flex items-center gap-1.5"
              style={{ backgroundColor: 'var(--drone-blue-solid)' }}
            >
              <Check className="w-4 h-4" />
              <span>Apply overrides</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
