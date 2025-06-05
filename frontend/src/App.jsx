import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ChessboardComponent from './pages/ChessBoard';
import HomePage from './pages/HomePage/HomePage';
import Login from "./pages/Login.jsx";
import LobbyManager from './pages/LobbyPage.jsx';
import LobbyDetails from './pages/LobbyPlayers.jsx';

function App() {
  const [count, setCount] = useState(0)
  
  return (
    <Router>
      <Routes>
        <Route path="/chess/:gameId" element={<ChessboardComponent />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<HomePage />} />
         <Route path="/lobby/:lobbyId" element={<LobbyDetails />} />
        <Route path="/lobby" element={<LobbyManager />} />
      </Routes>
    </Router>
  )
}

export default App
