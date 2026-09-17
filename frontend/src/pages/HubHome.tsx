import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useArenaStore } from '../store/arenaStore';
import { useArenaWebSocket } from '../hooks/useArenaWebSocket';
import { HeaderNav } from '../components/common/HeaderNav';
import { Tv, Sliders, Zap } from 'lucide-react';

export const HubHome: React.FC = () => {
  useArenaWebSocket();
  const { arenaSummaries } = useArenaStore();

  useEffect(() => {
    document.title = 'Drone Soccer Scoreboard & Arena Client';
  }, []);

  const defaultArenas = [
    { id: 1, name: 'Arena 1 - Alpha Cage', desc: 'Main Stadium Show Cage' },
    { id: 2, name: 'Arena 2 - Bravo Cage', desc: 'Tournament Flight Cage B' },
    { id: 3, name: 'Arena 3 - Charlie Cage', desc: 'Tournament Flight Cage C' },
  ];

  const displayedArenas =
    arenaSummaries.length > 0
      ? arenaSummaries.map((s) => ({
          id: s.arenaId,
          name: s.arenaName,
          desc: `Autonomous Drone Soccer Arena #${s.arenaId}`,
        }))
      : defaultArenas;

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col select-none">
      <HeaderNav variant="client" />

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-10 flex-1 flex flex-col justify-center w-full">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-xs mb-4">
            <Zap className="w-3.5 h-3.5 animate-pulse" />
            <span>FIDA / FAI MULTI-ARENA SCOREBOARD ENGINE</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-display font-black tracking-tight text-white mb-4">
            DRONE SOCCER <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent">ARENA CLIENT</span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg">
            High-precision 10Hz authoritative timer sync, dedicated multi-cage referee consoles, crowd stadium displays, and monitor HUDs.
          </p>
        </div>

        {/* Arenas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedArenas.map((cage) => {
            const summary = arenaSummaries.find((s) => s.arenaId === cage.id);

            return (
              <div
                key={cage.id}
                className="flex flex-col justify-between p-6 rounded-3xl bg-slate-900/80 border-2 border-slate-800 hover:border-cyan-500/50 transition-all shadow-xl group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-lg border border-cyan-800">
                      CAGE {cage.id}
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>AUTONOMOUS ENGINE</span>
                    </span>
                  </div>

                  <h3 className="text-2xl font-display font-bold text-white mb-1 group-hover:text-cyan-300 transition-colors">
                    {cage.name}
                  </h3>
                  <p className="text-xs text-slate-400 mb-6">{cage.desc}</p>

                  {/* Telemetry Preview */}
                  {summary ? (
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 mb-6">
                      <div className="flex justify-between items-center text-xs font-mono text-slate-400 mb-1">
                        <span>
                          {summary.matchNumber} (Set {summary.currentSet}/{summary.maxSets})
                        </span>
                        <span className="text-cyan-400 font-bold">{summary.phase}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-bold">
                        <span className="text-red-400">
                          {summary.teamRed}: {summary.redScore}
                        </span>
                        <span className="text-slate-600 font-mono">VS</span>
                        <span className="text-blue-400">
                          {summary.teamBlue}: {summary.blueScore}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 mb-6 text-xs font-mono text-slate-500">
                      Ready for match load
                    </div>
                  )}
                </div>

                {/* Direct Entry Buttons */}
                <div className="flex flex-col gap-2.5 pt-4 border-t border-slate-800">
                  {/* Primary Main Display & Referee */}
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to={`/arena/${cage.id}/display`}
                      className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-cyan-950/60 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all text-center"
                    >
                      <Tv className="w-4 h-4 text-cyan-400" />
                      <span>MAIN DISPLAY</span>
                    </Link>

                    <Link
                      to={`/arena/${cage.id}/referee`}
                      className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-purple-950/60 hover:text-purple-300 border border-slate-700 hover:border-purple-500/40 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all text-center"
                    >
                      <Sliders className="w-4 h-4 text-purple-400" />
                      <span>REFEREE DESK</span>
                    </Link>
                  </div>

                  {/* Dedicated Separate Monitor Views */}
                  <div className="flex flex-col gap-1.5 p-2 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold px-1">
                      Dedicated Scoreboard Screens:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <Link
                        to={`/arena/${cage.id}/display/red`}
                        target="_blank"
                        className="py-1.5 px-2 rounded-lg bg-red-950/30 hover:bg-red-900/50 border border-red-800/40 text-[11px] font-mono font-bold text-red-400 hover:text-red-300 flex items-center justify-center gap-1 transition-colors"
                      >
                        <span>🔴 Red Team HUD</span>
                      </Link>
                      <Link
                        to={`/arena/${cage.id}/display/blue`}
                        target="_blank"
                        className="py-1.5 px-2 rounded-lg bg-blue-950/30 hover:bg-blue-900/50 border border-blue-800/40 text-[11px] font-mono font-bold text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1 transition-colors"
                      >
                        <span>🔵 Blue Team HUD</span>
                      </Link>
                      <Link
                        to={`/arena/${cage.id}/display/timer`}
                        target="_blank"
                        className="py-1.5 px-2 rounded-lg bg-amber-950/30 hover:bg-amber-900/50 border border-amber-800/40 text-[11px] font-mono font-bold text-amber-300 hover:text-amber-200 flex items-center justify-center gap-1 transition-colors"
                      >
                        <span>⏱️ Big Clock</span>
                      </Link>
                      <Link
                        to={`/arena/${cage.id}/display/split`}
                        target="_blank"
                        className="py-1.5 px-2 rounded-lg bg-purple-950/30 hover:bg-purple-900/50 border border-purple-800/40 text-[11px] font-mono font-bold text-purple-300 hover:text-purple-200 flex items-center justify-center gap-1 transition-colors"
                      >
                        <span>👥 Split Teams</span>
                      </Link>
                    </div>
                  </div>

                  {/* OBS Overlays */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <Link
                      to={`/arena/${cage.id}/overlay/lower-third`}
                      target="_blank"
                      className="py-1.5 px-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-[10px] font-mono text-slate-400 hover:text-purple-300 border border-slate-800 transition-colors text-center"
                    >
                      OBS Lower
                    </Link>
                    <Link
                      to={`/arena/${cage.id}/overlay/top-bar`}
                      target="_blank"
                      className="py-1.5 px-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-[10px] font-mono text-slate-400 hover:text-purple-300 border border-slate-800 transition-colors text-center"
                    >
                      OBS Top
                    </Link>
                    <Link
                      to={`/arena/${cage.id}/overlay/penalty-alert`}
                      target="_blank"
                      className="py-1.5 px-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-[10px] font-mono text-slate-400 hover:text-amber-300 border border-slate-800 transition-colors text-center"
                    >
                      OBS Alert
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="border-t border-slate-800/80 py-6 text-center text-xs font-mono text-slate-500">
        Drone Soccer Multi-Arena Client • Dedicated 10Hz Synchronization Scoped Per Arena
      </footer>
    </div>
  );
};
