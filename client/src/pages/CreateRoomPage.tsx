import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Tv, ArrowLeft, Video, CheckCircle2, Shield } from 'lucide-react';
import { extractYouTubeVideoId } from '../utils/youtube';

export const CreateRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState(
    localStorage.getItem('wp_last_username') || `Host_${Math.floor(100 + Math.random() * 900)}`
  );
  const [customRoomId, setCustomRoomId] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Live video preview whenever video URL changes
  useEffect(() => {
    if (!videoUrl.trim()) {
      setPreviewId(null);
      return;
    }
    const extracted = extractYouTubeVideoId(videoUrl.trim());
    setPreviewId(extracted);
  }, [videoUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter your host display name.');
      return;
    }

    let initialVideoId: string | undefined;
    if (videoUrl.trim()) {
      const extracted = extractYouTubeVideoId(videoUrl.trim());
      if (!extracted) {
        setError('The YouTube URL provided is invalid.');
        return;
      }
      initialVideoId = extracted;
    }

    const roomId = customRoomId.trim()
      ? customRoomId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
      : `party-${Math.random().toString(36).slice(2, 8)}`;

    localStorage.setItem('wp_last_username', username.trim());

    navigate(`/room/${roomId}`, {
      state: {
        username: username.trim(),
        initialVideoId,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#06070b] text-white flex flex-col justify-center items-center px-4 py-12 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background glow orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[140px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </Link>

        {/* Card */}
        <div className="glass-panel p-8 rounded-3xl shadow-2xl border border-white/15 backdrop-blur-2xl">
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-violet-600 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Tv size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-white">Create a Watch Room</h2>
              <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-semibold mt-0.5">
                <Shield size={13} />
                <span>You will be the Host with playback master controls</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Host Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Your Display Name <span className="text-rose-400">*</span>
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
                placeholder="e.g. Captain"
                className="w-full px-4 py-3 bg-zinc-900/90 border border-white/10 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-indigo-500 transition-all font-medium"
              />
            </div>

            {/* Custom Room Code (Optional) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Custom Room Code <span className="text-zinc-500 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={customRoomId}
                onChange={(e) => setCustomRoomId(e.target.value)}
                placeholder="Leave blank for auto-generated code"
                maxLength={20}
                className="w-full px-4 py-3 bg-zinc-900/90 border border-white/10 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-indigo-500 transition-all font-mono"
              />
            </div>

            {/* Initial Video URL (Optional) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                Initial YouTube Video <span className="text-zinc-500 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => {
                    setVideoUrl(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full pl-10 pr-4 py-3 bg-zinc-900/90 border border-white/10 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-indigo-500 transition-all font-mono"
                />
                <Video size={16} className="absolute left-3.5 top-3.5 text-zinc-500" />
              </div>

              {/* Video Thumbnail Preview */}
              {previewId && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3 animate-fade-in">
                  <img
                    src={`https://i.ytimg.com/vi/${previewId}/hqdefault.jpg`}
                    alt="Video preview"
                    className="w-16 h-10 object-cover rounded-lg border border-white/10 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Valid Video Link
                    </span>
                    <p className="text-xs font-mono text-zinc-300 truncate">ID: {previewId}</p>
                  </div>
                </div>
              )}
            </div>



            {error && <p className="text-xs text-rose-400 font-semibold">{error}</p>}

            <button
              type="submit"
              className="w-full btn-primary py-3.5 text-sm shadow-xl"
            >
              Launch Watch Room
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
