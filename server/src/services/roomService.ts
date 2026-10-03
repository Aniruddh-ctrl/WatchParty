import { Role } from '../types/rbac.js';
import {
  Participant,
  PlayState,
  Room,
  SanitizedParticipant,
  SanitizedRoom,
} from '../types/room.js';
import { generateRoomId, generateUserId } from '../utils/idGenerator.js';

// No default demo video - rooms start empty until a URL is provided
const DEFAULT_VIDEO_ID = '';

export class RoomService {
  private rooms: Map<string, Room> = new Map();
  // Map socketId -> { roomId, userId }
  private socketToRoomMap: Map<string, { roomId: string; userId: string }> = new Map();

  /**
   * Sanitizes a participant for client consumption (strips private socketId).
   */
  public sanitizeParticipant(participant: Participant): SanitizedParticipant {
    return {
      userId: participant.userId,
      username: participant.username,
      role: participant.role,
      joinedAt: participant.joinedAt,
    };
  }

  /**
   * Sanitizes a room for client consumption, calculating real-time elapsed time.
   */
  public sanitizeRoom(room: Room): SanitizedRoom {
    const effectiveCurrentTime = this.calculateCurrentTime(room);

    return {
      roomId: room.roomId,
      hostId: room.hostId,
      participants: room.participants.map((p) => this.sanitizeParticipant(p)),
      currentVideoId: room.currentVideoId,
      currentTime: effectiveCurrentTime,
      playState: room.playState,
      lastUpdatedAt: room.lastUpdatedAt,
      createdAt: room.createdAt,
    };
  }

  /**
   * Calculates the current playback time taking elapsed real time into account if playing.
   */
  public calculateCurrentTime(room: Room): number {
    if (room.playState === 'PLAYING') {
      const elapsedSeconds = (Date.now() - room.lastUpdatedAt) / 1000;
      return Math.max(0, room.currentTime + elapsedSeconds);
    }
    return room.currentTime;
  }

  /**
   * Creates a new room.
   */
  public createRoom(customRoomId?: string, initialVideoId?: string): Room {
    const roomId = customRoomId && customRoomId.trim().length > 0
      ? customRoomId.trim().toLowerCase()
      : generateRoomId();

    if (this.rooms.has(roomId)) {
      throw new Error(`Room with ID '${roomId}' already exists.`);
    }

    const now = Date.now();
    const room: Room = {
      roomId,
      hostId: '', // Set when the first user joins
      participants: [],
      currentVideoId: initialVideoId || DEFAULT_VIDEO_ID,
      currentTime: 0,
      playState: 'PAUSED',
      lastUpdatedAt: now,
      createdAt: now,
    };

    this.rooms.set(roomId, room);
    return room;
  }

