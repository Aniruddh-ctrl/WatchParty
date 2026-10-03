import React, { useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import {
  Check,
  LogOut,
  Share2,
  Tv,
  AlertCircle,
  ArrowLeft,
  MessageSquare,
  Play,
  Clipboard,
  ExternalLink,
  Copy,
  X,
  CheckCircle2,
} from 'lucide-react';
import { ConnectionBadge } from '../components/ConnectionBadge';
import { ChatAndParticipantsPanel } from '../components/ChatAndParticipantsPanel';
import { PlaybackControls } from '../components/PlaybackControls';
import { ToastContainer } from '../components/ToastContainer';
import { VideoChangeModal } from '../components/VideoChangeModal';
import { YouTubePlayer } from '../components/YouTubePlayer';
import { useWatchParty } from '../hooks/useWatchParty';
import { RoleBadge } from '../components/RoleBadge';
import { extractYouTubeVideoId } from '../utils/youtube';

export const WatchRoomPage: React.FC = () => {
  const { roomId = '' } = useParams<{ roomId: string }>();
  const location = useLocation();

  // Retrieve initial username from route state or storage
  const stateUsername = (location.state as { username?: string })?.username;
  const initialVideoId = (location.state as { initialVideoId?: string })?.initialVideoId;

  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedVideoLink, setCopiedVideoLink] = useState(false);
  const [mobileTab, setMobileTab] = useState<'player' | 'chat'>('player');
  const [isMuted, setIsMuted] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [quickUrl, setQuickUrl] = useState('');
  const [quickUrlError, setQuickUrlError] = useState<string | null>(null);

  const {
    room,
    currentUser,
    connectionStatus,
    isLoading,
    roomNotFound,
    toasts,
    chatMessages,
    reactions,
    playerRef,
    handlePlay,
    handlePause,
    handleSeek,
    handleChangeVideo,
    handleAssignRole,
    handleRemoveParticipant,
    handleTransferHost,
    handleLeaveRoom,
    handleForceResync,
    handleSendChat,
    handleSendReaction,
    removeToast,
  } = useWatchParty(roomId, stateUsername);

  // If host provided an initial video ID on creation
  React.useEffect(() => {
    if (initialVideoId && currentUser?.role === 'HOST' && room?.currentVideoId !== initialVideoId) {
      handleChangeVideo(initialVideoId);
    }
  }, [initialVideoId, currentUser?.role, room?.currentVideoId, handleChangeVideo]);

  const isHost = currentUser?.role === 'HOST';
  const isController = currentUser?.role === 'HOST' || currentUser?.role === 'MODERATOR';

  const handleCopyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/join/${roomId}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleVolumeChange = (vol: number) => {
    playerRef.current?.setVolume(vol);
    if (vol > 0 && isMuted) {
      playerRef.current?.unMute();
      setIsMuted(false);
    }
  };

  const handleToggleMute = () => {
    if (isMuted) {
      playerRef.current?.unMute();
      setIsMuted(false);
    } else {
      playerRef.current?.mute();
      setIsMuted(true);
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const handleQuickStream = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = quickUrl.trim();
    if (!trimmed) return;

    const extracted = extractYouTubeVideoId(trimmed);
    if (!extracted) {
      setQuickUrlError('Invalid YouTube URL or ID.');
      return;
    }

    if (!isController) {
      handleSendChat(`💡 Suggested video: https://www.youtube.com/watch?v=${extracted}`);
      setQuickUrl('');
      setQuickUrlError(null);
      return;
    }

    setQuickUrlError(null);
    handleChangeVideo(extracted);
    setQuickUrl('');
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setQuickUrl(text.trim());
        if (quickUrlError) setQuickUrlError(null);
      }
    } catch {}
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090a0f] text-white flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
        <h2 className="text-sm font-semibold text-zinc-200">Connecting to Watch Party...</h2>
        <p className="text-xs text-zinc-500 mt-1.5 font-mono">
          Room: {roomId}
        </p>
      </div>
    );
  }

  // 2. Room Not Found State
  if (roomNotFound || !room) {
    return (
      <div className="min-h-screen bg-[#090a0f] text-white flex flex-col items-center justify-center p-4 text-center">
        <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 mb-3 border border-rose-500/20">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-white mb-1.5">Room Not Found</h2>
        <p className="text-xs text-zinc-400 max-w-sm mb-5">
          The room <span className="font-mono text-zinc-200 font-medium">"{roomId}"</span> could not be found or has ended.
        </p>
        <Link to="/" className="btn-primary">
          <ArrowLeft size={15} />
          <span>Return Home</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090a0f] text-white flex flex-col">
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Video Change Modal */}
      <VideoChangeModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        onSubmit={handleChangeVideo}
        currentVideoId={room.currentVideoId}
      />

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-[#0c0e15] border-b border-white/10 px-3 sm:px-6 py-2.5 flex items-center justify-between shadow-xs">
        {/* Left: Brand, Room ID, Live status */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link
            to="/"
            className="flex items-center gap-2 text-white hover:text-indigo-300 transition-colors shrink-0"
            title="WatchParty Home"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-indigo-600 flex items-center justify-center text-white shrink-0">
              <Tv size={16} />
            </div>
            <span className="font-semibold text-sm tracking-tight hidden sm:inline">
              WatchParty
            </span>
          </Link>

          <div className="h-4 w-px bg-white/10 hidden sm:block"></div>

          {/* Room ID Tag */}
          <button
            type="button"
            onClick={handleCopyInviteLink}
            title="Click to copy room code"
            className="font-mono text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-md text-zinc-300 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <span className="text-zinc-500 font-sans hidden md:inline">Room:</span>
            <span className="font-semibold text-indigo-300">{room.roomId}</span>
          </button>

          <ConnectionBadge status={connectionStatus} />
        </div>

        {/* Right: Actions (User tag, Invite button, Leave button) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {currentUser && (
            <div className="hidden md:flex items-center gap-2 bg-white/[0.03] px-2.5 py-1 rounded-md border border-white/5">
              <span className="text-xs font-medium text-zinc-300">{currentUser.username}</span>
              <RoleBadge role={currentUser.role} size="sm" />
            </div>
          )}

          {/* Copy Invite Link Button */}
          <button
            type="button"
            onClick={handleCopyInviteLink}
            title="Copy invitation link"
            className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs font-medium bg-white/[0.05] hover:bg-white/[0.09] text-zinc-200 rounded-md transition-colors border border-white/10 cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check size={13} className="text-emerald-400" />
                <span className="text-emerald-400 font-semibold hidden sm:inline">Copied!</span>
              </>
            ) : (
              <>
                <Share2 size={13} className="text-zinc-400" />
                <span className="hidden sm:inline">Invite</span>
              </>
            )}
          </button>

          {/* Leave Button */}
          <button
            type="button"
            onClick={handleLeaveRoom}
            title="Leave room"
            className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs font-medium text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 rounded-md transition-colors border border-rose-500/20 cursor-pointer"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </header>

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex border-b border-white/10 bg-[#0c0e15] sticky top-[49px] z-30">
        <button
          type="button"
          onClick={() => setMobileTab('player')}
          className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors cursor-pointer ${
            mobileTab === 'player'
              ? 'border-indigo-500 text-white bg-white/[0.03]'
              : 'border-transparent text-zinc-400'
          }`}
        >
          <Tv size={14} />
          <span>Player & Controls</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('chat')}
          className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors cursor-pointer ${
            mobileTab === 'chat'
              ? 'border-indigo-500 text-white bg-white/[0.03]'
              : 'border-transparent text-zinc-400'
          }`}
        >
          <MessageSquare size={14} />
          <span>Chat & Members</span>
          {chatMessages.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-medium bg-indigo-500/20 text-indigo-300">
              {chatMessages.length}
            </span>
          )}
        </button>
      </div>

      {/* Main Workspace Cinema Layout */}
      <main className="flex-1 max-w-[1920px] mx-auto w-full p-2.5 sm:p-4 lg:p-6">
        <div className={`cinema-layout ${isTheaterMode ? 'flex-col' : ''}`}>
          {/* Left Column: Video Player, Controls & Metadata */}
          <div
            className={`cinema-player-col ${
              mobileTab === 'chat' ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {/* 1. PRIMARY FOCUS: The Video Player (At the very top with maximized vertical height!) */}
            <div className="w-full">
              <YouTubePlayer
                ref={playerRef}
                videoId={room.currentVideoId}
                isController={isController}
                reactions={reactions}
                onPlay={handlePlay}
                onPause={handlePause}
                onSeek={handleSeek}
                onChangeVideoClick={() => setIsVideoModalOpen(true)}
                onReady={() => {
                  if (room) {
                    if (playerRef.current) {
                      playerRef.current.seekTo(room.currentTime);
                      if (room.playState === 'PLAYING') {
                        playerRef.current.play();
                      }
                    }
                  }
                }}
              />
            </div>

            {/* 2. Synchronized Playback Controls Bar */}
            <PlaybackControls
              playState={room.playState}
              isController={isController}
              onPlay={() => handlePlay(playerRef.current?.getCurrentTime() ?? room.currentTime)}
              onPause={() => handlePause(playerRef.current?.getCurrentTime() ?? room.currentTime)}
              onSeek={handleSeek}
              onResync={handleForceResync}
              getCurrentTime={() => playerRef.current?.getCurrentTime() ?? room.currentTime}
              getDuration={() => playerRef.current?.getDuration() ?? 0}
              onVolumeChange={handleVolumeChange}
              onToggleMute={handleToggleMute}
              isMuted={isMuted}
              onToggleFullscreen={handleToggleFullscreen}
              isTheaterMode={isTheaterMode}
              onToggleTheaterMode={() => setIsTheaterMode(!isTheaterMode)}
            />

            {/* 3. Dedicated YouTube Video URL Box (Always Visible, Substantial & Prominent) */}
            <div className="card p-4 sm:p-5 flex flex-col gap-3.5 shadow-sm">
              {/* Header row: Status of active video or instructions */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pb-1">
                {room.currentVideoId ? (
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                    <span className="text-xs sm:text-sm font-semibold text-white">Playing Video:</span>
                    <a
                      href={`https://www.youtube.com/watch?v=${room.currentVideoId}`}
                      target="_blank"
                      rel="noreferrer"
                      title="Open in YouTube"
                      className="font-mono text-xs sm:text-sm text-indigo-300 hover:text-indigo-200 font-medium px-2 py-0.5 rounded bg-white/[0.05] border border-white/10 flex items-center gap-1.5 transition-colors truncate max-w-[240px] sm:max-w-md"
                    >
                      <span>https://www.youtube.com/watch?v={room.currentVideoId}</span>
                      <ExternalLink size={12} className="shrink-0 text-zinc-400" />
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse shrink-0"></span>
                    <span className="text-xs sm:text-sm font-semibold text-white">Paste YouTube Video URL</span>
                    <span className="text-xs text-zinc-400 hidden sm:inline">&bull; Stream together in sync</span>
                  </div>
                )}

                {room.currentVideoId && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${room.currentVideoId}`);
                      setCopiedVideoLink(true);
                      setTimeout(() => setCopiedVideoLink(false), 2000);
                    }}
                    className="px-2.5 py-1 text-xs font-medium text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {copiedVideoLink ? (
                      <>
                        <Check size={12} className="text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Main Form: Prominent, comfortable YouTube URL Box */}
              <form
                onSubmit={handleQuickStream}
                className="flex flex-col sm:flex-row items-stretch gap-2.5 sm:gap-3"
              >
                {/* Robust Input Container (h-12 on mobile, h-14 on desktop — comfortable, never thin or squashed!) */}
                <div className="flex-1 relative flex items-center bg-[#0d1017] border border-white/15 hover:border-white/25 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 rounded-lg sm:rounded-xl transition-all h-12 sm:h-14 px-3 sm:px-4">
                  {/* YouTube / Video Icon */}
                  <div className="w-7 h-7 rounded-md bg-red-600/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0 mr-2">
                    <Play size={14} fill="currentColor" />
                  </div>

                  {/* The Actual URL Input */}
                  <input
                    type="text"
                    value={quickUrl}
                    onChange={(e) => {
                      setQuickUrl(e.target.value);
                      if (quickUrlError) setQuickUrlError(null);
                    }}
                    placeholder={
                      isController
                        ? 'Paste YouTube link or Video ID (e.g. https://www.youtube.com/watch?v=...)'
                        : 'Paste YouTube link to suggest to the room...'
                    }
                    className="flex-1 bg-transparent border-0 text-white placeholder-zinc-500 text-xs sm:text-sm md:text-base focus:outline-none font-normal min-w-0"
                  />

                  {/* Action buttons inside the input bar: Clear + Paste */}
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {quickUrl && (
                      <button
                        type="button"
                        onClick={() => setQuickUrl('')}
                        title="Clear input"
                        className="p-1 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      >
                        <X size={15} />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handlePasteClipboard}
                      title="Paste from clipboard"
                      className="px-2.5 sm:px-3 py-1.5 rounded-md bg-white/[0.06] hover:bg-white/[0.12] text-xs font-medium text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5 border border-white/10 cursor-pointer"
                    >
                      <Clipboard size={13} />
                      <span className="hidden xs:inline">Paste</span>
                    </button>
                  </div>
                </div>

                {/* Primary Stream Video Action Button (Matches h-12 / h-14 height!) */}
                <button
                  type="submit"
                  disabled={!quickUrl.trim()}
                  className="btn-primary h-12 sm:h-14 px-6 sm:px-8 text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl shrink-0 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm transition-all"
                >
                  <Play size={15} fill="currentColor" />
                  <span>{isController ? (room.currentVideoId ? 'Change Video' : 'Stream Video') : 'Suggest Video'}</span>
                </button>
              </form>

              {/* Error Message */}
              {quickUrlError && (
                <p className="text-xs sm:text-sm text-rose-400 flex items-center gap-1.5 animate-fade-in">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{quickUrlError}</span>
                </p>
              )}

              {/* Subtitle / Helper information */}
              <div className="flex flex-wrap items-center justify-between text-[11px] sm:text-xs text-zinc-400 gap-2 pt-0.5">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-indigo-400 shrink-0" />
                  <span>Supports any YouTube video URL, youtu.be shortlink, or 11-char Video ID</span>
                </span>
                {isController ? (
                  <span className="text-indigo-300 font-medium">Host/Moderator: Updates live for all viewers</span>
                ) : (
                  <span className="text-zinc-500">Only Host or Moderator can change stream</span>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Sidebar (Chat & People) */}
          <div
            className={`${
              isTheaterMode
                ? 'w-full max-w-4xl mx-auto h-[540px]'
                : 'cinema-sidebar-col'
            } ${mobileTab === 'player' ? 'hidden lg:block' : 'block'}`}
          >
            <ChatAndParticipantsPanel
              participants={room.participants}
              currentUserId={currentUser?.userId}
              isHost={isHost}
              chatMessages={chatMessages}
              onSendMessage={handleSendChat}
              onSendReaction={handleSendReaction}
              onAssignRole={handleAssignRole}
              onRemoveParticipant={handleRemoveParticipant}
              onTransferHost={handleTransferHost}
            />
          </div>
        </div>
      </main>
    </div>
  );
};
