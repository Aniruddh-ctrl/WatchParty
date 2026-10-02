import type { Role } from './rbac';
import type { Participant, PlayState, Room } from './room';

export interface SyncStatePayload {
  room: Room;
  serverTime: number;
  currentParticipant: Participant;
}

export interface PlaybackUpdatedPayload {
  playState: PlayState;
  currentTime: number;
  updatedAt: number;
  triggeredBy: string;
}

export interface VideoChangedPayload {
  videoId: string;
  currentTime: number;
  playState: PlayState;
  updatedAt: number;
  triggeredBy: string;
}

export interface UserJoinedPayload {
  participant: Participant;
  participants: Participant[];
}

export interface UserLeftPayload {
  userId: string;
  username: string;
  participants: Participant[];
  newHostId?: string;
}

export interface RoleAssignedPayload {
  targetUserId: string;
  role: Role;
  participants: Participant[];
  updatedBy: string;
}

export interface ParticipantRemovedPayload {
  targetUserId: string;
  reason: string;
  participants: Participant[];
}

export interface PermissionErrorPayload {
  action: string;
  message: string;
}

export interface ErrorPayload {
  message: string;
  code?: string;
}

export interface ChatMessagePayload {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  role: Role;
  message: string;
  timestamp: number;
}

export interface ReactionPayload {
  id: string;
  roomId: string;
  username: string;
  emoji: string;
  timestamp: number;
}
