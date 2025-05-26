# online_chess


# connecting web sockets
Spring Boot's standard spring-boot-starter-websocket module implements the standard RFC 6455 WebSocket protocol, often with STOMP (Simple Text Oriented Messaging Protocol) on top.

Socket.IO and standard WebSockets (and STOMP) are different protocols.

Socket.IO is a library that uses WebSockets (or long polling as a fallback) but adds its own framing, heartbeat, reconnection logic, and event-based messaging. It requires a Socket.IO server on the backend.
Spring Boot's WebSocket support is a standard WebSocket endpoint, and if you want structured messaging, you typically add STOMP.
Therefore, socket.io-client will NOT connect to a standard Spring Boot WebSocket backend.

The Correct Approach: Use Stomp.js (or native WebSocket) with sockjs-client
For Spring Boot with STOMP WebSockets, the common client-side libraries are:

Stomp.js: Provides the STOMP protocol client.
sockjs-client: Provides a WebSocket-like API that falls back to HTTP-based alternatives (like XHR polling) if a native WebSocket connection isn't available. Spring Boot's WebSocket endpoints often use SockJS for broader browser compatibility, so it's a good pairing.

@stomp/stompjs and sockjs-client: Replaced socket.io-client.
Client (from @stomp/stompjs): This is your STOMP client instance.
webSocketFactory: Used to provide a SockJS instance to the STOMP client, making it compatible with Spring Boot's common SockJS fallback.
useEffect for Connection:
Handles establishing the WebSocket connection when the component mounts (client.activate()).
Handles cleaning up the connection when the component unmounts (client.deactivate()).
client.subscribe(): This is where you tell the client to listen for messages from specific STOMP topics (e.g., /topic/game/{gameId}). Your Spring Boot backend will send game state updates to this topic.
stompClient.publish(): This is how you send messages from your frontend to your backend.
destination: This is the STOMP destination where your Spring Boot @MessageMapping controller will listen (e.g., /app/game.move/{gameId}).
body: Your message payload (e.g., the move details) as a stringified JSON.
gameRef = useRef(game): This is a common React pattern to ensure that callbacks (like onDrop or sendMoveToBackend) always have access to the latest state of game without causing useCallback to re-create the function too often, or without needing game in its dependency array.
gameIdRef: I've added a placeholder gameIdRef. In a real application, you'd get the actual gameId from your lobby/matchmaking logic (e.g., from URL params, or passed as a prop). This gameId is crucial for:
Backend to know which game the move belongs to.
Frontend to subscribe to updates for its specific game.
Backend to broadcast updates only to clients subscribed to that specific game.
Optimistic Updates: Notice the setGame(gameCopy) inside onDrop before sending to the backend. This is an "optimistic update" – the UI updates immediately based on the client's assumption that the move is valid. If the backend later rejects the move, you'd need to roll back the client's UI to the server's authoritative state (a more advanced pattern, but good to be aware of).

FEN stands for Forsyth-Edwards Notation.

It is a standard, single-line text string used to describe a specific position of a chess game. Its purpose is to provide all the necessary information to recreate a chessboard position accurately, allowing you to restart a game or analyze a particular moment without needing the full game history.

Think of it as a "snapshot" of the chessboard at a given moment.

What information does a FEN string contain?
A FEN string consists of six fields, separated by spaces:

 Piece Placement (Rank 8 to 1): This describes the pieces on the board, starting from the 8th rank (Black's back rank) down to the 1st rank (White's back rank).

rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR
Each rank is separated by a /.
p for pawn, n for knight, b for bishop, r for rook, q for queen, k for king.
Uppercase letters are used for White pieces (e.g., P for White pawn).
Lowercase letters are used for Black pieces (e.g., p for Black pawn).
Numbers (1 to 8) represent consecutive empty squares on a rank. For example, 8 means a rank is entirely empty. 1 means one empty square.
Active Color (Whose Turn):

w if White is to move.
b if Black is to move.
Castling Availability: This indicates which castling rights remain.

K: White can castle kingside.
Q: White can castle queenside.
k: Black can castle kingside.
q: Black can castle queenside.
-: If no castling is available.
(e.g., KQkq means all castling rights are available)
En Passant Target Square:

The square over which a pawn has just passed after moving two squares.
Given in algebraic notation (e.g., e3 or a6).
-: If there is no en passant target square.
Halfmove Clock: The number of halfmoves (ply) since the last capture or pawn advance. This is used to enforce the fifty-move rule for a draw. It's reset to 0 after a capture or pawn move.

Fullmove Number: The number of the full moves. It starts at 1 and is incremented after Black's move.