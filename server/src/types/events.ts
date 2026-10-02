import { Role } from './rbac.js';
import { PlayState, SanitizedParticipant, SanitizedRoom } from './room.js';

export interface JoinRoomPayload {
  roomId: string;
  username: string;
  userId?: string;
}

export interface LeaveRoomPayload {
  roomId: string;
}

export interface PlayPayload {
  roomId: string;
  currentTime: number;
}

export interface PausePayload {
  roomId: string;
  currentTime: number;
}

export interface SeekPayload {
  roomId: string;
  currentTime: number;
}

export interface ChangeVideoPayload {
  roomId: string;
  videoUrlOrId: string;
}

export interface AssignRolePayload {
  roomId: string;
  targetUserId: string;
  newRole: Role;
}

export interface RemoveParticipantPayload {
  roomId: string;
  targetUserId: string;
}

export interface TransferHostPayload {
  roomId: string;
  targetUserId: string;
}

// Server to Client Payloads
export interface SyncStatePayload {
  room: SanitizedRoom;
  serverTime: number;
  currentParticipant: SanitizedParticipant;
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
  participant: SanitizedParticipant;
  participants: SanitizedParticipant[];
}

export interface UserLeftPayload {
  userId: string;
  username: string;
  participants: SanitizedParticipant[];
  newHostId?: string;
}

export interface RoleAssignedPayload {
  targetUserId: string;
  role: Role;
  participants: SanitizedParticipant[];
  updatedBy: string;
}

export interface ParticipantRemovedPayload {
  targetUserId: string;
  reason: string;
  participants: SanitizedParticipant[];
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
