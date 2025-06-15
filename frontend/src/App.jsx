import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ChessboardComponent from './pages/ChessBoard';
import HomePage from './pages/HomePage/HomePage';
// Removed Login and Register imports
import LobbyManager from './pages/LobbyPage.jsx';
import LobbyDetails from './pages/LobbyPlayers.jsx';
import Particles from './assets/Particles.jsx'; // Make sure this is still used if you want the particles on other pages
import Profile from './pages/Profile.jsx';
import MagicLinkRequest from './pages/MagicLinkRequest.jsx'; // Keep this one
import MagicLoginHandler from './pages/MagicLoginHandler.jsx'; // Keep this one


function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
      <Routes>
        <Route path="/profile" element={<Profile/>}/>
        <Route path="/chess/:gameId" element={<ChessboardComponent />} />
        {/* Removed the /login and /register routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/lobby/:lobbyId" element={<LobbyDetails />} />
        <Route path="/lobby" element={<LobbyManager />} />
        {/* New route for initiating magic link login/registration */}
        <Route path="/login" element={<MagicLinkRequest />} />
        {/* Existing route for handling the magic link callback */}
        <Route path="/magic-login" element={<MagicLoginHandler />} />
      </Routes>
    </Router>
  )
}

export default App