import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import MatchmakingRequestModal from "./MatchMakingReqModal";
import Particles from "../assets/Particles";

const LobbyDetails = () => {
  const { lobbyId } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem("email");
  const [players, setPlayers] = useState([]);
  const [stompClient, setStompClient] = useState(null);
  const [incomingRequest, setIncomingRequest] = useState(null);

  const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL;
  const API_BASE = `${import.meta.env.VITE_BACKEND_URL}api/lobby`;
  const token = localStorage.getItem("authToken");
  const websocketUrlWithToken = `${WEBSOCKET_URL}?token=${token}`;

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await axios.get(`${API_BASE}/${lobbyId}/players`);
        setPlayers(response.data);
      } catch (err) {
        console.error("Error fetching players:", err);
      }
    };

    fetchPlayers();
  }, [lobbyId]);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(websocketUrlWithToken),
      debug: (str) => console.log("STOMP Debug:", str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      console.log("✅ Connected to matchmaking");

      client.subscribe("/user/queue/matchmaking", (message) => {
        const data = JSON.parse(message.body);
        console.log("Received matchmaking:", data);

        if (data.status === "success" && data.gameId) {
          navigate(`/chess/${data.gameId}`);
        }
      });

      client.subscribe("/user/queue/rejected", () => {
        alert("❌ Your matchmaking request was rejected.");
      });

      client.subscribe("/user/queue/matchmaking/request", (message) => {
        const data = JSON.parse(message.body);
        console.log("Matchmaking request received:", data);
        setIncomingRequest(data);
      });

      setStompClient(client);
    };

    client.onStompError = (frame) => {
      console.error("STOMP Error:", frame);
    };

    client.activate();

    return () => {
      if (client) {
        client.deactivate();
        console.log("Disconnected from matchmaking socket.");
      }
    };
  }, [navigate]);

  const playRandom = () => {
    if (stompClient && stompClient.connected) {
      stompClient.publish({
        destination: `/app/game.lobby.match.random/${lobbyId}`,
        body: "",
      });
    }
  };

  const playWith = (targetId) => {
    if (stompClient && stompClient.connected) {
      stompClient.publish({
        destination: `/app/game.lobby.match.specific/${lobbyId}`,
        body: targetId,
      });
    }
  };

  const handleConfirm = () => {
    stompClient.publish({
      destination: `/app/matchmaking/confirm`,
      body: JSON.stringify({
        initiatorEmail: incomingRequest.userId,
        confirmed: true,
      }),
    });
    setIncomingRequest(null);
  };

  const handleReject = () => {
    stompClient.publish({
      destination: `/app/matchmaking/confirm`,
      body: JSON.stringify({
        initiatorEmail: incomingRequest.userId,
        confirmed: false,
      }),
    });
    setIncomingRequest(null);
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center bg-black font-sans text-black-800 text-center">
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

    <div className=" w-1/2 min-h-[50vh] my-6 flex flex-col gap-4 justify-center bg-[#111827] opacity-80 max-w-xl mx-auto mt-10 p-4 text-white shadow-md rounded-lg z-50">
      <h2 className="text-2xl font-bold mb-4">Lobby: {lobbyId}</h2>
      <button
        className=" px-3 py-2 mb-3 bg-blue-800 text-white rounded hover:bg-blue-700  cursor-pointer transistion-all duration-300 "
        onClick={playRandom}
      >
        Play Random
      </button>

      {players.length === 0 ? (
        <p>No players in this lobby.</p>
      ) : (
        <ul className="space-y-5">
          {players.map((player) => (
            <li
              key={player.id}
              className="flex justify-between items-center p-2 border rounded"
            >
              <span>{player.email}</span>
              {player.email !== userId && (
                <button
                  className="px-4 py-1 bg-blue-600 cursor-pointer text-white rounded hover:bg-blue-700"
                  onClick={() => playWith(player.email)}
                >
                  Play
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* MUI Modal for Matchmaking */}
      <MatchmakingRequestModal
        open={Boolean(incomingRequest)}
        request={incomingRequest}
        onConfirm={handleConfirm}
        onReject={handleReject}
      />
    </div>
    </div>
  );
};

export default LobbyDetails;
