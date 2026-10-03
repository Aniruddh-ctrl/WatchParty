import React from 'react';
import type { ConnectionStatus } from '../hooks/useWatchParty';

interface ConnectionBadgeProps {
  status: ConnectionStatus;
}

export const ConnectionBadge: React.FC<ConnectionBadgeProps> = ({ status }) => {
  switch (status) {
    case 'connected':
      return (
        <div className="flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[11px] font-medium shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="hidden sm:inline">Live Sync</span>
          <span className="sm:hidden">Live</span>
        </div>
      );
    case 'reconnecting':
      return (
        <div className="flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-[11px] font-medium shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
          <span>Reconnecting</span>
        </div>
      );
    case 'connecting':
      return (
        <div className="flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[11px] font-medium shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
          <span>Connecting</span>
        </div>
      );
    case 'disconnected':
    default:
      return (
        <div className="flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-400 text-[11px] font-medium shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          <span>Offline</span>
        </div>
      );
  }
};
