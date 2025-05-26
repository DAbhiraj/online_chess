// backend/src/main/java/com/game/chess/service/GameService.java
package com.game.chess.service;

import com.game.chess.dto.GameStateDTO;
import com.game.chess.dto.MoveRequest;
import com.game.chess.model.Game;
import com.game.chess.model.MoveHistory;
import com.game.chess.repo.GameRepository;
import com.game.chess.repo.MoveRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
public class GameService {
    private static final String GAME_KEY_PREFIX = "game:";
    private static final long GAME_TTL_HOURS = 2;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private GameRepository gameRepository;

    @Autowired
    private MoveRepository moveHistoryRepository;

    public Game createNewGame(String player1Id, String player2Id) {
        String gameId = UUID.randomUUID().toString();
        Game newGame = new Game(gameId, player1Id, player2Id);

        redisTemplate.opsForValue().set(GAME_KEY_PREFIX + gameId, newGame, GAME_TTL_HOURS, TimeUnit.HOURS);
        System.out.println("Created new game in Redis: " + gameId);

        gameRepository.save(newGame);
        return newGame;
    }

    public Optional<Game> getGame(String gameId) {
        Game game = (Game) redisTemplate.opsForValue().get(GAME_KEY_PREFIX + gameId);
        return Optional.ofNullable(game);
    }

    public GameStateDTO processMove(String gameId, MoveRequest moveRequest) {
        Game game = getGame(gameId)
                .orElseThrow(() -> new IllegalArgumentException("Game not found: " + gameId));

        // --- IMPORTANT: This section needs server-side validation and chesslib logic ---
        // For now, as per your request to defer validation:
        // We'll trust the frontend's FEN for now, and manually flip the turn.
        // In a real app, chesslib would give you the new FEN and the next turn.

        String currentFen = game.getFen(); // Get current FEN from game object
        String currentTurn = game.getTurn(); // Get current turn from game object
        int currentFullMoveNumber = game.getFullMoveNumber(); // Get current move number

        // Simulate applying the move and updating state (NO VALIDATION)
        String newFen = moveRequest.getFenAfterMove(); // Trusting frontend for new FEN
        String nextTurn = currentTurn.equals("w") ? "b" : "w"; // Flip turn

        // Increment fullMoveNumber only after Black's move
        if (currentTurn.equals("b")) {
            currentFullMoveNumber++;
        }

        game.setFen(newFen);
        game.setTurn(nextTurn);
        game.setLastMoveTime(Instant.now().toEpochMilli());
        game.setFullMoveNumber(currentFullMoveNumber); // <-- Update the Game object

        // Placeholder for game over conditions (NO VALIDATION)
        game.setStatus("ONGOING"); // Defaulting to ongoing
        game.setWinnerId(null); // No winner yet

        // Save updated game state back to Redis
        redisTemplate.opsForValue().set(GAME_KEY_PREFIX + gameId, game, GAME_TTL_HOURS, TimeUnit.HOURS);
        System.out.println("Updated game " + gameId + " in Redis (without validation) with FEN: " + game.getFen());

        // Save move history to PostgreSQL
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
}