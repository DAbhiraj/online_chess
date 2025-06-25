import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import CircularProgress from "@mui/material/CircularProgress"; // ✅ MUI Progress Spinner
import Particles from "../../assets/Particles";
import StarBorder from "../../assets/StarBorder";

const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL;

function HomePage() {
  const navigate = useNavigate();
  const [stompClient, setStompClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [matchmakingStatus, setMatchmakingStatus] = useState("idle"); // 'idle', 'connecting', 'waiting', 'in_game'
  const [gameId, setGameId] = useState(null);
  const [matchDetails, setMatchDetails] = useState(null);
  const userIdRef = useRef(localStorage.getItem("email"));

  const TEST_JWT_TOKEN = localStorage.getItem("authToken");
  const stompClientRef = useRef(stompClient);

  useEffect(() => {
    stompClientRef.current = stompClient;
  }, [stompClient]);

  useEffect(() => {
  const email = localStorage.getItem("email");
  if (email?.startsWith("guest-")) {
    // Optional: also clear name if you set it for guests
    localStorage.removeItem("email");
    localStorage.removeItem("name");
    userIdRef.current = null;
    console.log("Cleared guest ID after returning from game");
  }
}, []);


  useEffect(() => {
    console.log(matchDetails);
    if (matchDetails?.gameId) {
      navigate(`/chess/${matchDetails.gameId}`, {
        state: {
          gameId: matchDetails.gameId,
          initialFen: matchDetails.fen,
        },
      });
    }
  }, [matchDetails, navigate]);

  useEffect(() => {
    const websocketUrlWithToken = TEST_JWT_TOKEN
      ? `${WEBSOCKET_URL}?token=${TEST_JWT_TOKEN}`
      : `${WEBSOCKET_URL}`;

    const client = new Client({
      webSocketFactory: () => new SockJS(websocketUrlWithToken),
      reconnectDelay: 5000,
    });

    client.onConnect = () => {
  console.log("Connected to WebSocket");
  setIsConnected(true);

  // ✅ Always subscribe BEFORE you send
  client.subscribe("/user/queue/matchmaking", (message) => {
    const matchDetails = JSON.parse(message.body);
    console.log("🎯 Matchmaking details received:", matchDetails);
    setMatchDetails(matchDetails);
    setMatchmakingStatus("in_game");
    setGameId(matchDetails.gameId);
  });

  if (!TEST_JWT_TOKEN) {
    console.log("Subscribing as guest");

    client.subscribe("/user/queue/guest", (message) => {
      const guestId = message.body;
      localStorage.setItem("email", guestId);
      userIdRef.current = guestId;

      // ✅ Delay this call slightly (or move it inside setTimeout)
      setTimeout(() => {
        client.publish({
          destination: "/app/game.find",
          body: JSON.stringify({ userId: guestId }),
        });
      }, 100);
      
      setMatchmakingStatus("waiting");
    });

    client.publish({
      destination: "/app/guest.requestGuestId",
    });

    console.log("Sent guest ID request");
  } else {
    // ✅ Delay /app/game.find slightly to give backend time to register subscription
    setTimeout(() => {
      client.publish({
        destination: "/app/game.find",
        body: JSON.stringify({ userId: userIdRef.current }),
      });
    }, 100);

    setMatchmakingStatus("waiting");
  }
};


    setStompClient(client);

    return () => {
      if (stompClientRef.current && stompClientRef.current.connected) {
        stompClientRef.current.deactivate();
        console.log("WebSocket disconnected (cleanup)");
      }
    };
  }, []);

  const handlePlayGame = useCallback(() => {
    if (stompClient && matchmakingStatus === "idle") {
      console.log("Activating STOMP client...");
      setMatchmakingStatus("connecting");
      stompClient.activate();
    } else {
      console.warn("Already connecting or client not ready.");
    }
  }, [stompClient, matchmakingStatus]);

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center bg-black font-sans text-black-800 text-center">
      {/* Particle Background */}
      <div className="absolute inset-0 z-0">
        <Particles
          particleColors={["#ffffff", "#ffffff"]}
          particleCount={200}
          particleSpread={10}
          speed={0.1}
          particleBaseSize={100}
          moveParticlesOnHover={true}
          alphaParticles={false}
          disableRotation={false}
        />
      </div>

      <div className="relative z-10 top-0 right-0 flex flex-col items-center p-5 max-w-2xl w-full">
        <h1 className="text-5xl font-extrabold text-blue-200 mt-8 mb-4">
          Welcome to Chess Online
        </h1>

        {userIdRef.current ? (
          <>
            <p className="text-2xl text-white mb-6">
              {localStorage.getItem("name")} !!
            </p>
            {matchmakingStatus === "idle" && (
              <StarBorder
                as="button"
                onClick={handlePlayGame}
                color="cyan"
                speed="4s"
                className="cursor-pointer"
              >
                Play Game
              </StarBorder>
            )}
          </>
        ) : (
          <>
            {matchmakingStatus === "idle" && (
              <StarBorder
                as="button"
                onClick={handlePlayGame}
                color="cyan"
                speed="5s"
                className="cursor-pointer"
              >
                Play Game As Guest
              </StarBorder>
            )}
          </>
        )}

        {/* Show progress while connecting or searching */}
        {(matchmakingStatus === "connecting" || matchmakingStatus === "waiting") && (
          <div className="flex flex-col items-center mt-6 gap-4">
            <CircularProgress size={50} thickness={5} color="info" />
            <p className="italic text-gray-300">
              {matchmakingStatus === "connecting"
                ? "Connecting to server..."
                : "Searching for opponent... Please wait."}
            </p>
          </div>
        )}

        {/* In-game transition message */}
        {matchmakingStatus === "in_game" && gameId && (
          <p className="italic text-gray-300 mt-4">
            Match found! Redirecting to game...
          </p>
        )}
      </div>
    </div>
  );
}

export default HomePage;
