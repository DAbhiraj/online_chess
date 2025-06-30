
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import ChessboardComponent from "./pages/ChessBoard";
import HomePage from "./pages/HomePage/HomePage";
import LobbyManager from "./pages/LobbyPage.jsx";
import LobbyDetails from "./pages/LobbyPlayers.jsx";
import Profile from "./pages/Profile.jsx";
import MagicLinkRequest from "./pages/MagicLinkRequest.jsx"; 
import MagicLoginHandler from "./pages/MagicLoginHandler.jsx"; 
import Navbar from "./pages/component/Navbar.component.jsx";


function App() {
  
  return (
    <Router>
      <Navbar/>
      <Routes>
        <Route path="/profile" element={<Profile />} />
        <Route path="/chess/:gameId" element={<ChessboardComponent />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/lobby/:lobbyId" element={<LobbyDetails />} />
        <Route path="/lobby" element={<LobbyManager />} />
        <Route path="/login" element={<MagicLinkRequest />} />
        <Route path="/magic-login" element={<MagicLoginHandler />} />
      </Routes>
    </Router>
  );
}

export default App;
