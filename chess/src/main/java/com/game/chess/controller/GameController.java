package com.game.chess.controller;


import com.game.chess.dto.ConfirmationRequest;
import com.game.chess.dto.GameOverReq;
import com.game.chess.dto.GameStateDTO;
import com.game.chess.dto.LobbyDto;
import com.game.chess.dto.MatchMakingConfirmation;
import com.game.chess.dto.MoveRequest;
import com.game.chess.dto.PlayerDTO;
import com.game.chess.model.User;
import com.game.chess.service.GameService;
import com.game.chess.service.LobbyService;

import lombok.extern.slf4j.Slf4j;

import java.security.Principal;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Controller;




@Controller
@Slf4j
public class GameController {

    @Autowired
    private GameService gameService;

    @Autowired
    private SimpMessageSendingOperations messagingTemplate;

    @Autowired
    private LobbyService lobbyService;

    private static final Logger logger = LoggerFactory.getLogger(GameController.class);


    public GameController(SimpMessageSendingOperations messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/game.find")
    public void findGame(SimpMessageHeaderAccessor headerAccessor) {
        Principal principal = headerAccessor.getUser();
        logger.info("got in backend");
        logger.debug("principal is {}",principal);
        String userId = principal.getName();
        logger.info("Matchmaking request from: " + userId);

        if (userId.startsWith("guest-")) {
            gameService.matchGuestPlayers(userId);
            return;
        }

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
            int whiteTimeLeft = 600;
            int blackTimeLeft = 600;
            String gameId = gameService.createNewGame(userId, opponentId,whiteTimeLeft,blackTimeLeft);
            String userColor = "white";      // Assign colors as you see fit
            String fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
            gameService.sendMatchmakingResponse(userId, "success", gameId, opponentId, fen, userColor);
            gameService.sendMatchmakingResponse(opponentId, "success", gameId, userId, fen, "black");
            gameService.handleUser(userId,opponentId,true,"",false);
        }
    }

    @MessageMapping("/game.move/{gameId}")
    public void handleMove(
            @DestinationVariable String gameId,
            @Payload MoveRequest moveRequest,
            SimpMessageHeaderAccessor headerAccessor) {
        
        Principal principal = headerAccessor.getUser();
        String userId = principal.getName();
        if (userId.startsWith("guest-")) {
            GameStateDTO updatedState = gameService.processMoveForGuests(gameId, moveRequest);
            messagingTemplate.convertAndSend("/topic/game/" + gameId, updatedState);
            logger.info("Broadcasted move for game " + gameId);
            return;
        }

       
        logger.debug("Move received from " + userId + " in game " + gameId);
        logger.debug("MoveRequest: " + moveRequest);
        try {
            GameStateDTO updatedState = gameService.processMove(gameId, moveRequest);
            messagingTemplate.convertAndSend("/topic/game/" + gameId, updatedState);
            logger.info("Broadcasted move for game " + gameId);
            
        } catch (Exception e) {
            System.err.println("Move processing error: " + e.getMessage());
            gameService.sendError(userId, "Invalid move: " + e.getMessage());
        }
    }

    @MessageMapping("/game.over/{gameId}")
    public void handleGameOver(@DestinationVariable String gameId,GameOverReq gameOverdto){
        gameService.handleUser(gameOverdto.getWinnerId(),gameOverdto.getLoserId(),false,gameOverdto.getReason(),gameOverdto.isGuest());
        gameService.handleGameOver(gameId,gameOverdto.getReason(),gameOverdto.getWinnerId(),gameOverdto.getLoserId(),gameOverdto.isGuest());
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
        int whiteTimeLeft = 600;
        int blackTimeLeft = 600;
        String gameId = gameService.createNewGame(userId, opponentId,whiteTimeLeft,blackTimeLeft);
        String fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

        gameService.sendMatchmakingResponse(userId, "success", gameId, opponentId, fen, "white");
        gameService.sendMatchmakingResponse(opponentId, "success", gameId, userId, fen, "black");
        gameService.handleUser(userId,opponentId,true,"",false);
    }

    @MessageMapping("/game.lobby.match.specific/{lobbyId}")
    public void matchWithSpecific(
        @DestinationVariable String lobbyId,
        @Payload String targetUserId,
        SimpMessageHeaderAccessor headerAccessor
    ) {
        logger.debug("inside the match with specific with "+targetUserId);
        Principal principal = headerAccessor.getUser();
        if (principal == null) {
            gameService.sendError(headerAccessor.getSessionId(), "Authentication required");
            return;
        }

        String userId = principal.getName();

        LobbyDto lobby = lobbyService.getLobbyDTO(lobbyId);
        List<PlayerDTO> players = lobby.getPlayers();

        logger.debug("targetUserId is "+targetUserId);
        logger.debug("userId is "+userId);

        boolean Player1 = players.stream().anyMatch(p -> p.getEmail().toString().equals(targetUserId));
        boolean Player2 = players.stream().anyMatch(p -> p.getEmail().toString().equals(userId));

        logger.debug("is player1 present? "+Player1);
        logger.debug("is player2 present? "+Player2);

        boolean bothPresent = Player1 && Player2;

        if (!bothPresent) {
            gameService.sendMatchmakingResponse(userId, "target_not_in_lobby", null, null, null, null);
            return;
        }

        messagingTemplate.convertAndSendToUser(targetUserId, "/queue/matchmaking/request", new MatchMakingConfirmation(userId, lobbyId)); 
    }

    @MessageMapping("/matchmaking/confirm")
    public void confirmMatch(ConfirmationRequest request, SimpMessageHeaderAccessor headerAccessor) {
        Principal principal = headerAccessor.getUser();
        if (principal == null) {
            gameService.sendError(headerAccessor.getSessionId(), "Authentication required");
            return;
        }

        String userId = principal.getName(); // The user who is confirming the match
        String initiatorId = request.getInitiatorEmail(); // The user who initiated the match request

         if (request.isConfirmed()) {
            // Ensure the confirmation is coming from the *target* user and for the correct initiator.
            // You might want to add more robust validation here, e.g., checking a pending match request.
            // For simplicity, assuming 'initiatorId' is the 'targetUserId' from the previous step.
            int whiteTimeLeft = 600;
            int blackTimeLeft = 600;
            String gameId = gameService.createNewGame(initiatorId, userId,whiteTimeLeft,blackTimeLeft); // initiatorId is player1, userId is player2
            String fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

            // Send success response to both players
            gameService.sendMatchmakingResponse(initiatorId, "success", gameId, userId, fen, "white");
            gameService.sendMatchmakingResponse(userId, "success", gameId, initiatorId, fen, "black");
            logger.debug("going to handleUser");
            gameService.handleUser(initiatorId,userId,true,"",false); 
        } else {
        // Notify initiator of rejection
            messagingTemplate.convertAndSendToUser(request.getInitiatorEmail(), "/queue/rejected", "user rejected the request");
         }
    }

    @MessageMapping("/guest.requestGuestId") // This matches "/app/guest.requestGuestId" from frontend
    public void requestGuestId(StompHeaderAccessor headerAccessor, Principal principal) {
        if (principal != null && principal.getName().startsWith("guest-")) {
            String guestId = principal.getName();
            // Send the ID ONLY AFTER the client has explicitly requested it,
            // meaning their subscription should be active.
            messagingTemplate.convertAndSendToUser(guestId, "/queue/guest", guestId);
            log.info("Guest ID {} sent on request to /queue/guest", guestId);
        } else {
            log.warn("Non-guest or unauthenticated user tried to request guest ID.");
        }
    }




    


    
}