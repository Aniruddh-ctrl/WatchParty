import React, { useState, useEffect } from 'react';
import { X, Video, CheckCircle2, AlertCircle } from 'lucide-react';
import { extractYouTubeVideoId } from '../utils/youtube';

interface VideoChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (videoId: string) => void;
  currentVideoId?: string;
}

export const VideoChangeModal: React.FC<VideoChangeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentVideoId,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  // Live video preview whenever user types or pastes
  useEffect(() => {
    if (!urlInput.trim()) {
      setPreviewId(null);
      setError(null);
      return;
    }
    const extracted = extractYouTubeVideoId(urlInput.trim());
    if (extracted) {
      setPreviewId(extracted);
      setError(null);
    } else {
      setPreviewId(null);
    }
  }, [urlInput]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const videoId = extractYouTubeVideoId(urlInput.trim());

    if (!videoId) {
      setError('Please enter a valid YouTube URL or an 11-character video ID.');
      return;
    }

    if (videoId === currentVideoId) {
      setError('This video is already loaded in the watch room.');
      return;
    }

    setError(null);
    onSubmit(videoId);
    setUrlInput('');
    setPreviewId(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-xl glass-panel-elevated p-6 shadow-2xl border border-white/15 overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25">
              <Video size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Stream New Video</h2>
              <p className="text-xs text-zinc-400">Instantly switch video synchronized for all viewers</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
              YouTube Video URL or Video ID
            </label>
            <div className="relative">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="https://www.youtube.com/watch?v=... or ID"
                autoFocus
                className="w-full px-4 py-3 bg-zinc-900/90 border border-white/10 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-indigo-500 transition-all font-mono"
              />
              {previewId && (
                <div className="absolute right-3 top-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  <CheckCircle2 size={13} />
                  <span>Valid ID</span>
                </div>
              )}
            </div>
            {error && (
              <p className="mt-2 text-xs text-rose-400 flex items-center gap-1 font-medium">
                <AlertCircle size={14} /> {error}
              </p>
            )}
          </div>

          {/* Live Video Preview Box */}
          {previewId && (
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3.5 animate-fade-in">
              <img
                src={`https://i.ytimg.com/vi/${previewId}/hqdefault.jpg`}
                alt="Video preview thumbnail"
                className="w-24 h-14 object-cover rounded-xl border border-white/10 shadow-md shrink-0"
              />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                  Ready to broadcast
                </span>
                <p className="text-xs font-mono font-semibold text-zinc-200 truncate mt-0.5">
                  ID: {previewId}
                </p>
                <p className="text-[11px] text-zinc-400">Click below to change video for everyone.</p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!previewId}
              className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
            >
              Broadcast Video
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
