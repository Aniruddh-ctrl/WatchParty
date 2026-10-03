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
    <div className="card p-3 sm:p-4 flex flex-col gap-2.5 sm:gap-3 select-none">
      {/* Progress Bar & Timestamps */}
      <div className="flex items-center gap-2 sm:gap-3 w-full">
        <span className="text-[11px] sm:text-xs font-mono font-medium text-zinc-300 min-w-[42px] sm:min-w-[48px] text-right">
          {formatTime(isSeekingLocally ? sliderValue : currentTime)}
        </span>

        {/* Custom Scrubber Track */}
        <div
          ref={progressBarRef}
          onMouseMove={handleProgressMouseMove}
          onMouseLeave={() => setHoverTime(null)}
          className="relative flex-1 h-4 flex items-center group cursor-pointer"
        >
          {/* Tooltip on Hover */}
          {hoverTime !== null && isController && (
            <div
              className="absolute -top-7 -translate-x-1/2 px-1.5 py-0.5 rounded bg-zinc-900 border border-white/20 text-[10px] font-mono font-medium text-white pointer-events-none z-30"
              style={{ left: `${hoverPosition}px` }}
            >
              {formatTime(hoverTime)}
            </div>
          )}

          {/* Track Background */}
          <div className="w-full h-1 group-hover:h-1.5 bg-white/10 rounded-full overflow-hidden transition-all relative">
            {/* Progress Fill (Solid clean accent, no tacky rainbow gradient) */}
            <div
              className="h-full bg-indigo-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
            />
          </div>

          {/* Native range input overlay */}
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

        <span className="text-[11px] sm:text-xs font-mono font-medium text-zinc-400 min-w-[42px] sm:min-w-[48px]">
          {formatTime(duration)}
        </span>
      </div>

      {/* Control Buttons Bar */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        {/* Left: Playback & Volume */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Skip -10s */}
          <button
            type="button"
            onClick={() => handleSkip(-10)}
            disabled={!isController}
            title={isController ? 'Rewind 10s' : 'Controls locked for viewers'}
            className="p-2 sm:p-2.5 rounded-md hover:bg-white/5 text-zinc-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCcw size={16} />
          </button>

          {/* Primary Play / Pause Button (Clean solid brand button) */}
          <button
            type="button"
            onClick={() => (isPlaying ? onPause() : onPlay())}
            disabled={!isController}
            title={
              !isController
                ? 'Only Host or Moderators can control playback'
                : isPlaying
                ? 'Pause video'
                : 'Play video'
            }
            className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-md font-medium transition-all ${
              isPlaying
                ? 'bg-zinc-800 text-amber-300 hover:bg-zinc-700'
                : 'bg-indigo-600 text-white hover:bg-indigo-500'
            } disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            {isPlaying ? (
              <Pause size={17} fill="currentColor" />
            ) : (
              <Play size={17} fill="currentColor" className="ml-0.5" />
            )}
          </button>

          {/* Skip +10s */}
          <button
            type="button"
            onClick={() => handleSkip(10)}
            disabled={!isController}
            title={isController ? 'Fast forward 10s' : 'Controls locked for viewers'}
            className="p-2 sm:p-2.5 rounded-md hover:bg-white/5 text-zinc-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCw size={16} />
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-1 ml-1 group">
            <button
              type="button"
              onClick={onToggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
              className="p-2 rounded-md text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX size={16} className="text-rose-400" />
              ) : volume < 50 ? (
                <Volume1 size={16} />
              ) : (
                <Volume2 size={16} />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeSlider}
              aria-label="Volume"
              className="hidden sm:block w-14 sm:w-18 h-1 bg-white/15 rounded-full cursor-pointer accent-indigo-500"
            />
          </div>
        </div>

        {/* Center: Controller Status Pill */}
        <div className="hidden md:flex items-center">
          {!isController ? (
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/5">
              <Lock size={12} className="text-zinc-500" />
              <span>Viewer &bull; Synced with Host</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
              <span>Host Master Active</span>
            </div>
          )}
        </div>

        {/* Right: Resync, Theater Mode, Fullscreen */}
        <div className="flex items-center gap-1">
          {/* Resync Button */}
          <button
            type="button"
            onClick={handleResyncClick}
            title="Resync with party"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/5 rounded-md transition-colors border border-white/5"
          >
            <RefreshCw size={13} className={isResyncing ? 'animate-spin text-indigo-400' : ''} />
            <span className="hidden sm:inline">Resync</span>
          </button>

          {/* Theater Mode Button */}
          {onToggleTheaterMode && (
            <button
              type="button"
              onClick={onToggleTheaterMode}
              title={isTheaterMode ? 'Exit Theater Mode' : 'Theater Mode'}
              className={`p-2 rounded-md transition-colors hidden sm:flex items-center gap-1.5 text-xs font-medium ${
                isTheaterMode
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Tv size={15} />
              <span className="hidden lg:inline">{isTheaterMode ? 'Exit' : 'Theater'}</span>
            </button>
          )}

          {/* Fullscreen Button */}
          {onToggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              title="Fullscreen"
              className="p-2 rounded-md text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Maximize2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
