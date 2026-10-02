# YouTube Watch Party

A real-time, synchronized YouTube Watch Party web application engineered with Node.js, Express, Socket.IO, React, TypeScript, and the YouTube IFrame Player API. Built with strict role-based access control (RBAC), drift-resistant event-driven playback synchronization, and an in-memory room state architecture ready for single-service or decoupled production deployment on Render.

---

## Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Architecture](#architecture)
5. [Room Lifecycle](#room-lifecycle)
6. [Playback Synchronization](#playback-synchronization)
7. [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
8. [WebSocket Events](#websocket-events)
9. [Project Structure](#project-structure)
10. [Installation & Local Setup](#installation)
11. [Environment Variables](#environment-variables)
12. [Deployment](#deployment)
13. [Security](#security)
14. [Known Limitations](#known-limitations)
15. [Future Improvements](#future-improvements)

---

## Overview

YouTube Watch Party allows multiple users across different browsers and devices to watch YouTube videos in unison. When an authorized user plays, pauses, seeks, or changes the video, all participants in the room experience the exact same playback state in real time without continuous bandwidth-heavy polling.

The backend acts as the authoritative source of truth for both playback state and user permissions. Unauthorized actions attempted directly via client tampering or WebSocket payloads are strictly validated and rejected on the server.

---

## Features

- **Sub-Second Playback Synchronization**: Event-driven sync for `play`, `pause`, `seek`, and `change_video` with drift mitigation.
- **Elapsed Time Correction**: Newly joined or reconnecting users receive the active video with calculated elapsed playback time, preventing them from falling behind while a video is playing.
- **Feedback-Loop Prevention**: Programmatic player commands (from remote broadcasts) are marked and isolated so that local player state listeners do not echo events back to the server.
- **Strict Server-Side RBAC**: Three distinct roles (`HOST`, `MODERATOR`, `PARTICIPANT`) validated at the Socket.IO level before executing state mutations.
- **Host Role Reassignment**: If a host disconnects, the server automatically promotes an active moderator (or the next oldest participant) to host, preventing orphan rooms.
- **Room Code & Shareable Invite Link**: One-click URL copying with visual feedback.
- **Live Connection Monitor**: Real-time heartbeat indicator showing connection states (`Live Sync`, `Reconnecting`, `Offline`).
- **Resync Button**: Instant client-side resync button for viewers recovering from local device buffering or network spikes.
- **Production-Ready Unified Deployment**: Can be deployed as a single web service on Render where Express serves the production React build and handles WebSocket traffic simultaneously.

---

## Tech Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router DOM (v7)
- **Real-Time Client**: Socket.IO Client (v4)
- **Player API**: YouTube IFrame Player API
- **Icons**: Lucide React
- **Styling**: Vanilla CSS Design System with CSS Custom Properties, Glassmorphism, and Responsive Grid

### Backend
- **Runtime**: Node.js (v20+ / v24+)
- **Server Framework**: Express 4 with TypeScript
- **Real-Time Engine**: Socket.IO (v4)
- **CORS**: `cors` middleware with dynamic origin reflection
- **Configuration**: `dotenv`
- **Testing**: Vitest, Supertest

### State Persistence
- Clean, structured in-memory room repository designed for future extraction into Redis or PostgreSQL/Prisma without altering core domain logic.

---

## Architecture

```text
Browser (User Interaction)
       │
       ▼
React Component (PlaybackControls / YouTubePlayer)
       │
       ▼
Socket.IO Client (useWatchParty Hook)
       │ (WebSocket / Polling Fallback)
       ▼
Node.js + Express + Socket.IO Server
       │
       ├─► Authorization Guard (PermissionService.canPerformAction)
       │        │
       │        ├─► [Unauthorized] ──► Emit 'permission_error' to offending socket
       │        │
       │        └─► [Authorized]
       │                 │
       ▼                 ▼
Room State Manager (RoomService) ──► Mutate State (playState, currentTime, lastUpdatedAt)
       │
       ▼
Socket.IO Broadcast (io.to(roomId).emit)
       │
       ▼
All Connected Room Clients (Except sender or including sender depending on event)
       │
       ▼
YouTube Player API (Programmatic seekTo / playVideo / pauseVideo with feedback suppression)
```

---

## Room Lifecycle

1. **Room Creation (`/create` or `/`)**:
   - Host specifies an optional room code or accepts a cryptographically random, collision-resistant code (e.g., `party-7x9k`).
   - Host enters a display name and optionally specifies a starter YouTube URL.
   - Client joins Socket.IO room; backend assigns the first user as `HOST`.

2. **Joining Room (`/join/:roomId` or `/room/:roomId`)**:
   - Viewer enters room via URL or input code.
   - Viewer sends `join_room` event with `roomId` and `username`.
   - Backend registers participant with role `PARTICIPANT`.
   - Backend sends `sync_state` containing current video ID, play/pause state, elapsed time calculation, and full member list.
   - Backend broadcasts `user_joined` to all existing members.

3. **Active Party Session**:
   - Host/Moderator controls playback or switches video.
   - Server validates permissions, updates timestamps, and broadcasts `playback_updated` or `video_changed`.
   - Host can promote participants to `MODERATOR`, demote moderators, transfer `HOST`, or kick participants.

4. **Departure & Cleanup**:
   - When a user disconnects or clicks "Leave", `leave_room` is processed.
   - If a `HOST` leaves and other members remain, the oldest active `MODERATOR` (or oldest `PARTICIPANT`) is automatically promoted to `HOST` and notified.
   - When the last user leaves, the room is safely garbage-collected from the in-memory map.

---

## Playback Synchronization

Synchronizing video playback across diverse devices and varying network latencies requires a clear synchronization protocol:

### 1. Event-Driven Model (No Frame-by-Frame Flooding)
The system avoids emitting WebSocket events on every animation frame or timer tick. Sync events are emitted strictly on discrete actions:
- `play`: Emits current timestamp when playback begins.
- `pause`: Emits timestamp when playback pauses.
- `seek`: Emits target timestamp when the user scrubs the progress bar.
- `change_video`: Emits new video ID and resets playback to 0 seconds.

### 2. Elapsed Time Correction
When a client joins an ongoing room where the video is `PLAYING`:
$$\text{Effective Current Time} = \text{room.currentTime} + \frac{\text{Date.now()} - \text{room.lastUpdatedAt}}{1000}$$
This calculation ensures newly joined users do not start at the beginning or at a stale timestamp.

### 3. Drift Threshold Seeking
Clients periodically inspect the local player timestamp against incoming sync payloads. If the local player's time differs by more than **1.5 seconds**, the player performs a `seekTo` correction. Minor variances under 1.5 seconds are allowed to run smoothly to prevent audio stutter or jarring micro-seeks.

### 4. Feedback-Loop Prevention
When the YouTube IFrame player receives a remote command (e.g., `player.pauseVideo()`), the player's internal `onStateChange` listener would ordinarily fire and emit another `pause` event to the server, triggering an infinite broadcast loop.
To prevent this:
- An internal ref `isProgrammaticActionRef` is set to `true` immediately before executing any remote player command.
- When `onStateChange` fires, it checks `isProgrammaticActionRef`. If true, the event is swallowed and ignored.
- The flag is reset after a controlled tick window.

---

## Role-Based Access Control (RBAC)

The application enforces three roles with a strict hierarchy:

| Permission / Action | HOST | MODERATOR | PARTICIPANT |
| :--- | :---: | :---: | :---: |
| Play Video (`PLAY`) | Yes | Yes | No |
| Pause Video (`PAUSE`) | Yes | Yes | No |
| Seek Position (`SEEK`) | Yes | Yes | No |
| Change Video (`CHANGE_VIDEO`) | Yes | Yes | No |
| Promote / Demote Roles (`ASSIGN_ROLE`) | Yes | No | No |
| Kick Participant (`REMOVE_PARTICIPANT`) | Yes | No | No |
| Transfer Host (`TRANSFER_HOST`) | Yes | No | No |
| Watch & Resync | Yes | Yes | Yes |

### Why Backend Validation is Mandatory
Frontend UI controls (such as disabled buttons and hidden dropdowns) provide user guidance, but offer zero security against deliberate client tampering. A participant can open browser DevTools and execute:
```js
socket.emit('play', { roomId: 'party-123', currentTime: 0 });
```
The backend `PermissionService` intercepts every Socket.IO event, queries the user's role stored in memory, and rejects unauthorized requests with a `permission_error` event before any room mutation can occur.

---

## WebSocket Events

| Event | Direction | Payload | Purpose | Permission Required |
| :--- | :--- | :--- | :--- | :--- |
| `join_room` | Client -> Server | `{ roomId, username, userId? }` | Join or reconnect to room | Anyone |
| `leave_room` | Client -> Server | `{ roomId }` | Voluntarily leave room | Connected Participant |
| `play` | Client -> Server | `{ roomId, currentTime }` | Start playback | HOST, MODERATOR |
| `pause` | Client -> Server | `{ roomId, currentTime }` | Pause playback | HOST, MODERATOR |
| `seek` | Client -> Server | `{ roomId, currentTime }` | Seek to timestamp | HOST, MODERATOR |
| `change_video` | Client -> Server | `{ roomId, videoUrlOrId }` | Switch current video | HOST, MODERATOR |
| `assign_role` | Client -> Server | `{ roomId, targetUserId, newRole }` | Promote or demote user | HOST |
| `remove_participant`| Client -> Server | `{ roomId, targetUserId }` | Kick user from party | HOST |
| `transfer_host` | Client -> Server | `{ roomId, targetUserId }` | Transfer host role | HOST |
| `sync_state` | Server -> Client | `{ room, serverTime, currentParticipant }` | Initial synchronization | Server to joined socket |
| `playback_updated` | Server -> Client | `{ playState, currentTime, updatedAt, triggeredBy }` | Update play/pause/seek | Broadcast to room |
| `video_changed` | Server -> Client | `{ videoId, currentTime, playState, updatedAt, triggeredBy }` | New video loaded | Broadcast to room |
| `user_joined` | Server -> Client | `{ participant, participants }` | New member alert | Broadcast to room |
| `user_left` | Server -> Client | `{ userId, username, participants, newHostId? }` | Member departure & new host | Broadcast to room |
| `role_assigned` | Server -> Client | `{ targetUserId, role, participants, updatedBy }` | Role change notification | Broadcast to room |
| `participant_removed`| Server -> Client | `{ targetUserId, reason, participants }` | Member removal notice | Target socket & room |
| `permission_error` | Server -> Client | `{ action, message }` | Unauthorized action alert | Offending socket |
| `error` | Server -> Client | `{ message }` | General validation error | Offending socket |

---

## Project Structure

```text
/
├── client/                     # Vite + React + TypeScript Frontend
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ConnectionBadge.tsx   # Live connection indicator
│   │   │   ├── ParticipantsList.tsx  # Member list with Host action menus
│   │   │   ├── PlaybackControls.tsx  # Scrub bar, play, pause, rewind, fast-forward
│   │   │   ├── RoleBadge.tsx         # Host / Moderator / Viewer badges
│   │   │   ├── ToastContainer.tsx    # Non-intrusive alert notifications
│   │   │   ├── VideoChangeModal.tsx  # URL input modal with demo presets
│   │   │   └── YouTubePlayer.tsx     # Reusable IFrame player with feedback suppression
│   │   ├── hooks/
│   │   │   └── useWatchParty.ts      # Core state machine, socket handlers, and RBAC actions
│   │   ├── pages/
│   │   │   ├── CreateRoomPage.tsx    # Room creation page
│   │   │   ├── HomePage.tsx          # Landing hero page with quick join
│   │   │   ├── JoinRoomPage.tsx      # Invitation landing page
│   │   │   ├── NotFoundPage.tsx      # 404 handler
│   │   │   └── WatchRoomPage.tsx     # Primary Watch Room interface
│   │   ├── services/
│   │   │   └── socket.ts             # Socket.IO connection manager with auto-discovery
│   │   ├── types/
│   │   │   ├── events.ts             # Socket event payload types
│   │   │   ├── rbac.ts               # Role and Action definitions
│   │   │   └── room.ts               # Room and Participant definitions
│   │   ├── utils/
│   │   │   ├── time.ts               # Timestamp formatting (MM:SS)
│   │   │   └── youtube.ts            # Video ID extraction and URL validation
│   │   ├── App.tsx                   # Route definitions
│   │   ├── index.css                 # Vanilla CSS design system
│   │   └── main.tsx                  # React DOM entry point
│   ├── index.html                    # Root HTML document
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── server/                     # Node.js + Express + TypeScript Backend
│   ├── src/
│   │   ├── __tests__/          # Automated test suites
│   │   │   ├── apiAndSocket.test.ts  # Integration test for health check & socket sync
│   │   │   ├── permissions.test.ts   # RBAC permission unit tests
│   │   │   ├── roomService.test.ts   # Room lifecycle and elapsed time unit tests
│   │   │   └── youtube.test.ts       # URL parser & ID validation unit tests
│   │   ├── controllers/
│   │   │   ├── healthController.ts   # GET /api/health endpoint
│   │   │   └── roomController.ts     # REST endpoints for room inspection
│   │   ├── middleware/
│   │   │   └── errorHandler.ts       # Global error handling middleware
│   │   ├── services/
│   │   │   ├── permissionService.ts  # Centralized RBAC validation engine
│   │   │   └── roomService.ts        # In-memory room state management & elapsed sync
│   │   ├── types/
│   │   │   ├── events.ts             # Server event types
│   │   │   ├── rbac.ts               # Role and Action types
│   │   │   └── room.ts               # Room and Participant data models
│   │   ├── utils/
│   │   │   ├── idGenerator.ts        # Collision-resistant ID generator
│   │   │   └── youtube.ts            # Server-side YouTube URL parser
│   │   ├── websocket/
│   │   │   └── socketHandler.ts      # Socket.IO event router and authorization guard
│   │   └── server.ts                 # Express & Socket.IO server setup with static fallback
│   ├── package.json
│   └── tsconfig.json
│
├── package.json                # Monorepo orchestration scripts
├── render.yaml                 # Render Blueprint configuration
├── .gitignore                  # Git ignore rules
├── .env.example                # Root environment template
└── README.md                   # Project documentation
```

---

## Installation

### Prerequisites
- Node.js (version 20 or higher recommended; Node 24 supported)
- npm (version 10 or higher)

### Setup Commands

1. **Clone repository and navigate to root**:
   ```bash
   git clone <REPO_URL>
   cd WatchParty
   ```

2. **Install all dependencies (root, client, and server)**:
   ```bash
   npm run build
   ```
   *Note: If installing manually per directory:*
   ```bash
   cd client && npm install
   cd ../server && npm install
   cd ..
   ```

3. **Run in Development Mode**:
   Open two terminal windows:
   - Terminal 1 (Backend Server):
     ```bash
     npm run dev:server
     ```
     Server will start on `http://localhost:4000`.
   - Terminal 2 (Frontend Client):
     ```bash
     npm run dev:client
     ```
     Client will start on `http://localhost:5173`.

4. **Run Automated Tests**:
   ```bash
   npm run test
   ```
   Runs Vitest test suites covering URL parsing, RBAC permissions, room lifecycle, and live Socket.IO synchronization.

5. **Build and Run for Production**:
   ```bash
   npm run build
   npm run start
   ```
   Opens unified server at `http://localhost:4000` with the production UI bundled and served statically.

---

## Environment Variables

### Root / Server (`server/.env`)
```ini
PORT=4000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### Client (`client/.env`)
```ini
# Points to backend server during development.
# In unified single-service production, leave blank or omit to use same-origin.
VITE_SERVER_URL=http://localhost:4000
```

---

## Deployment

The application is pre-configured for deployment on **Render** using the included `render.yaml`.

### Single-Service Unified Deployment (Recommended)
1. Push your repository to GitHub.
2. In Render, select **New +** -> **Blueprint**.
3. Select your repository. Render will automatically read `render.yaml`.
4. Render builds both the client and server, then starts the Express server which serves both the frontend static bundle and WebSocket connections on a single URL.

- **Deployed Frontend URL**: `<YOUR_RENDER_FRONTEND_URL>`
- **Deployed Backend URL**: `<YOUR_RENDER_BACKEND_URL>`

---

## Security

1. **Zero Trust Client Roles**: User roles are maintained strictly in server memory. Socket events carry no trusted client role payloads. The server looks up the socket ID in its internal session map.
2. **Input Validation**: Video URLs, IDs, and seek timestamps are sanitized and validated with regular expressions and finite number checks before triggering mutations.
3. **Private Data Masking**: Socket IDs and raw socket objects are stripped before room states are broadcast to clients (`sanitizeRoom` and `sanitizeParticipant`).
4. **CORS Configuration**: Restricts origins and method types for HTTP endpoints.

---

## Known Limitations

- **In-Memory Volatility**: If the Node server restarts or crashes, active rooms and participant lists are reset.
- **YouTube Embed Restrictions**: Some YouTube videos (e.g., copyright-restricted music videos or videos with embedding disabled by the creator) cannot be played inside third-party iframes due to YouTube's platform policy. In these cases, the player displays a clear "Video Unavailable" overlay.
- **Single Process Scaling**: Designed for a single server instance. Multi-instance horizontal scaling would require a Socket.IO Redis adapter and Redis-backed room state.

---

## Future Improvements

- **Persistent Rooms with Redis**: Integrate a Redis adapter for Socket.IO to support multi-process horizontal scaling across multiple server instances.
- **Real-Time Text Chat & Reactions**: Add room-specific live messaging, user avatars, and floating emoji reactions.
- **User Authentication**: Implement JWT/OAuth authentication (e.g., Google Sign-In) to persist user profiles and favorite watch parties.
- **Video Queue / Playlist**: Allow the host and moderators to queue up multiple YouTube videos in a shared playlist.
- **WebRTC Voice Chat**: Add optional low-latency audio chat among room members during streams.
