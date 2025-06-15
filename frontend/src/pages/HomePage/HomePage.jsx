import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import Particles from "../../assets/Particles"; // Assuming this path is correct

const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL;
import StarBorder from "../../assets/StarBorder";

function HomePage() {
  const navigate = useNavigate();
  const [stompClient, setStompClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [matchmakingStatus, setMatchmakingStatus] = useState("idle"); // 'idle', 'connecting', 'waiting', 'in_game'
  const [gameId, setGameId] = useState(null); // Will store the gameId once matched
  const [matchDetails, setMatchDetails] = useState(null);
  const userIdRef = useRef(localStorage.getItem("email")); // Use the actual user ID from your generated JWT

  const TEST_JWT_TOKEN = localStorage.getItem("authToken"); // REPLACE THIS WITH YOUR GENERATED TOKEN
  //console.log("jwt token is " + TEST_JWT_TOKEN);
  const stompClientRef = useRef(stompClient);

  useEffect(() => {
    stompClientRef.current = stompClient;
  }, [stompClient]);

  useEffect(() => {
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
    // Append the JWT token as a query parameter to the WebSocket URL.
    // This is a common workaround for SockJS when `connectHeaders` are not reliably passed
    // during the initial HTTP handshake for fallback transports.
    const websocketUrlWithToken = TEST_JWT_TOKEN
      ? `${WEBSOCKET_URL}?token=${TEST_JWT_TOKEN}`
      : `${WEBSOCKET_URL}`;
    console.log("url is " + websocketUrlWithToken);
    const client = new Client({
      webSocketFactory: () => new SockJS(websocketUrlWithToken),
      reconnectDelay: 5000,
    });

    client.onConnect = (frame) => {
      console.log("Connected to WebSocket");
      setIsConnected(true); // <--- Set isConnected to true here

      if (TEST_JWT_TOKEN == null) {
        // 👇 Subscribe to standard guest queue
        console.log("going to subscribe guest");
        client.subscribe("/user/queue/guest", (message) => {
          console.log("in guest subscribe");
          const guestId = message.body;
          console.log("Received guest ID:", guestId);

          localStorage.setItem("email", guestId);
          userIdRef.current = guestId;

          // Only send matchmaking after getting the guestId
          client.publish({
            destination: "/app/game.find",
            body: JSON.stringify({ userId: guestId }),
          });
        });

        client.publish({
          destination: "/app/guest.requestGuestId", // Define a new endpoint on backend
          // No body needed if the backend can get the user's Principal from the session
        });
        console.log("Sent request for guest ID.");

      } else {
        // Authenticated user: send matchmaking request directly
        client.publish({
          destination: "/app/game.find",
          body: JSON.stringify({ userId: userIdRef.current }),
        });
      }

      // Also subscribe to matchmaking response
      client.subscribe("/user/queue/matchmaking", (message) => {
        const matchDetails = JSON.parse(message.body);
        console.log("Matchmaking details:", matchDetails);
        setMatchDetails(matchDetails);
      });
    };

    client.onStompError = (frame) => {
      console.error(
        "Broker reported error (HomePage):",
        frame.headers["message"]
      );
      console.error("Additional details (HomePage):", frame.body);
      setIsConnected(false);
      setMatchmakingStatus("idle"); // Revert to idle on error
      setGameId(null);
    };

    client.onWebSocketClose = () => {
      console.log("WebSocket connection closed (HomePage).");
      setIsConnected(false);
      setMatchmakingStatus("idle"); // Revert to idle on close
      setGameId(null);
    };

    setStompClient(client);

    return () => {
      if (stompClientRef.current && stompClientRef.current.connected) {
        stompClientRef.current.deactivate();
        console.log("Disconnected from WebSocket (HomePage cleanup).");
      }
    };
  }, []); // Empty dependency array: runs only once on mount

  const handlePlayGame = useCallback(() => {
    if (stompClient && matchmakingStatus === "idle") {
      console.log("Activating STOMP client from HomePage...");
      setMatchmakingStatus("connecting");
      stompClient.activate(); // THIS IS THE KEY: Activate the client here!
    } else {
      console.warn(
        "Cannot initiate matchmaking: STOMP client not ready or already searching."
      );
    }
  }, [stompClient, matchmakingStatus]);




  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center bg-black font-sans text-black-800 text-center">
      {/* Particles Background */}
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
                className="cursor-pointer"
                speed="5s"
              >
                Play Game As Guest
              </StarBorder>
            )}
          </>
        )}

        {matchmakingStatus === "connecting" && (
          <p className="italic text-gray-600 mt-4">Connecting to server...</p>
        )}

        {matchmakingStatus === "waiting" && (
          <p className="italic text-gray-600 mt-4">
            Searching for opponent... Please wait.
          </p>
        )}

        {matchmakingStatus === "in_game" && gameId && (
          <p className="italic text-gray-600 mt-4">
            Match found! Redirecting to game...
          </p>
        )}
      </div>
    </div>
  );
}

export default HomePage;
