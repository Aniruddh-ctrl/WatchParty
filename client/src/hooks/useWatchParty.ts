import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { YouTubePlayerRef } from '../components/YouTubePlayer';
import { getSocket } from '../services/socket';
import type {
  ChatMessagePayload,
  ErrorPayload,
  ParticipantRemovedPayload,
  PermissionErrorPayload,
  PlaybackUpdatedPayload,
  ReactionPayload,
  RoleAssignedPayload,
  SyncStatePayload,
  UserJoinedPayload,
  UserLeftPayload,
  VideoChangedPayload,
} from '../types/events';
import { canPerformAction, type Action, type Role } from '../types/rbac';
import type { Participant, Room } from '../types/room';

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export function useWatchParty(roomId: string, initialUsername?: string) {
  const navigate = useNavigate();
  const playerRef = useRef<YouTubePlayerRef | null>(null);

  const [room, setRoom] = useState<Room | null>(null);
  const [currentUser, setCurrentUser] = useState<Participant | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessagePayload[]>([]);
  const [reactions, setReactions] = useState<ReactionPayload[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [roomNotFound, setRoomNotFound] = useState<boolean>(false);

  // Sync tracking to prevent redundant seeks
  const lastSyncTimeRef = useRef<number>(0);

  const addToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]); // Keep last 5 max

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Check if current user has permission
  const checkPermission = useCallback(
    (action: Action): boolean => {
      if (!currentUser) return false;
      return canPerformAction(currentUser.role, action);
    },
    [currentUser]
  );

  // Synchronize player with room state
  const applyRoomSync = useCallback(
    (targetRoom: Room, immediatePlay: boolean = false) => {
      if (!playerRef.current) return;

      const player = playerRef.current;
      const calculatedTime = targetRoom.currentTime;

      // Check current player time
      const playerCurrentTime = player.getCurrentTime();
      const timeDifference = Math.abs(playerCurrentTime - calculatedTime);

      // Only seek if time drift is greater than 1.5 seconds to prevent jarring micro-adjustments
      if (timeDifference > 1.5) {
        player.seekTo(calculatedTime);
      }

      if (targetRoom.playState === 'PLAYING' || immediatePlay) {
        player.play();
      } else if (targetRoom.playState === 'PAUSED') {
        player.pause();
      }
    },
    []
  );

  // Setup Socket listeners
  useEffect(() => {
    if (!roomId) return;

    const socket = getSocket();
    let storedUsername = initialUsername || localStorage.getItem(`wp_username_${roomId}`) || localStorage.getItem('wp_last_username');
    if (!storedUsername || storedUsername.trim() === '') {
      storedUsername = `Guest_${Math.floor(100 + Math.random() * 900)}`;
    }

    const storedUserId = localStorage.getItem(`wp_user_id_${roomId}`) || undefined;

    // Join room when connected
    const emitJoin = () => {
      setConnectionStatus('connecting');
      socket.emit('join_room', {
        roomId,
        username: storedUsername,
        userId: storedUserId,
      });
    };

    if (socket.connected) {
      emitJoin();
    }

    const onConnect = () => {
      setConnectionStatus('connected');
      emitJoin();
    };

    const onDisconnect = () => {
      setConnectionStatus('disconnected');
    };

    const onReconnectAttempt = () => {
      setConnectionStatus('reconnecting');
    };

    // 1. Initial or full room synchronization
    const onSyncState = (payload: SyncStatePayload) => {
      setIsLoading(false);
      setRoomNotFound(false);
      setConnectionStatus('connected');
      setRoom(payload.room);
      setCurrentUser(payload.currentParticipant);

      // Save user identity in localStorage
      localStorage.setItem(`wp_username_${roomId}`, payload.currentParticipant.username);
      localStorage.setItem(`wp_last_username`, payload.currentParticipant.username);
      localStorage.setItem(`wp_user_id_${roomId}`, payload.currentParticipant.userId);

      // Programmatically apply room state to player
      setTimeout(() => {
        applyRoomSync(payload.room);
      }, 300);
    };

    // 2. Playback state updated (Play/Pause/Seek)
    const onPlaybackUpdated = (payload: PlaybackUpdatedPayload) => {
      setRoom((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          playState: payload.playState,
          currentTime: payload.currentTime,
          lastUpdatedAt: payload.updatedAt,
        };
      });

      if (!playerRef.current) return;

      const player = playerRef.current;
      const playerTime = player.getCurrentTime();
      const drift = Math.abs(playerTime - payload.currentTime);

      // Apply seek if drift is noticeable
      if (drift > 1.5) {
        player.seekTo(payload.currentTime);
      }

      if (payload.playState === 'PLAYING') {
        player.play();
      } else if (payload.playState === 'PAUSED') {
        player.pause();
      }

      lastSyncTimeRef.current = payload.currentTime;
    };

    // 3. Video changed
    const onVideoChanged = (payload: VideoChangedPayload) => {
      setRoom((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          currentVideoId: payload.videoId,
          currentTime: 0,
          playState: payload.playState,
          lastUpdatedAt: payload.updatedAt,
        };
      });

      if (playerRef.current) {
        playerRef.current.loadVideo(payload.videoId, 0);
      }

      addToast(`${payload.triggeredBy} changed the video.`, 'info');
    };

    // 4. User joined
    const onUserJoined = (payload: UserJoinedPayload) => {
      setRoom((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          participants: payload.participants,
        };
      });
      addToast(`${payload.participant.username} joined the party!`, 'info');
    };

    // 5. User left
    const onUserLeft = (payload: UserLeftPayload) => {
      setRoom((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          participants: payload.participants,
          hostId: payload.newHostId || prev.hostId,
        };
      });

      // Update role if this client was promoted to host
      if (payload.newHostId && currentUser?.userId === payload.newHostId) {
        setCurrentUser((prev) => (prev ? { ...prev, role: 'HOST' } : null));
        addToast('You are now the Host of the room!', 'success');
      } else {
        addToast(`${payload.username} left the room.`, 'info');
      }
    };

    // 6. Role assigned
    const onRoleAssigned = (payload: RoleAssignedPayload) => {
      setRoom((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          participants: payload.participants,
          hostId: payload.role === 'HOST' ? payload.targetUserId : prev.hostId,
        };
      });

      // If this user was affected
      if (currentUser?.userId === payload.targetUserId) {
        setCurrentUser((prev) => (prev ? { ...prev, role: payload.role } : null));
        addToast(`Your role was updated to ${payload.role}.`, 'success');
      } else {
        const target = payload.participants.find((p) => p.userId === payload.targetUserId);
        const name = target ? target.username : 'A user';
        addToast(`${name} is now ${payload.role}.`, 'info');
      }
    };

    // 7. Participant removed
    const onParticipantRemoved = (payload: ParticipantRemovedPayload) => {
      if (currentUser?.userId === payload.targetUserId) {
        addToast(payload.reason || 'You were removed from the room.', 'error');
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        setRoom((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            participants: payload.participants,
          };
        });
      }
    };

    // 8. Permission error
    const onPermissionError = (payload: PermissionErrorPayload) => {
      addToast(payload.message || 'Permission denied.', 'warning');
    };

    // 9. Generic error
    const onError = (payload: ErrorPayload) => {
      addToast(payload.message || 'An error occurred.', 'error');
      if (payload.message.includes('not found')) {
        setRoomNotFound(true);
        setIsLoading(false);
      }
    };

    // 10. Chat Message
    const onChatMessage = (payload: ChatMessagePayload) => {
      setChatMessages((prev) => [...prev.slice(-99), payload]); // keep last 100 messages
    };

    // 11. Floating Reaction
    const onReaction = (payload: ReactionPayload) => {
      setReactions((prev) => [...prev.slice(-15), payload]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== payload.id));
      }, 3500);
    };

    // Attach listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('reconnect_attempt', onReconnectAttempt);
    socket.on('sync_state', onSyncState);
    socket.on('playback_updated', onPlaybackUpdated);
    socket.on('video_changed', onVideoChanged);
    socket.on('user_joined', onUserJoined);
    socket.on('user_left', onUserLeft);
    socket.on('role_assigned', onRoleAssigned);
    socket.on('participant_removed', onParticipantRemoved);
    socket.on('permission_error', onPermissionError);
    socket.on('error', onError);
    socket.on('chat_message', onChatMessage);
    socket.on('reaction', onReaction);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('reconnect_attempt', onReconnectAttempt);
      socket.off('sync_state', onSyncState);
      socket.off('playback_updated', onPlaybackUpdated);
      socket.off('video_changed', onVideoChanged);
      socket.off('user_joined', onUserJoined);
      socket.off('user_left', onUserLeft);
      socket.off('role_assigned', onRoleAssigned);
      socket.off('participant_removed', onParticipantRemoved);
      socket.off('permission_error', onPermissionError);
      socket.off('error', onError);
      socket.off('chat_message', onChatMessage);
      socket.off('reaction', onReaction);
    };
  }, [roomId, initialUsername, applyRoomSync, addToast, currentUser?.userId, navigate]);

  // Actions
  const handleSendChat = useCallback(
    (message: string) => {
      const trimmed = message.trim();
      if (!trimmed) return;
      const socket = getSocket();
      socket.emit('send_chat', { roomId, message: trimmed });
    },
    [roomId]
  );

  const handleSendReaction = useCallback(
    (emoji: string) => {
      const socket = getSocket();
      socket.emit('send_reaction', { roomId, emoji });
    },
    [roomId]
  );

  const handlePlay = useCallback(
    (currentTime: number) => {
      if (!checkPermission('PLAY')) {
        addToast('Only Host or Moderators can play.', 'warning');
        return;
      }
      const socket = getSocket();
      socket.emit('play', { roomId, currentTime });
    },
    [roomId, checkPermission, addToast]
  );

  const handlePause = useCallback(
    (currentTime: number) => {
      if (!checkPermission('PAUSE')) {
        addToast('Only Host or Moderators can pause.', 'warning');
        return;
      }
      const socket = getSocket();
      socket.emit('pause', { roomId, currentTime });
    },
    [roomId, checkPermission, addToast]
  );

  const handleSeek = useCallback(
    (currentTime: number) => {
      if (!checkPermission('SEEK')) {
        addToast('Only Host or Moderators can seek.', 'warning');
        return;
      }
      const socket = getSocket();
      socket.emit('seek', { roomId, currentTime });
    },
    [roomId, checkPermission, addToast]
  );

  const handleChangeVideo = useCallback(
    (videoUrlOrId: string) => {
      if (!checkPermission('CHANGE_VIDEO')) {
        addToast('Only Host or Moderators can change the video.', 'warning');
        return;
      }
      const socket = getSocket();
      socket.emit('change_video', { roomId, videoUrlOrId });
    },
    [roomId, checkPermission, addToast]
  );

  const handleAssignRole = useCallback(
    (targetUserId: string, newRole: Role) => {
      if (!checkPermission('ASSIGN_ROLE')) {
        addToast('Only the Host can assign roles.', 'warning');
        return;
      }
      const socket = getSocket();
      socket.emit('assign_role', { roomId, targetUserId, newRole });
    },
    [roomId, checkPermission, addToast]
  );

  const handleRemoveParticipant = useCallback(
    (targetUserId: string) => {
      if (!checkPermission('REMOVE_PARTICIPANT')) {
        addToast('Only the Host can remove participants.', 'warning');
        return;
      }
      const socket = getSocket();
      socket.emit('remove_participant', { roomId, targetUserId });
    },
    [roomId, checkPermission, addToast]
  );

  const handleTransferHost = useCallback(
    (targetUserId: string) => {
      if (!checkPermission('TRANSFER_HOST')) {
        addToast('Only the Host can transfer host permissions.', 'warning');
        return;
      }
      const socket = getSocket();
      socket.emit('transfer_host', { roomId, targetUserId });
    },
    [roomId, checkPermission, addToast]
  );

  const handleLeaveRoom = useCallback(() => {
    const socket = getSocket();
    socket.emit('leave_room', { roomId });
    navigate('/');
  }, [roomId, navigate]);

  // Resync button action if client experiences lag
  const handleForceResync = useCallback(() => {
    if (room) {
      applyRoomSync(room, room.playState === 'PLAYING');
      addToast('Resynchronized with room state.', 'info');
    }
  }, [room, applyRoomSync, addToast]);

  return {
    room,
    currentUser,
    connectionStatus,
    isLoading,
    roomNotFound,
    toasts,
    chatMessages,
    reactions,
    playerRef,
    checkPermission,
    handlePlay,
    handlePause,
    handleSeek,
    handleChangeVideo,
    handleAssignRole,
    handleRemoveParticipant,
    handleTransferHost,
    handleLeaveRoom,
    handleForceResync,
    handleSendChat,
    handleSendReaction,
    removeToast,
  };
}
