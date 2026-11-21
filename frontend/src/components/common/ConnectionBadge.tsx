import React from 'react';
import { useArenaStore } from '../../store/arenaStore';
import { Wifi, WifiOff, Loader2, RefreshCw } from 'lucide-react';

export const ConnectionBadge: React.FC = () => {
  const { isConnected, isConnecting, connectionError, transportMode, pendingCommands, commandOutbox } =
    useArenaStore();

  const totalQueued = Object.values(commandOutbox).reduce((sum, list) => sum + list.length, 0);
  const totalInFlight = pendingCommands + totalQueued;

  if (transportMode === 'WS' && isConnected) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono"
        title="Connected via native WebSocket with instant mutation push"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <Wifi className="w-3.5 h-3.5" />
        <span>{totalInFlight > 0 ? `SYNCING (${totalInFlight})` : 'LIVE SYNC'}</span>
      </div>
    );
  }

  if (transportMode === 'HTTP_FALLBACK') {
    return (
      <div
        className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-mono"
        title="WebSocket interrupted by RF congestion — automatic HTTP fallback is keeping state & commands live"
      >
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span>{totalInFlight > 0 ? `HTTP SYNC (${totalInFlight})` : 'HTTP RESYNC'}</span>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>{totalQueued > 0 ? `QUEUED (${totalQueued})` : 'RECONNECTING'}</span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono"
      title={connectionError || 'Disconnected — retrying automatically'}
    >
      <WifiOff className="w-3.5 h-3.5" />
      <span>{totalQueued > 0 ? `OFFLINE (${totalQueued} QUEUED)` : 'OFFLINE'}</span>
    </div>
  );
};
