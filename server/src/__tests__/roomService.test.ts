import { describe, it, expect, beforeEach } from 'vitest';
import { RoomService } from '../services/roomService.js';

describe('RoomService', () => {
  let service: RoomService;

  beforeEach(() => {
    service = new RoomService();
  });

  it('creates a room with default starter video and in PAUSED state', () => {
    const room = service.createRoom('test-room-1', 'custom-video-id');
    expect(room.roomId).toBe('test-room-1');
    expect(room.currentVideoId).toBe('custom-video-id');
    expect(room.playState).toBe('PAUSED');
    expect(room.currentTime).toBe(0);
    expect(room.participants).toHaveLength(0);
  });

  it('assigns HOST role to first user joining a room', () => {
    service.createRoom('test-room-2');
    const { participant, isNewHost } = service.joinRoom('test-room-2', 'Alice', 'socket_1');

    expect(participant.role).toBe('HOST');
    expect(participant.username).toBe('Alice');
    expect(isNewHost).toBe(true);

    const room = service.getRoom('test-room-2');
    expect(room?.hostId).toBe(participant.userId);
  });

  it('assigns PARTICIPANT role to subsequent users joining', () => {
    service.createRoom('test-room-3');
    service.joinRoom('test-room-3', 'Alice', 'socket_1');
    const { participant, isNewHost } = service.joinRoom('test-room-3', 'Bob', 'socket_2');

    expect(participant.role).toBe('PARTICIPANT');
    expect(participant.username).toBe('Bob');
    expect(isNewHost).toBe(false);

    const room = service.getRoom('test-room-3');
    expect(room?.participants).toHaveLength(2);
  });

  it('correctly calculates elapsed time during playback', async () => {
    service.createRoom('test-room-4');
    service.updatePlay('test-room-4', 10);

    const room = service.getRoom('test-room-4')!;
    expect(room.playState).toBe('PLAYING');

    // Simulate 200ms elapsed
    await new Promise((resolve) => setTimeout(resolve, 200));

    const calculatedTime = service.calculateCurrentTime(room);
    expect(calculatedTime).toBeGreaterThanOrEqual(10.15);
  });

  it('handles pause and seek accurately', () => {
    service.createRoom('test-room-5');
    service.updatePlay('test-room-5', 5);
    service.updatePause('test-room-5', 12);

    let room = service.getRoom('test-room-5')!;
    expect(room.playState).toBe('PAUSED');
    expect(room.currentTime).toBe(12);

    service.updateSeek('test-room-5', 45);
    room = service.getRoom('test-room-5')!;
    expect(room.currentTime).toBe(45);
  });

  it('promotes participant to MODERATOR and allows transferring HOST', () => {
    service.createRoom('test-room-6');
    const { participant: host } = service.joinRoom('test-room-6', 'Alice', 'socket_1');
    const { participant: bob } = service.joinRoom('test-room-6', 'Bob', 'socket_2');

    // Promote Bob to MODERATOR
    service.assignRole('test-room-6', bob.userId, 'MODERATOR');
    expect(bob.role).toBe('MODERATOR');

    // Transfer Host to Bob
    service.assignRole('test-room-6', bob.userId, 'HOST');
    expect(bob.role).toBe('HOST');
    expect(host.role).toBe('MODERATOR');

    const room = service.getRoom('test-room-6')!;
    expect(room.hostId).toBe(bob.userId);
  });

  it('transfers host automatically to moderator when host leaves', () => {
    service.createRoom('test-room-7');
    const { participant: alice } = service.joinRoom('test-room-7', 'Alice', 'socket_1');
    const { participant: bob } = service.joinRoom('test-room-7', 'Bob', 'socket_2');
    const { participant: charlie } = service.joinRoom('test-room-7', 'Charlie', 'socket_3');

    // Make Charlie a Moderator
    service.assignRole('test-room-7', charlie.userId, 'MODERATOR');

    // Alice (Host) leaves
    const result = service.leaveRoom('test-room-7', alice.userId);
    expect(result.roomDeleted).toBe(false);
    expect(result.newHostId).toBe(charlie.userId); // Charlie prioritized because he was Moderator

    const room = service.getRoom('test-room-7')!;
    expect(room.hostId).toBe(charlie.userId);
    expect(charlie.role).toBe('HOST');
  });

  it('deletes room when last participant leaves', () => {
    service.createRoom('test-room-8');
    const { participant: alice } = service.joinRoom('test-room-8', 'Alice', 'socket_1');

    const result = service.leaveRoom('test-room-8', alice.userId);
    expect(result.roomDeleted).toBe(true);
    expect(service.hasRoom('test-room-8')).toBe(false);
  });

  it('removes participant and prevents removing the room host', () => {
    service.createRoom('test-room-9');
    const { participant: alice } = service.joinRoom('test-room-9', 'Alice', 'socket_1');
    const { participant: bob } = service.joinRoom('test-room-9', 'Bob', 'socket_2');

    // Cannot remove host
    expect(() => service.removeParticipant('test-room-9', alice.userId)).toThrow();

    // Can remove participant
    const { removedParticipant } = service.removeParticipant('test-room-9', bob.userId);
    expect(removedParticipant.userId).toBe(bob.userId);

    const room = service.getRoom('test-room-9')!;
    expect(room.participants).toHaveLength(1);
  });
});
