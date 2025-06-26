# 🛠️ Tech Stack 

### Frontend
- **React**: Chosen for its component-based architecture, fast rendering, and ease of state management.
- **react-chessboard + chess.js**: `chess.js` validates moves and tracks game state, while `react-chessboard` renders the board interactively.
- **Tailwind CSS**: Utility-first styling framework for rapid UI development.

### Backend
- **Spring Boot**: Offers strong WebSocket support via STOMP, and robust structure for scalable service logic.
- **Redis**: Acts as an in-memory store for real-time game state and matchmaking queues.
- **PostgreSQL**: Stores persistent data like users, ratings, and match history. Chosen over MySQL/Oracle for advanced features like JSONB and ACID compliance.

### Authentication
- **Google OAuth2**: Enables users to log in securely via Google.
- **Magic Link Authentication**: Provides email-based login for users without OAuth accounts.
- **Spring Security + JWT**: Manages secure session-based login using access tokens.

### 🚀 Deployment

- **Docker**: Used to containerize the backend, Redis, and PostgreSQL services. This ensures a consistent development and deployment environment across systems, and allows team members unfamiliar with Spring Boot or Redis to run the app effortlessly.

- **Render**: Hosts the Spring Boot backend and manages environment variables, ports, and automatic deployment from GitHub.

- **Netlify**: Serves the React frontend with optimized static builds and continuous deployment from the main branch.