  /**
   * Retrieves a room by ID.
   */
  public getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId.toLowerCase());
  }

  /**
   * Checks whether a room exists.
   */
  public hasRoom(roomId: string): boolean {
    return this.rooms.has(roomId.toLowerCase());
  }

  /**
   * Total number of active rooms.
   */
  public getRoomCount(): number {
    return this.rooms.size;
  }

  /**
   * Total number of active participants across all rooms.
   */
  public getTotalParticipantCount(): number {
    let count = 0;
    for (const room of this.rooms.values()) {
      count += room.participants.length;
    }
    return count;
  }

  /**
   * Adds or reconnects a participant in a room.
   */
  public joinRoom(
    roomId: string,
    username: string,
    socketId: string,
    existingUserId?: string
  ): { room: Room; participant: Participant; isNewHost: boolean } {
    const room = this.getRoom(roomId);
    if (!room) {
      throw new Error(`Room '${roomId}' not found.`);
    }

    const cleanUsername = username.trim().slice(0, 30) || 'Anonymous';
    const now = Date.now();

    // Check if this user is reconnecting
    let participant: Participant | undefined;
    if (existingUserId) {
      participant = room.participants.find((p) => p.userId === existingUserId);
    }

    let isNewHost = false;

    if (participant) {
      // Clean up previous socket mapping if different
      if (participant.socketId && participant.socketId !== socketId) {
        this.socketToRoomMap.delete(participant.socketId);
      }
      participant.socketId = socketId;
      participant.username = cleanUsername;
    } else {
      // New participant
      const isFirstUser = room.participants.length === 0 || !room.hostId;
      const role: Role = isFirstUser ? 'HOST' : 'PARTICIPANT';
      const userId = existingUserId || generateUserId();

      participant = {
        userId,
        socketId,
        username: cleanUsername,
        role,
        joinedAt: now,
      };

      if (isFirstUser) {
        room.hostId = userId;
        isNewHost = true;
      }

      room.participants.push(participant);
    }

    this.socketToRoomMap.set(socketId, { roomId: room.roomId, userId: participant.userId });

    return { room, participant, isNewHost };
  }

  /**
   * Removes a participant from a room by socketId or userId.
   */
  public leaveRoom(
    roomId: string,
    userId: string
  ): {
    room: Room;
    leftParticipant: Participant | undefined;
    newHostId?: string;
    roomDeleted: boolean;
  } {
    const room = this.getRoom(roomId);
    if (!room) {
      return { room: null as unknown as Room, leftParticipant: undefined, roomDeleted: false };
    }

    const participantIndex = room.participants.findIndex((p) => p.userId === userId);
    if (participantIndex === -1) {
      return { room, leftParticipant: undefined, roomDeleted: false };
    }

    const [leftParticipant] = room.participants.splice(participantIndex, 1);
    this.socketToRoomMap.delete(leftParticipant.socketId);

    // If the room is now empty, delete room state
    if (room.participants.length === 0) {
      this.rooms.delete(room.roomId);
      return { room, leftParticipant, roomDeleted: true };
    }

    let newHostId: string | undefined;

    // If the host left, transfer host role to the next highest priority user
    if (room.hostId === userId) {
      // Look for a moderator first
      const nextMod = room.participants.find((p) => p.role === 'MODERATOR');
      const newHost = nextMod || room.participants[0];

      if (newHost) {
        newHost.role = 'HOST';
        room.hostId = newHost.userId;
        newHostId = newHost.userId;
      }
    }

    return { room, leftParticipant, newHostId, roomDeleted: false };
  }

  /**
   * Disconnect handler using socketId.
   */
  public handleDisconnect(socketId: string) {
    const mapping = this.socketToRoomMap.get(socketId);
    if (!mapping) return null;

    const { roomId, userId } = mapping;
    this.socketToRoomMap.delete(socketId);
    return this.leaveRoom(roomId, userId);
  }

  /**
   * Finds participant and room by socketId.
   */
  public getParticipantBySocketId(
    socketId: string
  ): { room: Room; participant: Participant } | null {
    const mapping = this.socketToRoomMap.get(socketId);
    if (!mapping) return null;

    const room = this.getRoom(mapping.roomId);
    if (!room) return null;

    const participant = room.participants.find((p) => p.userId === mapping.userId);
    if (!participant) return null;

    return { room, participant };
  }

  /**
   * Updates playback state to PLAYING.
   */
  public updatePlay(roomId: string, currentTime: number): Room {
    const room = this.getRoom(roomId);
    if (!room) throw new Error(`Room '${roomId}' not found.`);

    room.playState = 'PLAYING';
    room.currentTime = Math.max(0, currentTime);
    room.lastUpdatedAt = Date.now();
    return room;
  }

  /**
   * Updates playback state to PAUSED.
   */
  public updatePause(roomId: string, currentTime: number): Room {
    const room = this.getRoom(roomId);
    if (!room) throw new Error(`Room '${roomId}' not found.`);

    room.playState = 'PAUSED';
    room.currentTime = Math.max(0, currentTime);
    room.lastUpdatedAt = Date.now();
    return room;
  }

  /**
   * Seeks to a specific timestamp.
   */
  public updateSeek(roomId: string, currentTime: number): Room {
    const room = this.getRoom(roomId);
    if (!room) throw new Error(`Room '${roomId}' not found.`);

    room.currentTime = Math.max(0, currentTime);
    room.lastUpdatedAt = Date.now();
    return room;
  }

  /**
   * Changes current video.
   */
  public updateVideo(roomId: string, videoId: string): Room {
    const room = this.getRoom(roomId);
    if (!room) throw new Error(`Room '${roomId}' not found.`);

    room.currentVideoId = videoId;
    room.currentTime = 0;
    room.playState = 'PAUSED';
    room.lastUpdatedAt = Date.now();
    return room;
  }

  /**
   * Assigns a role to a participant.
   */
  public assignRole(roomId: string, targetUserId: string, newRole: Role): Room {
    const room = this.getRoom(roomId);
    if (!room) throw new Error(`Room '${roomId}' not found.`);

    const target = room.participants.find((p) => p.userId === targetUserId);
    if (!target) throw new Error(`Participant '${targetUserId}' not found in room.`);

    if (newRole === 'HOST') {
      // If promoting to host, demote current host to MODERATOR
      const currentHost = room.participants.find((p) => p.userId === room.hostId);
      if (currentHost) {
        currentHost.role = 'MODERATOR';
      }
      target.role = 'HOST';
      room.hostId = target.userId;
    } else {
      // Prevent demoting current host without transferring host role first
      if (target.userId === room.hostId) {
        throw new Error('Cannot demote Host. Transfer host role first.');
      }
      target.role = newRole;
    }

    return room;
  }

  /**
   * Removes a participant from a room.
   */
  public removeParticipant(roomId: string, targetUserId: string): { room: Room; removedParticipant: Participant } {
    const room = this.getRoom(roomId);
    if (!room) throw new Error(`Room '${roomId}' not found.`);

    if (targetUserId === room.hostId) {
      throw new Error('Cannot remove the room Host.');
    }

    const targetIndex = room.participants.findIndex((p) => p.userId === targetUserId);
    if (targetIndex === -1) {
      throw new Error(`Participant '${targetUserId}' not found in room.`);
    }

    const [removedParticipant] = room.participants.splice(targetIndex, 1);
    this.socketToRoomMap.delete(removedParticipant.socketId);

    return { room, removedParticipant };
  }
}

// Export singleton instance
export const roomService = new RoomService();
