import React, { useState, useEffect } from 'react';
import { SponsorItem, ScheduledMatch } from '../../types/scoreboard';
import { Calendar } from 'lucide-react';

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
  const currentSponsor =
    activeSponsors.length > 0 ? activeSponsors[currentIndex % activeSponsors.length] : null;

  useEffect(() => {
    if (activeSponsors.length <= 1) return;
    const duration = (currentSponsor?.displayDurationSec || 8) * 1000;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeSponsors.length);
    }, duration);

    return () => clearInterval(interval);
  }, [activeSponsors.length, currentSponsor]);

  return (
    <div className="w-full h-full flex-1 flex flex-col justify-between p-6 lg:p-10 rounded-2xl bg-[var(--court-surface)] border border-[var(--court-line)] overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--court-line-soft)] pb-4">
        <div>
          <span className="text-xs font-semibold text-[var(--court-muted)] block">
            {arenaName} — {isIntermission ? 'Intermission break' : 'Standby'}
          </span>
          <h1 className="spectator-numeral text-3xl lg:text-4xl font-black text-[var(--court-ink)]">
            Official event partners
          </h1>
        </div>
      </div>

      {/* Featured Sponsor */}
      <div className="my-auto py-6 flex flex-col items-center justify-center text-center">
        {currentSponsor ? (
          <div className="flex flex-col items-center">
            <div className="w-40 h-40 lg:w-48 lg:h-48 rounded-2xl bg-[var(--court-subtle)] border border-[var(--court-line)] p-6 flex items-center justify-center mb-5 overflow-hidden">
              <img
                src={currentSponsor.logoUrl}
                alt={currentSponsor.name}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <span className="text-xs font-semibold text-[var(--court-muted)] mb-1">
              Presenting partner
            </span>
            <h2 className="spectator-numeral text-4xl lg:text-6xl font-black text-[var(--court-ink)] mb-2">
              {currentSponsor.name}
            </h2>
            {currentSponsor.tagline && (
              <p className="text-base lg:text-xl text-[var(--court-muted)] max-w-2xl">
                {currentSponsor.tagline}
              </p>
            )}

            {activeSponsors.length > 1 && (
              <div className="flex items-center gap-2 mt-5">
                {activeSponsors.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === currentIndex % activeSponsors.length ? 'w-8' : 'w-2'
                    }`}
                    style={{
                      backgroundColor:
                        idx === currentIndex % activeSponsors.length
                          ? 'var(--court-ink)'
                          : 'var(--court-line)',
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-[var(--court-muted)]">Standing by for next match...</div>
        )}
      </div>

      {/* Upcoming Matches */}
      <div className="border-t border-[var(--court-line-soft)] pt-4">
        <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-[var(--court-muted)]">
          <Calendar className="w-4 h-4" />
          <span>Up next on {arenaName}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {upcomingMatches.slice(0, 3).map((match) => (
            <div
              key={match.id}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[var(--court-subtle)] border border-[var(--court-line-soft)] text-xs"
            >
              <span className="font-bold text-[var(--court-ink)]">{match.matchNumber}</span>
              <span className="font-semibold truncate mx-2">
                <span style={{ color: 'var(--drone-red-text)' }}>{match.teamRed}</span>{' '}
                <span className="text-[var(--court-muted)]">vs</span>{' '}
                <span style={{ color: 'var(--drone-blue-text)' }}>{match.teamBlue}</span>
              </span>
            </div>
          ))}

          {upcomingMatches.length === 0 && (
            <div className="col-span-3 text-center py-2 text-xs text-[var(--court-muted)]">
              No pending matches queued for this cage.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
