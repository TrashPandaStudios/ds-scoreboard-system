import React, { useState, useEffect } from 'react';
import { SponsorItem, ScheduledMatch } from '../../types/scoreboard';
import { Sparkles, Calendar, ArrowRight, Shield } from 'lucide-react';

interface SponsorTakeoverProps {
  sponsors: SponsorItem[];
  upcomingMatches?: ScheduledMatch[];
  arenaName?: string;
  isIntermission?: boolean;
}

export const SponsorTakeover: React.FC<SponsorTakeoverProps> = ({
  sponsors,
  upcomingMatches = [],
  arenaName = 'Arena 1',
  isIntermission = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeSponsors = sponsors.filter((s) => s.active);
  const currentSponsor = activeSponsors.length > 0 ? activeSponsors[currentIndex % activeSponsors.length] : null;

  // Auto rotate sponsors
  useEffect(() => {
    if (activeSponsors.length <= 1) return;
    const duration = (currentSponsor?.displayDurationSec || 8) * 1000;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeSponsors.length);
    }, duration);

    return () => clearInterval(interval);
  }, [activeSponsors.length, currentSponsor]);

  return (
    <div className="w-full flex-1 flex flex-col justify-between p-8 lg:p-12 rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-[#080b11] border-2 border-cyan-500/30 shadow-2xl relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner: Arena Status & Event Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
            <Shield className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
              {arenaName} — {isIntermission ? 'INTERMISSION BREAK' : 'ARENA STANDBY'}
            </span>
            <h1 className="text-2xl lg:text-3xl font-display font-extrabold text-white tracking-wide">
              World Drone Soccer Championship
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-mono text-slate-300">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>OFFICIAL TOURNAMENT PARTNERS</span>
        </div>
      </div>

      {/* Center: Featured Partner Carousel Card */}
      <div className="my-8 flex flex-col items-center justify-center text-center">
        {currentSponsor ? (
          <div className="flex flex-col items-center animate-fadeIn transition-all duration-700">
            <div className="w-40 h-40 lg:w-48 lg:h-48 rounded-3xl bg-slate-900/90 border-2 border-cyan-500/30 p-6 flex items-center justify-center shadow-2xl shadow-cyan-500/10 mb-6 overflow-hidden group">
              <img
                src={currentSponsor.logoUrl}
                alt={currentSponsor.name}
                className="max-h-full max-w-full object-contain rounded-xl group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <span className="text-xs font-mono tracking-widest uppercase text-cyan-400 font-semibold mb-2">
              PRESENTING PARTNER
            </span>
            <h2 className="text-3xl lg:text-5xl font-display font-black text-white tracking-tight mb-3">
              {currentSponsor.name}
            </h2>
            {currentSponsor.tagline && (
              <p className="text-lg lg:text-xl font-medium text-slate-400 max-w-2xl">
                "{currentSponsor.tagline}"
              </p>
            )}

            {/* Carousel Dots */}
            {activeSponsors.length > 1 && (
              <div className="flex items-center gap-2 mt-6">
                {activeSponsors.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === currentIndex % activeSponsors.length
                        ? 'w-8 bg-cyan-400 shadow-sm shadow-cyan-400'
                        : 'w-2 bg-slate-700 hover:bg-slate-600'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-slate-500 font-mono text-sm">Standby for match commencement...</div>
        )}
      </div>

      {/* Bottom: Upcoming Match Schedule Ticker */}
      <div className="border-t border-slate-800 pt-6">
        <div className="flex items-center gap-2 mb-3 text-xs font-mono uppercase tracking-wider text-slate-400">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <span>UPCOMING MATCH SCHEDULE ON THIS CAGE:</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {upcomingMatches.slice(0, 3).map((match) => (
            <div
              key={match.id}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                  {match.matchNumber}
                </span>
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <span className="text-red-400">{match.teamRed}</span>
                  <span className="text-slate-500 font-mono">VS</span>
                  <span className="text-blue-400">{match.teamBlue}</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600" />
            </div>
          ))}

          {upcomingMatches.length === 0 && (
            <div className="col-span-3 text-center py-2 text-xs font-mono text-slate-500">
              No pending matches queued for this cage. Ready for referee assignment.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
