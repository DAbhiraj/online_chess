import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const API_BASE = "http://localhost:8080/api/lobby";

function LobbyManager() {
  const [lobbies, setLobbies] = useState([]);
  const [newLobbyId, setNewLobbyId] = useState("");
  const [message, setMessage] = useState("");
  const userId = localStorage.getItem("email");
  useEffect(() => {
    fetchMyLobbies();
  }, []);

  const fetchMyLobbies = async () => {
    try {
      const response = await axios.get(`${API_BASE}/mylobby/${userId}`);
      setLobbies(response.data);
      console.log(response.data);
    } catch (err) {
      console.error("Error fetching lobbies", err);
    }
  };

  const createLobby = async () => {
    try {
      const response = await axios.post(`${API_BASE}/create`, {
        lobbyId: newLobbyId,
        ownerId: userId,
      });
      setMessage("✅ Lobby created!");
      console.log(response.data);
      localStorage.setItem("lobbyId",response.data.lobbyId);
      fetchMyLobbies();
    } catch (err) {
      setMessage("❌ Failed to create lobby.");
    }
  };

  const joinLobby = async (lobbyId) => {
    
    try {
      await axios.post(`${API_BASE}/${lobbyId}/join/${userId}`);
      setMessage(`✅ Joined lobby ${lobbyId}`);
      fetchMyLobbies();
    } catch (err) {
      setMessage("❌ Failed to join lobby.");
    }
  };

  const leaveLobby = async (lobbyId) => {
    
    try {
      await axios.post(`${API_BASE}/${lobbyId}/leave/${userId}`);
      setMessage(`👋 Left lobby ${lobbyId}`);
      fetchMyLobbies();
    } catch (err) {
      setMessage("❌ Failed to leave lobby.");
    }
  };

  const deleteLobby = async (lobbyId) => {
    
    console.log(`${API_BASE}/${lobbyId}/delete`);
    try {
      await axios.delete(`${API_BASE}/${lobbyId}/delete`);
      setMessage(`🗑️ Lobby ${lobbyId} deleted`);
      fetchMyLobbies();
    } catch (err) {
      setMessage("❌ Failed to delete lobby.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">🎮 Lobby Manager</h2>

      <div className="mb-6 flex gap-2">
        <input
          type="text"
          className="flex-1 p-2 border border-gray-300 rounded-md"
          placeholder="Enter Lobby ID"
          value={newLobbyId}
          onChange={(e) => setNewLobbyId(e.target.value)}
        />
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          onClick={createLobby}
        >
          Create
        </button>
      </div>

      <h3 className="text-lg font-semibold mb-2 text-gray-700">🧑‍🤝‍🧑 My Lobbies</h3>
      <ul className="space-y-3 mb-6">
        {lobbies.map((lobby) => (
          <li key={lobby.lobbyId} className="p-4 border rounded-md flex justify-between items-center">
            <div>
              <Link to={`/lobby/${lobby.lobbyId}`} className="font-medium text-gray-800">
                {lobby.name || lobby.lobbyId}
              </Link>
              <p className="text-sm text-gray-500">
                Players: {lobby.players?.length || 0}
              </p>
            </div>
            <div className="space-x-2">
              <button
                className="text-yellow-600 hover:underline"
                onClick={() => leaveLobby(lobby.lobbyId)}
              >
                Leave
              </button>
              {lobby.ownerId === userId && (
                <button
                  className="text-red-600 hover:underline"
                  onClick={() => deleteLobby(lobby.lobbyId)}
                >
                  Delete
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <h3 className="text-lg font-semibold mb-2 text-gray-700">➕ Join Lobby</h3>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          className="flex-1 p-2 border border-gray-300 rounded-md"
          placeholder="Lobby ID to join"
          onChange={(e) => setNewLobbyId(e.target.value)}
        />
        <button
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          onClick={() => joinLobby(newLobbyId)}
        >
          Join
        </button>
      </div>

      {message && (
        <div className="text-center text-sm text-gray-700 font-medium mt-4">
          {message}
        </div>
      )}
    </div>
  );
}

export default LobbyManager;
