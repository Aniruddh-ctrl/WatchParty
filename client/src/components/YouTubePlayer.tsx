import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';

// YouTube Player API types
export interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead?: boolean): void;
  loadVideoById(videoId: string, startSeconds?: number): void;
  cueVideoById(videoId: string, startSeconds?: number): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  setVolume(volume: number): void;
  getVolume(): number;
  isMuted(): boolean;
  mute(): void;
  unMute(): void;
  destroy(): void;
}

export interface YouTubePlayerRef {
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  loadVideo: (videoId: string, startSeconds?: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  isMuted: () => boolean;
  mute: () => void;
  unMute: () => void;
  getPlayer: () => YTPlayer | null;
}

interface YouTubePlayerProps {
  videoId: string;
  isController: boolean; // True if HOST or MODERATOR (can emit changes)
  reactions?: Array<{ id: string; emoji: string; username: string }>;
  onPlay?: (currentTime: number) => void;
  onPause?: (currentTime: number) => void;
  onSeek?: (currentTime: number) => void;
  onError?: (errorMessage: string) => void;
  onReady?: () => void;
  onChangeVideoClick?: () => void;
}

// Global script loader tracker
let isApiLoading = false;
const readyCallbacks: Array<() => void> = [];

function loadYouTubeIframeApi(callback: () => void) {
  if (typeof window === 'undefined') return;

  if (window.YT && window.YT.Player) {
    callback();
    return;
  }

  readyCallbacks.push(callback);

  if (!isApiLoading) {
    isApiLoading = true;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      readyCallbacks.forEach((cb) => cb());
      readyCallbacks.length = 0;
    };
  }
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const YouTubePlayer = forwardRef<YouTubePlayerRef, YouTubePlayerProps>(
  ({ videoId, isController, reactions, onPlay, onPause, onSeek, onError, onReady, onChangeVideoClick }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<YTPlayer | null>(null);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    // CRITICAL: Flag to prevent feedback loops
    const isProgrammaticActionRef = useRef<boolean>(false);
    const lastReportedTimeRef = useRef<number>(0);
    const currentLoadedVideoIdRef = useRef<string>(videoId);

    // Expose imperative handle to parent component
    useImperativeHandle(ref, () => ({
      play: () => {
        if (!playerRef.current) return;
        isProgrammaticActionRef.current = true;
        try {
          playerRef.current.playVideo();
        } finally {
          setTimeout(() => {
            isProgrammaticActionRef.current = false;
          }, 400);
        }
      },
      pause: () => {
        if (!playerRef.current) return;
        isProgrammaticActionRef.current = true;
        try {
          playerRef.current.pauseVideo();
        } finally {
          setTimeout(() => {
            isProgrammaticActionRef.current = false;
          }, 400);
        }
      },
      seekTo: (seconds: number) => {
        if (!playerRef.current) return;
        isProgrammaticActionRef.current = true;
        lastReportedTimeRef.current = seconds;
        try {
          playerRef.current.seekTo(seconds, true);
        } finally {
          setTimeout(() => {
            isProgrammaticActionRef.current = false;
          }, 400);
        }
      },
      loadVideo: (newVideoId: string, startSeconds: number = 0) => {
        currentLoadedVideoIdRef.current = newVideoId;
        setLoadError(null);
        if (!playerRef.current) return;
        isProgrammaticActionRef.current = true;
        lastReportedTimeRef.current = startSeconds;
        try {
          playerRef.current.loadVideoById(newVideoId, startSeconds);
        } finally {
          setTimeout(() => {
            isProgrammaticActionRef.current = false;
          }, 500);
        }
      },
      getCurrentTime: () => {
        try {
          if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
            return playerRef.current.getCurrentTime() ?? 0;
          }
        } catch {}
        return 0;
      },
      getDuration: () => {
        try {
          if (playerRef.current && typeof playerRef.current.getDuration === 'function') {
            return playerRef.current.getDuration() ?? 0;
          }
        } catch {}
        return 0;
      },
      setVolume: (volume: number) => {
        try {
          if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
            playerRef.current.setVolume(volume);
          }
        } catch {}
      },
      getVolume: () => {
        try {
          if (playerRef.current && typeof playerRef.current.getVolume === 'function') {
            return playerRef.current.getVolume() ?? 100;
          }
        } catch {}
        return 100;
      },
      isMuted: () => {
        try {
          if (playerRef.current && typeof playerRef.current.isMuted === 'function') {
            return playerRef.current.isMuted() ?? false;
          }
        } catch {}
        return false;
      },
      mute: () => {
        try {
          if (playerRef.current && typeof playerRef.current.mute === 'function') {
            playerRef.current.mute();
          }
        } catch {}
      },
      unMute: () => {
        try {
          if (playerRef.current && typeof playerRef.current.unMute === 'function') {
            playerRef.current.unMute();
          }
        } catch {}
      },
      getPlayer: () => playerRef.current,
    }));

    // Handle videoId prop change smoothly via playerRef when player is already ready
    useEffect(() => {
      if (playerRef.current && isPlayerReady && currentLoadedVideoIdRef.current !== videoId) {
        currentLoadedVideoIdRef.current = videoId;
        setLoadError(null);
        isProgrammaticActionRef.current = true;
        try {
          playerRef.current.loadVideoById(videoId, 0);
        } catch (err) {
          console.error('Failed to load video by ID:', err);
        } finally {
          setTimeout(() => {
            isProgrammaticActionRef.current = false;
          }, 500);
        }
      }
    }, [videoId, isPlayerReady]);

