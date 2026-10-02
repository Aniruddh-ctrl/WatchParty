import type { Role } from './rbac';

export type PlayState = 'PLAYING' | 'PAUSED' | 'BUFFERING';

export interface Participant {
  userId: string;
  username: string;
  role: Role;
  joinedAt: number;
}

export interface Room {
  roomId: string;
  hostId: string;
  participants: Participant[];
  currentVideoId: string;
  currentTime: number;
  playState: PlayState;
  lastUpdatedAt: number;
  createdAt: number;
}
