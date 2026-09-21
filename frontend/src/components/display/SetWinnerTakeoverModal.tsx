import React from 'react';
import { SetWinnerBanner } from '../../types/scoreboard';
import { TeamBadge } from '../common/TeamBadge';
import { Trophy, Sparkles, Award, Flame } from 'lucide-react';

interface SetWinnerTakeoverModalProps {
  banner: SetWinnerBanner;
}

export const SetWinnerTakeoverModal: React.FC<SetWinnerTakeoverModalProps> = ({ banner }) => {
  if (!banner || !banner.active) return null;

  const isRed = banner.winner === 'RED';
  const isBlue = banner.winner === 'BLUE';
  const isTie = banner.winner === 'TIE';
  const setsNeededToWin = Math.floor((banner.maxSets || 3) / 2) + 1;
  const isMatchWinner =
    Boolean(banner.isMatchWinner) ||
    Boolean(banner.matchWinner) ||
    banner.setsWon >= setsNeededToWin ||
    banner.redSetScore >= setsNeededToWin ||
    banner.blueSetScore >= setsNeededToWin;

  // Primary team accent color styles
  const teamTheme = isRed
    ? {
      border: 'border-red-500/80',
      glow: 'shadow-[0_0_90px_rgba(239,68,68,0.45)]',
      bgGradient: 'from-red-950/90 via-slate-950/95 to-slate-950/95',
      badgeBg: 'bg-red-500/20 text-red-400 border-red-500/40',
      accentText: 'text-red-400',
      highlightGrad: 'from-red-500 to-rose-400',
    }
    : isBlue
      ? {
        border: 'border-blue-500/80',
        glow: 'shadow-[0_0_90px_rgba(59,130,246,0.45)]',
        bgGradient: 'from-blue-950/90 via-slate-950/95 to-slate-950/95',
        badgeBg: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
        accentText: 'text-blue-400',
        highlightGrad: 'from-blue-500 to-cyan-400',
      }
      : {
        border: 'border-amber-500/80',
        glow: 'shadow-[0_0_90px_rgba(245,158,11,0.35)]',
        bgGradient: 'from-amber-950/90 via-slate-950/95 to-slate-950/95',
        badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
        accentText: 'text-amber-400',
        highlightGrad: 'from-amber-500 to-yellow-400',
      };

  const otherSetsWon = isRed ? banner.blueSetScore : banner.redSetScore;
  const isTiedSeries = banner.redSetScore === banner.blueSetScore;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/85 backdrop-blur-xl animate-in fade-in duration-300 select-none">
      {/* Dynamic ambient pulsing glow background */}
      <div
        className={`absolute inset-0 pointer-events-none opacity-30 ${isMatchWinner ? 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/30 via-slate-950/0 to-transparent animate-pulse' : ''
          }`}
      />

      <div
        className={`relative w-full max-w-3xl rounded-3xl border-2 ${teamTheme.border} ${teamTheme.glow} bg-gradient-to-b ${teamTheme.bgGradient} p-6 sm:p-10 flex flex-col items-center text-center overflow-hidden`}
      >
        {/* Top Decorative Sparkles */}
        <div className="flex items-center gap-2 mb-3">
          {isMatchWinner ? (
            <>
              <Sparkles className="w-6 h-6 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span className="text-xs sm:text-sm font-mono tracking-widest text-amber-400 font-extrabold uppercase bg-amber-950/80 px-4 py-1 rounded-full border border-amber-500/50 shadow-lg shadow-amber-500/20">
                ★ OFFICIAL MATCH CHAMPION ★
              </span>
              <Sparkles className="w-6 h-6 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
            </>
          ) : (
            <>
              <Award className="w-5 h-5 text-cyan-400" />
              <span className="text-xs sm:text-sm font-mono tracking-widest text-cyan-300 font-bold uppercase bg-slate-900/80 px-4 py-1 rounded-full border border-slate-700">
                SET {banner.currentSet} CONCLUDED
              </span>
              <Award className="w-5 h-5 text-cyan-400" />
            </>
          )}
        </div>

        {/* Big Celebration Title */}
        <div className="mb-4">
          {isMatchWinner ? (
            <h1 className="text-4xl sm:text-6xl font-display font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 drop-shadow-[0_4px_16px_rgba(245,158,11,0.6)]">
              MATCH WINNER
            </h1>
          ) : (
            <h1 className="text-3xl sm:text-5xl font-display font-black tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              SET {banner.currentSet} WINNER
            </h1>
          )}
        </div>

        {/* Centerpiece: Winning Team Logo Badge & Name */}
        <div className="flex flex-col items-center gap-4 my-3 sm:my-5">
          <div
            className={`p-2 sm:p-3 rounded-full border-4 ${isMatchWinner ? 'border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.6)]' : teamTheme.border
              } bg-slate-950/80 transform hover:scale-105 transition-transform duration-300`}
          >
            <TeamBadge
              side={isRed ? 'red' : isBlue ? 'blue' : 'neutral'}
              teamName={banner.winnerName}
              logoUrl={banner.winnerLogoUrl}
              size="xl"
            />
          </div>

          <div className="flex flex-col items-center">
            <span
              className={`text-3xl sm:text-5xl font-display font-black tracking-tight ${isMatchWinner
                  ? 'text-white'
                  : isRed
                    ? 'text-red-400 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                    : 'text-blue-400 drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]'
                }`}
            >
              {banner.winnerName}
            </span>

            {isMatchWinner ? (
              <div className="mt-2 flex items-center gap-2 text-amber-300 font-mono font-bold text-sm sm:text-base bg-amber-950/60 px-4 py-1.5 rounded-xl border border-amber-600/40">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>VICTORY: {banner.setsWon} SETS TO {otherSetsWon}</span>
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-2 text-slate-300 font-mono text-sm sm:text-base">
                {isTiedSeries ? (
                  <span className="bg-slate-900/80 border border-slate-700 px-3 py-1 rounded-xl">
                    Series Tied <strong className="text-white">{banner.setsWon} - {otherSetsWon}</strong>
                  </span>
                ) : (
                  <span className="bg-slate-900/80 border border-slate-700 px-3 py-1 rounded-xl">
                    Leads Match <strong className={teamTheme.accentText}>{banner.setsWon} - {otherSetsWon}</strong> (Best of {banner.maxSets})
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sets Score Counter Bar */}
        <div className="w-full max-w-md bg-slate-950/80 border border-slate-800 rounded-2xl p-4 my-2 flex items-center justify-around shadow-inner">
          <div className="flex flex-col items-center">
            <span className="text-[10px] sm:text-xs font-mono text-red-400 font-bold uppercase tracking-wider">
              RED SETS
            </span>
            <span className="text-2xl sm:text-3xl font-display font-black text-white">
              {banner.redSetScore}
            </span>
          </div>

          <div className="h-8 w-px bg-slate-800" />

          <div className="flex flex-col items-center">
            <span className="text-[10px] sm:text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">
              TOTAL SETS
            </span>
            <span className="text-sm sm:text-base font-mono font-bold text-slate-300">
              {banner.currentSet} / {banner.maxSets}
            </span>
          </div>

          <div className="h-8 w-px bg-slate-800" />

          <div className="flex flex-col items-center">
            <span className="text-[10px] sm:text-xs font-mono text-blue-400 font-bold uppercase tracking-wider">
              BLUE SETS
            </span>
            <span className="text-2xl sm:text-3xl font-display font-black text-white">
              {banner.blueSetScore}
            </span>
          </div>
        </div>

        {/* Bottom Subtitle / Next Phase Indicator */}
        <div className="mt-4 flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>
            {isMatchWinner
              ? 'Match Concluded • Official Tournament Final'
              : 'Intermission Break Pending Referee Call'}
          </span>
        </div>
      </div>
    </div>
  );
};
