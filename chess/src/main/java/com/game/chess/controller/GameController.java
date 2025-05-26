package com.game.chess.controller;


import com.game.chess.dto.GameStateDTO;
import com.game.chess.dto.MoveRequest;
import com.game.chess.service.GameService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class GameController {

    @Autowired
    private GameService gameService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate; // Used to send messages to clients

    // This method handles incoming moves from clients via /app/game.move/{gameId}
    @MessageMapping("/game.move/{gameId}")
    // @SendTo("/topic/game/{gameId}") //Can use @SendTo for simple broadcasts but SimpMessagingTemplate is more flexible
    public void handleMove(@DestinationVariable String gameId, MoveRequest moveRequest) {
        //DestinationVariable is like Pathvariable in websockets
        System.out.println("Received move for game " + gameId + ": " + moveRequest);

        try {
            // 1. Process and validate the move using your GameService
            // This is where Redis interaction (get/update game state) happens
            GameStateDTO updatedState = gameService.processMove(gameId, moveRequest);


            // 2. Broadcast the updated game state to all subscribers of this game's topic
            messagingTemplate.convertAndSend("/topic/game/" + gameId,updatedState);
            System.out.println("Broadcasted new state for game " + gameId + ": " + updatedState.getFen() + " Move #" + updatedState.getFullMoveNumber());

        } catch (Exception e) {
            System.err.println("Error processing move for game " + gameId + ": " + e.getMessage());
            // Optionally, send an error message back to the player
            //messagingTemplate.convertAndSendToUser(moveRequest.getPlayerId(), "/queue/errors", "Invalid move!");
        }
    }

    // You might also have methods for creating/joining games via REST,
    // and then pushing initial game state via WebSocket
    // e.g., after a new game is created, send initial FEN to players.
}
