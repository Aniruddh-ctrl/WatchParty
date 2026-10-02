import React from 'react';
import type { ConnectionStatus } from '../hooks/useWatchParty';

interface ConnectionBadgeProps {
  status: ConnectionStatus;
}

export const ConnectionBadge: React.FC<ConnectionBadgeProps> = ({ status }) => {
  switch (status) {
    case 'connected':
      return (
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Live Sync</span>
        </div>
      );
    case 'reconnecting':
      return (
        <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-xs font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span>Reconnecting...</span>
        </div>
      );
    case 'connecting':
      return (
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
          <span>Connecting...</span>
        </div>
      );
    case 'disconnected':
    default:
      return (
        <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          <span>Offline</span>
        </div>
      );
  }
};
