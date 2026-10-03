import React, { useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import {
  Check,
  LogOut,
  Video,
  Share2,
  Tv,
  AlertCircle,
  ArrowLeft,
  MessageSquare,
  Play,
  Clipboard,
  ExternalLink,
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
  const [isQuickPasteOpen, setIsQuickPasteOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
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
      setIsQuickPasteOpen(false);
      return;
    }

    setQuickUrlError(null);
    handleChangeVideo(extracted);
    setQuickUrl('');
    setIsQuickPasteOpen(false);
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setQuickUrl(text);
        const extracted = extractYouTubeVideoId(text.trim());
        if (extracted && isController) {
          handleChangeVideo(extracted);
          setQuickUrl('');
          setIsQuickPasteOpen(false);
        }
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

            {/* 3. Essential Video Information & Stream Actions Bar */}
            <div className="card p-3 sm:p-3.5 flex flex-col gap-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                {/* Left: Video Details & YouTube Link */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="text-xs font-medium text-zinc-300">Live Video:</span>
                  <a
                    href={`https://www.youtube.com/watch?v=${room.currentVideoId}`}
                    target="_blank"
                    rel="noreferrer"
                    title="Open video on YouTube"
                    className="font-mono text-xs text-indigo-300 hover:text-indigo-200 font-medium px-2 py-0.5 rounded bg-white/[0.04] border border-white/5 flex items-center gap-1 transition-colors truncate"
                  >
                    <span>{room.currentVideoId}</span>
                    <ExternalLink size={11} className="shrink-0 text-zinc-400" />
                  </a>
                </div>

                {/* Right: Quick Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsQuickPasteOpen(!isQuickPasteOpen)}
                    className="px-2.5 py-1 text-xs font-medium text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] rounded-md transition-colors border border-white/5 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Video size={13} className="text-indigo-400" />
                    <span>{isQuickPasteOpen ? 'Close URL' : 'Quick URL'}</span>
                  </button>

                  {isController && (
                    <button
                      type="button"
                      onClick={() => setIsVideoModalOpen(true)}
                      className="btn-primary py-1 px-3 text-xs"
                    >
                      <span>Change Video</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Expandable Quick-Paste URL Input */}
              {isQuickPasteOpen && (
                <form
                  onSubmit={handleQuickStream}
                  className="pt-2 border-t border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 animate-fade-in"
                >
                  <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-md border border-white/10">
                    <input
                      type="text"
                      value={quickUrl}
                      onChange={(e) => {
                        setQuickUrl(e.target.value);
                        if (quickUrlError) setQuickUrlError(null);
                      }}
                      placeholder={
                        isController
                          ? 'Paste YouTube URL or ID to play immediately...'
                          : 'Paste YouTube link to suggest to room...'
                      }
                      autoFocus
                      className="w-full bg-transparent border-0 text-white placeholder-zinc-500 text-xs focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={handlePasteClipboard}
                      title="Paste from clipboard"
                      className="p-1 rounded text-zinc-400 hover:text-white transition-colors shrink-0 cursor-pointer"
                    >
                      <Clipboard size={13} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="submit"
                      disabled={!quickUrl.trim()}
                      className="btn-primary py-1.5 px-3 text-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Play size={12} fill="currentColor" />
                      <span>{isController ? 'Stream Video' : 'Suggest'}</span>
                    </button>
                  </div>
                </form>
              )}

              {quickUrlError && (
                <p className="text-xs text-rose-400 flex items-center gap-1">
                  <AlertCircle size={12} /> {quickUrlError}
                </p>
              )}
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
