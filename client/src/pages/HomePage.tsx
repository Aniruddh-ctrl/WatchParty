import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tv,
  Plus,
  ArrowRight,
  ShieldCheck,
  Zap,
  MessageSquare,
  Video,
} from 'lucide-react';
import { extractYouTubeVideoId } from '../utils/youtube';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState(
    localStorage.getItem('wp_last_username') || `Guest_${Math.floor(100 + Math.random() * 900)}`
  );
  const [videoUrl, setVideoUrl] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleCreateRoom = () => {
    if (!username.trim()) {
      setError('Please enter a display name to continue.');
      return;
    }

    let initialVideoId: string | undefined;
    if (videoUrl.trim()) {
      const extracted = extractYouTubeVideoId(videoUrl.trim());
      if (!extracted) {
        setError('The YouTube URL is invalid. Please provide a valid link or leave it blank.');
        return;
      }
      initialVideoId = extracted;
    }

    localStorage.setItem('wp_last_username', username.trim());
    const newRoomId = `party-${Math.random().toString(36).slice(2, 8)}`;
    navigate(`/room/${newRoomId}`, {
      state: {
        username: username.trim(),
        initialVideoId,
      },
    });
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter your display name.');
      return;
    }
    if (!roomCode.trim()) {
      setError('Please enter a room code or invite URL.');
      return;
    }
    localStorage.setItem('wp_last_username', username.trim());

    let cleanCode = roomCode.trim();
    if (cleanCode.includes('/room/')) {
      cleanCode = cleanCode.split('/room/')[1].split('?')[0];
    } else if (cleanCode.includes('/join/')) {
      cleanCode = cleanCode.split('/join/')[1].split('?')[0];
    }

    navigate(`/room/${cleanCode}`, { state: { username: username.trim() } });
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-white flex flex-col justify-between">
      {/* Navigation Header */}
      <header className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-5 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center text-white">
            <Tv size={18} />
          </div>
          <span className="font-semibold text-base tracking-tight text-white">
            WatchParty
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Real-Time Sync
          </span>
        </div>
      </header>

      {/* Hero & Interactive Action Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 flex-1 flex flex-col items-center justify-center text-center">
        {/* Clean pill badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-medium text-zinc-300 mb-5">
          <Zap size={13} className="text-indigo-400" />
          <span>Synchronized YouTube streaming with friends</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight max-w-2xl text-white leading-tight">
          Watch YouTube together, <br className="hidden sm:inline" />
          in perfect synchronization.
        </h1>

        {/* Subtitle */}
        <p className="mt-3.5 text-sm sm:text-base text-zinc-400 max-w-xl font-normal leading-relaxed">
          Create a private party room, invite friends with a link, and watch videos in unison with sub-second playback sync, live chat, and reactions.
        </p>

        {/* Action Panel Card */}
        <div className="mt-8 w-full max-w-md card p-5 sm:p-6 text-left">
          {/* Display Name Input */}
          <div className="mb-3.5">
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Your Display Name
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Alex"
              maxLength={25}
              className="w-full h-11 px-3.5 bg-zinc-900 border border-white/15 rounded-lg text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Optional Video URL input upfront */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              YouTube Video URL <span className="text-zinc-500 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => {
                  setVideoUrl(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Paste YouTube URL (or add it later in the room)"
                className="w-full h-11 pl-9 pr-3.5 bg-zinc-900 border border-white/15 rounded-lg text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <Video size={15} className="absolute left-3 top-3.5 text-zinc-500" />
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Leave blank if you prefer to paste a video after entering the party.
            </p>
          </div>

          {error && <p className="text-xs text-rose-400 mb-3 font-medium">{error}</p>}

          {/* Create Button */}
          <button
            type="button"
            onClick={handleCreateRoom}
            className="w-full btn-primary h-11 text-sm font-semibold flex items-center justify-center gap-2 rounded-lg"
          >
            <Plus size={16} />
            <span>Create Watch Room</span>
          </button>

          {/* Clean flex divider */}
          <div className="flex items-center gap-2.5 my-4">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
              or join existing room
            </span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          {/* Join Form */}
          <form onSubmit={handleJoinRoom} className="flex gap-2">
            <input
              type="text"
              value={roomCode}
              onChange={(e) => {
                setRoomCode(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter room code or link (e.g. party-abc1)"
              className="flex-1 h-11 px-3.5 bg-zinc-900 border border-white/15 rounded-lg text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors font-mono"
            />
            <button
              type="submit"
              className="h-11 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center shrink-0 cursor-pointer"
            >
              <ArrowRight size={16} />
            </button>
          </form>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-3xl w-full text-left">
          <div className="card p-4 hover:border-white/15 transition-colors">
            <div className="w-7 h-7 rounded-md bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-2.5">
              <Zap size={15} />
            </div>
            <h3 className="text-xs font-semibold text-white">Sub-Second Sync</h3>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              Drift-resistant playback with elapsed time correction for joining and reconnecting viewers.
            </p>
          </div>

          <div className="card p-4 hover:border-white/15 transition-colors">
            <div className="w-7 h-7 rounded-md bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-2.5">
              <MessageSquare size={15} />
            </div>
            <h3 className="text-xs font-semibold text-white">Live Chat & Reactions</h3>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              Real-time room chat with animated floating emojis that float directly over the video.
            </p>
          </div>

          <div className="card p-4 hover:border-white/15 transition-colors">
            <div className="w-7 h-7 rounded-md bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-2.5">
              <ShieldCheck size={15} />
            </div>
            <h3 className="text-xs font-semibold text-white">Role Controls</h3>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              Host, Moderator, and Viewer roles validated on the server to prevent unauthorized playback tampering.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-5 text-center text-xs text-zinc-500 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>WatchParty &bull; Synchronized streaming platform</span>
        <span className="font-mono text-[11px] text-zinc-600">TypeScript &bull; React &bull; Socket.IO</span>
      </footer>
    </div>
  );
};
