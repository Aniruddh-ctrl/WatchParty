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
    <div className="min-h-screen bg-[#090a0f] text-white flex flex-col justify-center items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors mb-5"
        >
          <ArrowLeft size={14} />
          <span>Back to Home</span>
        </Link>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-md bg-indigo-600 flex items-center justify-center text-white shrink-0">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Join Watch Party</h2>
              <p className="text-xs text-indigo-400 font-mono font-medium">Room: {roomId}</p>
            </div>
          </div>

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
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
                required
                maxLength={30}
                placeholder="e.g. Charlie"
                autoFocus
                className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-md text-white placeholder-zinc-500 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}

            <button
              type="submit"
              className="w-full btn-primary py-2.5 text-sm font-medium flex items-center justify-center gap-1.5"
            >
              <LogIn size={15} />
              <span>Enter Watch Room</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
