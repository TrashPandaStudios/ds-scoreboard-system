import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useArenaStore } from '../../store/arenaStore';
import { ConnectionBadge } from './ConnectionBadge';
import { AddArenaModal } from '../dashboard/AddArenaModal';
import { Shield, Tv, Sliders, LayoutDashboard, Layers, Crosshair, ExternalLink, Monitor, Clock, Users, Plus } from 'lucide-react';

export interface HeaderNavProps {
  arenaId?: number;
  variant?: 'admin' | 'referee' | 'client' | 'display' | 'minimal';
}

export const HeaderNav: React.FC<HeaderNavProps> = ({ arenaId = 1, variant = 'client' }) => {
  const location = useLocation();
  const path = location.pathname;
  const { arenaSummaries } = useArenaStore();
  const [isAddArenaModalOpen, setIsAddArenaModalOpen] = useState(false);

  const activeArenaIds = arenaSummaries.length > 0 
    ? arenaSummaries.map(a => a.arenaId) 
    : [1, 2, 3];

  const nextArenaId = arenaSummaries.reduce((max, a) => Math.max(max, a.arenaId), 0) + 1;

  const handleLaunchAllScreens = () => {
    window.open(`/arena/${arenaId}/display/red`, '_blank');
    window.open(`/arena/${arenaId}/display/blue`, '_blank');
    window.open(`/arena/${arenaId}/display/timer`, '_blank');
    window.open(`/arena/${arenaId}/display/split`, '_blank');
  };

  // -------------------------------------------------------------------------
  // REFEREE CONSOLE VARIANT: Strict referee view with ONLY dedicated screens
  // -------------------------------------------------------------------------
  if (variant === 'referee') {
    return (
      <header className="sticky top-0 z-50 bg-[#080b11]/95 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3 select-none">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Left: Cage Scoped Referee Badge */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Sliders className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-display font-black tracking-wider text-base lg:text-lg text-white block leading-tight">
                DRONE SOCCER
              </span>
              <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-bold">
                ARENA {arenaId} • REFEREE CONSOLE
              </span>
            </div>
          </div>

          {/* Center: Dedicated Scoreboard Screen Launchers (ONLY options accessible to referee) */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold hidden sm:inline-block mr-1">
              Scoreboard Screens:
            </span>

            {/* Red Team HUD */}
            <Link
              to={`/arena/${arenaId}/display/red`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-white border border-red-800/60 text-xs font-mono font-bold transition-all shadow-sm group"
              title="Open Red Team Pilot Box HUD in new window"
            >
              <span className="w-2 h-2 rounded-full bg-red-500 group-hover:scale-125 transition-transform" />
              <span>Red Team HUD</span>
              <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
            </Link>

            {/* Blue Team HUD */}
            <Link
              to={`/arena/${arenaId}/display/blue`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-950/40 hover:bg-blue-900/60 text-blue-300 hover:text-white border border-blue-800/60 text-xs font-mono font-bold transition-all shadow-sm group"
              title="Open Blue Team Pilot Box HUD in new window"
            >
              <span className="w-2 h-2 rounded-full bg-blue-500 group-hover:scale-125 transition-transform" />
              <span>Blue Team HUD</span>
              <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
            </Link>

            {/* Big Clock */}
            <Link
              to={`/arena/${arenaId}/display/timer`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 hover:text-white border border-amber-800/60 text-xs font-mono font-bold transition-all shadow-sm group"
              title="Open Big Clock / Authoritative Match Timer in new window"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Big Clock</span>
              <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
            </Link>

            {/* Split Teams */}
            <Link
              to={`/arena/${arenaId}/display/split`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 hover:text-white border border-purple-800/60 text-xs font-mono font-bold transition-all shadow-sm group"
              title="Open Split Teams Telemetry in new window"
            >
              <Users className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
              <span>Split Teams</span>
              <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
            </Link>

            {/* Launch All Screens helper */}
            <button
              onClick={handleLaunchAllScreens}
              className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-mono font-bold transition-all"
              title="Open all 4 dedicated scoreboard displays in separate tabs/windows"
            >
              <Monitor className="w-3.5 h-3.5 text-cyan-400" />
              <span>Open All 4</span>
            </button>
          </div>

          {/* Right: Authoritative Connection Status */}
          <div className="flex items-center gap-3">
            <ConnectionBadge />
          </div>
        </div>
      </header>
    );
  }

  // -------------------------------------------------------------------------
  // DISPLAY VARIANT: Clean minimal header for public / pilot monitors
  // -------------------------------------------------------------------------
  if (variant === 'display') {
    return (
      <header className="sticky top-0 z-40 bg-[#080b11]/80 backdrop-blur-md border-b border-slate-800/60 px-3 sm:px-6 py-1.5 select-none shrink-0">
        <div className="w-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <span className="text-[11px] sm:text-xs font-mono font-bold text-slate-300 tracking-wider">
              DRONE SOCCER SCOREBOARD • ARENA {arenaId}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ConnectionBadge />
          </div>
        </div>
      </header>
    );
  }

  // -------------------------------------------------------------------------
  // ADMIN PANEL VARIANT: Rendered exclusively on the Main Docker Container /master
  // -------------------------------------------------------------------------
  if (variant === 'admin') {
    return (
      <>
        <header className="sticky top-0 z-50 bg-[#080b11]/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3 transition-colors select-none">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            {/* Left: Branding */}
            <div className="flex items-center gap-3">
              <Link to="/master" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                  <LayoutDashboard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-display font-black tracking-wider text-base lg:text-lg text-white block leading-tight">
                    DRONE SOCCER
                  </span>
                  <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-bold">
                    MAIN DOCKER ADMIN PANEL
                  </span>
                </div>
              </Link>

              {/* Quick Arena Switcher Tabs for Admin Inspection */}
              <div className="hidden md:flex items-center gap-1 ml-4 pl-4 border-l border-slate-800">
                {activeArenaIds.map((id) => (
                  <Link
                    key={id}
                    to={`/arena/${id}/referee`}
                    target="_blank"
                    className="px-2.5 py-1 text-xs font-mono font-semibold rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all flex items-center gap-1"
                    title={`Open Referee Desk for Cage ${id} in new window`}
                  >
                    <span>Cage {id}</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Center: Admin Scope Info */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>AUTHORITATIVE TOURNAMENT COMMAND CENTER</span>
            </div>

            {/* Right: Add Arena & Connection Badge */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setIsAddArenaModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-bold shadow-md shadow-cyan-600/20 transition-all active:scale-95"
                title="Deploy a new authoritative drone arena cage at runtime"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>ADD ARENA</span>
              </button>
              <ConnectionBadge />
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
  // CLIENT VARIANT: Standard client navigation (Hub, Stadium Display, Referee)
  // -------------------------------------------------------------------------
  const clientNavItems = [
    { to: '/', label: 'Arena Hub', icon: Crosshair },
    { to: `/arena/${arenaId}/display`, label: 'Stadium Display', icon: Tv },
    { to: `/arena/${arenaId}/referee`, label: 'Referee Console', icon: Sliders },
    { to: '/master', label: 'Admin Panel', icon: LayoutDashboard },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#080b11]/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3 transition-colors select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Branding & Current Cage Switcher */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-display font-black tracking-wider text-base lg:text-lg text-white block leading-tight">
                DRONE SOCCER
              </span>
              <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase">
                ARENA {arenaId} SCORE ENGINE
              </span>
            </div>
          </Link>

          {/* Quick Arena Switcher Tabs for Client */}
          <div className="hidden md:flex items-center gap-1 ml-4 pl-4 border-l border-slate-800">
            {activeArenaIds.map((id) => (
              <Link
                key={id}
                to={path.includes('/referee') ? `/arena/${id}/referee` : `/arena/${id}/display`}
                className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-md transition-all ${
                  arenaId === id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                Cage {id}
              </Link>
            ))}
          </div>
        </div>

        {/* Center: Client Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {clientNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = path === item.to || (item.to !== '/' && path.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white font-semibold border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Dedicated Monitor Views Dropdown */}
          <div className="relative group ml-2">
            <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800/50 text-cyan-300 transition-colors">
              <Tv className="w-3.5 h-3.5 text-cyan-400" />
              <span>Monitors ▾</span>
            </button>

            <div className="absolute top-full left-0 mt-1 w-56 py-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl hidden group-hover:flex flex-col z-50 animate-fadeIn">
              <span className="px-3 py-1 text-[10px] font-mono text-slate-400 uppercase font-bold border-b border-slate-800 mb-1">
                Dedicated Arena {arenaId} Monitors
              </span>
              <Link
                to={`/arena/${arenaId}/display`}
                className="px-3 py-1.5 text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2"
              >
                <span>📺 Stadium Crowd Main</span>
              </Link>
              <Link
                to={`/arena/${arenaId}/display/red`}
                target="_blank"
                className="px-3 py-1.5 text-xs font-mono text-red-400 hover:text-red-300 hover:bg-red-950/40 flex items-center gap-2"
              >
                <span>🔴 Red Team Pilot Box</span>
              </Link>
              <Link
                to={`/arena/${arenaId}/display/blue`}
                target="_blank"
                className="px-3 py-1.5 text-xs font-mono text-blue-400 hover:text-blue-300 hover:bg-blue-950/40 flex items-center gap-2"
              >
                <span>🔵 Blue Team Pilot Box</span>
              </Link>
              <Link
                to={`/arena/${arenaId}/display/timer`}
                target="_blank"
                className="px-3 py-1.5 text-xs font-mono text-amber-300 hover:text-amber-200 hover:bg-amber-950/40 flex items-center gap-2"
              >
                <span>⏱️ Dedicated Match Clock</span>
              </Link>
              <Link
                to={`/arena/${arenaId}/display/split`}
                target="_blank"
                className="px-3 py-1.5 text-xs font-mono text-purple-300 hover:text-purple-200 hover:bg-purple-950/40 flex items-center gap-2"
              >
                <span>👥 Split Red / Blue Telemetry</span>
              </Link>
            </div>
          </div>
        </nav>

        {/* Right: Add Arena, Overlay Shortcuts & Connection */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsAddArenaModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-bold shadow-md shadow-cyan-600/20 transition-all active:scale-95"
            title="Deploy a new authoritative drone arena cage at runtime"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>ADD ARENA</span>
          </button>

          <Link
            to={`/arena/${arenaId}/overlay/lower-third`}
            target="_blank"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-purple-300 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/50 rounded-lg transition-colors"
            title="Open OBS Lower-Third Overlay in new tab"
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>OBS Overlay</span>
          </Link>
          <ConnectionBadge />
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
