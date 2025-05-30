// backend/src/main/java/com/game/chess/service/GameService.java
package com.game.chess.service;

import com.game.chess.dto.GameState;
import com.game.chess.dto.GameStateDTO;
import com.game.chess.dto.MatchMakingResponse;
import com.game.chess.dto.MoveRequest;
import com.game.chess.model.Game;
import com.game.chess.model.MoveHistory;
import com.game.chess.repo.GameRepository;
import com.game.chess.repo.MoveRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class GameService {
    private static final String GAME_KEY_PREFIX = "game:";
    private static final long GAME_TTL_HOURS = 2;


    // New constant for the Redis key storing waiting players
    private static final String WAITING_PLAYERS_KEY = "waiting_players_set";

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private GameRepository gameRepository;

    @Autowired
    private MoveRepository moveHistoryRepository;

    @Autowired
    private SimpMessageSendingOperations messagingTemplate;

    public String createNewGame(String player1Id, String player2Id) {
        String gameId = UUID.randomUUID().toString();
        Game newGame = new Game(gameId, player1Id, player2Id);

        redisTemplate.opsForValue().set(GAME_KEY_PREFIX + gameId, newGame, GAME_TTL_HOURS, TimeUnit.HOURS);
        System.out.println("Created new game in Redis: " + gameId);

        gameRepository.save(newGame);
        return gameId;
    }

    public Optional<Game> getGame(String gameId) {
        Game game = (Game) redisTemplate.opsForValue().get(GAME_KEY_PREFIX + gameId);
        return Optional.ofNullable(game);
    }

    public GameStateDTO processMove(String gameId, MoveRequest moveRequest) {
        Game game = getGame(gameId)
                .orElseThrow(() -> new IllegalArgumentException("Game not found: " + gameId));


        System.out.println("in processMove");

        // --- IMPORTANT: This section needs server-side validation and chesslib logic ---


        String currentFen = game.getFen(); // Get current FEN from game object
        String currentTurn = game.getTurn(); // Get current turn from game object
        int currentFullMoveNumber = game.getFullMoveNumber(); // Get current move number

        System.out.println("currentFen is "+currentFen);

        // Simulate applying the move and updating state (NO VALIDATION)
        String newFen = moveRequest.getFenAfterMove(); // Trusting frontend for new FEN
        String nextTurn = currentTurn.equals("w") ? "b" : "w"; // Flip turn

        // Increment fullMoveNumber only after Black's move
        if (currentTurn.equals("b")) {
            currentFullMoveNumber++;
        }
        System.out.println("new fen is "+ newFen);
        game.setFen(newFen);
        game.setTurn(nextTurn);
        game.setLastMoveTime(Instant.now().toEpochMilli());
        game.setFullMoveNumber(currentFullMoveNumber); // <-- Update the Game object

        // Placeholder for game over conditions (NO VALIDATION)
        game.setStatus("ONGOING"); // Defaulting to ongoing
        game.setWinnerId(null); // No winner yet

         System.out.println("going to send to redis");

        // Save updated game state back to Redis
        redisTemplate.opsForValue().set(GAME_KEY_PREFIX + gameId, game, GAME_TTL_HOURS, TimeUnit.HOURS);
        System.out.println("Updated game " + gameId + " in Redis (without validation) with FEN: " + game.getFen());

        // Save move history to PostgreSQL
         System.out.println("going to be in saveMoveTOHistory");
        saveMoveToHistory(gameId, moveRequest, currentFullMoveNumber); // Pass the updated fullMoveNumber

        // Return a DTO for the frontend, including the fullMoveNumber
        return new GameStateDTO(game.getFen(), game.getTurn(), game.getStatus(), game.getWinnerId(), game.getFullMoveNumber());
    }

    public void saveMoveToHistory(String gameId, MoveRequest moveRequest, Integer moveNumber) {
        MoveHistory moveHistory = new MoveHistory(
                gameId,
                moveNumber,
                moveRequest.getPlayerId(),
                moveRequest.getFrom(),
                moveRequest.getTo(),
                moveRequest.getPromotion(),
                moveRequest.getFenAfterMove()
        );
        moveHistoryRepository.save(moveHistory);
        System.out.println("Saving move to history (PostgreSQL): " + moveRequest.getFrom() + moveRequest.getTo() + " for game " + gameId + " move #" + moveNumber);
    }

    public void endGame(String gameId, String status, String winnerId) {
        Optional<Game> gameOpt = getGame(gameId);
        if (gameOpt.isPresent()) {
            Game game = gameOpt.get();
            game.setStatus(status);
            game.setWinnerId(winnerId);
            redisTemplate.opsForValue().set(GAME_KEY_PREFIX + gameId, game, GAME_TTL_HOURS, TimeUnit.HOURS);
            gameRepository.save(game);
            System.out.println("Game " + gameId + " ended with status: " + status);
        }
    }

    public boolean isUserInActiveGame(String userId) {
        // Get all keys matching the game prefix
            Set<String> gameKeys = redisTemplate.keys(GAME_KEY_PREFIX + "*");

            if (gameKeys == null || gameKeys.isEmpty()) {
                System.out.println("No active game keys found in Redis.");
                return false;
            }

            // Iterate through each game key, retrieve the game, and check player IDs
            for (String key : gameKeys) {
                Game game = (Game) redisTemplate.opsForValue().get(key);
                if (game != null) {
                    if (userId.equals(game.getPlayer1Id()) || userId.equals(game.getPlayer2Id())) {
                        System.out.println("User " + userId + " found in active game: " + game.getId());
                        return true; // User found in an active game
                    }
                } else {
                    // This case should ideally not happen if TTL is managed correctly,
                    // but it handles potential race conditions or manual key deletions.
                    System.out.println("Warning: Game key " + key + " found but game object was null in Redis.");
                }
            }

            System.out.println("User " + userId + " not found in any active games in Redis.");
            return false; // User not found in any active game
    }

    public void sendMatchmakingResponse(String userId, String status, String gameId, 
                                      String opponent, String fen, String color) {
        messagingTemplate.convertAndSendToUser(
            userId,
            "queue/matchmaking",
            new MatchMakingResponse(status, gameId, opponent, fen, color)
        );
        System.out.println("sent match to /queue/matchmaking with "+userId+ " "+status+" "+gameId+" "+opponent+" "+fen+" "+color);
    }

    public void sendGameEndedNotification(String userId, String gameId, String reason) {
        messagingTemplate.convertAndSendToUser(
            userId,
            "/queue/game_ended",
            Map.of("gameId", gameId, "reason", reason)
        );
    }

    public void sendError(String userId, String message) {
        messagingTemplate.convertAndSendToUser(
            userId,
            "/queue/errors",
            Map.of("error", message)
        );
    }


public void addWaitingPlayer(String userId) {
    List<Object> existingUsers = redisTemplate.opsForList().range(WAITING_PLAYERS_KEY, 0, -1);
    if (existingUsers != null && existingUsers.contains(userId)) {
        System.out.println("Player " + userId + " already in waiting list.");
    } else {
        redisTemplate.opsForList().rightPush(WAITING_PLAYERS_KEY, userId);
        System.out.println("Player " + userId + " added to waiting list.");
    }
}



public void removeWaitingPlayer(String userId) {
    Long removed = redisTemplate.opsForList().remove(WAITING_PLAYERS_KEY, 0, userId);
    if (removed != null && removed > 0) {
        System.out.println("Player " + userId + " removed from waiting list.");
    } else {
        System.out.println("Player " + userId + " was not found in waiting list.");
    }
}



public String pollWaitingPlayer() {
    Object player = redisTemplate.opsForList().leftPop(WAITING_PLAYERS_KEY);
    return player != null ? player.toString() : null;
}



public boolean isPlayerWaiting(String userId) {
    List<Object> existingUsers = redisTemplate.opsForList().range(WAITING_PLAYERS_KEY, 0, -1);
    return existingUsers != null && existingUsers.contains(userId);
}

}