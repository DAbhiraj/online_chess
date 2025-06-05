package com.game.chess.controller;


import com.game.chess.dto.GameOverReq;
import com.game.chess.dto.GameStateDTO;
import com.game.chess.dto.LobbyDto;
import com.game.chess.dto.MoveRequest;
import com.game.chess.dto.PlayerDTO;
import com.game.chess.model.User;
import com.game.chess.service.GameService;
import com.game.chess.service.LobbyService;

import java.security.Principal;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Controller;




@Controller
public class GameController {

    @Autowired
    private GameService gameService;

    @Autowired
    private SimpMessageSendingOperations messagingTemplate;

    @Autowired
    private LobbyService lobbyService;


    public GameController(SimpMessageSendingOperations messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/game.find")
    public void findGame(SimpMessageHeaderAccessor headerAccessor) {
        Principal principal = headerAccessor.getUser();
        System.out.println("got in backend");
        System.out.println(principal);
        if (principal == null) {
            //gameService.sendError(headerAccessor.getSessionId(), "Authentication required");
            gameService.matchGuestPlayers();
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
        String opponentId = gameService.pollWaitingPlayer(userId);
        
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

    @MessageMapping("/game.over/{gameId}")
    public void handleGameOver(@DestinationVariable String gameId,GameOverReq gameOverdto){
        gameService.handleGameOver(gameId,gameOverdto.getReason(),gameOverdto.getWinnerId(),gameOverdto.getLoserId());
    }

    @MessageMapping("/game.lobby.match.random/{lobbyId}")
    public void matchWithRandom(@DestinationVariable String lobbyId,SimpMessageHeaderAccessor headerAccessor) {
        Principal principal = headerAccessor.getUser();
        if (principal == null) {
            gameService.sendError(headerAccessor.getSessionId(), "Authentication required");
            return;
        }

        String userId = principal.getName();
        Optional<User> opponentOpt = lobbyService.getRandomOpponentInLobby(lobbyId, userId);

        if (opponentOpt.isEmpty()) {
            gameService.sendMatchmakingResponse(userId, "no_opponent_available", null, null, null, null);
            return;
        }

        User opponent = opponentOpt.get();
        String opponentId = opponent.getEmail().toString();
        String gameId = gameService.createNewGame(userId, opponentId);
        String fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

        gameService.sendMatchmakingResponse(userId, "success", gameId, opponentId, fen, "white");
        gameService.sendMatchmakingResponse(opponentId, "success", gameId, userId, fen, "black");
    }

    @MessageMapping("/game.lobby.match.specific/{lobbyId}")
    public void matchWithSpecific(
        @DestinationVariable String lobbyId,
        @Payload String targetUserId,
        SimpMessageHeaderAccessor headerAccessor
    ) {
        Principal principal = headerAccessor.getUser();
        if (principal == null) {
            gameService.sendError(headerAccessor.getSessionId(), "Authentication required");
            return;
        }

        String userId = principal.getName();

        LobbyDto lobby = lobbyService.getLobbyDTO(lobbyId);
        List<PlayerDTO> players = lobby.getPlayers();

        System.out.println("targetUserId is "+targetUserId);
        System.out.println("userId is "+userId);

        boolean Player1 = players.stream().anyMatch(p -> p.getEmail().toString().equals(targetUserId));
        boolean Player2 = players.stream().anyMatch(p -> p.getEmail().toString().equals(userId));

        System.out.println("is player1 present? "+Player1);
        System.out.println("is player2 present? "+Player2);

        boolean bothPresent = Player1 && Player2;

        if (!bothPresent) {
            gameService.sendMatchmakingResponse(userId, "target_not_in_lobby", null, null, null, null);
            return;
        }
        
        String gameId = gameService.createNewGame(userId, targetUserId);
        String fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

        gameService.sendMatchmakingResponse(userId, "success", gameId, targetUserId, fen, "white");
        gameService.sendMatchmakingResponse(targetUserId, "success", gameId, userId, fen, "black");
        
    }

    // @MessageMapping("/matchmaking/confirm")
    // public void confirmMatch(ConfirmationRequest request) {
    //     if (request.isConfirmed()) {
    //         gameService.createGame(request.getGameId()); // Only now create the game

            
    //     } else {
    //         // Notify initiator of rejection
    //         messagingTemplate.convertAndSendToUser(request.getInitiatorEmail(), "/queue/rejected", new RejectedMessage("user rejected the request"));
    //     }
    // }




    


    
}