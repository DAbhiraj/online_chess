# 🧩 Problem Statement

Most existing online chess platforms are feature-heavy, making it hard for new developers to understand the full architecture behind real-time multiplayer systems. I wanted to build a **lightweight, full-stack online chess app** from scratch to explore and implement:

- Real-time multiplayer gameplay using WebSockets
- Game state synchronization between clients
- Matchmaking system using Redis queues
- OAuth2 and magic link login flows for secure access
- Seamless frontend-backend communication using STOMP over WebSocket

Additionally, I noticed that many chess platforms lack **flexible friend-based gameplay without account linking or complex invites**. So I introduced:

- **Private lobbies** with unique invite codes, allowing players to share a link and start a match instantly without matchmaking
- A way to simulate casual games, friend challenges, and the base for future tournament-style systems
- Lobby-based architecture that separates **ranked matchmaking** from **custom games**, giving users control over how they play

This helped me not only explore multiplayer systems, but also design a scalable backend that supports both anonymous and authenticated gameplay modes.
