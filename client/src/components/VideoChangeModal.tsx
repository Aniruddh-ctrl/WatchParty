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
      setError('This video is already currently playing.');
      return;
    }

    setError(null);
    onSubmit(videoId);
    setUrlInput('');
    setPreviewId(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-lg card p-6 shadow-xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-md bg-indigo-500/10 text-indigo-400">
              <Video size={18} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Stream New Video</h2>
              <p className="text-xs text-zinc-400">Synchronized instantly for all viewers</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
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
                className="w-full px-3 py-2.5 bg-zinc-900 border border-white/10 rounded-md text-white placeholder-zinc-500 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition-colors font-mono"
              />
              {previewId && (
                <div className="absolute right-2.5 top-2.5 flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  <CheckCircle2 size={12} />
                  <span>Valid ID</span>
                </div>
              )}
            </div>
            {error && (
              <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                <AlertCircle size={13} /> {error}
              </p>
            )}
          </div>

          {/* Live Video Preview Box */}
          {previewId && (
            <div className="p-2.5 rounded-md bg-white/[0.02] border border-white/10 flex items-center gap-3 animate-fade-in">
              <img
                src={`https://i.ytimg.com/vi/${previewId}/hqdefault.jpg`}
                alt="Video preview thumbnail"
                className="w-20 h-12 object-cover rounded border border-white/10 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400">
                  Ready to stream
                </span>
                <p className="text-xs font-mono text-zinc-200 truncate mt-0.5">
                  ID: {previewId}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
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
              className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Stream Video
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
