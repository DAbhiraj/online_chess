import "./init.jsx";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { useLocation, useNavigate } from "react-router-dom";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import axios from "axios";
import moveSoundFile from '/chess_move.wav';


const WEBSOCKET_URL = "http://localhost:8080/ws";
const API_BASE_URL = "http://localhost:8080/"; // adjust to your backend base URL
const moveSound = new Audio(moveSoundFile)
function ChessboardComponent() {
  const location = useLocation();
  const navigate = useNavigate();

  const { gameId: initialGameId, initialFen } = location.state || {};

  const [game, setGame] = useState(
    new Chess(initialFen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
  );
  const [stompClient, setStompClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameId, setGameId] = useState(initialGameId);
  const [matchmakingStatus, setMatchmakingStatus] = useState(
    initialGameId ? "in_game" : "idle"
  );
  const [loadingGameState, setLoadingGameState] = useState(false);
  const [error, setError] = useState(null);

  const gameRef = useRef(game);
  const gameIdRef = useRef(gameId);
  const stompClientRef = useRef(stompClient);
  const isConnectedRef = useRef(isConnected);

  const playMoveSound = () => {
  moveSound.currentTime = 0;
  moveSound.play();
};

  useEffect(() => { gameRef.current = game; }, [game]);
  useEffect(() => { gameIdRef.current = gameId; }, [gameId]);
  useEffect(() => { stompClientRef.current = stompClient; }, [stompClient]);
  useEffect(() => { isConnectedRef.current = isConnected; }, [isConnected]);

  useEffect(() => {
    if (!initialGameId) {
      console.warn("No gameId passed, redirecting to home...");
      navigate("/");
    }
  }, [initialGameId, navigate]);

  // Fetch game state once from REST endpoint after WebSocket connection established
  const fetchGameState = useCallback(async () => {
    if (!gameIdRef.current) return;

    setLoadingGameState(true);
    setError(null);

    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.get(`${API_BASE_URL}game/${gameIdRef.current}`);

      const gameState = response.data;
      console.log("Fetched game state from REST API:", gameState);

      if (gameState.fen) {
        const updatedGame = new Chess(gameState.fen);
        setGame(updatedGame);
      } else {
        console.warn("REST API did not return FEN in game state");
      }
    } catch (err) {
      console.error("Error fetching game state:", err);
      setError("Failed to load game state.");
    } finally {
      setLoadingGameState(false);
    }
  }, []);

  useEffect(() => {
    if (!gameId) return;

    const token = localStorage.getItem("authToken");
    const websocketUrlWithToken = `${WEBSOCKET_URL}?token=${token}`;

    const client = new Client({
      webSocketFactory: () => new SockJS(websocketUrlWithToken),
      debug: (str) => console.log("STOMP Debug (ChessboardComponent):", str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = (frame) => {
      console.log("Connected to WebSocket:", frame);
      setIsConnected(true);
      setStompClient(client);

      // Subscribe to game updates
      client.gameSubscription = client.subscribe(
        `/topic/game/${gameId}`,
        (message) => {
          const newGameState = JSON.parse(message.body);
          console.log("Received game update:", newGameState);

          if (newGameState.fen) {
            const updatedGame = new Chess(newGameState.fen);
            setGame(updatedGame);
          }
        },
        { id: "gameSub" }
      );

      // After WS connection, fetch current game state from REST
      fetchGameState();
    };

    client.onStompError = (frame) => {
      console.error("STOMP Error:", frame.headers["message"], frame.body);
      setIsConnected(false);
      setGameId(null);
      setMatchmakingStatus("idle");
      navigate("/");
    };

    client.onWebSocketClose = () => {
      console.log("WebSocket closed.");
      setIsConnected(false);
      setGameId(null);
      setMatchmakingStatus("idle");
      navigate("/");
    };

    client.activate();

    return () => {
      if (client) {
        if (client.gameSubscription) {
          client.gameSubscription.unsubscribe();
        }
        client.deactivate();
        console.log("WebSocket client disconnected (cleanup).");
      }
    };
  }, [gameId, navigate, fetchGameState]);

  const sendMoveToBackend = useCallback(
    (moveDetails) => {
      if (
        stompClientRef.current &&
        isConnectedRef.current &&
        gameIdRef.current
      ) {
        stompClientRef.current.publish({
          destination: `/app/game.move/${gameIdRef.current}`,
          body: JSON.stringify(moveDetails),
        });
        console.log("Sent move to backend:", moveDetails);
      } else {
        console.warn("Cannot send move: Not connected or missing gameId");
      }
    },
    []
  );

  const onDrop = useCallback(
    (sourceSquare, targetSquare) => {
      if (!gameIdRef.current || matchmakingStatus !== "in_game") {
        console.log("Move rejected: Not in active game.");
        return false;
      }

      const gameCopy = new Chess(gameRef.current.fen());

      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      if (move) {
        setGame(gameCopy);
        console.log("Legal move:", move);
        playMoveSound()
        sendMoveToBackend({
          from: sourceSquare,
          to: targetSquare,
          promotion: "q",
          fenAfterMove: gameCopy.fen(),
        });

        if (gameCopy.isGameOver()) {
          console.log("Game Over!");
        } else if (gameCopy.isCheck()) {
          console.log("Check!");
        }

        return true;
      }

      console.warn("Illegal move attempted");
      return false;
    },
    [sendMoveToBackend, matchmakingStatus]
  );

  return (
    <div className="chess-board-component">
      <h2>Your Chess Game</h2>
      <p>Game ID: {gameId || "N/A"}</p>

      {!isConnected && (
        <p className="status-message">
          {gameId
            ? "Connecting to game server..."
            : "No game ID received. Redirecting..."}
        </p>
      )}

      {loadingGameState && <p>Loading game state...</p>}
      {error && <p className="error-message">{error}</p>}

      {matchmakingStatus === "in_game" && gameId && isConnected && !loadingGameState ? (
        <>
          <p className="warning-message">
            WARNING: Backend only relays FEN. Moves are optimistically applied
            client-side. No server-side validation.
          </p>
          <Chessboard
            position={game.fen()}
            onPieceDrop={onDrop}
            boardWidth={500}
          />
          <p>Current Turn: {game.turn() === "w" ? "White" : "Black"}</p>
          <p className="fen-display">FEN: {game.fen()}</p>
        </>
      ) : (
        !loadingGameState && <p className="status-message">
          Waiting for game to load or connection to establish...
        </p>
      )}
    </div>
  );
}

export default ChessboardComponent;
