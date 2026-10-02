import { Request, Response } from 'express';
import { roomService } from '../services/roomService.js';

export function getHealth(req: Request, res: Response): void {
  res.status(200).json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    service: 'YouTube Watch Party API',
    roomsCount: roomService.getRoomCount(),
    participantsCount: roomService.getTotalParticipantCount(),
  });
}
