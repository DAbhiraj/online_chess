import "./init.jsx";
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js'; // Import the chess.js logic library

// Import STOMP and SockJS
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// IMPORTANT: Define your WebSocket endpoint URL.
// This should match your Spring Boot WebSocket configuration.
// Typically, Spring Boot SockJS endpoints are prefixed with /ws
const WEBSOCKET_URL = "http://localhost:8080/ws";

function ChessboardComponent() {
  const [game, setGame] = useState(new Chess());
  const [stompClient, setStompClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const gameRef = useRef(game); // Use a ref to access the latest game state in callbacks

  // Use a ref for a pseudo-gameId or actual gameId if you have it
  // In a real app, this would come from the lobby/matchmaking logic
  const gameIdRef = useRef('G123'); // IMPORTANT: Replace with actual game ID logic

  useEffect(() => {
    gameRef.current = game; // Keep the ref updated with the latest game state
  }, [game]);

  // --- WebSocket Connection Management ---
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(WEBSOCKET_URL),
      debug: (str) => {
        console.log('STOMP Debug:', str);
      },
      reconnectDelay: 5000, // Try to reconnect every 5 seconds
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = (frame) => {
      console.log('Connected to WebSocket:', frame);
      setIsConnected(true);
      setStompClient(client);

      // --- SUBSCRIBE TO GAME UPDATES ---
      // This is crucial: Subscribe to a topic where the backend will send game state updates.
      // The topic usually includes a game ID.
      // Example: /topic/game/{gameId}
      client.subscribe(`/topic/game/${gameIdRef.current}`, (message) => {
        const newGameState = JSON.parse(message.body);
        console.log('Received game state update:', newGameState);
        // Assuming the backend sends the full FEN string
        const updatedGame = new Chess(newGameState.fen);
        setGame(updatedGame); // Update React state with the new FEN from the server
      });

      // You might also subscribe to personal queues for specific notifications:
      // client.subscribe(`/user/queue/private-messages`, (message) => { ... });
    };

    client.onStompError = (frame) => {
      console.error('Broker reported error:', frame.headers['message']);
      console.error('Additional details:', frame.body);
      setIsConnected(false);
    };

    client.onWebSocketClose = () => {
        console.log('WebSocket connection closed.');
        setIsConnected(false);
    };

    client.activate(); // Connect

    // Cleanup function: Disconnect when component unmounts
    return () => {
      if (client.connected) {
        client.deactivate();
        console.log('Disconnected from WebSocket.');
      }
    };
  }, []); // Empty dependency array means this runs once on mount and clean up on unmount

  // --- Sending Moves to Backend ---
  const sendMoveToBackend = useCallback((moveDetails) => {
    
    if (stompClient && isConnected) {
      // The topic where the backend expects to receive moves
      // This usually maps to a @MessageMapping endpoint in Spring Boot
      const destination = `/app/game.move/${gameIdRef.current}`; // Example: /app/game.move/{gameId}
      
      stompClient.publish({
        destination: destination,
        body: JSON.stringify(moveDetails),
      });
      console.log('Move sent to backend:', moveDetails);
    } else {
      console.warn('Not connected to WebSocket to send move.');
    }
  }, [stompClient, isConnected]); // Depend on stompClient and isConnected

  // --- onDrop handler (remains largely the same, but now calls sendMoveToBackend) ---
  const onDrop = useCallback((sourceSquare, targetSquare) => {
    // Perform client-side validation for immediate UX feedback
    const gameCopy = new Chess(gameRef.current.fen()); 
    
    try {
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });

      if (move) {
        // Optimistic update: Update client-side game state immediately
        // This makes the UI feel very responsive.
        setGame(gameCopy); 

        console.log("Client-side legal move made:", move);

        // --- Send move to backend for server-side validation and broadcast ---
        sendMoveToBackend({
          gameId: gameIdRef.current, // Pass the game ID
          from: sourceSquare,
          to: targetSquare,
          promotion: 'q', // Keep promotion for backend
          fen: gameCopy.fen() // Optionally send current FEN for server to verify
        });

        // You might want to remove the game over/check checks here
        // or just keep them for logging as the server will be authoritative
        if (gameCopy.isGameOver()) {
            if (gameCopy.isCheckmate()) { console.log("Client-side: Checkmate!"); }
            else if (gameCopy.isStalemate()) { console.log("Client-side: Stalemate!"); }
            else if (gameCopy.isDraw()) { console.log("Client-side: Draw!"); }
        } else if (gameCopy.isCheck()) {
            console.log("Client-side: Check!");
        }

        return true; // Indicate that the move was legal and the piece should be updated on the board
      }
    } catch (e) {
      console.error("Client-side illegal move:", e);
    }
    return false; // Indicate that the move was illegal, and the piece should snap back
  }, [sendMoveToBackend]); // Depend on sendMoveToBackend callback


  return (
    <div>
      <h2>Your Chess Game {isConnected ? '(Connected)' : '(Disconnected)'}</h2>
      <p>Game ID: {gameIdRef.current} (Replace with actual ID logic)</p>
      <Chessboard position={game.fen()} onPieceDrop={onDrop} />
      <p>Current Turn: {game.turn() === 'w' ? 'White' : 'Black'}</p>
      <p>FEN: {game.fen()}</p>
    </div>
  );
}

export default ChessboardComponent;