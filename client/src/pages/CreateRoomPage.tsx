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
    <div className="min-h-screen bg-[#090a0f] text-white flex flex-col justify-center items-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors mb-5"
        >
          <ArrowLeft size={14} />
          <span>Back to Home</span>
        </Link>

        {/* Card */}
        <div className="card p-6 sm:p-7">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-md bg-indigo-600 flex items-center justify-center text-white shrink-0">
              <Tv size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Create a Watch Room</h2>
              <div className="flex items-center gap-1 text-xs text-indigo-400 font-medium mt-0.5">
                <Shield size={12} />
                <span>You will have Host playback controls</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Host Name */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
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
                className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-md text-white placeholder-zinc-500 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Custom Room Code (Optional) */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Custom Room Code <span className="text-zinc-500 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={customRoomId}
                onChange={(e) => setCustomRoomId(e.target.value)}
                placeholder="Leave blank for auto-generated code"
                maxLength={20}
                className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-md text-white placeholder-zinc-500 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition-colors font-mono"
              />
            </div>

            {/* Initial Video URL (Optional) */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
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
                  className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-white/10 rounded-md text-white placeholder-zinc-500 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                />
                <Video size={14} className="absolute left-3 top-3 text-zinc-500" />
              </div>

              {/* Video Thumbnail Preview */}
              {previewId && (
                <div className="mt-2 p-2 rounded-md bg-white/[0.02] border border-white/10 flex items-center gap-2.5 animate-fade-in">
                  <img
                    src={`https://i.ytimg.com/vi/${previewId}/hqdefault.jpg`}
                    alt="Video preview"
                    className="w-14 h-9 object-cover rounded border border-white/10 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={11} /> Valid Video Link
                    </span>
                    <p className="text-xs font-mono text-zinc-300 truncate">ID: {previewId}</p>
                  </div>
                </div>
              )}
            </div>

            {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}

            <button
              type="submit"
              className="w-full btn-primary py-2.5 text-sm font-medium mt-2"
            >
              Launch Watch Room
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
