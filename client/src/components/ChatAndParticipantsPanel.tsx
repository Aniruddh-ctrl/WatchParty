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

const REACTION_EMOJIS = ['❤️', '🔥', '😂', '👏', '🍿', '🚀', '✨'];

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
    <div className="flex flex-col h-full card overflow-hidden select-none">
      {/* Header Tabs */}
      <div className="flex items-center border-b border-white/10 bg-zinc-950/40">
        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-3 px-3 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'chat'
              ? 'border-indigo-500 text-white bg-white/[0.03]'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <MessageSquare size={15} />
          <span>Chat</span>
          {chatMessages.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-medium bg-indigo-500/20 text-indigo-300">
              {chatMessages.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('participants')}
          className={`flex-1 py-3 px-3 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'participants'
              ? 'border-indigo-500 text-white bg-white/[0.03]'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Users size={15} />
          <span>People</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-medium bg-white/10 text-zinc-300">
            {participants.length}
          </span>
        </button>
      </div>

      {/* TAB 1: LIVE CHAT */}
      {activeTab === 'chat' && (
        <div className="flex flex-col flex-1 min-h-0 bg-transparent">
          {/* Messages Feed Area */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
            {chatMessages.length === 0 ? (
              <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center p-4 text-zinc-500">
                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center mb-2.5 text-zinc-400">
                  <Smile size={20} />
                </div>
                <p className="text-xs font-semibold text-zinc-300">Room Chat Ready</p>
                <p className="text-[11px] text-zinc-400 mt-1 max-w-[200px] leading-relaxed">
                  Send a message or react with emojis during video streaming.
                </p>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="mt-3 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-medium text-zinc-300 flex items-center gap-1.5 transition-colors"
                >
                  {copiedInvite ? (
                    <>
                      <Check size={12} className="text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
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
                    <div className="flex items-center gap-1.5 text-[10px] px-1 select-text">
                      <span className={`font-semibold ${isMe ? 'text-indigo-400' : 'text-zinc-300'}`}>
                        {msg.username}
                      </span>
                      {msg.role === 'HOST' && (
                        <span className="text-[9px] font-semibold px-1 py-0.2 bg-amber-500/15 text-amber-300 rounded border border-amber-500/30">
                          HOST
                        </span>
                      )}
                      {msg.role === 'MODERATOR' && (
                        <span className="text-[9px] font-semibold px-1 py-0.2 bg-indigo-500/15 text-indigo-300 rounded border border-indigo-500/30">
                          MOD
                        </span>
                      )}
                      <span className="text-[10px] text-zinc-500 font-mono">{formattedTime}</span>
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-lg text-xs leading-relaxed break-words select-text ${
                        isMe
                          ? 'bg-indigo-600/20 border border-indigo-500/30 text-white rounded-br-xs'
                          : 'bg-zinc-800/70 border border-white/5 text-zinc-200 rounded-bl-xs'
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

          {/* Quick Reaction Bar */}
          <div className="px-3 py-1.5 border-t border-white/5 bg-zinc-950/40 flex items-center justify-between gap-1">
            <span className="text-[10px] font-medium text-zinc-500 shrink-0">React:</span>
            <div className="flex items-center gap-1">
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onSendReaction(emoji)}
                  title={`Send ${emoji} reaction`}
                  className="w-7 h-7 flex items-center justify-center text-sm rounded-md hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Message Input Box */}
          <form
            onSubmit={handleFormSubmit}
            className="p-2.5 border-t border-white/10 bg-zinc-950/60 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Send message..."
              maxLength={250}
              enterKeyHint="send"
              className="flex-1 px-3 py-2 bg-zinc-900 border border-white/10 rounded-md text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              title="Send"
              className="p-2 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors flex items-center justify-center shrink-0 cursor-pointer"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: PARTICIPANTS */}
      {activeTab === 'participants' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {participants.map((p) => {
            const isCurrentUser = p.userId === currentUserId;
            const isMenuOpen = activeMenuUserId === p.userId;

            return (
              <div
                key={p.userId}
                className={`relative flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                  isCurrentUser
                    ? 'bg-indigo-950/20 border-indigo-500/25'
                    : 'bg-zinc-800/30 border-white/5 hover:border-white/10'
                }`}
              >
                {/* User Info */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center font-semibold text-white text-xs shrink-0">
                    {p.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white truncate max-w-[130px]">
                        {p.username}
                      </span>
                      {isCurrentUser && (
                        <span className="text-[9px] uppercase font-bold text-indigo-400 bg-indigo-500/10 px-1 py-0.2 rounded">
                          YOU
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5">
                      <RoleBadge role={p.role} size="sm" />
                    </div>
                  </div>
                </div>

                {/* Host Actions Menu */}
                {isHost && !isCurrentUser && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setActiveMenuUserId(isMenuOpen ? null : p.userId)}
                      className="p-1.5 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <MoreVertical size={15} />
                    </button>

                    {isMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-30"
                          onClick={() => setActiveMenuUserId(null)}
                        />
                        <div className="absolute right-0 top-8 z-40 w-48 bg-zinc-900 border border-white/15 rounded-lg shadow-lg p-1.5 flex flex-col gap-0.5 text-xs animate-scale-up">
                          {p.role === 'PARTICIPANT' && (
                            <button
                              type="button"
                              onClick={() => {
                                onAssignRole(p.userId, 'MODERATOR');
                                setActiveMenuUserId(null);
                              }}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-zinc-200 hover:bg-indigo-600 hover:text-white transition-colors text-left"
                            >
                              <ShieldCheck size={14} className="text-indigo-400" />
                              <span>Promote to Mod</span>
                            </button>
                          )}

                          {p.role === 'MODERATOR' && (
                            <button
                              type="button"
                              onClick={() => {
                                onAssignRole(p.userId, 'PARTICIPANT');
                                setActiveMenuUserId(null);
                              }}
                              className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-zinc-200 hover:bg-amber-600 hover:text-white transition-colors text-left"
                            >
                              <ShieldAlert size={14} className="text-amber-400" />
                              <span>Demote to Viewer</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Transfer Host role to ${p.username}?`)) {
                                onTransferHost(p.userId);
                              }
                              setActiveMenuUserId(null);
                            }}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-amber-300 hover:bg-amber-600 hover:text-white transition-colors text-left"
                          >
                            <Crown size={14} className="text-amber-400" />
                            <span>Transfer Host</span>
                          </button>

                          <div className="h-px bg-white/10 my-0.5" />

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Kick ${p.username} from the watch party?`)) {
                                onRemoveParticipant(p.userId);
                              }
                              setActiveMenuUserId(null);
                            }}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-rose-400 hover:bg-rose-600 hover:text-white transition-colors text-left"
                          >
                            <UserMinus size={14} />
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
