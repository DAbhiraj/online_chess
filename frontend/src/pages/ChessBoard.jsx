// ...imports
import "./init.jsx";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import axios from "axios";
import moveSoundFile from "/chess_move.wav";
import Particles from "../assets/Particles.jsx";
import { Modal, Box, Typography, Button } from "@mui/material";

const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL;
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
const moveSound = new Audio(moveSoundFile);

function ChessboardComponent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { gameId: initialGameId } = useParams();
  const { initialFen } = location.state || {};

  const [game, setGame] = useState(new Chess(initialFen || undefined));
  const [stompClient, setStompClient] = useState(null);
  const [gameId, setGameId] = useState(initialGameId);
  const [isGuest, setIsGuest] = useState(false);
  const [whitePlayerId, setWhitePlayerId] = useState("");
  const [blackPlayerId, setBlackPlayerId] = useState("");
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);
  const [myLastMoveSquares, setMyLastMoveSquares] = useState([]);
  const [opponentLastMoveSquares, setOpponentLastMoveSquares] = useState([]);
  const [checkPrompt, setCheckPrompt] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [gameOverInfo, setGameOverInfo] = useState({});
  const [moveHistory, setMoveHistory] = useState([]); // stores each move as [from, to]

  const userId = localStorage.getItem("email");

  // Refs
  const gameRef = useRef(game);
  const gameIdRef = useRef(gameId);
  const stompClientRef = useRef(stompClient);
  const gameOverSentRef = useRef(false);
  const whitePlayerIdRef = useRef("");
  const blackPlayerIdRef = useRef("");
  const isGuestRef = useRef(false);

  // Effect sync
  useEffect(() => {
    gameRef.current = game;
    setCheckPrompt(game.in_check());
  }, [game]);

  useEffect(() => {
    if (localStorage.getItem("authToken") == null) setIsGuest(true);
  }, []);

  useEffect(() => {
    isGuestRef.current = isGuest;
  }, [isGuest]);

  useEffect(() => {
    gameIdRef.current = gameId;
  }, [gameId]);

  useEffect(() => {
    stompClientRef.current = stompClient;
  }, [stompClient]);

  useEffect(() => {
    whitePlayerIdRef.current = whitePlayerId;
    blackPlayerIdRef.current = blackPlayerId;
  }, [whitePlayerId, blackPlayerId]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (gameRef.current.game_over() || gameOverSentRef.current) return;

      const turn = gameRef.current.turn();
      if (turn === "w") {
        setWhiteTime((prev) =>
          prev <= 1 ? handleTimeout("w") || 0 : prev - 1
        );
      } else if (turn === "b") {
        setBlackTime((prev) =>
          prev <= 1 ? handleTimeout("b") || 0 : prev - 1
        );
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleTimeout = (losingColor) => {
    if (gameOverSentRef.current) return;
    gameOverSentRef.current = true;
    const loserId =
      losingColor === "w" ? whitePlayerIdRef.current : blackPlayerIdRef.current;
    const winnerId =
      losingColor === "w" ? blackPlayerIdRef.current : whitePlayerIdRef.current;
    stompClientRef.current?.publish({
      destination: `/app/game.over/${gameIdRef.current}`,
      body: JSON.stringify({
        reason: "timeout",
        winnerId,
        loserId,
        isGuest: isGuestRef.current,
      }),
    });
  };

  useEffect(() => {
    if (!initialGameId) navigate("/");
  }, [initialGameId, navigate]);

  useEffect(() => {
    if (initialGameId) {
      axios.get(`${API_BASE_URL}game/gameOver/${initialGameId}`).then((res) => {
        setWhitePlayerId(res.data.player1Id);
        setBlackPlayerId(res.data.player2Id);
      });
    }
  }, [initialGameId]);

  useEffect(() => {
    if (initialGameId) {
      axios.get(`${API_BASE_URL}game/${initialGameId}`).then((res) => {
        const { whiteTimeLeft, blackTimeLeft, lastMoveTime, turn, fen } =
          res.data;

        const now = Date.now();
        let elapsed = 0;

        if (lastMoveTime) {
          elapsed = Math.floor((now - lastMoveTime) / 1000);
        }

        const whiteTime =
          turn === "w" ? whiteTimeLeft - elapsed : whiteTimeLeft;
        const blackTime =
          turn === "b" ? blackTimeLeft - elapsed : blackTimeLeft;

        setWhiteTime(Math.max(whiteTime, 0));
        setBlackTime(Math.max(blackTime, 0));
        setGame(new Chess(fen));
      });
    }
  }, [initialGameId]);

  useEffect(() => {
    if (!gameId) return;
    const token = localStorage.getItem("authToken");
    const wsUrl = `${WEBSOCKET_URL}?token=${token}`;
    const client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,
    });

    client.onConnect = () => {
      setStompClient(client);

      client.subscribe(`/topic/game/${gameId}`, (msg) => {
        const data = JSON.parse(msg.body);
        console.log(data);
        if (data.fen) {
          const lastMoveFrom = data.from;
          const lastMoveTo = data.to;
          const isMyMove =
            userId ===
            (gameRef.current.turn() === "w"
              ? whitePlayerIdRef.current
              : blackPlayerIdRef.current);
          setMoveHistory((prev) => [...prev, [lastMoveFrom, lastMoveTo]]);
          if (!isMyMove) {
            setMyLastMoveSquares([lastMoveFrom, lastMoveTo]);
          } else {
            setOpponentLastMoveSquares([lastMoveFrom, lastMoveTo]);
          }
          setGame(new Chess(data.fen));
          moveSound.currentTime = 0;
          moveSound.play();
        }
      });

      client.subscribe(`/topic/game/${gameId}/gameover`, (msg) => {
        const data = JSON.parse(msg.body);
        setGameOverInfo(data);
        setModalOpen(true);
      });
    };

    client.onStompError = () => navigate("/");
    client.onWebSocketClose = () => navigate("/");
    client.activate();
    return () => client.deactivate();
  }, [gameId, navigate]);

  const getGameOverReasonAndWinner = (g) => {
    const reason = g.in_checkmate()
      ? "checkmate"
      : g.in_stalemate()
      ? "stalemate"
      : g.in_draw()
      ? "draw"
      : g.isInsufficientMaterial()
      ? "insufficient_material"
      : g.isThreefoldRepetition()
      ? "threefold_repetition"
      : "unknown";

    let winnerId = null,
      loserId = null;
    if (reason === "checkmate") {
      const winnerColor = g.turn() === "w" ? "b" : "w";
      winnerId =
        winnerColor === "w"
          ? whitePlayerIdRef.current
          : blackPlayerIdRef.current;
      loserId =
        winnerColor === "w"
          ? blackPlayerIdRef.current
          : whitePlayerIdRef.current;
    }

    return { reason, winnerId, loserId };
  };

  const sendMoveToBackend = useCallback((moveDetails) => {
    stompClientRef.current?.publish({
      destination: `/app/game.move/${gameIdRef.current}`,
      body: JSON.stringify(moveDetails),
    });
  }, []);

  const onDrop = useCallback(
    (sourceSquare, targetSquare) => {
      const gameCopy = new Chess(gameRef.current.fen());
      const piece = gameCopy.get(sourceSquare);
      const userId = localStorage.getItem("email");

      const isWhite = userId === whitePlayerIdRef.current;
      const isBlack = userId === blackPlayerIdRef.current;
      if (
        !piece ||
        (!isWhite && !isBlack) ||
        (isWhite && piece.color !== "w") ||
        (isBlack && piece.color !== "b")
      )
        return false;

      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });
      if (move) {
        setGame(gameCopy);
        playMoveSound();
        setMyLastMoveSquares([sourceSquare, targetSquare]);

        sendMoveToBackend({
          from: sourceSquare,
          to: targetSquare,
          promotion: "q",
          fenAfterMove: gameCopy.fen(),
        });

        if (gameCopy.game_over() && !gameOverSentRef.current) {
          gameOverSentRef.current = true;
          const { reason, winnerId, loserId } =
            getGameOverReasonAndWinner(gameCopy);
          stompClientRef.current?.publish({
            destination: `/app/game.over/${gameIdRef.current}`,
            body: JSON.stringify({
              reason,
              winnerId,
              loserId,
              isGuest: isGuestRef.current,
            }),
          });
        }

        return true;
      }

      return false;
    },
    [sendMoveToBackend]
  );

  const playMoveSound = () => {
    moveSound.currentTime = 0;
    moveSound.play();
  };

  const handleEnd = () => {
    if (!gameOverSentRef.current) {
      gameOverSentRef.current = true;
      const resigningId = localStorage.getItem("email");
      const winnerId =
        resigningId === whitePlayerIdRef.current
          ? blackPlayerIdRef.current
          : whitePlayerIdRef.current;
      const loserId = resigningId;
      stompClientRef.current.publish({
        destination: `/app/game.over/${gameIdRef.current}`,
        body: JSON.stringify({
          reason: "resignation",
          winnerId,
          loserId,
          isGuest: isGuestRef.current,
        }),
      });
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="relative min-h-screen bg-black text-white flex justify-center items-center overflow-x-hidden">
      <div className="absolute inset-0 z-0">
        <Particles
          particleColors={["#ffffff", "#ffffff"]}
          particleCount={200}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover={true}
          alphaParticles={false}
        />
      </div>

      <div className="z-10 flex flex-row gap-6 p-4 items-center">
        <div className="flex flex-col items-center">
          {/* Top (Opponent Timer) */}
          <div className="w-[500px] flex justify-between mb-2">
            <span className="text-left text-sm font-semibold">
              {userId === whitePlayerIdRef.current
                ? blackPlayerIdRef.current
                : whitePlayerIdRef.current}
            </span>
            <div
              className={`flex items-center justify-center w-28 h-10 rounded-lg shadow-inner text-lg font-semibold tracking-widest 
                ${
                  game.turn() === "b" && userId === whitePlayerIdRef.current
                    ? "bg-white text-black animate-pulse"
                    : game.turn() === "w" && userId === blackPlayerIdRef.current
                    ? "bg-white text-black animate-pulse"
                    : "bg-gray-800 text-white"
                }
              `}
            >
              {formatTime(
                userId === whitePlayerIdRef.current ? blackTime : whiteTime
              )}
            </div>
          </div>

          {/* Chessboard */}
          <Chessboard
            position={game.fen()}
            onPieceDrop={onDrop}
            boardWidth={500}
            boardOrientation={
              userId === blackPlayerIdRef.current ? "black" : "white"
            }
            customBoardStyle={{ borderRadius: "0.5rem", boxShadow: "none" }}
            customSquareStyles={{
              ...(myLastMoveSquares.length === 2 && {
                [myLastMoveSquares[0]]: {
                  backgroundColor: "rgba(0, 255, 0, 0.4)",
                },
                [myLastMoveSquares[1]]: {
                  backgroundColor: "rgba(0, 255, 0, 0.4)",
                },
              }),
              ...(opponentLastMoveSquares.length === 2 && {
                [opponentLastMoveSquares[0]]: {
                  backgroundColor: "rgba(0, 255, 0, 0.4)",
                },
                [opponentLastMoveSquares[1]]: {
                  backgroundColor: "rgba(0, 255, 0, 0.4)",
                },
              }),
            }}
          />

          {/* Bottom (Your Timer) */}
          <div className="w-[500px] flex justify-between mt-2">
            <span className="text-left text-sm font-semibold">
              {userId === whitePlayerIdRef.current
                ? whitePlayerIdRef.current
                : blackPlayerIdRef.current}
            </span>
            <div
              className={`flex items-center justify-center w-28 h-10 rounded-lg shadow-inner text-lg font-semibold tracking-widest 
    ${
      game.turn() === "w" && userId === whitePlayerIdRef.current
        ? "bg-white text-black animate-pulse"
        : game.turn() === "b" && userId === blackPlayerIdRef.current
        ? "bg-white text-black animate-pulse"
        : "bg-gray-800 text-white"
    }
  `}
            >
              {formatTime(
                userId === whitePlayerIdRef.current ? whiteTime : blackTime
              )}
            </div>
          </div>

          <p className="mt-4 text-white text-lg font-bold">
            Turn: {game.turn() === "w" ? "White" : "Black"}
          </p>

          {checkPrompt && (
            <p className="text-yellow-300 mt-2 font-semibold text-lg animate-pulse">
              ⚠ Check!
            </p>
          )}

          <button
            className="mt-2 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
            onClick={handleEnd}
          >
            Resign
          </button>
        </div>

        {/* Move History */}
        <div className="w-48 bg-gray-800 rounded-lg p-3 max-h-[520px] overflow-y-auto">
          <h3 className="text-md font-semibold mb-2 text-white">
            Move History
          </h3>
          <ol className="text-sm text-white">
            {moveHistory.map(([from, to], index) => (
              <li key={index}>
                {Math.floor(index / 2) + 1}. {from} - {to}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Game Over Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 300,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            textAlign: "center",
          }}
        >
          <Typography variant="h6" gutterBottom>
            Game Over
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Reason: {gameOverInfo.reason}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Winner:{" "}
            {gameOverInfo.winnerId === whitePlayerIdRef.current
              ? "White"
              : gameOverInfo.winnerId === blackPlayerIdRef.current
              ? "Black"
              : "N/A"}
          </Typography>
          <Button variant="contained" onClick={() => navigate("/")}>
            Go Home
          </Button>
        </Box>
      </Modal>
    </div>
  );
}

export default ChessboardComponent;
