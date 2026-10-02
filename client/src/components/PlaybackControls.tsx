import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  RefreshCw,
  Lock,
  Volume2,
  VolumeX,
  Volume1,
  Maximize2,
  Sparkles,
  Tv,
} from 'lucide-react';
import { formatTime } from '../utils/time';
import type { PlayState } from '../types/room';

interface PlaybackControlsProps {
  playState: PlayState;
  isController: boolean; // True if HOST or MODERATOR
  onPlay: () => void;
  onPause: () => void;
  onSeek: (seconds: number) => void;
  onResync: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  onVolumeChange?: (vol: number) => void;
  onToggleMute?: () => void;
  isMuted?: boolean;
  onToggleFullscreen?: () => void;
  isTheaterMode?: boolean;
  onToggleTheaterMode?: () => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  playState,
  isController,
  onPlay,
  onPause,
  onSeek,
  onResync,
  getCurrentTime,
  getDuration,
  onVolumeChange,
  onToggleMute,
  isMuted = false,
  onToggleFullscreen,
  isTheaterMode = false,
  onToggleTheaterMode,
}) => {
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isSeekingLocally, setIsSeekingLocally] = useState<boolean>(false);
  const [sliderValue, setSliderValue] = useState<number>(0);
  const [isResyncing, setIsResyncing] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(100);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Poll player time every 400ms to keep UI progress updated smoothly
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isSeekingLocally) {
        const time = getCurrentTime();
        const dur = getDuration();
        setCurrentTime(time);
        setDuration(dur);
        setSliderValue(time);
      }
    }, 400);

    return () => clearInterval(timer);
  }, [getCurrentTime, getDuration, isSeekingLocally]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isController) return;
    setIsSeekingLocally(true);
    setSliderValue(parseFloat(e.target.value));
  };

  const handleSliderCommit = () => {
    if (!isController) return;
    setIsSeekingLocally(false);
    onSeek(sliderValue);
  };

  const handleSkip = (seconds: number) => {
    if (!isController) return;
    const newTime = Math.max(0, Math.min(currentTime + seconds, duration || 999999));
    onSeek(newTime);
  };

  const handleResyncClick = () => {
    setIsResyncing(true);
    onResync();
    setTimeout(() => setIsResyncing(false), 800);
  };

  const handleVolumeSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseInt(e.target.value, 10);
    setVolume(newVol);
    onVolumeChange?.(newVol);
  };

  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = pos / rect.width;
    setHoverPosition(pos);
    setHoverTime(percentage * duration);
  };

  const isPlaying = playState === 'PLAYING';
  const progressPercent = duration > 0 ? (sliderValue / duration) * 100 : 0;

  return (
    <div className="relative glass-panel p-4 rounded-2xl flex flex-col gap-3.5 shadow-2xl border border-white/10 transition-all select-none">
      {/* Progress Bar & Timestamps */}
      <div className="flex items-center gap-3 w-full">
        <span className="text-xs font-mono font-semibold text-zinc-300 min-w-[50px] text-right">
          {formatTime(isSeekingLocally ? sliderValue : currentTime)}
        </span>

        {/* Custom Progress Bar with Hover Tooltip */}
        <div
          ref={progressBarRef}
          onMouseMove={handleProgressMouseMove}
          onMouseLeave={() => setHoverTime(null)}
          className="relative flex-1 h-5 flex items-center group cursor-pointer"
        >
          {/* Tooltip on Hover */}
          {hoverTime !== null && isController && (
            <div
              className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded-md bg-zinc-900 border border-white/20 text-[10px] font-mono font-bold text-white shadow-lg pointer-events-none z-30"
              style={{ left: `${hoverPosition}px` }}
            >
              {formatTime(hoverTime)}
            </div>
          )}

          {/* Track Background */}
          <div className="w-full h-1.5 group-hover:h-2 bg-white/10 rounded-full overflow-hidden transition-all relative">
            {/* Progress Fill */}
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>

          {/* Actual range input overlay for accessibility and smooth dragging */}
          <input
            type="range"
            min={0}
            max={duration > 0 ? duration : 100}
            step={0.5}
            value={sliderValue}
            onChange={handleSliderChange}
            onMouseUp={handleSliderCommit}
            onTouchEnd={handleSliderCommit}
            disabled={!isController}
            aria-label="Video scrubber"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
          />
        </div>

        <span className="text-xs font-mono font-semibold text-zinc-400 min-w-[50px]">
          {formatTime(duration)}
        </span>
      </div>

      {/* Control Buttons Bar */}
      <div className="flex items-center justify-between pt-1">
        {/* Left: Playback buttons */}
        <div className="flex items-center gap-2">
          {/* Skip -10s */}
          <button
            onClick={() => handleSkip(-10)}
            disabled={!isController}
            title={isController ? 'Rewind 10s' : 'Controls locked for viewers'}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/5 hover:border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <RotateCcw size={17} />
          </button>

          {/* Main Play / Pause Button with Glow Halo */}
          <button
            onClick={() => (isPlaying ? onPause() : onPlay())}
            disabled={!isController}
            title={
              !isController
                ? 'Only Host or Moderators can control playback'
                : isPlaying
                ? 'Pause video for everyone'
                : 'Play video for everyone'
            }
            className={`relative flex items-center justify-center w-11 h-11 rounded-2xl font-bold transition-all shadow-lg active:scale-95 ${
              isPlaying
                ? 'bg-gradient-to-tr from-amber-500 to-orange-400 text-zinc-950 shadow-amber-500/30 hover:brightness-110'
                : 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white shadow-indigo-500/35 hover:brightness-110'
            } disabled:opacity-35 disabled:cursor-not-allowed disabled:transform-none`}
          >
            {isPlaying ? (
              <Pause size={20} fill="currentColor" />
            ) : (
              <Play size={20} fill="currentColor" className="ml-0.5" />
            )}
          </button>

          {/* Skip +10s */}
          <button
            onClick={() => handleSkip(10)}
            disabled={!isController}
            title={isController ? 'Fast Forward 10s' : 'Controls locked for viewers'}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/5 hover:border-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <RotateCw size={17} />
          </button>

          {/* Volume Control */}
          <div className="hidden sm:flex items-center gap-1.5 ml-2 group">
            <button
              type="button"
              onClick={onToggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX size={17} className="text-rose-400" />
              ) : volume < 50 ? (
                <Volume1 size={17} />
              ) : (
                <Volume2 size={17} />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeSlider}
              aria-label="Volume"
              className="w-16 h-1 bg-white/15 rounded-lg accent-indigo-500 cursor-pointer opacity-70 group-hover:opacity-100 transition-opacity"
            />
          </div>
        </div>

        {/* Center: Viewer lock indicator or Controller status */}
        <div className="hidden md:flex items-center">
          {!isController ? (
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              <Lock size={12} className="text-zinc-400" />
              <span>Viewer Mode &bull; Synchronized with Host</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/25 shadow-sm">
              <Sparkles size={13} className="text-indigo-400 animate-pulse" />
              <span>Playback Master Active</span>
            </div>
          )}
        </div>

        {/* Right: Resync & Fullscreen Actions */}
        <div className="flex items-center gap-2">
          {/* Resync Button */}
          <button
            onClick={handleResyncClick}
            title="Force re-sync with room time"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white rounded-xl transition-all border border-white/10 active:scale-95"
          >
            <RefreshCw size={13} className={isResyncing ? 'animate-spin text-indigo-400' : ''} />
            <span className="hidden sm:inline">Resync</span>
          </button>

          {/* Theater Mode Button */}
          {onToggleTheaterMode && (
            <button
              onClick={onToggleTheaterMode}
              title={isTheaterMode ? 'Exit Theater Mode' : 'Enter Theater Mode (Larger Video)'}
              className={`p-2 rounded-xl border transition-all active:scale-95 hidden sm:flex items-center gap-1.5 text-xs font-semibold ${
                isTheaterMode
                  ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40 shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border-white/10'
              }`}
            >
              <Tv size={15} />
              <span className="hidden md:inline">{isTheaterMode ? 'Exit Theater' : 'Theater'}</span>
            </button>
          )}

          {/* Fullscreen Button */}
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              title="Toggle Fullscreen"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-all active:scale-95"
            >
              <Maximize2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
