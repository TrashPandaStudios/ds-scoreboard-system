import React from 'react';
import { MatchPhase } from '../../types/scoreboard';
import { AlertTriangle, Clock, PlayCircle, Coffee, CheckCircle2, Zap } from 'lucide-react';

interface PhaseAlertBannerProps {
  phase: MatchPhase;
  currentSet: number;
}

export const PhaseAlertBanner: React.FC<PhaseAlertBannerProps> = ({ phase, currentSet }) => {
  switch (phase) {
    case 'PENALTY_PHASE':
      return (
        <div className="w-full relative overflow-hidden rounded-2xl border-2 border-amber-500 bg-amber-950/60 p-4 shadow-[0_0_30px_rgba(245,158,11,0.4)] animate-pulse">
          <div className="absolute inset-0 opacity-20 hazard-bar pointer-events-none" />
          <div className="relative flex items-center justify-center gap-3 text-amber-300">
            <AlertTriangle className="w-6 h-6 animate-bounce text-amber-400" />
            <span className="font-display font-black text-xl lg:text-2xl uppercase tracking-widest text-white drop-shadow-md">
              PENALTY SHOOTOUT PHASE ACTIVE
            </span>
            <AlertTriangle className="w-6 h-6 animate-bounce text-amber-400" />
          </div>
        </div>
      );

    case 'TIMEOUT':
      return (
        <div className="w-full rounded-2xl border-2 border-sky-500/60 bg-sky-950/50 p-3 shadow-lg shadow-sky-500/10">
          <div className="flex items-center justify-center gap-3 text-sky-300">
            <Clock className="w-5 h-5 text-sky-400 animate-spin" />
            <span className="font-display font-black text-lg uppercase tracking-wider text-white">
              OFFICIAL TIMEOUT IN PROGRESS
            </span>
          </div>
        </div>
      );

    case 'INTERMISSION':
      return (
        <div className="w-full rounded-2xl border border-purple-500/50 bg-purple-950/40 p-3 shadow-lg shadow-purple-500/10">
          <div className="flex items-center justify-center gap-3 text-purple-300">
            <Coffee className="w-5 h-5 text-purple-400" />
            <span className="font-display font-bold text-lg uppercase tracking-wider text-white">
              INTERMISSION BREAK — PREPARING NEXT SET
            </span>
          </div>
        </div>
      );

    case 'COUNTDOWN':
      return (
        <div className="w-full rounded-2xl border-2 border-red-500 bg-red-950/60 p-3 animate-pulse shadow-lg shadow-red-500/30">
          <div className="flex items-center justify-center gap-3 text-red-300">
            <Zap className="w-5 h-5 text-red-400 fill-red-400" />
            <span className="font-display font-black text-lg uppercase tracking-widest text-white">
              GET READY! SET {currentSet} STARTING...
            </span>
          </div>
        </div>
      );

    case 'MATCH_ENDED':
      return (
        <div className="w-full rounded-2xl border-2 border-amber-400 bg-amber-950/50 p-4 shadow-[0_0_30px_rgba(251,191,36,0.3)]">
          <div className="flex items-center justify-center gap-3 text-amber-300">
            <CheckCircle2 className="w-6 h-6 text-amber-400" />
            <span className="font-display font-black text-xl uppercase tracking-widest text-white">
              MATCH CONCLUDED
            </span>
          </div>
        </div>
      );

    case 'NORMAL_PHASE':
    default:
      return (
        <div className="flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80">
          <PlayCircle className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-bold tracking-widest text-slate-300 uppercase">
            SET {currentSet} OF 3 — ACTIVE FLIGHT
          </span>
        </div>
      );
  }
};