    // Initialize player once API is ready
    useEffect(() => {
      let isMounted = true;
      setLoadError(null);
      setIsPlayerReady(false);
      currentLoadedVideoIdRef.current = videoId;
      const elementId = `yt-player-${Math.random().toString(36).slice(2, 9)}`;

      if (containerRef.current) {
        containerRef.current.innerHTML = `<div id="${elementId}" style="width: 100%; height: 100%;"></div>`;
      }

      const initPlayer = () => {
        if (!isMounted || !document.getElementById(elementId)) return;

        try {
          playerRef.current = new window.YT.Player(elementId, {
            videoId,
            host: 'https://www.youtube.com',
            playerVars: {
              autoplay: 0,
              controls: isController ? 1 : 0,
              disablekb: isController ? 0 : 1,
              modestbranding: 1,
              rel: 0,
              origin: window.location.origin,
              playsinline: 1,
              enablejsapi: 1,
            },
            events: {
              onReady: () => {
                if (!isMounted) return;
                const iframe = containerRef.current?.querySelector('iframe');
                if (iframe) {
                  iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
                  iframe.setAttribute(
                    'allow',
                    'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
                  );
                }
                setIsPlayerReady(true);
                setLoadError(null);
                onReady?.();
              },
              onStateChange: (event: { data: number }) => {
                if (!isMounted) return;
                const state = event.data;

                if (isProgrammaticActionRef.current) {
                  return;
                }

                if (!isController) {
                  return;
                }

                const currentTime = playerRef.current?.getCurrentTime() ?? 0;

                // 1 = Playing
                if (state === 1) {
                  onPlay?.(currentTime);
                }
                // 2 = Paused
                else if (state === 2) {
                  onPause?.(currentTime);
                }

                // Detect manual seek
                if (Math.abs(currentTime - lastReportedTimeRef.current) > 1.5) {
                  lastReportedTimeRef.current = currentTime;
                  onSeek?.(currentTime);
                }
              },
              onError: (event: { data: number }) => {
                let errorMsg = 'An error occurred loading the YouTube video.';
                switch (event.data) {
                  case 2:
                    errorMsg = 'Invalid YouTube video ID parameter.';
                    break;
                  case 5:
                    errorMsg = 'HTML5 player error on YouTube.';
                    break;
                  case 100:
                    errorMsg = 'This video was not found or has been removed/marked private.';
                    break;
                  case 101:
                  case 150:
                    errorMsg =
                      'The owner of this video restricts external embedding (Error 150/101). The host can paste another video link.';
                    break;
                }
                setLoadError(errorMsg);
                onError?.(errorMsg);
              },
            },
          });
        } catch (err: unknown) {
          console.error('Failed to initialize YouTube Player:', err);
          const msg = err instanceof Error ? err.message : 'Failed to initialize player';
          setLoadError(msg);
          onError?.(msg);
        }
      };

      loadYouTubeIframeApi(initPlayer);

      return () => {
        isMounted = false;
        if (playerRef.current) {
          try {
            playerRef.current.destroy();
          } catch {}
          playerRef.current = null;
        }
      };
    }, [isController]);

    return (
      <div className="relative w-full h-full">
        {/* Ambient Backlight Glow */}
        <div className="ambient-glow" />

        {/* Video Player Frame */}
        <div className="relative w-full h-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center border border-white/10 group z-10">
          <div ref={containerRef} className="w-full h-full" />

          {/* Floating Emoji Reactions Overlay */}
          {reactions && reactions.length > 0 && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-20 flex justify-end items-end p-6">
              {reactions.map((r, i) => (
                <div
                  key={r.id}
                  className="animate-float-reaction flex flex-col items-center"
                  style={{
                    position: 'absolute',
                    bottom: '24px',
                    right: `${32 + (i % 6) * 48}px`,
                  }}
                >
                  <span className="text-4xl drop-shadow-lg select-none filter">{r.emoji}</span>
                  <span className="text-[10px] font-bold text-white bg-black/75 px-2 py-0.5 rounded-full border border-white/10 shadow-lg mt-1 whitespace-nowrap">
                    {r.username}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Loading overlay */}
          {!isPlayerReady && !loadError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/85 backdrop-blur-md z-10 transition-opacity">
              <div className="w-12 h-12 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-3"></div>
              <p className="text-zinc-200 font-semibold text-sm tracking-wide">Syncing YouTube Player...</p>
              <span className="text-xs text-indigo-400 mt-1 font-mono">ID: {videoId}</span>
            </div>
          )}

          {/* Error overlay */}
          {loadError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/95 backdrop-blur-xl z-20 p-6 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mb-4 shadow-lg shadow-rose-500/10">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Video Unavailable for Embedding</h3>
              <p className="text-sm text-zinc-400 max-w-md mb-6 leading-relaxed">{loadError}</p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                {isController && onChangeVideoClick && (
                  <button
                    type="button"
                    onClick={onChangeVideoClick}
                    className="btn-primary"
                  >
                    <span>Change Video Now</span>
                  </button>
                )}

                <a
                  href={`https://www.youtube.com/watch?v=${videoId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                >
                  <span>Open on YouTube ↗</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

YouTubePlayer.displayName = 'YouTubePlayer';
