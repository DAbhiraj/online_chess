import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Particles from "../assets/Particles";

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
      localStorage.setItem("lobbyId", response.data.lobbyId);
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
    try {
      await axios.delete(`${API_BASE}/${lobbyId}/delete`);
      setMessage(`🗑️ Lobby ${lobbyId} deleted`);
      fetchMyLobbies();
    } catch (err) {
      setMessage("❌ Failed to delete lobby.");
    }
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

    <div className="min-h-screen w-3xl text-white flex items-center justify-center p-6 z-100">
      <div className="w-full max-w-3xl   px-10 py-12 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center mb-6 text-white">🎮 Lobby Manager</h2>

        <div className="mb-6 flex gap-2">
          <input
            type="text"
            className="flex-1 p-2 border border-gray-600 rounded-md bg-gray-800 text-white"
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

        <h3 className="text-xl font-semibold mb-2 text-white">🧑‍🤝‍🧑 My Lobbies</h3>
        <ul className="space-y-3 mb-6">
          {lobbies.map((lobby) => (
            <li key={lobby.lobbyId} className="p-4 border border-gray-700 rounded-md flex justify-between items-center bg-gray-800">
              <div>
                <Link to={`/lobby/${lobby.lobbyId}`} className="font-medium text-cyan-400 hover:underline">
                  {lobby.name || lobby.lobbyId}
                </Link>
                <p className="text-sm text-gray-400">
                  Players: {lobby.players?.length || 0}
                </p>
              </div>
              <div className="space-x-2">
                <button
                  className="text-yellow-400 hover:underline"
                  onClick={() => leaveLobby(lobby.lobbyId)}
                >
                  Leave
                </button>
                {lobby.ownerId === userId && (
                  <button
                    className="text-red-400 hover:underline"
                    onClick={() => deleteLobby(lobby.lobbyId)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>

        <h3 className="text-xl font-semibold mb-2 text-white">➕ Join Lobby</h3>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            className="flex-1 p-2 border border-gray-600 rounded-md bg-gray-800 text-white"
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
          <div className="text-center text-sm text-green-400 font-medium mt-4">
            {message}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

export default LobbyManager;
