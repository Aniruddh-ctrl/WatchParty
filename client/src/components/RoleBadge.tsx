import React from 'react';
import { Crown, Shield, Eye } from 'lucide-react';
import type { Role } from '../types/rbac';

interface RoleBadgeProps {
  role: Role;
  size?: 'sm' | 'md';
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'md' }) => {
  const isSm = size === 'sm';
  const padding = isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';
  const iconSize = isSm ? 12 : 14;

  switch (role) {
    case 'HOST':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 ${padding}`}
        >
          <Crown size={iconSize} className="text-amber-400" />
          <span>HOST</span>
        </span>
      );
    case 'MODERATOR':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 ${padding}`}
        >
          <Shield size={iconSize} className="text-indigo-400" />
          <span>MODERATOR</span>
        </span>
      );
    case 'PARTICIPANT':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/60 ${padding}`}
        >
          <Eye size={iconSize} className="text-zinc-400" />
          <span>VIEWER</span>
        </span>
      );
  }
};
