import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import express from 'express';
import { getHealth } from '../controllers/healthController.js';
import { createRoom, getRoom } from '../controllers/roomController.js';
import { setupSocketHandlers } from '../websocket/socketHandler.js';
import { roomService } from '../services/roomService.js';

describe('API & Socket.IO Integration Tests', () => {
  let app: express.Express;
  let httpServer: ReturnType<typeof createServer>;
  let ioServer: Server;
  let serverPort: number;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.get('/api/health', getHealth);
    app.post('/api/rooms', createRoom);
    app.get('/api/rooms/:roomId', getRoom);

    httpServer = createServer(app);
    ioServer = new Server(httpServer, {
      cors: { origin: '*' },
    });
    setupSocketHandlers(ioServer);

    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        const addr = httpServer.address();
        if (typeof addr === 'object' && addr !== null) {
          serverPort = addr.port;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    ioServer.close();
    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
  });

  // REST API Tests
  it('GET /api/health returns 200 with server status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptime).toBe('number');
    expect(res.body.service).toContain('Watch Party');
  });

  it('POST /api/rooms creates a new room', async () => {
    const res = await request(app)
      .post('/api/rooms')
      .send({ customRoomId: 'api-test-room' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.room.roomId).toBe('api-test-room');
  });

  it('GET /api/rooms/:roomId returns room details or 404', async () => {
    const resFound = await request(app).get('/api/rooms/api-test-room');
    expect(resFound.status).toBe(200);
    expect(resFound.body.room.roomId).toBe('api-test-room');

    const resNotFound = await request(app).get('/api/rooms/non-existent-room');
    expect(resNotFound.status).toBe(404);
  });

  // Socket.IO Real-time Tests
  it('handles room join, synchronization, and broadcasts', async () => {
    const hostSocket: ClientSocket = Client(`http://localhost:${serverPort}`);
    const viewerSocket: ClientSocket = Client(`http://localhost:${serverPort}`);

    const roomId = 'live-sync-test';

    // 1. Host joins
    const hostSyncPromise = new Promise<any>((resolve) => {
      hostSocket.on('sync_state', (data) => resolve(data));
    });

    hostSocket.emit('join_room', { roomId, username: 'HostUser' });
    const hostSyncData = await hostSyncPromise;

    expect(hostSyncData.currentParticipant.role).toBe('HOST');
    expect(hostSyncData.room.roomId).toBe(roomId);

    // 2. Viewer joins
    const viewerSyncPromise = new Promise<any>((resolve) => {
      viewerSocket.on('sync_state', (data) => resolve(data));
    });
    const hostNotifiedPromise = new Promise<any>((resolve) => {
      hostSocket.on('user_joined', (data) => resolve(data));
    });

    viewerSocket.emit('join_room', { roomId, username: 'ViewerUser' });
    const viewerSyncData = await viewerSyncPromise;
    const hostNotifiedData = await hostNotifiedPromise;

    expect(viewerSyncData.currentParticipant.role).toBe('PARTICIPANT');
    expect(hostNotifiedData.participant.username).toBe('ViewerUser');

    // 3. Host emits PLAY -> Viewer receives playback_updated
    const viewerPlayPromise = new Promise<any>((resolve) => {
      viewerSocket.on('playback_updated', (data) => resolve(data));
    });

    hostSocket.emit('play', { roomId, currentTime: 25.5 });
    const playbackData = await viewerPlayPromise;

    expect(playbackData.playState).toBe('PLAYING');
    expect(playbackData.currentTime).toBe(25.5);
    expect(playbackData.triggeredBy).toBe('HostUser');

    // 4. Viewer (PARTICIPANT) attempts to emit PLAY -> rejected with permission_error!
    const permissionErrorPromise = new Promise<any>((resolve) => {
      viewerSocket.on('permission_error', (data) => resolve(data));
    });

    viewerSocket.emit('play', { roomId, currentTime: 50 });
    const errorData = await permissionErrorPromise;

    expect(errorData.action).toBe('PLAY');
    expect(errorData.message).toContain('not permitted');

    // Clean up sockets
    hostSocket.disconnect();
    viewerSocket.disconnect();
  });
});
