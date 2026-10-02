import { Role } from './rbac.js';

export type PlayState = 'PLAYING' | 'PAUSED' | 'BUFFERING';

export interface Participant {
  userId: string;
  socketId: string;
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
  lastUpdatedAt: number; // Server timestamp in milliseconds
  createdAt: number;
}

export interface SanitizedParticipant {
  userId: string;
  username: string;
  role: Role;
  joinedAt: number;
}

export interface SanitizedRoom {
  roomId: string;
  hostId: string;
  participants: SanitizedParticipant[];
  currentVideoId: string;
  currentTime: number;
  playState: PlayState;
  lastUpdatedAt: number;
  createdAt: number;
}
