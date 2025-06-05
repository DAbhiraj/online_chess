import "./init.jsx";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { useLocation, useNavigate,useParams } from "react-router-dom";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import axios from "axios";
import moveSoundFile from "/chess_move.wav";

const WEBSOCKET_URL = "http://localhost:8080/ws";
const API_BASE_URL = "http://localhost:8080/";
const moveSound = new Audio(moveSoundFile);

function ChessboardComponent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [whitePlayerId, setWhitePlayerId] = useState("");
  const [blackPlayerId, setBlackPlayerId] = useState("");
  console.log("Prototype of Chess:", Chess.prototype);
  const { gameId: initialGameId } = useParams();
  const { initialFen } = location.state || {};

  const [game, setGame] = useState(new Chess(initialFen || undefined));
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
  const gameOverSentRef = useRef(false); // 👈 new flag

  const playMoveSound = () => {
    moveSound.currentTime = 0;
    moveSound.play();
  };

  useEffect(() => {
    gameRef.current = game;
  }, [game]);
  useEffect(() => {
    gameIdRef.current = gameId;
  }, [gameId]);
  useEffect(() => {
    stompClientRef.current = stompClient;
  }, [stompClient]);
  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);

  useEffect(() => {
    (async () => {
      if (initialGameId) {
        try {
          const response = await axios.get(
            `${API_BASE_URL}game/gameOver/${initialGameId}`
          );
          console.log("/gameover"+response.data);
          const { player1Id, player2Id } = response.data; 
          setWhitePlayerId(player1Id);
          setBlackPlayerId(player2Id);
        } catch (err) {
          console.error("Error fetching players:", err);
        }
      }
    })();
  }, [initialGameId]);

  useEffect(() => {
    if (!initialGameId) {
      console.warn("No gameId passed, redirecting to home...");
      navigate("/");
    }
  }, [initialGameId, navigate]);

  const fetchGameState = useCallback(async () => {
    if (!gameIdRef.current) return;
    setLoadingGameState(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}game/${gameIdRef.current}`
      );
      if (response.data?.fen) {
        const updatedGame = new Chess(response.data.fen);
        setGame(updatedGame);
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
      debug: (str) => console.log("STOMP Debug:", str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = (frame) => {
      console.log("Connected:", frame);
      setIsConnected(true);
      setStompClient(client);

      client.subscribe(`/topic/game/${gameId}`, (message) => {
        const newGameState = JSON.parse(message.body);
        if (newGameState.fen) {
          const updatedGame = new Chess(newGameState.fen);
          setGame(updatedGame);
        }
      });

      client.subscribe(`/topic/game/${gameId}/gameover`, (message) => {
        const data = JSON.parse(message.body);
        alert(`Game Over: ${data.reason}, Winner: ${data.winnerId}`);
      });

      fetchGameState();
    };

    client.onStompError = (frame) => {
      console.error("STOMP Error:", frame);
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
        client.deactivate();
        console.log("WebSocket client disconnected.");
      }
    };
  }, [gameId, navigate, fetchGameState]);

  function getGameOverReasonAndWinner(game) {
    const reason = game.inCheckmate()
      ? "checkmate"
      : game.inStalemate()
      ? "stalemate"
      : game.isDraw()
      ? "draw"
      : game.isInsufficientMaterial()
      ? "insufficient_material"
      : game.isThreefoldRepetition()
      ? "threefold_repetition"
      : "unknown";

    let winnerId = null;
    console.log(reason);
    if (reason === "checkmate") {
      const winnerColor = game.turn() === "w" ? "b" : "w";
      winnerId = winnerColor === "w" ? whitePlayerId : blackPlayerId;
      console.log("WINNER "+winnerId);
    }

    return { reason, winnerId };
  }

  const sendMoveToBackend = useCallback((moveDetails) => {
    if (stompClientRef.current && isConnectedRef.current && gameIdRef.current) {
      stompClientRef.current.publish({
        destination: `/app/game.move/${gameIdRef.current}`,
        body: JSON.stringify(moveDetails),
      });
    }
  }, []);

  const onDrop = useCallback(
    (sourceSquare, targetSquare) => {
      if (!gameIdRef.current || matchmakingStatus !== "in_game") {
        alert("Move rejected: Not in active game.");
        return false;
      }

      const gameCopy = new Chess(gameRef.current.fen()); // This creates the Chess object

      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      if (move) {
        setGame(gameCopy);
        playMoveSound();

        sendMoveToBackend({
          from: sourceSquare,
          to: targetSquare,
          promotion: "q",
          fenAfterMove: gameCopy.fen(),
        });

        console.log("game over "+gameCopy.game_over());
        if (gameCopy.game_over() && !gameOverSentRef.current) {
          gameOverSentRef.current = true;
          const { reason, winnerId } = getGameOverReasonAndWinner(gameCopy);
          if (
            stompClientRef.current &&
            isConnectedRef.current &&
            gameIdRef.current
          ) {
            stompClientRef.current.publish({
              destination: `/app/game.over/${gameIdRef.current}`,
              body: JSON.stringify({ reason, winnerId }),
            });
            console.log("Sent game over event.");
          }
        }
        return true;
      }
      return false;
    },
    [sendMoveToBackend, matchmakingStatus]
  );

  const handleEnd = () => {
    if (
      stompClientRef.current &&
      isConnectedRef.current &&
      gameIdRef.current &&
      !gameOverSentRef.current
    ) {
      gameOverSentRef.current = true; // prevent duplicates

      const resigningPlayerId = localStorage.getItem("userId"); // or fetch it from context/auth
      const winnerId =
        resigningPlayerId === whitePlayerId ? blackPlayerId : whitePlayerId;

      stompClientRef.current.publish({
        destination: `/app/game.over/${gameIdRef.current}`,
        body: JSON.stringify({
          reason: "resignation",
          winnerId,
        }),
      });

      console.log("Sent game over event due to resignation.");
    }
  };

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

      {matchmakingStatus === "in_game" &&
      gameId &&
      isConnected &&
      !loadingGameState ? (
        <>
          <Chessboard
            position={game.fen()}
            onPieceDrop={onDrop}
            boardWidth={500}
          />
          <p>Current Turn: {game.turn() === "w" ? "White" : "Black"}</p>
        </>
      ) : (
        !loadingGameState && (
          <p>Waiting for game to load or connection to establish...</p>
        )
      )}
      <button onClick={handleEnd}>End Game</button>
    </div>
  );
}

export default ChessboardComponent;
