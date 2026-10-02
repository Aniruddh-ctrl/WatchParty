import { describe, it, expect } from 'vitest';
import { extractYouTubeVideoId, isValidYouTubeId } from '../utils/youtube.js';

describe('YouTube URL & ID Extraction', () => {
  it('extracts direct 11-character video IDs', () => {
    expect(extractYouTubeVideoId('jfKfPfyJRdk')).toBe('jfKfPfyJRdk');
    expect(extractYouTubeVideoId('aqz-KE-bpKQ')).toBe('aqz-KE-bpKQ');
  });

  it('extracts ID from standard watch URL', () => {
    expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=jfKfPfyJRdk')).toBe('jfKfPfyJRdk');
    expect(extractYouTubeVideoId('https://youtube.com/watch?v=jfKfPfyJRdk&t=40s')).toBe('jfKfPfyJRdk');
  });

  it('extracts ID from short youtu.be URL', () => {
    expect(extractYouTubeVideoId('https://youtu.be/jfKfPfyJRdk')).toBe('jfKfPfyJRdk');
    expect(extractYouTubeVideoId('http://youtu.be/jfKfPfyJRdk?si=xyz')).toBe('jfKfPfyJRdk');
  });

  it('extracts ID from embed URL', () => {
    expect(extractYouTubeVideoId('https://www.youtube.com/embed/jfKfPfyJRdk')).toBe('jfKfPfyJRdk');
  });

  it('extracts ID from shorts URL', () => {
    expect(extractYouTubeVideoId('https://www.youtube.com/shorts/jfKfPfyJRdk')).toBe('jfKfPfyJRdk');
  });

  it('handles URLs without protocol', () => {
    expect(extractYouTubeVideoId('youtube.com/watch?v=jfKfPfyJRdk')).toBe('jfKfPfyJRdk');
    expect(extractYouTubeVideoId('youtu.be/jfKfPfyJRdk')).toBe('jfKfPfyJRdk');
  });

  it('returns null for invalid inputs or non-YouTube URLs', () => {
    expect(extractYouTubeVideoId('')).toBeNull();
    expect(extractYouTubeVideoId('not-a-youtube-url')).toBeNull();
    expect(extractYouTubeVideoId('https://vimeo.com/12345678')).toBeNull();
    expect(extractYouTubeVideoId('https://google.com')).toBeNull();
  });

  it('validates standard 11-char ID', () => {
    expect(isValidYouTubeId('jfKfPfyJRdk')).toBe(true);
    expect(isValidYouTubeId('invalid')).toBe(false);
    expect(isValidYouTubeId('toolongvideoidentifier')).toBe(false);
  });
});
