import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import { getHealth } from './controllers/healthController.js';
import { createRoom, getRoom } from './controllers/roomController.js';
import { errorHandler } from './middleware/errorHandler.js';
import { setupSocketHandlers } from './websocket/socketHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '4000', 10);
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const app = express();
const httpServer = createServer(app);

// Setup Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin) return callback(null, true);
      // In dev or if configured, allow all origins or CLIENT_URL
      if (process.env.NODE_ENV !== 'production' || origin === CLIENT_URL) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive CORS for smooth Render deployments
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());

// API Routes
app.get('/api/health', getHealth);
app.post('/api/rooms', createRoom);
app.get('/api/rooms/:roomId', getRoom);

// Mount Socket.IO logic
setupSocketHandlers(io);

// Static file serving for single-service production (Render)
const clientDistPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      // In development when client dist doesn't exist, return API status
      res.status(200).send('WatchParty API Server running. Client running in development mode.');
    }
  });
});

// Global error handler
app.use(errorHandler);

// Start server
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[WatchParty Server] Running on http://localhost:${PORT}`);
  console.log(`[WatchParty Server] Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
const shutdown = () => {
  console.log('[WatchParty Server] Shutting down gracefully...');
  httpServer.close(() => {
    console.log('[WatchParty Server] Closed all HTTP and Socket.IO connections.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export { app, httpServer, io };
