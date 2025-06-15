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

const WEBSOCKET_URL = "http://localhost:8080/ws";
const API_BASE_URL = "http://localhost:8080/";
const moveSound = new Audio(moveSoundFile);

function ChessboardComponent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { gameId: initialGameId } = useParams();
  const { initialFen } = location.state || {};

  const [game, setGame] = useState(new Chess(initialFen || undefined));
  const [stompClient, setStompClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameId, setGameId] = useState(initialGameId);
  const [isGuest,setIsGuest] = useState(false);
  const isGuestRef = useRef(false);
  const [matchmakingStatus, setMatchmakingStatus] = useState(
    initialGameId ? "in_game" : "idle"
  );

  useEffect(() => {
  console.log(localStorage.getItem("authToken")==null);
  if (localStorage.getItem("authToken") == null) {
    setIsGuest(true);
  }
}, []);



  const [whitePlayerId, setWhitePlayerId] = useState("");
  const [blackPlayerId, setBlackPlayerId] = useState("");

  const whitePlayerIdRef = useRef("");
  const blackPlayerIdRef = useRef("");
  const gameRef = useRef(game);
  const gameIdRef = useRef(gameId);
  const stompClientRef = useRef(stompClient);
  const isConnectedRef = useRef(isConnected);
  const gameOverSentRef = useRef(false);

  const [whiteTime, setWhiteTime] = useState(600); // 10 min
  const [blackTime, setBlackTime] = useState(600);


  const [whiteStarted, setWhiteStarted] = useState(false);
  const [blackStarted, setBlackStarted] = useState(false);

  const whiteStartedRef = useRef(false);
  const blackStartedRef = useRef(false);

  const userId = localStorage.getItem("email");

  const playMoveSound = () => {
    moveSound.currentTime = 0;
    moveSound.play();
  };

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  useEffect(()=>{
    isGuestRef.current = isGuest;
    console.log("isGuestRef.current "+isGuest);
  },[isGuest])

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
    whitePlayerIdRef.current = whitePlayerId;
  }, [whitePlayerId]);

  useEffect(() => {
    blackPlayerIdRef.current = blackPlayerId;
  }, [blackPlayerId]);

  useEffect(() => {
    whiteStartedRef.current = whiteStarted;
  }, [whiteStarted]);

  useEffect(() => {
    blackStartedRef.current = blackStarted;
  }, [blackStarted]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (gameRef.current.game_over() || gameOverSentRef.current) return;

      if (gameRef.current.turn() === "w") {
        setWhiteTime((prev) => {
          if (prev <= 1) {
            handleTimeout("w");
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBlackTime((prev) => {
          if (prev <= 1) {
            handleTimeout("b");
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [whiteTime, blackTime]);

  const handleTimeout = (losingColor) => {
    if (gameOverSentRef.current) return;
    gameOverSentRef.current = true;

    const loserId =
      losingColor === "w" ? whitePlayerIdRef.current : blackPlayerIdRef.current;

    const winnerId =
      losingColor === "w" ? blackPlayerIdRef.current : whitePlayerIdRef.current;

    console.log("isGuest "+isGuestRef.current);
    stompClientRef.current?.publish({
      destination: `/app/game.over/${gameIdRef.current}`,
      body: JSON.stringify({ reason: "timeout", winnerId, loserId,isGuest: isGuestRef.current }),
    });
  };

  useEffect(() => {
    if (!initialGameId) navigate("/");
  }, [initialGameId, navigate]);

  useEffect(() => {
    (async () => {
      if (initialGameId) {
        try {
          const res = await axios.get(
            `${API_BASE_URL}game/gameOver/${initialGameId}`
          );
          setWhitePlayerId(res.data.player1Id);
          setBlackPlayerId(res.data.player2Id);
        } catch (e) {
          console.error("Error fetching players:", e);
        }
      }
    })();
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
      setIsConnected(true);
      setStompClient(client);

      client.subscribe(`/topic/game/${gameId}`, (msg) => {
        const data = JSON.parse(msg.body);
        if (data.fen) setGame(new Chess(data.fen));
      });

      client.subscribe(`/topic/game/${gameId}/gameover`, (msg) => {
        const data = JSON.parse(msg.body);
        alert(`Game Over: ${data.reason}, Winner: ${data.winnerId}`);
      });
    };

    client.onStompError = () => navigate("/");
    client.onWebSocketClose = () => navigate("/");

    client.activate();
    return () => client.deactivate();
  }, [gameId, navigate]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

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
    if (stompClientRef.current && isConnectedRef.current && gameIdRef.current) {
      stompClientRef.current.publish({
        destination: `/app/game.move/${gameIdRef.current}`,
        body: JSON.stringify(moveDetails),
      });
    }
  }, []);

  const onDrop = useCallback(
    (sourceSquare, targetSquare) => {
      const gameCopy = new Chess(gameRef.current.fen());
      const piece = gameCopy.get(sourceSquare);
      const userId = localStorage.getItem("email");

      if (!piece) return false;
      const isWhite = userId === whitePlayerIdRef.current;
      const isBlack = userId === blackPlayerIdRef.current;
      console.log("isWhite "+isWhite);
      console.log("isBlack "+isBlack);



      if ((isWhite && piece.color !== "w") || (isBlack && piece.color !== "b"))
        return false;

      if (!isWhite && !isBlack) return false;

      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q",
      });

      if (move) {
        setGame(gameCopy);
        playMoveSound();

        // Start respective timer only after first move
        if (move.color === "w" && !whiteStartedRef.current)
          setWhiteStarted(true);
        if (move.color === "b" && !blackStartedRef.current)
          setBlackStarted(true);

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

          console.log("isGuest "+isGuestRef.current);
          stompClientRef.current?.publish({
            destination: `/app/game.over/${gameIdRef.current}`,
            body: JSON.stringify({ reason, winnerId, loserId,isGuest: isGuestRef.current }),
          });
        }

        return true;
      }

      return false;
    },
    [sendMoveToBackend]
  );

  const handleEnd = () => {
    if (
      stompClientRef.current &&
      isConnectedRef.current &&
      gameIdRef.current &&
      !gameOverSentRef.current
    ) {
      gameOverSentRef.current = true;
      const resigningId = localStorage.getItem("email");
      const winnerId =
        resigningId === whitePlayerIdRef.current
          ? blackPlayerIdRef.current
          : whitePlayerIdRef.current;

      console.log(winnerId);

      const loserId =
        resigningId === whitePlayerIdRef.current
          ? whitePlayerIdRef.current
          : blackPlayerIdRef.current;

      console.log("isGuest "+isGuestRef.current);
      stompClientRef.current.publish({
        destination: `/app/game.over/${gameIdRef.current}`,
        body: JSON.stringify({ reason: "resignation", winnerId,loserId,isGuest: isGuestRef.current }),
      });
    }
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
          <div className="w-[500px] flex justify-between mb-2">
            <span className="text-left text-sm font-semibold">
              {userId === whitePlayerIdRef.current
                ? blackPlayerIdRef.current
                : whitePlayerIdRef.current}
            </span>
            <span
              className={`text-right px-3 py-1 rounded font-mono text-sm ${
                userId === whitePlayerIdRef.current
                  ? "bg-gray-900 text-white"
                  : "bg-white text-black"
              }`}
            >
              {formatTime(
                userId === whitePlayerIdRef.current ? blackTime : whiteTime
              )}
            </span>
          </div>

          <Chessboard
            position={game.fen()}
            onPieceDrop={onDrop}
            boardWidth={500}
            boardOrientation={
              userId === blackPlayerIdRef.current ? "black" : "white"
            }
            customBoardStyle={{
              borderRadius: "0.5rem",
              boxShadow: "none",
            }}
          />

          <div className="w-[500px] flex justify-between mt-2">
            <span className="text-left text-sm font-semibold">
              {userId === whitePlayerIdRef.current
                ? whitePlayerIdRef.current
                : blackPlayerIdRef.current}
            </span>
            <span
              className={`text-right px-3 py-1 rounded font-mono text-sm ${
                userId === whitePlayerIdRef.current
                  ? "bg-white text-black"
                  : "bg-gray-900 text-white"
              }`}
            >
              {formatTime(
                userId === whitePlayerIdRef.current ? whiteTime : blackTime
              )}
            </span>
          </div>

          <p className="mt-4 text-white text-lg font-bold">
            Turn: {game.turn() === "w" ? "White" : "Black"}
          </p>
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
          <ol className="list-decimal list-inside text-sm text-white space-y-1">
            {Array.from({
              length: Math.ceil(game.history({ verbose: true }).length / 2),
            }).map((_, i) => {
              const history = game.history({ verbose: true });
              const w = history[2 * i];
              const b = history[2 * i + 1];

              const formatMove = (move) =>
                move ? `${move.from} → ${move.to} (${move.san})` : "";

              return (
                <li key={i}>
                  {i + 1}. {formatMove(w)} {b ? `| ${formatMove(b)}` : ""}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}

export default ChessboardComponent;
