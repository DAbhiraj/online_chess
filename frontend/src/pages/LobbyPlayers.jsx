import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import MatchmakingRequestModal from "./MatchMakingReqModal";

const LobbyDetails = () => {
  const { lobbyId } = useParams();
  const navigate = useNavigate();
  const userId = localStorage.getItem("email");
  const [players, setPlayers] = useState([]);
  const [stompClient, setStompClient] = useState(null);
  const [incomingRequest, setIncomingRequest] = useState(null);

  const WEBSOCKET_URL = `http://localhost:8080/ws`;
  const API_BASE = "http://localhost:8080/api/lobby";
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
    <div className="max-w-xl mx-auto mt-10 p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Lobby: {lobbyId}</h2>
      <button
        className="px-3 py-1 mb-3 bg-red-500 text-white rounded hover:bg-red-600"
        onClick={playRandom}
      >
        Play Random
      </button>

      {players.length === 0 ? (
        <p>No players in this lobby.</p>
      ) : (
        <ul className="space-y-2">
          {players.map((player) => (
            <li
              key={player.id}
              className="flex justify-between items-center p-2 border rounded"
            >
              <span>{player.email}</span>
              {player.email !== userId && (
                <button
                  className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
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
  );
};

export default LobbyDetails;
