import { Server, Socket } from 'socket.io';
import { PermissionService } from '../services/permissionService.js';
import { roomService } from '../services/roomService.js';
import {
  AssignRolePayload,
  ChangeVideoPayload,
  JoinRoomPayload,
  LeaveRoomPayload,
  PausePayload,
  PlayPayload,
  RemoveParticipantPayload,
  SeekPayload,
  TransferHostPayload,
} from '../types/events.js';
import { Action } from '../types/rbac.js';
import { extractYouTubeVideoId } from '../utils/youtube.js';

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    // ----------------------------------------------------
    // Helper: Authenticate & Authorize socket action
    // ----------------------------------------------------
    const authorizeAction = (
      action: Action,
      explicitRoomId?: string
    ): {
      authorized: boolean;
      room?: ReturnType<typeof roomService.getRoom>;
      participant?: ReturnType<typeof roomService.sanitizeParticipant>;
    } => {
      const data = roomService.getParticipantBySocketId(socket.id);

      if (!data) {
        socket.emit('error', { message: 'You are not connected to any room.' });
        return { authorized: false };
      }

      const { room, participant } = data;

      if (explicitRoomId && room.roomId !== explicitRoomId.toLowerCase()) {
        socket.emit('error', { message: 'Room ID mismatch.' });
        return { authorized: false };
      }

      const isAllowed = PermissionService.canPerformAction(participant.role, action);
      if (!isAllowed) {
        socket.emit('permission_error', {
          action,
          message: PermissionService.getPermissionDeniedMessage(participant.role, action),
        });
        return { authorized: false, room, participant };
      }

      return { authorized: true, room, participant };
    };

    // ----------------------------------------------------
    // 1. JOIN ROOM
    // ----------------------------------------------------
    socket.on('join_room', (payload: JoinRoomPayload) => {
      try {
        if (!payload || !payload.roomId || typeof payload.roomId !== 'string') {
          return socket.emit('error', { message: 'A valid room ID is required.' });
        }

        const roomId = payload.roomId.trim().toLowerCase();
        const username = typeof payload.username === 'string' ? payload.username : 'Guest';
        const userId = typeof payload.userId === 'string' ? payload.userId : undefined;

        // Auto-create room if it doesn't exist yet so seamless creation works
        if (!roomService.hasRoom(roomId)) {
          roomService.createRoom(roomId);
        }

        const { room, participant } = roomService.joinRoom(roomId, username, socket.id, userId);

        // Join Socket.IO room channel
        socket.join(roomId);

        // Send full sync state to the newly joined client
        const sanitizedRoom = roomService.sanitizeRoom(room);
        const sanitizedParticipant = roomService.sanitizeParticipant(participant);

        socket.emit('sync_state', {
          room: sanitizedRoom,
          serverTime: Date.now(),
          currentParticipant: sanitizedParticipant,
        });

        // Broadcast to others in the room that a new user joined
        socket.to(roomId).emit('user_joined', {
          participant: sanitizedParticipant,
          participants: sanitizedRoom.participants,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to join room';
        socket.emit('error', { message });
      }
    });

    // ----------------------------------------------------
    // 2. LEAVE ROOM
    // ----------------------------------------------------
    socket.on('leave_room', (payload: LeaveRoomPayload) => {
      try {
        const data = roomService.getParticipantBySocketId(socket.id);
        if (!data) return;

        const { room, participant } = data;
        const result = roomService.leaveRoom(room.roomId, participant.userId);

        socket.leave(room.roomId);

        if (!result.roomDeleted) {
          const sanitizedRoom = roomService.sanitizeRoom(result.room);
          io.to(room.roomId).emit('user_left', {
            userId: participant.userId,
            username: participant.username,
            participants: sanitizedRoom.participants,
            newHostId: result.newHostId,
          });
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error leaving room';
        socket.emit('error', { message });
      }
    });

    // ----------------------------------------------------
    // 3. PLAY
    // ----------------------------------------------------
    socket.on('play', (payload: PlayPayload) => {
      try {
        const { authorized, room, participant } = authorizeAction('PLAY', payload?.roomId);
        if (!authorized || !room || !participant) return;

        const currentTime = typeof payload?.currentTime === 'number' && Number.isFinite(payload.currentTime)
          ? Math.max(0, payload.currentTime)
          : roomService.calculateCurrentTime(room);

        const updatedRoom = roomService.updatePlay(room.roomId, currentTime);

        io.to(room.roomId).emit('playback_updated', {
          playState: 'PLAYING',
          currentTime: updatedRoom.currentTime,
          updatedAt: updatedRoom.lastUpdatedAt,
          triggeredBy: participant.username,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to play';
        socket.emit('error', { message });
      }
    });

    // ----------------------------------------------------
    // 4. PAUSE
    // ----------------------------------------------------
    socket.on('pause', (payload: PausePayload) => {
      try {
        const { authorized, room, participant } = authorizeAction('PAUSE', payload?.roomId);
        if (!authorized || !room || !participant) return;

        const currentTime = typeof payload?.currentTime === 'number' && Number.isFinite(payload.currentTime)
          ? Math.max(0, payload.currentTime)
          : roomService.calculateCurrentTime(room);

        const updatedRoom = roomService.updatePause(room.roomId, currentTime);

        io.to(room.roomId).emit('playback_updated', {
          playState: 'PAUSED',
          currentTime: updatedRoom.currentTime,
          updatedAt: updatedRoom.lastUpdatedAt,
          triggeredBy: participant.username,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to pause';
        socket.emit('error', { message });
      }
    });

    // ----------------------------------------------------
    // 5. SEEK
    // ----------------------------------------------------
    socket.on('seek', (payload: SeekPayload) => {
      try {
        const { authorized, room, participant } = authorizeAction('SEEK', payload?.roomId);
        if (!authorized || !room || !participant) return;

        if (typeof payload?.currentTime !== 'number' || !Number.isFinite(payload.currentTime)) {
          return socket.emit('error', { message: 'Invalid seek position provided.' });
        }

        const updatedRoom = roomService.updateSeek(room.roomId, payload.currentTime);

        io.to(room.roomId).emit('playback_updated', {
          playState: updatedRoom.playState,
          currentTime: updatedRoom.currentTime,
          updatedAt: updatedRoom.lastUpdatedAt,
          triggeredBy: participant.username,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to seek';
        socket.emit('error', { message });
      }
    });

    // ----------------------------------------------------
    // 6. CHANGE VIDEO
    // ----------------------------------------------------
    socket.on('change_video', (payload: ChangeVideoPayload) => {
      try {
        const { authorized, room, participant } = authorizeAction('CHANGE_VIDEO', payload?.roomId);
        if (!authorized || !room || !participant) return;

        if (!payload?.videoUrlOrId || typeof payload.videoUrlOrId !== 'string') {
          return socket.emit('error', { message: 'Video URL or ID is required.' });
        }

        const videoId = extractYouTubeVideoId(payload.videoUrlOrId);
        if (!videoId) {
          return socket.emit('error', {
            message: 'Invalid YouTube link or ID. Please provide a valid YouTube URL.',
          });
        }

        const updatedRoom = roomService.updateVideo(room.roomId, videoId);

        io.to(room.roomId).emit('video_changed', {
          videoId: updatedRoom.currentVideoId,
          currentTime: 0,
          playState: updatedRoom.playState,
          updatedAt: updatedRoom.lastUpdatedAt,
          triggeredBy: participant.username,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to change video';
        socket.emit('error', { message });
      }
    });

    // ----------------------------------------------------
    // 7. ASSIGN ROLE
    // ----------------------------------------------------
    socket.on('assign_role', (payload: AssignRolePayload) => {
      try {
        const { authorized, room, participant } = authorizeAction('ASSIGN_ROLE', payload?.roomId);
        if (!authorized || !room || !participant) return;

        if (!payload?.targetUserId || !payload?.newRole) {
          return socket.emit('error', { message: 'Target user ID and new role are required.' });
        }

        if (!['HOST', 'MODERATOR', 'PARTICIPANT'].includes(payload.newRole)) {
          return socket.emit('error', { message: 'Invalid role specified.' });
        }

        const updatedRoom = roomService.assignRole(room.roomId, payload.targetUserId, payload.newRole);
        const sanitizedRoom = roomService.sanitizeRoom(updatedRoom);

        io.to(room.roomId).emit('role_assigned', {
          targetUserId: payload.targetUserId,
          role: payload.newRole,
          participants: sanitizedRoom.participants,
          updatedBy: participant.username,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to assign role';
        socket.emit('error', { message });
      }
    });

    // ----------------------------------------------------
    // 8. REMOVE PARTICIPANT
    // ----------------------------------------------------
    socket.on('remove_participant', (payload: RemoveParticipantPayload) => {
      try {
        const { authorized, room, participant } = authorizeAction('REMOVE_PARTICIPANT', payload?.roomId);
        if (!authorized || !room || !participant) return;

        if (!payload?.targetUserId) {
          return socket.emit('error', { message: 'Target user ID is required.' });
        }

        const { room: updatedRoom, removedParticipant } = roomService.removeParticipant(
          room.roomId,
          payload.targetUserId
        );

        const sanitizedRoom = roomService.sanitizeRoom(updatedRoom);

        // Notify target participant's socket directly
        io.to(removedParticipant.socketId).emit('participant_removed', {
          targetUserId: removedParticipant.userId,
          reason: `You were removed from the room by ${participant.username}.`,
          participants: sanitizedRoom.participants,
        });

        // Make socket leave room channel
        const targetSocket = io.sockets.sockets.get(removedParticipant.socketId);
        if (targetSocket) {
          targetSocket.leave(room.roomId);
        }

        // Broadcast to everyone else in the room
        io.to(room.roomId).emit('user_left', {
          userId: removedParticipant.userId,
          username: removedParticipant.username,
          participants: sanitizedRoom.participants,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to remove participant';
        socket.emit('error', { message });
      }
    });

    // ----------------------------------------------------
    // 9. TRANSFER HOST
    // ----------------------------------------------------
    socket.on('transfer_host', (payload: TransferHostPayload) => {
      try {
        const { authorized, room, participant } = authorizeAction('TRANSFER_HOST', payload?.roomId);
        if (!authorized || !room || !participant) return;

        if (!payload?.targetUserId) {
          return socket.emit('error', { message: 'Target user ID is required.' });
        }

        const updatedRoom = roomService.assignRole(room.roomId, payload.targetUserId, 'HOST');
        const sanitizedRoom = roomService.sanitizeRoom(updatedRoom);

        io.to(room.roomId).emit('role_assigned', {
          targetUserId: payload.targetUserId,
          role: 'HOST',
          participants: sanitizedRoom.participants,
          updatedBy: participant.username,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to transfer host';
        socket.emit('error', { message });
      }
    });

    // ----------------------------------------------------
    // 10. CHAT MESSAGE
    // ----------------------------------------------------
    socket.on('send_chat', (payload: { roomId: string; message: string }) => {
      try {
        const data = roomService.getParticipantBySocketId(socket.id);
        if (!data) return;
        const { room, participant } = data;
        const rawMessage = (payload?.message || '').trim().slice(0, 300);
        if (!rawMessage) return;

        io.to(room.roomId).emit('chat_message', {
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          roomId: room.roomId,
          userId: participant.userId,
          username: participant.username,
          role: participant.role,
          message: rawMessage,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error('Error handling chat message:', err);
      }
    });

    // ----------------------------------------------------
    // 11. FLOATING REACTION
    // ----------------------------------------------------
    socket.on('send_reaction', (payload: { roomId: string; emoji: string }) => {
      try {
        const data = roomService.getParticipantBySocketId(socket.id);
        if (!data) return;
        const { room, participant } = data;
        const emoji = (payload?.emoji || '❤️').slice(0, 8);

        io.to(room.roomId).emit('reaction', {
          id: `react-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          roomId: room.roomId,
          username: participant.username,
          emoji,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error('Error handling reaction:', err);
      }
    });

    // ----------------------------------------------------
    // 12. DISCONNECT
    // ----------------------------------------------------
    socket.on('disconnect', () => {
      try {
        const result = roomService.handleDisconnect(socket.id);
        if (!result || result.roomDeleted) return;

        const { room, leftParticipant, newHostId } = result;
        if (leftParticipant) {
          const sanitizedRoom = roomService.sanitizeRoom(room);
          io.to(room.roomId).emit('user_left', {
            userId: leftParticipant.userId,
            username: leftParticipant.username,
            participants: sanitizedRoom.participants,
            newHostId,
          });
        }
      } catch (err) {
        console.error('Error handling socket disconnect:', err);
      }
    });
  });
}
