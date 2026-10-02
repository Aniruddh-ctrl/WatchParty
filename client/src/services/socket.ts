import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocketServerUrl(): string {
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL;
  }

  // If running in development (port 5173), connect to backend at port 4000
  // Supports localhost, 127.0.0.1, AND local Wi-Fi IPs (e.g. 192.168.x.x on phones/tablets)
  if (window.location.port === '5173') {
    return `http://${window.location.hostname}:4000`;
  }

  // Fallback for local testing
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:4000';
  }

  // In production single-server deployment, use same origin
  return window.location.origin;
}

export function initSocket(): Socket {
  if (!socket) {
    const serverUrl = getSocketServerUrl();
    socket = io(serverUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      transports: ['websocket', 'polling'], // Prioritize websocket, fallback to polling
    });
  }
  return socket;
}

export function getSocket(): Socket {
  if (!socket) {
    return initSocket();
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
