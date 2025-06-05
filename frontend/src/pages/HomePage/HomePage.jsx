import React, { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const WEBSOCKET_URL = "http://localhost:8080/ws";

function HomePage() {
  const navigate = useNavigate();
  const [stompClient, setStompClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [matchmakingStatus, setMatchmakingStatus] = useState("idle"); // 'idle', 'connecting', 'waiting', 'in_game'
  const [gameId, setGameId] = useState(null); // Will store the gameId once matched


  const userIdRef = useRef(localStorage.getItem("email")); // Use the actual user ID from your generated JWT

  const TEST_JWT_TOKEN = localStorage.getItem("authToken"); // REPLACE THIS WITH YOUR GENERATED TOKEN
  //console.log("jwt token is " + TEST_JWT_TOKEN);
  const stompClientRef = useRef(stompClient);

  useEffect(() => {
    stompClientRef.current = stompClient;
  }, [stompClient]);

  useEffect(() => {
    // Append the JWT token as a query parameter to the WebSocket URL.
    // This is a common workaround for SockJS when `connectHeaders` are not reliably passed
    // during the initial HTTP handshake for fallback transports.
    const websocketUrlWithToken = `${WEBSOCKET_URL}?token=${TEST_JWT_TOKEN}`;
    console.log("url is " + websocketUrlWithToken);
    const client = new Client({
      webSocketFactory: () =>
        new SockJS(websocketUrlWithToken),
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
            setGameId(matchDetails.gameId);
            setMatchmakingStatus("in_game");
            navigate("/chess", {
              state: {
                gameId: matchDetails.gameId,
                initialFen: matchDetails.fen,
              },
            });

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
    navigate('/login');
  }

    const handleLobbyRedirect = () => {
    navigate('/lobby');
  }

  return (
    <div className="home-page-container">
      <button onClick = {handleLoginRedirect}>login</button>
      <button onClick = {handleLobbyRedirect}>Lobby</button>
      <h1>Welcome to Chess Online!</h1>
      <p>Your User ID: {userIdRef.current}</p>

      {/* Conditional rendering based on matchmaking status */}
      {matchmakingStatus === "idle" && (
        <button onClick={handlePlayGame} className="play-game-button">
          Play Game (Find Opponent)
        </button>
      )}

      {matchmakingStatus === "connecting" && (
        <p className="status-message">Connecting to server...</p>
      )}

      {matchmakingStatus === "waiting" && (
        <p className="status-message">Searching for opponent... Please wait.</p>
      )}

      {matchmakingStatus === "in_game" && gameId && (
        <p className="status-message">Match found! Redirecting to game...</p>
      )}

      {/* Basic styling for the home page */}
      <style>{`
                .home-page-container {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    background-color: #f0f2f5;
                    font-family: 'Arial', sans-serif;
                    color: #333;
                    text-align: center;
                }

                h1 {
                    color: #2c3e50;
                    margin-bottom: 20px;
                    font-size: 2.5em;
                }

                p {
                    margin: 10px 0;
                    font-size: 1.1em;
                }

                .play-game-button {
                    padding: 15px 30px;
                    font-size: 1.5em;
                    background-color: #4CAF50; /* Green */
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: background-color 0.3s ease, transform 0.2s ease;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
                    margin-top: 20px;
                }

                .play-game-button:hover {
                    background-color: #45a049;
                    transform: translateY(-2px);
                }

                .play-game-button:active {
                    background-color: #3e8e41;
                    transform: translateY(0);
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                }

                .status-message {
                    font-style: italic;
                    color: #555;
                    margin-top: 15px;
                }
            `}</style>
    </div>
  );
}

export default HomePage;
