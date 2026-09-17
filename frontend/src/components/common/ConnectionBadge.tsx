import React from 'react';
import { useArenaStore } from '../../store/arenaStore';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

export const ConnectionBadge: React.FC = () => {
  const { isConnected, isConnecting, connectionError } = useArenaStore();

  if (isConnecting) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>CONNECTING</span>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <Wifi className="w-3.5 h-3.5" />
        <span>10Hz SYNC</span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono"
      title={connectionError || 'Disconnected'}
    >
      <WifiOff className="w-3.5 h-3.5" />
      <span>DISCONNECTED</span>
    </div>
  );
};
