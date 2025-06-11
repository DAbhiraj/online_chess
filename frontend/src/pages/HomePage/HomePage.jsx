import React, { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import Particles from "../../assets/Particles"; // Assuming this path is correct
import GooeyNav from "../../assets/GoevyNav";
import BackgroundLetterAvatars from "../../assets/Avatar";
const WEBSOCKET_URL = "http://localhost:8080/ws";

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
      console.log("Connected to WebSocket (HomePage):", frame);
      setIsConnected(true);
      setMatchmakingStatus("waiting"); // Immediately transition to waiting after connection

      // --- SUBSCRIBE TO PRIVATE MATCHMAKING QUEUE ---
      console.log("subscribing to matchmaking");
      client.subscribe(`/user/queue/matchmaking`, (message) => {
        console.log("subscribing to matchmaking");
        try {
          const matchDetails = JSON.parse(message.body);
          console.log("Received matchmaking details (HomePage):", matchDetails);
          if (matchDetails.gameId) {
            setMatchDetails(matchDetails);
            setMatchmakingStatus("in_game");

            if (stompClientRef.current && stompClientRef.current.connected) {
              stompClientRef.current.deactivate();
              console.log("STOMP client deactivated on HomePage after match.");
            }
          } else if (matchDetails.status === "waiting") {
            setMatchmakingStatus("waiting");
            console.log("Still waiting for an opponent...");
          }
        } catch (e) {
          console.error(
            "Failed to parse matchmaking message body:",
            message.body,
            e
          );
        }
      });

      // Send the find opponent request immediately after connecting and subscribing
      client.publish({
        destination: `/app/game.find`,
        body: JSON.stringify({ userId: userIdRef.current }), // Send your user ID (from frontend)
      });

      console.log(`Sent find opponent request for user: ${userIdRef.current}`);
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

  const handleLoginRedirect = () => {
    navigate("/login");
  };

  const handleLobbyRedirect = () => {
    navigate("/lobby");
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };
  const items = [
    { label: "Home", href: "/" },
    { label: "Lobby", href: "/lobby" },
  ];

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

      <div className="absolute items-center  top-5  z-20">
        <GooeyNav
          items={items}
          particleCount={15}
          particleDistances={[90, 10]}
          particleR={100}
          initialActiveIndex={0}
          animationTime={600}
          timeVariance={300}
          colors={[1, 2, 3, 1, 2, 3, 1, 4]}
        />
      </div>

      {/* Content Overlay */}
      <div className="absolute items-center  top-2 right-2 z-20">
        {TEST_JWT_TOKEN ? (
          <button
            onClick={handleLogout}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-300 ease-in-out"
          >
            Logout
          </button>
        ) : (
          <button
            onClick={handleLoginRedirect}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-300 ease-in-out"
          >
            Login
          </button>
        )}
      </div>
      <div className="relative z-10 top-0 right-0 flex flex-col items-center p-5 max-w-2xl w-full">
        <h1 className="text-5xl font-extrabold text-blue-800 mt-8 mb-4">
          Welcome to Chess Online
        </h1>

        {userIdRef.current ? (
          <>
            <p className="text-lg text-gray-700 mb-6">
              localStorage.getItem("name")
            </p>
            {matchmakingStatus === "idle" && (
              <button
                onClick={handlePlayGame}
                className="px-8 py-4 text-2xl bg-green-600 text-white rounded-xl cursor-pointer transition duration-300 ease-in-out shadow-lg hover:bg-green-700 hover:scale-105 active:bg-green-800 active:scale-100 mt-8"
              >
                Play Game
              </button>
            )}
          </>
        ) : (
          <>

            {matchmakingStatus === "idle" && (
              <button
                onClick={handlePlayGame}
                className="px-8 py-4 text-2xl bg-green-600 text-white rounded-xl cursor-pointer transition duration-300 ease-in-out shadow-lg hover:bg-green-700 hover:scale-105 active:bg-green-800 active:scale-100 mt-8"
              >
                Play Game As Guest
              </button>
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
