import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useArenaStore } from '../../store/arenaStore';
import { useSpectatorTheme } from '../../hooks/useSpectatorTheme';
import { ConnectionBadge } from './ConnectionBadge';
import { AddArenaModal } from '../dashboard/AddArenaModal';
import {
  Tv,
  Sliders,
  LayoutDashboard,
  Layers,
  Crosshair,
  ExternalLink,
  Monitor,
  Clock,
  Users,
  Plus,
  Sun,
  Moon,
  Globe,
} from 'lucide-react';

export interface HeaderNavProps {
  arenaId?: number;
  variant?: 'admin' | 'referee' | 'client' | 'display' | 'minimal';
}

const DroneRingEmblem: React.FC = () => (
  <div
    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-[var(--court-line)]"
    style={{ backgroundColor: 'var(--court-emblem-bg)' }}
    aria-hidden="true"
  >
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <circle cx="9.5" cy="12" r="5" stroke="#F85149" strokeWidth="2.4" />
      <circle cx="14.5" cy="12" r="5" stroke="#388BFD" strokeWidth="2.4" />
    </svg>
  </div>
);

export const HeaderNav: React.FC<HeaderNavProps> = ({ arenaId = 1, variant = 'client' }) => {
  const location = useLocation();
  const path = location.pathname;
  const { arenaSummaries } = useArenaStore();
  const { theme, toggleTheme } = useSpectatorTheme();
  const [isAddArenaModalOpen, setIsAddArenaModalOpen] = useState(false);

  const activeArenaIds =
    arenaSummaries.length > 0 ? [...arenaSummaries].sort((a, b) => a.arenaId - b.arenaId).map((a) => a.arenaId) : [1, 2, 3];

  const nextArenaId = arenaSummaries.reduce((max, a) => Math.max(max, a.arenaId), 0) + 1;

  const handleLaunchAllScreens = () => {
    window.open(`/arena/${arenaId}/display/red`, '_blank');
    window.open(`/arena/${arenaId}/display/blue`, '_blank');
    window.open(`/arena/${arenaId}/display/timer`, '_blank');
    window.open(`/arena/${arenaId}/display/split`, '_blank');
  };

  const themeToggleBtn = (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--court-line)] bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-xs font-semibold text-[var(--court-ink-secondary)] transition-colors"
    >
      {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
      <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
    </button>
  );

  // -------------------------------------------------------------------------
  // DISPLAY VARIANT: Clean full-screen monitor (no header chrome)
  // -------------------------------------------------------------------------
  if (variant === 'display') {
    return null;
  }

  // -------------------------------------------------------------------------
  // REFEREE CONSOLE VARIANT: Cage-scoped referee desk with monitor launchers
  // -------------------------------------------------------------------------
  if (variant === 'referee') {
    return (
      <header className="sticky top-0 z-40 bg-[var(--court-surface)] border-b border-[var(--court-line)] px-4 lg:px-8 py-3 select-none">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Cage-Scoped Branding */}
          <div className="flex items-center gap-3">
            <DroneRingEmblem />
            <div>
              <span className="spectator-numeral text-xl font-extrabold text-[var(--court-ink)] block leading-none">
                Drone Soccer Referee
              </span>
              <span className="text-xs text-[var(--court-muted)] mt-0.5 block">
                Cage {arenaId} control desk
              </span>
            </div>
          </div>

          {/* Center: Dedicated Scoreboard Screen Launchers */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Link
              to={`/arena/${arenaId}/display/red`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors"
              style={{
                backgroundColor: 'var(--drone-red-tint)',
                borderColor: 'var(--drone-red-border)',
                color: 'var(--drone-red-text)',
              }}
              title="Open Red Team pilot box display"
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--drone-red)' }} />
              <span>Red HUD</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </Link>

            <Link
              to={`/arena/${arenaId}/display/blue`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors"
              style={{
                backgroundColor: 'var(--drone-blue-tint)',
                borderColor: 'var(--drone-blue-border)',
                color: 'var(--drone-blue-text)',
              }}
              title="Open Blue Team pilot box display"
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--drone-blue)' }} />
              <span>Blue HUD</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </Link>

            <Link
              to={`/arena/${arenaId}/display/timer`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors"
              style={{
                backgroundColor: 'var(--signal-amber-tint)',
                borderColor: 'var(--signal-amber-border)',
                color: 'var(--signal-amber-text)',
              }}
              title="Open dedicated stadium clock"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Big clock</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </Link>

            <Link
              to={`/arena/${arenaId}/display/split`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors"
              style={{
                backgroundColor: 'var(--signal-intermission-tint)',
                borderColor: 'var(--signal-intermission-border)',
                color: 'var(--signal-intermission-text)',
              }}
              title="Open split teams monitor"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Split teams</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </Link>

            <button
              type="button"
              onClick={handleLaunchAllScreens}
              className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--court-control-bg)] hover:bg-[var(--court-control-hover)] text-[var(--court-ink-secondary)] border border-[var(--court-line)] text-xs font-semibold transition-colors"
              title="Open all 4 dedicated displays in separate tabs"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Open all 4</span>
            </button>
          </div>

          {/* Right: Sync + Theme Toggle */}
          <div className="flex items-center gap-2">
            <ConnectionBadge />
            {themeToggleBtn}
          </div>
        </div>
      </header>
    );
  }

  // -------------------------------------------------------------------------
  // ADMIN PANEL VARIANT: Master Dashboard masthead
  // -------------------------------------------------------------------------
  if (variant === 'admin') {
    return (
      <>
        <header className="sticky top-0 z-40 bg-[var(--court-surface)] border-b border-[var(--court-line)] px-4 lg:px-8 py-3 select-none">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            {/* Left: Branding & Quick Referee Launchers */}
            <div className="flex items-center gap-3">
              <Link to="/master" className="flex items-center gap-2.5">
                <DroneRingEmblem />
                <div>
                  <span className="spectator-numeral text-xl font-extrabold text-[var(--court-ink)] block leading-none">
                    Drone Soccer Admin
                  </span>
                  <span className="text-xs text-[var(--court-muted)] mt-0.5 block">
                    Tournament command center
                  </span>
                </div>
              </Link>

              <div className="hidden md:flex items-center gap-1 ml-3 pl-3 border-l border-[var(--court-line-soft)]">
                <Link
                  to="/"
                  className="px-2.5 py-1 text-xs font-semibold rounded-md text-[var(--court-muted)] hover:text-[var(--court-ink)] hover:bg-[var(--court-control-bg)] transition-colors"
                >
                  Arena hub
                </Link>
                {activeArenaIds.map((id) => (
                  <Link
                    key={id}
                    to={`/arena/${id}/referee`}
                    target="_blank"
                    className="px-2.5 py-1 text-xs font-semibold rounded-md text-[var(--court-muted)] hover:text-[var(--court-ink)] hover:bg-[var(--court-control-bg)] transition-colors inline-flex items-center gap-1"
                    title={`Open Referee Console for Cage ${id}`}
                  >
                    <span>Cage {id}</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Right: Add Arena, Sync & Theme Toggle */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddArenaModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: 'var(--court-active-pill-bg)',
                  color: 'var(--court-active-pill-fg)',
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add arena</span>
              </button>
              <ConnectionBadge />
              {themeToggleBtn}
            </div>
          </div>
        </header>

        <AddArenaModal
          isOpen={isAddArenaModalOpen}
          onClose={() => setIsAddArenaModalOpen(false)}
          nextArenaId={nextArenaId}
        />
      </>
    );
  }

  // -------------------------------------------------------------------------
  // CLIENT VARIANT: Standard LAN Hub navigation
  // -------------------------------------------------------------------------
  const clientNavItems = [
    { to: '/', label: 'Arena hub', icon: Crosshair },
    { to: `/arena/${arenaId}/display`, label: 'Stadium display', icon: Tv },
    { to: `/arena/${arenaId}/referee`, label: 'Referee desk', icon: Sliders },
    { to: '/master', label: 'Admin panel', icon: LayoutDashboard },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-[var(--court-surface)] border-b border-[var(--court-line)] px-4 lg:px-8 py-3 select-none">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Branding & Cage Switcher */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5">
              <DroneRingEmblem />
              <div>
                <span className="spectator-numeral text-xl font-extrabold text-[var(--court-ink)] block leading-none">
                  Drone Soccer Engine
                </span>
                <span className="text-xs text-[var(--court-muted)] mt-0.5 block">
                  Multi-arena control
                </span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-1 ml-3 pl-3 border-l border-[var(--court-line-soft)]">
              {activeArenaIds.map((id) => {
                const isSelected = arenaId === id && path.includes('/arena/');
                return (
                  <Link
                    key={id}
                    to={path.includes('/referee') ? `/arena/${id}/referee` : `/arena/${id}/display`}
                    className="px-2.5 py-1 text-xs font-semibold rounded-md transition-colors"
                    style={
                      isSelected
                        ? {
                            backgroundColor: 'var(--court-active-pill-bg)',
                            color: 'var(--court-active-pill-fg)',
                          }
                        : { color: 'var(--court-muted)' }
                    }
                  >
                    Cage {id}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Center: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {clientNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = path === item.to || (item.to !== '/' && path.startsWith(item.to));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-[var(--court-control-bg)] text-[var(--court-ink)] border border-[var(--court-line)]'
                      : 'text-[var(--court-muted)] hover:text-[var(--court-ink)] hover:bg-[var(--court-control-bg)]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <Link
              to="/live"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--court-muted)] hover:text-[var(--court-ink)] hover:bg-[var(--court-control-bg)] transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Public live</span>
            </Link>

            <Link
              to={`/arena/${arenaId}/overlay/lower-third`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--court-muted)] hover:text-[var(--court-ink)] hover:bg-[var(--court-control-bg)] transition-colors"
              title="Open OBS lower-third overlay"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>OBS</span>
            </Link>
          </nav>

          {/* Right: Add Arena, Connection & Theme Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddArenaModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90"
              style={{
                backgroundColor: 'var(--court-active-pill-bg)',
                color: 'var(--court-active-pill-fg)',
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add arena</span>
            </button>
            <ConnectionBadge />
            {themeToggleBtn}
          </div>
        </div>
      </header>

      <AddArenaModal
        isOpen={isAddArenaModalOpen}
        onClose={() => setIsAddArenaModalOpen(false)}
        nextArenaId={nextArenaId}
      />
    </>
  );
};
