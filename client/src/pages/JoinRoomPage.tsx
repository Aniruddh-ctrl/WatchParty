import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Users, ArrowLeft, LogIn } from 'lucide-react';

export const JoinRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const [username, setUsername] = useState(
    localStorage.getItem('wp_last_username') || `Guest_${Math.floor(100 + Math.random() * 900)}`
  );
  const [error, setError] = useState<string | null>(null);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter your display name to join.');
      return;
    }
    if (!roomId) {
      setError('Room ID is missing in the invite URL.');
      return;
    }

    localStorage.setItem('wp_last_username', username.trim());
    navigate(`/room/${roomId.trim().toLowerCase()}`, {
      state: { username: username.trim() },
    });
  };

  return (
    <div className="min-h-screen bg-[#06070b] text-white flex flex-col justify-center items-center px-4 py-12 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[480px] h-[480px] bg-indigo-600/20 rounded-full blur-[140px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </Link>

        <div className="glass-panel p-8 rounded-3xl shadow-2xl border border-white/15 backdrop-blur-2xl">
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-violet-600 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Users size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-white">Join Watch Party</h2>
              <p className="text-xs text-indigo-400 font-mono font-semibold">Room Code: {roomId}</p>
            </div>
          </div>

          <form onSubmit={handleJoin} className="space-y-5">
            <div>
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
                required
                maxLength={30}
                placeholder="e.g. Charlie"
                autoFocus
                className="w-full px-4 py-3 bg-zinc-900/90 border border-white/10 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-indigo-500 transition-all font-medium"
              />
            </div>

            {error && <p className="text-xs text-rose-400 font-semibold">{error}</p>}

            <button
              type="submit"
              className="w-full btn-primary py-3.5 text-sm flex items-center justify-center gap-2 shadow-xl"
            >
              <LogIn size={18} />
              <span>Enter Watch Room</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
