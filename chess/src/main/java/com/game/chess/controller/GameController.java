package com.game.chess.controller;


import com.game.chess.dto.GameStateDTO;
import com.game.chess.dto.MoveRequest;
import com.game.chess.service.GameService;
import com.game.chess.service.UserService;

import java.security.Principal;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Controller
public class GameController {

    @Autowired
    private GameService gameService;

    @Autowired
    private SimpMessageSendingOperations messagingTemplate;


    public GameController(SimpMessageSendingOperations messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/game.find")
    public void findGame(SimpMessageHeaderAccessor headerAccessor) {
        Principal principal = headerAccessor.getUser();
        System.out.println("got in backend");
        System.out.println(principal);
        if (principal == null) {
            gameService.sendError(headerAccessor.getSessionId(), "Authentication required");
            return;
        }

        String userId = principal.getName();
        System.out.println("Matchmaking request from: " + userId);

        // Check if already in queue
        if (gameService.isPlayerWaiting(userId)) {
            gameService.sendMatchmakingResponse(userId, "already_in_queue", null, null, null, null);
            return;
        }

        // Check if already in game
        if (gameService.isUserInActiveGame(userId)) {
            gameService.sendMatchmakingResponse(userId, "already_in_game", null, null, null, null);
            return;
        }

        // Try to find opponent
        String opponentId = gameService.pollWaitingPlayer();
        
        if (opponentId == null) {
            gameService.addWaitingPlayer(userId);
        } else {
            String gameId = gameService.createNewGame(userId, opponentId);
            String userColor = "white";      // Assign colors as you see fit
            String fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
            gameService.sendMatchmakingResponse(userId, "success", gameId, opponentId, fen, userColor);
            gameService.sendMatchmakingResponse(opponentId, "success", gameId, userId, fen, "black");
        }
    }

    @MessageMapping("/game.move/{gameId}")
    public void handleMove(
            @DestinationVariable String gameId,
            @Payload MoveRequest moveRequest,
            SimpMessageHeaderAccessor headerAccessor) {
        
        Principal principal = headerAccessor.getUser();
        if (principal == null) {
            gameService.sendError(headerAccessor.getSessionId(), "Authentication required");
            return;
        }

        String userId = principal.getName();
        System.out.println("Move received from " + userId + " in game " + gameId);
        System.out.println("MoveRequest: " + moveRequest);
        try {
            GameStateDTO updatedState = gameService.processMove(gameId, moveRequest);
            messagingTemplate.convertAndSend("/topic/game/" + gameId, updatedState);
            System.out.println("Broadcasted move for game " + gameId);
            
        } catch (Exception e) {
            System.err.println("Move processing error: " + e.getMessage());
            gameService.sendError(userId, "Invalid move: " + e.getMessage());
        }
    }

    @GetMapping("game/{gameId}")
    public ResponseEntity<GameStateDTO> getGameState(@PathVariable String gameId) {
        return gameService.getGame(gameId)
                .map(game -> {
                    // Convert your Game entity to GameStateDTO
                    GameStateDTO dto = new GameStateDTO(
                        game.getFen(),
                        game.getTurn(),
                        game.getStatus(),
                        game.getWinnerId(),
                        game.getFullMoveNumber()
                    );
                    return ResponseEntity.ok(dto);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }




}
// frontend <-> backend