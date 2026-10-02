import React, { useState } from 'react';
import { Users, MoreVertical, ShieldCheck, ShieldAlert, UserMinus, Crown } from 'lucide-react';
import type { Participant } from '../types/room';
import type { Role } from '../types/rbac';
import { RoleBadge } from './RoleBadge';

interface ParticipantsListProps {
  participants: Participant[];
  currentUserId?: string;
  isHost: boolean;
  onAssignRole: (userId: string, newRole: Role) => void;
  onRemoveParticipant: (userId: string) => void;
  onTransferHost: (userId: string) => void;
}

export const ParticipantsList: React.FC<ParticipantsListProps> = ({
  participants,
  currentUserId,
  isHost,
  onAssignRole,
  onRemoveParticipant,
  onTransferHost,
}) => {
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400">
            <Users size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Participants</h3>
            <p className="text-xs text-zinc-400">{participants.length} watching now</p>
          </div>
        </div>
      </div>

      {/* Participants Scroll List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {participants.map((p) => {
          const isCurrentUser = p.userId === currentUserId;
          const isMenuOpen = activeMenuUserId === p.userId;

          return (
            <div
              key={p.userId}
              className={`relative flex items-center justify-between p-3 rounded-xl border transition-all ${
                isCurrentUser
                  ? 'bg-indigo-950/20 border-indigo-500/30'
                  : 'bg-zinc-800/40 border-white/5 hover:border-white/10'
              }`}
            >
              {/* User info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-white text-xs shadow-inner">
                  {p.username.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-white truncate max-w-[120px]">
                      {p.username}
                    </span>
                    {isCurrentUser && (
                      <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                        You
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5">
                    <RoleBadge role={p.role} size="sm" />
                  </div>
                </div>
              </div>

              {/* Host actions menu (only for other users) */}
              {isHost && !isCurrentUser && (
                <div className="relative">
                  <button
                    onClick={() => setActiveMenuUserId(isMenuOpen ? null : p.userId)}
                    className="p-1.5 rounded-lg hover:bg-zinc-700/60 text-zinc-400 hover:text-white transition-colors"
                  >
                    <MoreVertical size={16} />
                  </button>

                  {isMenuOpen && (
                    <>
                      {/* Backdrop for closing */}
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setActiveMenuUserId(null)}
                      />

                      {/* Dropdown Menu */}
                      <div className="absolute right-0 top-8 z-40 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl p-1.5 flex flex-col gap-1 text-xs">
                        {p.role === 'PARTICIPANT' && (
                          <button
                            onClick={() => {
                              onAssignRole(p.userId, 'MODERATOR');
                              setActiveMenuUserId(null);
                            }}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-zinc-200 hover:bg-indigo-600 hover:text-white transition-colors text-left"
                          >
                            <ShieldCheck size={14} className="text-indigo-400" />
                            <span>Make Moderator</span>
                          </button>
                        )}

                        {p.role === 'MODERATOR' && (
                          <button
                            onClick={() => {
                              onAssignRole(p.userId, 'PARTICIPANT');
                              setActiveMenuUserId(null);
                            }}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-zinc-200 hover:bg-amber-600 hover:text-white transition-colors text-left"
                          >
                            <ShieldAlert size={14} className="text-amber-400" />
                            <span>Demote to Viewer</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (window.confirm(`Transfer Host role to ${p.username}?`)) {
                              onTransferHost(p.userId);
                            }
                            setActiveMenuUserId(null);
                          }}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-amber-300 hover:bg-amber-600 hover:text-white transition-colors text-left"
                        >
                          <Crown size={14} className="text-amber-400" />
                          <span>Transfer Host</span>
                        </button>

                        <div className="h-px bg-white/10 my-0.5" />

                        <button
                          onClick={() => {
                            if (window.confirm(`Remove ${p.username} from room?`)) {
                              onRemoveParticipant(p.userId);
                            }
                            setActiveMenuUserId(null);
                          }}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-600 hover:text-white transition-colors text-left"
                        >
                          <UserMinus size={14} />
                          <span>Remove User</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
