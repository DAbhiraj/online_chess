# 🧩 Low-Level Code Flow

This document outlines how different flows in the app function under the hood: matchmaking (guest & logged-in users), private lobbies for friend matches, and authentication via magic links and Google OAuth2.

---

### 🔁 Guest & Logged-in Matchmaking Flow

1. **Player joins as a guest or authenticated user** and clicks either “Play as Guest” or “Find Match”.
2. The frontend sends a matchmaking request to the backend, which **adds the player ID to a Redis queue**.
3. A **Redis Pub/Sub listener** continuously monitors the queue and pairs players in real time.
4. When two players are available:
   - A unique `gameId` is generated.
   - Redis stores the initial game state (FEN, player IDs, and timers).
   - Both players are redirected to `/play/{gameId}`.
5. Each client **subscribes to `/topic/game.{gameId}`** using STOMP over WebSocket.
6. Player moves are sent to `/app/move.{gameId}` → validated using `chess.js` → updated in Redis → broadcasted to both clients.
7. The backend handles:
   - Timer synchronization and countdown logic
   - Move validation and turn enforcement
   - Win/draw/loss detection
   - Last move highlighting

> ✅ The core difference: for **guests**, the game state is stored only in Redis. For **authenticated users**, it is also persisted in PostgreSQL so they can view match history in their profile.

---

### 🧑‍🤝‍🧑 Private Lobby (Friend Match) Flow

1. A logged-in user creates a lobby → the backend generates a unique `lobbyId`.
2. The user receives a **shareable invite code** (e.g., `Guest1234`) to send to their friend.
3. The invited friend joins by entering the code in the "Join Lobby" section.
4. Once both players are in the lobby:
   - One user sends a **matchmaking request** via WebSocket to the other.
   - The other player either **accepts** or **rejects** the request.
   - Responses are communicated through WebSocket topics:  
     `/matchmakingconfirm/{userId}` or `/matchmakingreject/{userId}`
5. Upon acceptance:
   - The backend generates a `gameId`, initializes the session in Redis, and redirects both players to `/play/{gameId}`.
   - The gameplay follows the same real-time WebSocket flow as standard matchmaking.

> 🧠 Lobbies provide a structured way for friends to play together with full control over match initiation.

---

### 🔐 Magic Link Login Flow

1. The user enters their email on the login screen and clicks **"Send Magic Link"**.
2. The backend:
   - Validates the email format.
   - Generates a one-time-use **JWT token** with an expiration time (e.g., 10 minutes).
   - Stores the token temporarily and sends an email with a login link:  
     `https://chess-app.com/magic-login?token=...`
3. When the user clicks the link, the frontend extracts the token and sends it to the backend for verification.
4. If valid:
   - The backend issues a secure session JWT.
   - The frontend stores the token in `localStorage` and authenticates the user.

> 🔐 Magic link login is secure, stateless, and passwordless. Tokens cannot be reused after expiration or initial login.

---

### 🧑‍💻 Key Backend Classes

- `GameController.java`: Handles all STOMP WebSocket endpoints for moves and matchmaking.
- `GameService.java`: Core logic for gameplay, including FEN updates, timer control, and move validation.
- `LobbyService.java`: Manages creation, join logic, and matchmaking requests in private lobbies.
- `AuthController.java`: Manages Google OAuth2 and Magic Link login endpoints.
- `SecurityConfig.java`: Configures JWT filters, CORS policies, and public route access.

---

### 🧑‍💻 Key Frontend Components

- `ChessboardComponent.jsx`: Renders the chessboard, highlights moves, and manages real-time sync via WebSocket.
- `ChessBoard.jsx`: High-level game wrapper; manages timer, move dispatching, and WebSocket state.
- `LoginPage.jsx`: Supports both Google OAuth and magic link authentication.
- `Lobby.jsx`: Handles lobby creation, matchmaking requests, and game initialization between friends.
- `HomePage.jsx`: Lets users start matchmaking as guest or authenticated players and handles routing logic.
