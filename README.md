# ♟️ Online Chess App

A full-stack, real-time multiplayer chess platform built with React, Spring Boot, Redis, PostgreSQL, and WebSockets. Features live matchmaking, Google OAuth2 login, move synchronization, timers, private lobbies and scalable architecture — backend containerized using Docker.

---

## 🌐 Live Demo

🔗 [Play Now](https://reliable-semolina-680ade.netlify.app/)  
<!-- 📹 [Demo Video](https://your-demo-video.com) *(optional)* -->

---

## ✨ Features

- Real-time gameplay with WebSocket move syncing
- Live matchmaking using Redis
- Login via Magic link sent to mail
- Google OAuth2 login with secure JWT handling
- Chessboard with legal move validation (chess.js)
- Private lobbies for friend matches with unique invite codes
- Last move highlighting and synced countdown timers
- Dockerized backend, frontend, and database setup

---

## 🛠 Tech Stack

- **Frontend**: React,Tailwind Css, react-chessboard, chess.js  
- **Backend**: Spring Boot, STOMP over WebSocket, Redis, PostgreSQL  
- **Auth**: Google OAuth2 (`@react-oauth/google`, Spring Security + JWT)  
- **Deployment**: Docker, Render, netlify

---

## 📁 Documentation

All technical details including architecture, code structure, and challenges are available in the [`/docs`](./docs) folder:

- [Problem Statement](./docs/problem-statement.md)
- [Tech Stack ](./docs/tech-stack.md)
- [High-Level Architecture](./docs/high-level-diagram.md)
- [Low-Level Code Flow](./docs/low-level-design.md)
- [Challenges & Solutions](./docs/challenges.md)
- [features coming up next](./docs/feature-developments.md)


---

## 🧪 Getting Started (For Developers)

To run the project locally, follow the steps below. The backend runs via Docker, while the frontend runs with `npm run dev`.

---

### 🔧 Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose installed  
- [Node.js](https://nodejs.org/) (v16+ recommended) and npm

---
### 🚀 Frontend (React.js)

```bash
# Clone the repository
git clone https://github.com/your-username/chess-app.git
git checkout dev_phase
cd online_chess/frontend

# Install dependencies
npm install

# Start React.js on http://localhost:5173
npm run dev
```
---
🚀 Backend (Spring Boot + Redis + PostgreSQL)

```bash
# Clone the repository
git clone https://github.com/your-username/chess-app.git
git checkout dev_phase
cd online_chess

# Start backend, Redis, and PostgreSQL using Docker
docker-compose up --build

```
---

### 🤝 Contributing

Contributions, suggestions, and feature requests are welcome!  
If you'd like to improve the project, feel free to:

- Fork the repository
- Create a new branch
- Make your changes
- Open a pull request

Make sure to describe your changes clearly in the PR.

---

### 👨‍💻 Author
**Abhiraj Dustakar**  
[LinkedIn](https://linkedin.com/in/your-profile) • [GitHub](https://github.com/your-username)

**B Sai Surya Pranav**  
[Portfolio](https://your-portfolio.com) • [LinkedIn](https://linkedin.com/in/your-profile) • [GitHub](https://github.com/your-username)



