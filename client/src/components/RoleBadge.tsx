import React from 'react';
import { Crown, Shield, Eye } from 'lucide-react';
import type { Role } from '../types/rbac';

interface RoleBadgeProps {
  role: Role;
  size?: 'sm' | 'md';
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'md' }) => {
  const isSm = size === 'sm';
  const padding = isSm ? 'px-1.5 py-0.2 text-[10px]' : 'px-2 py-0.5 text-xs';
  const iconSize = isSm ? 11 : 13;

  switch (role) {
    case 'HOST':
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 ${padding}`}
        >
          <Crown size={iconSize} className="text-amber-400" />
          <span>HOST</span>
        </span>
      );
    case 'MODERATOR':
      return (
        <span
          className={`inline-flex items-center gap-1 font-semibold rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 ${padding}`}
        >
          <Shield size={iconSize} className="text-indigo-400" />
          <span>MOD</span>
        </span>
      );
    case 'PARTICIPANT':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium rounded bg-white/[0.04] text-zinc-400 border border-white/5 ${padding}`}
        >
          <Eye size={iconSize} className="text-zinc-500" />
          <span>VIEWER</span>
        </span>
      );
  }
};
