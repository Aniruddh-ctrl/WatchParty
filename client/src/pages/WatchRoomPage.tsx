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
    setTimeout(() => setCopiedLink(false), 2500);
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
        setQuickUrl(text);
        const extracted = extractYouTubeVideoId(text.trim());
        if (extracted && isController) {
          handleChangeVideo(extracted);
          setQuickUrl('');
        }
      }
    } catch {}
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#06070b] text-white flex flex-col items-center justify-center p-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
          <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full"></div>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-100">Connecting to Watch Party...</h2>
        <p className="text-xs text-zinc-400 mt-2 font-mono bg-white/5 px-3 py-1 rounded-full border border-white/10">
          Room: {roomId}
        </p>
      </div>
    );
  }

  // 2. Room Not Found State
  if (roomNotFound || !room) {
    return (
      <div className="min-h-screen bg-[#06070b] text-white flex flex-col items-center justify-center p-4 text-center">
        <div className="p-4 rounded-3xl bg-rose-500/10 text-rose-400 mb-4 border border-rose-500/20 shadow-xl shadow-rose-500/10">
          <AlertCircle size={40} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Room Not Found</h2>
        <p className="text-sm text-zinc-400 max-w-sm mb-6">
          The room <span className="font-mono text-zinc-200 font-semibold">"{roomId}"</span> could not be found or has ended.
        </p>
        <Link to="/" className="btn-primary">
          <ArrowLeft size={16} />
          <span>Return Home</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06070b] text-white flex flex-col selection:bg-indigo-500 selection:text-white">
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
      <header className="sticky top-0 z-40 bg-zinc-950/85 backdrop-blur-xl border-b border-white/10 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shadow-lg">
        {/* Left: Brand & Room ID */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link
            to="/"
            className="flex items-center gap-2.5 p-1 rounded-2xl hover:bg-white/5 transition-all group"
            title="WatchParty Home"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-violet-600 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
              <Tv size={18} className="text-white" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                WatchParty
              </span>
              <span className="text-[9px] uppercase tracking-wider text-indigo-400 font-bold -mt-0.5">
                Live Cinema
              </span>
            </div>
          </Link>

          <div className="h-4 w-px bg-white/10 hidden sm:block"></div>

          {/* Room ID Tag */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-zinc-400 hidden md:inline">Room:</span>
            <button
              onClick={handleCopyInviteLink}
              title="Click to copy room code"
              className="font-mono text-xs font-bold px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-indigo-300 shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
              <span>{room.roomId}</span>
            </button>
          </div>

          <ConnectionBadge status={connectionStatus} />
        </div>

        {/* Right: Actions (Copy Link, Role badge, Leave) */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {currentUser && (
            <div className="hidden md:flex items-center gap-2 bg-white/5 px-2.5 py-1 rounded-xl border border-white/5">
              <span className="text-xs font-semibold text-zinc-300">{currentUser.username}</span>
              <RoleBadge role={currentUser.role} size="sm" />
            </div>
          )}

          {/* Copy Invite Link Button */}
          <button
            onClick={handleCopyInviteLink}
            title="Copy invitation link"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/5 hover:bg-white/10 text-zinc-200 rounded-xl transition-all border border-white/10 active:scale-95 shadow-sm cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check size={14} className="text-emerald-400" />
                <span className="text-emerald-400 font-bold hidden sm:inline">Copied!</span>
              </>
            ) : (
              <>
                <Share2 size={14} className="text-indigo-400" />
                <span className="hidden sm:inline">Invite</span>
              </>
            )}
          </button>

          {/* Leave Button */}
          <button
            onClick={handleLeaveRoom}
            title="Leave room"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-600 rounded-xl transition-all border border-rose-500/20 active:scale-95 cursor-pointer"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </header>

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex border-b border-white/10 bg-zinc-950/80 backdrop-blur-md sticky top-[53px] z-30">
        <button
          onClick={() => setMobileTab('player')}
          className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
            mobileTab === 'player'
              ? 'border-indigo-500 text-indigo-300 bg-white/5'
              : 'border-transparent text-zinc-400'
          }`}
        >
          <Tv size={15} />
          <span>Player & Controls</span>
        </button>
        <button
          onClick={() => setMobileTab('chat')}
          className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
            mobileTab === 'chat'
              ? 'border-indigo-500 text-indigo-300 bg-white/5'
              : 'border-transparent text-zinc-400'
          }`}
        >
          <MessageSquare size={15} />
          <span>Chat & Members</span>
          {chatMessages.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-500/25 text-indigo-300">
              {chatMessages.length}
            </span>
          )}
        </button>
      </div>

      {/* Main Workspace Layout (Expanded Cinema Width: max-w-[1720px] 2xl:max-w-[1920px]) */}
      <main
        className={`flex-1 max-w-[1720px] 2xl:max-w-[1920px] mx-auto w-full p-2 sm:p-5 xl:p-8 grid grid-cols-1 ${
          isTheaterMode ? 'gap-6' : 'lg:grid-cols-12 gap-6'
        } items-start`}
      >
        {/* Left Column: Video Player, Quick Paste Bar & Controls */}
        <div
          className={`${
            isTheaterMode
              ? 'col-span-1 lg:col-span-12'
              : 'lg:col-span-7 xl:col-span-8 2xl:col-span-9'
          } flex flex-col gap-3.5 ${mobileTab === 'chat' ? 'hidden lg:flex' : 'flex'}`}
        >
          {/* Quick-Paste YouTube Link Bar */}
          <div className="glass-panel p-2 sm:p-2.5 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2 border border-white/10 shadow-lg">
            <form onSubmit={handleQuickStream} className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-zinc-900/90 rounded-xl border border-white/10">
              <Video size={16} className="text-indigo-400 shrink-0" />
              <input
                type="text"
                value={quickUrl}
                onChange={(e) => {
                  setQuickUrl(e.target.value);
                  if (quickUrlError) setQuickUrlError(null);
                }}
                placeholder={
                  isController
                    ? 'Paste any YouTube URL or ID to play immediately...'
                    : 'Paste YouTube link to suggest to room...'
                }
                className="w-full bg-transparent border-0 text-white placeholder-zinc-500 text-xs sm:text-sm focus:outline-none font-medium"
              />
              <button
                type="button"
                onClick={handlePasteClipboard}
                title="Paste from clipboard"
                className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors shrink-0 cursor-pointer"
              >
                <Clipboard size={14} />
              </button>
            </form>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleQuickStream()}
                disabled={!quickUrl.trim()}
                className="btn-primary py-2 px-4 text-xs font-bold shrink-0 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex-1 sm:flex-initial"
              >
                <Play size={13} fill="currentColor" />
                <span>{isController ? 'Stream Video' : 'Suggest'}</span>
              </button>
            </div>
          </div>

          {quickUrlError && (
            <p className="text-xs text-rose-400 font-semibold px-2 flex items-center gap-1">
              <AlertCircle size={13} /> {quickUrlError}
            </p>
          )}

          {/* Video Player Info Banner */}
          <div className="flex items-center justify-between px-2 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              <span className="font-semibold text-zinc-300">Live Video:</span>
              <a
                href={`https://www.youtube.com/watch?v=${room.currentVideoId}`}
                target="_blank"
                rel="noreferrer"
                title="Open video on YouTube"
                className="font-mono text-indigo-300 hover:text-indigo-200 font-bold bg-white/5 px-2 py-0.5 rounded-lg border border-white/5 transition-colors"
              >
                {room.currentVideoId} ↗
              </a>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-500 hidden sm:inline">
                {isController ? 'Host Master Controls Active' : 'Viewer Sync Active'}
              </span>
            </div>
          </div>

          {/* YouTube Player Component with Floating Reactions Overlay */}
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

          {/* Synchronized Playback Controls with Volume, Theater Mode & Fullscreen */}
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
        </div>

        {/* Right Column: Large Interactive Sidebar (Live Chat + Floating Reactions + Members) */}
        <div
          className={`${
            isTheaterMode
              ? 'col-span-1 lg:col-span-12 max-w-4xl mx-auto w-full h-[620px] mt-2'
              : 'lg:col-span-5 xl:col-span-4 2xl:col-span-3 h-[640px] xl:h-[740px] 2xl:h-[820px] lg:sticky lg:top-20'
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
      </main>
    </div>
  );
};
