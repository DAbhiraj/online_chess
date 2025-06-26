# 🛠️ Feature Developments & Roadmap

This document outlines the major features implemented and the roadmap for upcoming enhancements.

---

## ✅ Implemented Features

- Real-time multiplayer chess with synced gameplay
- Matchmaking queue using Redis list + Pub/Sub
- Google OAuth2 login with JWT token generation
- Magic link login via email (passwordless auth)
- WebSocket-based move communication with STOMP
- Redis timer sync and last-move highlighting
- Private lobbies for friend matches
- Mobile-responsive React + Tailwind UI
- Dockerized backend (Spring Boot, Redis, PostgreSQL)
- Game state management using `chess.js` FEN

---

## 🔜 Upcoming Features

- **Tournament Support**  
  - Bracket system  
  - Multiple round scheduling  
  - Timer-based round advancement

- **Player Ratings & Leaderboard**  
  - ELO calculation  
  - Match history persistence in PostgreSQL  
  - Leaderboard UI

- **Spectator Mode**  
  - Allow read-only users to join any public lobby  
  - Live updates of moves and timers

- **Game history for user**
  - Allow users to see the previous game's they have played

- **Game Over Analytics**  
  - Show move logs, accuracy stats, and time used per move  
  - Option to download PGN

- **Chat System**  
  - Lobby-based real-time chat  
  - Moderation for public lobbies

- **Theming Support**  
  - Light/Dark modes  
  - Customizable board and piece styles

---

Feel free to fork and contribute — all ideas and PRs are welcome!
