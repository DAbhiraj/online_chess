// frontend/src/features/chessboard/ChessboardComponent.jsx
import React, { useState, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js'; // Import the chess.js logic library

function ChessboardComponent() {
  const [game, setGame] = useState(new Chess()); // Initialize a new chess game instance

  // This function will be called by react-chessboard when a piece is dropped
  // It handles the logic of making the move client-side for immediate feedback
  const onDrop = useCallback((sourceSquare, targetSquare) => {
    // Create a temporary copy of the game state to test the move
    const gameCopy = new Chess(game.fen()); // Create new Chess instance from current FEN

    try {
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q', // Always promote to queen for simplicity initially
      });

      if (gameCopy.isGameOver()) {
  if (gameCopy.isCheckmate()) {
    console.log("Game Over: Checkmate!");
    // Determine winner based on whose turn it was *before* the checkmating move
    // or simply the color of the player who just moved
    const winnerColor = gameCopy.turn() === 'w' ? 'Black' : 'White'; // If it's now White's turn, Black just moved and checkmated
    console.log(`${winnerColor} wins by checkmate!`);
    // *** Send game over event to backend via WebSocket ***
    // e.g., sendGameOverEventToBackend(gameCopy.fen(), 'CHECKMATE', winnerColor);
  } else if (gameCopy.isStalemate()) {
    console.log("Game Over: Stalemate (Draw)!");
    // *** Send game over event to backend via WebSocket ***
    // e.g., sendGameOverEventToBackend(gameCopy.fen(), 'STALEMATE', 'DRAW');
  } else if (gameCopy.isDraw()) { // This covers 3-fold repetition, 50-move rule, insufficient material
    console.log("Game Over: Draw!");
    // *** Send game over event to backend via WebSocket ***
    // e.g., sendGameOverEventToBackend(gameCopy.fen(), 'DRAW', 'DRAW');
  }
} else if (gameCopy.isCheck()) {
  console.log("Check!");
  // You might want to display a "Check!" message to the player whose king is attacked.
}



      // If the move was legal, update the game state
      if (move) {
        setGame(gameCopy); // Update the React state with the new game instance
        console.log("Legal move made:", move);
        // *** This is where you would send the move to your Spring Boot backend ***
        // Example: sendMoveToBackend(game.fen(), move);
        return true; // Indicate that the move was legal and the piece should be updated on the board
      }
    } catch (e) {
      console.error("Illegal move:", e);
    }
    return false;// Indicate that the move was illegal, and the piece should snap back

    
  }, [game]); // Depend on 'game' state to ensure latest FEN is used

  return (
    <div>
      <h2>Your Chess Game</h2>
      <Chessboard position={game.fen()} onPieceDrop={onDrop} />
      <p>Current Turn: {game.turn() === 'w' ? 'White' : 'Black'}</p>
      <p>FEN: {game.fen()}</p> {/* Display the FEN for debugging */}
    </div>
  );
}

export default ChessboardComponent;