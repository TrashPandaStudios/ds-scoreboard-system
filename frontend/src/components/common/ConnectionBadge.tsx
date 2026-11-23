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
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold"
        style={{
          backgroundColor: 'var(--signal-live-tint)',
          borderColor: 'var(--signal-live-border)',
          color: 'var(--signal-live-text)',
        }}
        title="Connected via native WebSocket with instant updates"
      >
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--signal-live)' }} />
        <Wifi className="w-3.5 h-3.5" />
        <span>{totalInFlight > 0 ? `Syncing (${totalInFlight})` : 'Live sync'}</span>
      </div>
    );
  }

  if (transportMode === 'HTTP_FALLBACK') {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold"
        style={{
          backgroundColor: 'var(--signal-amber-tint)',
          borderColor: 'var(--signal-amber-border)',
          color: 'var(--signal-amber-text)',
        }}
        title="WebSocket interrupted by RF congestion — automatic HTTP fallback is active"
      >
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span>{totalInFlight > 0 ? `HTTP sync (${totalInFlight})` : 'Auto-updating'}</span>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold"
        style={{
          backgroundColor: 'var(--signal-amber-tint)',
          borderColor: 'var(--signal-amber-border)',
          color: 'var(--signal-amber-text)',
        }}
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>{totalQueued > 0 ? `Queued (${totalQueued})` : 'Reconnecting'}</span>
      </div>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold"
      style={{
        backgroundColor: 'var(--drone-red-tint)',
        borderColor: 'var(--drone-red-border)',
        color: 'var(--drone-red-text)',
      }}
      title={connectionError || 'Disconnected — retrying automatically'}
    >
      <WifiOff className="w-3.5 h-3.5" />
      <span>{totalQueued > 0 ? `Offline (${totalQueued} queued)` : 'Offline'}</span>
    </div>
  );
};
