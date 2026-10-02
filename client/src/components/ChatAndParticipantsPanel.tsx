import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Users,
  Send,
  MoreVertical,
  ShieldCheck,
  ShieldAlert,
  UserMinus,
  Crown,
  Sparkles,
  Smile,
  Copy,
  Check,
} from 'lucide-react';
import type { Participant } from '../types/room';
import type { Role } from '../types/rbac';
import type { ChatMessagePayload } from '../types/events';
import { RoleBadge } from './RoleBadge';

interface ChatAndParticipantsPanelProps {
  participants: Participant[];
  currentUserId?: string;
  isHost: boolean;
  chatMessages: ChatMessagePayload[];
  onSendMessage: (message: string) => void;
  onSendReaction: (emoji: string) => void;
  onAssignRole: (userId: string, newRole: Role) => void;
  onRemoveParticipant: (userId: string) => void;
  onTransferHost: (userId: string) => void;
}

const REACTION_EMOJIS = ['❤️', '🔥', '😂', '👏', '🍿', '🚀', '🤯', '✨'];

export const ChatAndParticipantsPanel: React.FC<ChatAndParticipantsPanelProps> = ({
  participants,
  currentUserId,
  isHost,
  chatMessages,
  onSendMessage,
  onSendReaction,
  onAssignRole,
  onRemoveParticipant,
  onTransferHost,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('chat');
  const [inputMessage, setInputMessage] = useState('');
  const [activeMenuUserId, setActiveMenuUserId] = useState<string | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom on new message
  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    onSendMessage(inputMessage.trim());
    setInputMessage('');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  return (
    <div className="flex flex-col h-full glass-panel rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/10 select-none">
      {/* Header Tabs */}
      <div className="flex items-center border-b border-white/10 bg-white/[0.02]">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-3.5 px-4 text-xs sm:text-sm font-bold tracking-tight flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'chat'
              ? 'border-indigo-500 text-indigo-300 bg-white/[0.04]'
              : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]'
          }`}
        >
          <MessageSquare size={16} />
          <span>Live Chat</span>
          {chatMessages.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/25 text-indigo-300 border border-indigo-500/30">
              {chatMessages.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('participants')}
          className={`flex-1 py-3.5 px-4 text-xs sm:text-sm font-bold tracking-tight flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'participants'
              ? 'border-indigo-500 text-indigo-300 bg-white/[0.04]'
              : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]'
          }`}
        >
          <Users size={16} />
          <span>People</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-zinc-300">
            {participants.length}
          </span>
        </button>
      </div>

      {/* TAB 1: LIVE CHAT */}
      {activeTab === 'chat' && (
        <div className="flex flex-col flex-1 min-h-0 bg-transparent">
          {/* Messages Feed Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
            {chatMessages.length === 0 ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mb-3 text-indigo-400 shadow-inner">
                  <Smile size={28} />
                </div>
                <p className="text-sm font-bold text-zinc-300">Welcome to the Watch Room!</p>
                <p className="text-xs text-zinc-400 mt-1.5 max-w-[220px] leading-relaxed">
                  Chat is live. Send a message or tap an emoji to float it over the video stream!
                </p>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="mt-4 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 flex items-center gap-1.5 transition-all"
                >
                  {copiedInvite ? (
                    <>
                      <Check size={13} className="text-emerald-400" />
                      <span className="text-emerald-400">Copied invite link!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Invite Friends</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              chatMessages.map((msg) => {
                const isMe = msg.userId === currentUserId;
                const formattedTime = new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'} animate-fade-in`}
                  >
                    {/* Header info */}
                    <div className="flex items-center gap-1.5 text-[11px] px-1 select-text">
                      <span className={`font-bold ${isMe ? 'text-indigo-400' : 'text-zinc-200'}`}>
                        {msg.username}
                      </span>
                      {msg.role === 'HOST' && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-amber-500/15 text-amber-300 rounded border border-amber-500/30">
                          HOST
                        </span>
                      )}
                      {msg.role === 'MODERATOR' && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-indigo-500/15 text-indigo-300 rounded border border-indigo-500/30">
                          MOD
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-500 font-mono">{formattedTime}</span>
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`max-w-[88%] px-4 py-2.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed break-words shadow-md select-text ${
                        isMe
                          ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 text-white rounded-br-xs'
                          : 'bg-white/5 border border-white/10 text-zinc-100 rounded-bl-xs'
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Floating Reactions Bar */}
          <div className="px-3 py-2 border-t border-white/5 bg-white/[0.02] flex items-center justify-between gap-1 overflow-x-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-1 shrink-0 flex items-center gap-1">
              <Sparkles size={11} className="text-amber-400" /> React:
            </span>
            <div className="flex items-center gap-1.5">
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onSendReaction(emoji)}
                  title={`Send ${emoji} to stream`}
                  className="w-8 h-8 flex items-center justify-center text-lg rounded-xl hover:bg-white/10 hover:scale-125 active:scale-95 transition-all cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Message Input Box */}
          <form
            onSubmit={handleFormSubmit}
            className="p-3 sm:p-4 border-t border-white/10 bg-white/[0.015] flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Send message to room..."
              maxLength={250}
              enterKeyHint="send"
              className="flex-1 px-4 py-2.5 sm:py-3 bg-zinc-900/95 border border-white/10 rounded-xl text-white placeholder-zinc-500 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition-all font-medium"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              title="Send message"
              className="p-2.5 sm:p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-95 flex items-center justify-center shrink-0 cursor-pointer"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: PARTICIPANTS */}
      {activeTab === 'participants' && (
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
          {participants.map((p) => {
            const isCurrentUser = p.userId === currentUserId;
            const isMenuOpen = activeMenuUserId === p.userId;

            return (
              <div
                key={p.userId}
                className={`relative flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  isCurrentUser
                    ? 'bg-indigo-950/25 border-indigo-500/35 shadow-sm'
                    : 'bg-white/[0.025] border-white/5 hover:border-white/15'
                }`}
              >
                {/* User Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-white text-xs shadow-md shrink-0">
                    {p.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[130px] sm:max-w-[170px]">
                        {p.username}
                      </span>
                      {isCurrentUser && (
                        <span className="text-[9px] uppercase font-extrabold tracking-wider text-indigo-300 bg-indigo-500/20 px-1.5 py-0.2 rounded border border-indigo-500/30">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5">
                      <RoleBadge role={p.role} size="sm" />
                    </div>
                  </div>
                </div>

                {/* Host Actions Menu (Host only, not on self) */}
                {isHost && !isCurrentUser && (
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenuUserId(isMenuOpen ? null : p.userId)}
                      className="p-2 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {isMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setActiveMenuUserId(null)}
                        />
                        <div className="absolute right-0 top-9 z-40 w-52 bg-zinc-900 border border-white/15 rounded-2xl shadow-2xl p-2 flex flex-col gap-1 text-xs animate-scale-up">
                          {p.role === 'PARTICIPANT' && (
                            <button
                              onClick={() => {
                                onAssignRole(p.userId, 'MODERATOR');
                                setActiveMenuUserId(null);
                              }}
                              className="flex items-center gap-2 px-3 py-2 rounded-xl text-zinc-200 hover:bg-indigo-600 hover:text-white transition-colors text-left"
                            >
                              <ShieldCheck size={15} className="text-indigo-400" />
                              <span>Promote to Moderator</span>
                            </button>
                          )}

                          {p.role === 'MODERATOR' && (
                            <button
                              onClick={() => {
                                onAssignRole(p.userId, 'PARTICIPANT');
                                setActiveMenuUserId(null);
                              }}
                              className="flex items-center gap-2 px-3 py-2 rounded-xl text-zinc-200 hover:bg-amber-600 hover:text-white transition-colors text-left"
                            >
                              <ShieldAlert size={15} className="text-amber-400" />
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
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-amber-300 hover:bg-amber-600 hover:text-white transition-colors text-left"
                          >
                            <Crown size={15} className="text-amber-400" />
                            <span>Transfer Host</span>
                          </button>

                          <div className="h-px bg-white/10 my-1" />

                          <button
                            onClick={() => {
                              if (window.confirm(`Kick ${p.username} from the watch party?`)) {
                                onRemoveParticipant(p.userId);
                              }
                              setActiveMenuUserId(null);
                            }}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-600 hover:text-white transition-colors text-left"
                          >
                            <UserMinus size={15} />
                            <span>Kick from Room</span>
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
      )}
    </div>
  );
};
