import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ChessboardComponent from './pages/ChessBoard';
import HomePage from './pages/HomePage/HomePage';
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx"; 
import LobbyManager from './pages/LobbyPage.jsx';
import LobbyDetails from './pages/LobbyPlayers.jsx';
import Particles from './assets/Particles.jsx';
import Profile from './pages/Profile.jsx';


function App() {
  const [count, setCount] = useState(0)
  
  return (
    <Router>
      <Routes>
        <Route path="/profile" element={<Profile/>}/>
        <Route path="/chess/:gameId" element={<ChessboardComponent />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/lobby/:lobbyId" element={<LobbyDetails />} />
        <Route path="/lobby" element={<LobbyManager />} />
        <Route path="/particles" element={<Particles />} />
      </Routes>
    </Router>
  )
}

export default App
