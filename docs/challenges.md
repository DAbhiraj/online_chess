# ⚔️ Challenges & Solutions

### 🔐 Spring Security with OAuth2 + Magic Link
- Integrating both Google OAuth2 and email-based login required custom JWT logic and token validation.
- Solved by verifying Google ID tokens on backend and creating JWTs for both flows using a shared user model.

### 🔁 Real-Time Timer Syncing
- Each client has a different system clock → caused desync issues.
- Solution: Backend manages master timer in Redis and broadcasts updated values on each move.

### ♟️ Play as Guest

- Utilized Redis Lists to queue waiting players and Redis Pub/Sub to instantly notify and pair users as soon as a match is found.  
- This approach ensures minimal latency and efficient real-time pairing without requiring user authentication.




### ♟️ Matchmaking Logic
- Needed fast, scalable pairing logic.
- Used Redis list + Pub/Sub to push/pop player IDs and notify both clients instantly.

### 🧪 WebSocket Debugging
- STOMP frames weren’t always correctly routed.
- Enabled Spring WebSocket logs and used browser dev tools to inspect STOMP connections and subscriptions.

### ✅ Last Move Highlighting
- Required frontend customization.
- Tracked `from` and `to` squares in React state and styled squares using `react-chessboard`’s `customSquareStyles`.

