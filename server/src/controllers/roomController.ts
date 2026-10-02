import { Request, Response } from 'express';
import { roomService } from '../services/roomService.js';
import { extractYouTubeVideoId } from '../utils/youtube.js';

export function createRoom(req: Request, res: Response): void {
  try {
    const { customRoomId, initialVideoUrl, initialVideoId: rawVideoId } = req.body || {};
    let initialVideoId: string | undefined;

    if (rawVideoId) {
      initialVideoId = extractYouTubeVideoId(rawVideoId) || (typeof rawVideoId === 'string' && rawVideoId.trim().length === 11 ? rawVideoId.trim() : undefined);
    } else if (initialVideoUrl) {
      initialVideoId = extractYouTubeVideoId(initialVideoUrl) || undefined;
    }

    const room = roomService.createRoom(customRoomId, initialVideoId);
    res.status(201).json({
      success: true,
      room: roomService.sanitizeRoom(room),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create room';
    res.status(400).json({ success: false, error: message });
  }
}

export function getRoom(req: Request, res: Response): void {
  const roomIdParam = req.params.roomId;
  const roomId = Array.isArray(roomIdParam) ? roomIdParam[0] : roomIdParam;
  if (!roomId) {
    res.status(400).json({ success: false, error: 'Room ID is required.' });
    return;
  }

  const room = roomService.getRoom(roomId);
  if (!room) {
    res.status(404).json({ success: false, error: 'Room not found.' });
    return;
  }

  res.status(200).json({
    success: true,
    room: roomService.sanitizeRoom(room),
  });
}
