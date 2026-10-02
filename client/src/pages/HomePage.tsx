import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tv,
  Plus,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  MessageSquare,
  Play,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState(
    localStorage.getItem('wp_last_username') || `Guest_${Math.floor(100 + Math.random() * 900)}`
  );
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleCreateRoom = () => {
    if (!username.trim()) {
      setError('Please enter a display name to continue.');
      return;
    }
    localStorage.setItem('wp_last_username', username.trim());
    const newRoomId = `party-${Math.random().toString(36).slice(2, 8)}`;
    navigate(`/room/${newRoomId}`, { state: { username: username.trim() } });
  };

  const handleLaunchDemo = () => {
    const nick = username.trim() || 'Host_Demo';
    localStorage.setItem('wp_last_username', nick);
    const demoRoomId = `party-${Math.random().toString(36).slice(2, 8)}`;
    navigate(`/room/${demoRoomId}`, {
      state: {
        username: nick,
        initialVideoId: 'jfKfPfyJRdk', // Lofi Girl
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
    <div className="min-h-screen bg-[#06070b] text-white flex flex-col justify-between selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Dynamic Background Mesh Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-32 -left-32 w-[520px] h-[520px] bg-indigo-600/20 rounded-full blur-[140px] animate-pulse"></div>
        <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] bg-violet-600/15 rounded-full blur-[140px]"></div>
        <div className="absolute -bottom-32 left-1/3 w-[600px] h-[600px] bg-fuchsia-600/10 rounded-full blur-[160px]"></div>
      </div>

      {/* Navigation Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-violet-600 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Tv size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              WatchParty
            </h1>
            <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-bold">
              Synchronized Streaming
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Socket.IO 4.8 Live
          </span>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12 flex-1 flex flex-col items-center justify-center text-center">
        {/* Top Feature Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-zinc-200 mb-6 backdrop-blur-xl shadow-lg">
          <Sparkles size={14} className="text-amber-400" />
          <span>Sub-second playback sync &bull; Live room chat &bull; Host RBAC controls</span>
        </div>

        {/* Hero Title */}
        <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl leading-[1.12]">
          Stream YouTube together, <br />
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            frame-perfect & in real time.
          </span>
        </h2>

        {/* Subtitle */}
        <p className="mt-4 text-base sm:text-lg text-zinc-400 max-w-2xl font-normal leading-relaxed">
          Create a private party room, invite friends with one click, and watch videos in unison.
          Play, pause, seek, chat, and react with floating emojis in synchronized harmony.
        </p>

        {/* Action Panel Card */}
        <div className="mt-10 w-full max-w-md glass-panel p-7 rounded-3xl shadow-2xl border border-white/15 backdrop-blur-2xl">
          {/* Display Name Input */}
          <div className="text-left mb-5">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
              Your Display Name
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Alex, Sam, Captain"
              maxLength={25}
              className="w-full px-4 py-3 bg-zinc-900/90 border border-white/10 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-indigo-500 transition-all font-medium"
            />
          </div>

          {error && <p className="text-xs text-rose-400 mb-4 text-left font-semibold">{error}</p>}

          {/* Primary Create Button */}
          <div className="flex flex-col gap-2.5">
            <button
              onClick={handleCreateRoom}
              className="w-full btn-primary py-3.5 text-sm"
            >
              <Plus size={18} />
              <span>Create New Room</span>
            </button>

            {/* Quick Demo Party button */}
            <button
              type="button"
              onClick={handleLaunchDemo}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all flex items-center justify-center gap-1.5"
            >
              <Play size={13} className="text-indigo-400" />
              <span>Quick Demo (Lofi Girl Chill Beats)</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="w-full border-t border-white/10"></div>
            <span className="absolute bg-[#0f121d] px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              or join existing room
            </span>
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
              placeholder="Paste room code (e.g. party-7x9k)"
              className="flex-1 px-4 py-2.5 bg-zinc-900/90 border border-white/10 rounded-xl text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-indigo-500 transition-all font-mono"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center active:scale-95"
            >
              <ArrowRight size={17} />
            </button>
          </form>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl w-full text-left">
          <div className="p-5 rounded-2xl bg-white/[0.025] border border-white/5 hover:border-indigo-500/30 hover:bg-white/[0.04] transition-all group">
            <div className="p-2.5 rounded-xl bg-indigo-500/15 text-indigo-400 w-fit mb-3 group-hover:scale-110 transition-transform">
              <Zap size={20} />
            </div>
            <h4 className="text-sm font-bold text-white">Event-Driven Sync</h4>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Drift-resistant playback with elapsed time correction for joining and reconnecting viewers.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.025] border border-white/5 hover:border-violet-500/30 hover:bg-white/[0.04] transition-all group">
            <div className="p-2.5 rounded-xl bg-violet-500/15 text-violet-400 w-fit mb-3 group-hover:scale-110 transition-transform">
              <MessageSquare size={20} />
            </div>
            <h4 className="text-sm font-bold text-white">Live Chat & Reactions</h4>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Real-time room chat with animated floating emojis that float directly over the streaming player.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.025] border border-white/5 hover:border-emerald-500/30 hover:bg-white/[0.04] transition-all group">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 w-fit mb-3 group-hover:scale-110 transition-transform">
              <ShieldCheck size={20} />
            </div>
            <h4 className="text-sm font-bold text-white">Strict Backend RBAC</h4>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Host, Moderator, and Viewer roles validated on the server to prevent unauthorized playback tampering.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 text-center text-xs text-zinc-500 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>YouTube Watch Party &bull; Real-time synchronized streaming architecture</span>
        <span className="font-mono text-[11px] text-zinc-600">TypeScript &bull; React 19 &bull; Socket.IO &bull; Express</span>
      </footer>
    </div>
  );
};
