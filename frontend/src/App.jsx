import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ChessboardComponent from './pages/ChessBoard';
import HomePage from './pages/HomePage/HomePage';
import Login from "./pages/Login.jsx";


function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
      <Routes>
        <Route path="/chess" element={<ChessboardComponent />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<HomePage />} />
      </Routes>
    </Router>
  )
}

export default App
