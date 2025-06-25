import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Particles from "../assets/Particles";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

const API_BASE = `${import.meta.env.VITE_BACKEND_URL}api/lobby`;

function LobbyManager() {
  const [lobbies, setLobbies] = useState([]);
  const [newLobbyId, setNewLobbyId] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [createdLobbyId, setCreatedLobbyId] = useState("");
  const userId = localStorage.getItem("email");

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  useEffect(() => {
    fetchMyLobbies();
  }, []);

  const fetchMyLobbies = async () => {
    try {
      const response = await axios.get(`${API_BASE}/mylobby/${userId}`);
      setLobbies(response.data);
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
      setCreatedLobbyId(response.data.lobbyId);
      setSnackbar({ open: true, message: "✅ Lobby created!", severity: "success" });
      setShowPopup(true);
      localStorage.setItem("lobbyId", response.data.lobbyId);
      fetchMyLobbies();
    } catch (err) {
      setSnackbar({ open: true, message: "❌ Failed to create lobby.", severity: "error" });
    }
  };

  const joinLobby = async (lobbyId) => {
    try {
      await axios.post(`${API_BASE}/${lobbyId}/join/${userId}`);
      setSnackbar({ open: true, message: `✅ Joined lobby ${lobbyId}`, severity: "success" });
      fetchMyLobbies();
    } catch (err) {
      setSnackbar({ open: true, message: "❌ Failed to join lobby.", severity: "error" });
    }
  };

  const leaveLobby = async (lobbyId) => {
    try {
      await axios.post(`${API_BASE}/${lobbyId}/leave/${userId}`);
      setSnackbar({ open: true, message: `👋 Left lobby ${lobbyId}`, severity: "info" });
      fetchMyLobbies();
    } catch (err) {
      setSnackbar({ open: true, message: "❌ Failed to leave lobby.", severity: "error" });
    }
  };

  const deleteLobby = async (lobbyId) => {
    try {
      await axios.delete(`${API_BASE}$/{lobbyId}/delete`);
      setSnackbar({ open: true, message: `🗑️ Lobby ${lobbyId} deleted`, severity: "warning" });
      fetchMyLobbies();
    } catch (err) {
      setSnackbar({ open: true, message: "❌ Failed to delete lobby.", severity: "error" });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(createdLobbyId);
    setSnackbar({ open: true, message: "✅ Copied to clipboard!", severity: "success" });
    setTimeout(() => setShowPopup(false), 1000);
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center bg-black font-sans text-black-800 text-center">
      {/* Particles background */}
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

      {/* Popup overlay */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full border border-cyan-400">
            <h3 className="text-xl font-bold text-cyan-400 mb-4">Lobby Created!</h3>
            <p className="text-white mb-2">Share this code with friends to join:</p>
            <div className="flex items-center justify-between bg-gray-700 p-3 rounded mb-4">
              <code className="text-white text-lg font-mono">{createdLobbyId}</code>
              <button
                onClick={copyToClipboard}
                className="ml-4 px-3 py-1 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition-all duration-300 cursor-pointer"
              >
                Copy
              </button>
            </div>
            <button
              onClick={() => setShowPopup(false)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-all duration-200 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="relative w-full max-w-3xl px-6 py-8 md:px-10 md:py-12 rounded-lg z-10">
        <div className="bg-[#111827] opacity-80 rounded-lg p-6 shadow-lg">
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
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
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
                    className="text-yellow-400 hover:underline cursor-pointer mx-2 px-2"
                    onClick={() => leaveLobby(lobby.lobbyId)}
                  >
                    Leave
                  </button>
                  {lobby.ownerId === userId && (
                    <button
                      className="text-red-400 hover:underline cursor-pointer"
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
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer"
              onClick={() => joinLobby(newLobbyId)}
            >
              Join
            </button>
          </div>
        </div>
      </div>

      {/* Snackbar Alert */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "centre" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default LobbyManager;
