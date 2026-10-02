/**
 * Utility for parsing and validating YouTube video IDs and URLs.
 * Standard YouTube video IDs are 11 characters consisting of [a-zA-Z0-9_-].
 */
const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

export function extractYouTubeVideoId(input: string): string | null {
  if (!input || typeof input !== 'string') return null;

  const trimmed = input.trim();

  // If input is already an 11-character video ID
  if (YOUTUBE_ID_REGEX.test(trimmed)) {
    return trimmed;
  }

  try {
    // Parse URL with protocol if missing
    let urlString = trimmed;
    if (!/^https?:\/\//i.test(urlString)) {
      urlString = `https://${urlString}`;
    }

    const parsed = new URL(urlString);
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '');

    // 1. youtu.be/VIDEO_ID
    if (hostname === 'youtu.be') {
      const pathId = parsed.pathname.slice(1).split('/')[0];
      if (YOUTUBE_ID_REGEX.test(pathId)) {
        return pathId;
      }
    }

    // 2. youtube.com/watch?v=VIDEO_ID
    if (hostname === 'youtube.com' || hostname === 'youtube-nocookie.com') {
      const vParam = parsed.searchParams.get('v');
      if (vParam && YOUTUBE_ID_REGEX.test(vParam)) {
        return vParam;
      }

      // 3. youtube.com/embed/VIDEO_ID or /v/VIDEO_ID or /shorts/VIDEO_ID
      const pathParts = parsed.pathname.split('/').filter(Boolean);
      if (['embed', 'v', 'shorts', 'live'].includes(pathParts[0]) && pathParts[1]) {
        const idFromPath = pathParts[1].split('?')[0];
        if (YOUTUBE_ID_REGEX.test(idFromPath)) {
          return idFromPath;
        }
      }
    }
  } catch {
    // Return null if URL parsing fails
    return null;
  }

  return null;
}

export function isValidYouTubeId(id: string): boolean {
  return typeof id === 'string' && YOUTUBE_ID_REGEX.test(id);
}
