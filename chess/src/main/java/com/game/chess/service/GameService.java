// backend/src/main/java/com/game/chess/service/GameService.java
package com.game.chess.service;

import com.game.chess.dto.GameOverReq;
import com.game.chess.dto.GameState;
import com.game.chess.dto.GameStateDTO;
import com.game.chess.dto.MatchMakingResponse;
import com.game.chess.dto.MoveRequest;
import com.game.chess.model.Game;
import com.game.chess.model.MoveHistory;
import com.game.chess.model.User;
import com.game.chess.repo.GameRepository;
import com.game.chess.repo.MoveRepository;
import com.game.chess.repo.UserRepository;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;



@Service
@Slf4j
public class GameService {
    private static final String GAME_KEY_PREFIX = "game:";
    private static final long GAME_TTL_HOURS = 2;
    private static final long MAX_RATING_DIFF = 200;
    private static final String WAITING_GUEST_PLAYERS_KEY = "waiting_guest_players_set";


    // New constant for the Redis key storing waiting players
    private static final String WAITING_PLAYERS_KEY = "waiting_players_set";

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    private static final Logger logger = LoggerFactory.getLogger(GameService.class);

    @Autowired
    private GameRepository gameRepository;

    @Autowired
    private MoveRepository moveHistoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private SimpMessageSendingOperations messagingTemplate;

    public String createNewGame(String player1Id, String player2Id,int whiteTimeLeft,int blackTimeLeft) {
        String gameId = UUID.randomUUID().toString();
        Game newGame = new Game(gameId, player1Id, player2Id,whiteTimeLeft,blackTimeLeft);

        redisTemplate.opsForValue().set(GAME_KEY_PREFIX + gameId, newGame, GAME_TTL_HOURS, TimeUnit.HOURS);
        logger.info("Created new game in Redis: " + gameId);

        gameRepository.save(newGame);
        return gameId;
    }

    public Optional<Game> getGame(String gameId) {
        Game game = (Game) redisTemplate.opsForValue().get(GAME_KEY_PREFIX + gameId);
        log.info(game.getPlayer1Id()+" "+game.getPlayer2Id());
        return Optional.ofNullable(game);
    }

    public GameStateDTO processMove(String gameId, MoveRequest moveRequest) {
        Game game = getGame(gameId)
                .orElseThrow(() -> new IllegalArgumentException("Game not found: " + gameId));


        logger.info("in processMove");

        String currentFen = game.getFen(); 
        String currentTurn = game.getTurn(); 
        int currentFullMoveNumber = game.getFullMoveNumber(); 

        logger.info("currentFen is "+currentFen);

        
        String newFen = moveRequest.getFenAfterMove(); 
        String nextTurn = currentTurn.equals("w") ? "b" : "w"; 

        // Increment fullMoveNumber only after Black's move
        if (currentTurn.equals("b")) {
            currentFullMoveNumber++;
        }

        long now = System.currentTimeMillis();
        long elapsedSec = (now - game.getLastMoveTime()) / 1000;

        if (game.getTurn().equals("w")) {
            game.setWhiteTimeLeft(game.getWhiteTimeLeft() - (int) elapsedSec);
        } else {
            game.setBlackTimeLeft(game.getBlackTimeLeft() - (int) elapsedSec);
        }
        game.setLastMoveTime(now);

        logger.info("new fen is "+ newFen);
        game.setFen(newFen);
        game.setTurn(nextTurn);
        game.setLastMoveTime(Instant.now().toEpochMilli());
        game.setFullMoveNumber(currentFullMoveNumber); // <-- Update the Game object

        
        game.setStatus("ONGOING"); // Defaulting to ongoing
        game.setWinnerId(null); // No winner yet

         logger.info("going to send to redis");

        // Save updated game state back to Redis
        redisTemplate.opsForValue().set(GAME_KEY_PREFIX + gameId, game, GAME_TTL_HOURS, TimeUnit.HOURS);
        logger.info("Updated game " + gameId + " in Redis (without validation) with FEN: " + game.getFen());

        // Save move history to PostgreSQL
         logger.info("going to be in saveMoveTOHistory");
        saveMoveToHistory(gameId, moveRequest, currentFullMoveNumber); // Pass the updated fullMoveNumber

        // Return a DTO for the frontend, including the fullMoveNumber
        return new GameStateDTO(game.getFen(), game.getTurn(), game.getStatus(), game.getWinnerId(), game.getFullMoveNumber(),moveRequest.getFrom(),moveRequest.getTo(),game.getWhiteTimeLeft(),game.getBlackTimeLeft());
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
        logger.info("Saving move to history (PostgreSQL): " + moveRequest.getFrom() + moveRequest.getTo() + " for game " + gameId + " move #" + moveNumber);
    }



    public boolean isUserInActiveGame(String userId) {
        // Get all keys matching the game prefix
           
            Set<String> gameKeys = redisTemplate.keys(GAME_KEY_PREFIX + "*");

            if (gameKeys == null || gameKeys.isEmpty()) {
                logger.warn("No active game keys found in Redis.");
                return false;
            }

            // Iterate through each game key, retrieve the game, and check player IDs
            for (String key : gameKeys) {
                Game game = (Game) redisTemplate.opsForValue().get(key);
                if (game != null) {
                    if (userId.equals(game.getPlayer1Id()) || userId.equals(game.getPlayer2Id())) {
                        logger.warn("User " + userId + " found in active game: " + game.getId());
                        return true; // User found in an active game
                    }
                } else {
                    // This case should ideally not happen if TTL is managed correctly,
                    // but it handles potential race conditions or manual key deletions.
                    logger.warn("Warning: Game key " + key + " found but game object was null in Redis.");
                }
            }

            logger.info("User " + userId + " not found in any active games in Redis.");
            return false; // User not found in any active game
    }

    public void sendMatchmakingResponse(String userId, String status, String gameId, 
                                      String opponent, String fen, String color) {
        messagingTemplate.convertAndSendToUser(
            userId,
            "queue/matchmaking",
            new MatchMakingResponse(status, gameId, opponent, fen, color)
        );
        logger.info("sent match to /queue/matchmaking with "+userId+ " "+status+" "+gameId+" "+opponent+" "+fen+" "+color);
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
            logger.warn("Player " + userId + " already in waiting list.");
        } else {
            redisTemplate.opsForList().rightPush(WAITING_PLAYERS_KEY, userId);
            logger.info("Player " + userId + " added to waiting list.");
        }
    }



    public void removeWaitingPlayer(String userId) {
        Long removed = redisTemplate.opsForList().remove(WAITING_PLAYERS_KEY, 0, userId);
        if (removed != null && removed > 0) {
            logger.info("Player " + userId + " removed from waiting list.");
        } else {
            logger.warn("Player " + userId + " was not found in waiting list.");
        }
    }

    public int getRating(String userId){
        Optional<User> optUser = userRepository.findByEmail(userId);
        if(!optUser.isPresent()){
            throw new IllegalArgumentException("user not found with "+userId);
        }
        User user = optUser.get();
        int userRating = user.getRating();
        return userRating;
    }



    public String pollWaitingPlayer(String userId) {
        
        
        List<Object> candidates = redisTemplate.opsForList().range(WAITING_PLAYERS_KEY,0,-1);

        if(candidates == null) return null;

        int userRating = getRating(userId);

        for(Object opponent : candidates){
            String candidate = opponent.toString();

            if (candidate.equals(userId)) continue;

            int theirRating = getRating(candidate);
            if (Math.abs(userRating - theirRating) <= MAX_RATING_DIFF) {
                redisTemplate.opsForList().remove(WAITING_PLAYERS_KEY, 0, candidate);
                return candidate;
            }
        }

        return null;
    }



    public boolean isPlayerWaiting(String userId) {
        List<Object> existingUsers = redisTemplate.opsForList().range(WAITING_PLAYERS_KEY, 0, -1);
        return existingUsers != null && existingUsers.contains(userId);
    }

    public boolean isGuestPlayerWaiting(String userId) {
        List<Object> existingUsers = redisTemplate.opsForList().range(WAITING_GUEST_PLAYERS_KEY, 0, -1);
        return existingUsers != null && existingUsers.contains(userId);
    }

    public Game getPlayers(String gameId) {
        Game game = gameRepository.getReferenceById(gameId);
        logger.info(game.getPlayer1Id());
        return game;
    }

    public Game getGuestGame(String gameId){
        String key = GAME_KEY_PREFIX+gameId;
        Game game = (Game) redisTemplate.opsForValue().get(key);
        return game;
    }

    public void handleGameOver(String gameId, String status, String winnerId,String loserId,boolean isGuest) {
        Optional<Game> gameOpt = getGame(gameId);

        if (gameOpt.isPresent()) {
            Game game = gameOpt.get();
            game.setStatus(status);
            game.setWinnerId(winnerId);
            redisTemplate.opsForValue().set(GAME_KEY_PREFIX + gameId, game, GAME_TTL_HOURS, TimeUnit.HOURS);
            if(!isGuest)
                gameRepository.save(game);
            logger.info("Game " + gameId + " ended with status: " + status);
            redisTemplate.delete("game:" + gameId);
            logger.info("cleared " + gameId + " in redis ");
            GameOverReq payload = new GameOverReq(status, winnerId,loserId,false);
            messagingTemplate.convertAndSend("/topic/game/" + gameId + "/gameover", payload);
            if(!isGuest)
                updateRatings(winnerId, loserId);
        }
    }

    public void changeRating(String userId,int newRating){
        Optional<User> optUser = userRepository.findByEmail(userId);
        if(!optUser.isPresent()){
            throw new IllegalArgumentException("user not found with "+userId);
        }
        User user = optUser.get();
        user.setRating(newRating);
        System.out.println(user.getEmail()+" "+user.getRating());
        userRepository.save(user);
    }

    public void updateRatings(String winnerId, String loserId) {
        int winnerRating = getRating(winnerId);
        int loserRating = getRating(loserId);

        // Simple ELO formula
        double expectedWin = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400.0));
        int k = 32;

        int newWinnerRating = (int) Math.round(winnerRating + k * (1 - expectedWin));
        int newLoserRating = (int) Math.round(loserRating + k * (0 - (1 - expectedWin)));

        changeRating(winnerId,newWinnerRating);
        changeRating(loserId,newLoserRating);

        

        System.out.printf("Updated ratings - %s: %d -> %d, %s: %d -> %d%n",
                winnerId, winnerRating, newWinnerRating,
                loserId, loserRating, newLoserRating);
    }

    public void addWaitingGuest(String guestId) {
        redisTemplate.opsForList().rightPush(WAITING_GUEST_PLAYERS_KEY, guestId);
    }

    public String pollWaitingGuest(String currentGuestId) {
        String other = (String) redisTemplate.opsForList().leftPop(WAITING_GUEST_PLAYERS_KEY);
        return (other != null && !other.equals(currentGuestId)) ? other : null;
    }

    public void matchGuestPlayers(String guestId) {
        

        logger.info("Guest matchmaking request: " + guestId);

        // Check if guest is already waiting
        if (isGuestPlayerWaiting(guestId)) {
           sendMatchmakingResponse(guestId, "already_in_queue", null, null, null, null);
            return;
        }

                // Check if guest is already in a game
        if (isUserInActiveGame(guestId)) {
            sendMatchmakingResponse(guestId, "already_in_game", null, null, null, null);
            return;
        }

        String opponentId = pollWaitingGuest(guestId);
        if (opponentId == null) {
            addWaitingGuest(guestId);
        } else {
            String gameId = createGuestGame(guestId, opponentId);
            String fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
            sendMatchmakingResponse(guestId, "success", gameId, opponentId, fen, "white");
            sendMatchmakingResponse(opponentId, "success", gameId, guestId, fen, "black");
        }
    }

    public String createGuestGame(String player1Id, String player2Id) {
        String gameId = UUID.randomUUID().toString();
        int whiteTimeLeft = 600;
        int blackTimeLeft = 600;
        Game newGame = new Game(gameId, player1Id, player2Id,whiteTimeLeft,blackTimeLeft);

        redisTemplate.opsForValue().set(GAME_KEY_PREFIX + gameId, newGame, GAME_TTL_HOURS, TimeUnit.HOURS);
        logger.info("Created new game in Redis: " + gameId);

        return gameId;
    }

     public GameStateDTO processMoveForGuests(String gameId, MoveRequest moveRequest) {
        Game game = getGuestGame(gameId);

        logger.info("in processMove");

        String currentFen = game.getFen(); // Get current FEN from game object
        String currentTurn = game.getTurn(); // Get current turn from game object
        int currentFullMoveNumber = game.getFullMoveNumber(); // Get current move number

        logger.info("currentFen is "+currentFen);

        // Simulate applying the move and updating state (NO VALIDATION)
        String newFen = moveRequest.getFenAfterMove(); // Trusting frontend for new FEN
        String nextTurn = currentTurn.equals("w") ? "b" : "w"; // Flip turn

        // Increment fullMoveNumber only after Black's move
        if (currentTurn.equals("b")) {
            currentFullMoveNumber++;
        }

        long now = System.currentTimeMillis();
        long elapsedSec = (now - game.getLastMoveTime()) / 1000;

        if (game.getTurn().equals("w")) {
            game.setWhiteTimeLeft(game.getWhiteTimeLeft() - (int) elapsedSec);
        } else {
            game.setBlackTimeLeft(game.getBlackTimeLeft() - (int) elapsedSec);
        }
        game.setLastMoveTime(now);

        logger.info("new fen is "+ newFen);
        game.setFen(newFen);
        game.setTurn(nextTurn);
        game.setLastMoveTime(Instant.now().toEpochMilli());
        game.setFullMoveNumber(currentFullMoveNumber); // <-- Update the Game object

        // Placeholder for game over conditions (NO VALIDATION)
        game.setStatus("ONGOING"); // Defaulting to ongoing
        game.setWinnerId(null); // No winner yet

         logger.info("going to send to redis");

        // Save updated game state back to Redis
        redisTemplate.opsForValue().set(GAME_KEY_PREFIX + gameId, game, GAME_TTL_HOURS, TimeUnit.HOURS);
        logger.info("Updated game " + gameId + " in Redis (without validation) with FEN: " + game.getFen());


        // Return a DTO for the frontend, including the fullMoveNumber
        return new GameStateDTO(game.getFen(), game.getTurn(), game.getStatus(), game.getWinnerId(), game.getFullMoveNumber(),moveRequest.getFrom(),moveRequest.getTo(),game.getWhiteTimeLeft(),game.getWhiteTimeLeft());
    }

    public void handleUser(String winnerId,String loserId,boolean matchStatus,String reason,boolean isGuest){
        if(isGuest){
            return;
        }
        User user = userService.getPlayer(winnerId);
        User opponent = userService.getPlayer(loserId);
        logger.info(user.getEmail()+" "+opponent.getEmail()+" "+matchStatus);
        //If matchstatus is true means match has been made, increase matches played by plyer by 1
        if(matchStatus){
            user.setMatchesPlayed(user.getMatchesPlayed()+1);
            opponent.setMatchesPlayed(opponent.getMatchesPlayed()+1);
            userRepository.save(user);
            userRepository.save(opponent);
        }
        else{ //if game is over
            //if it's drawn then increase matches drawn to both user by 1
            if(reason=="draw"){
                user.setMatchesDrawn(user.getMatchesDrawn()+1);
                opponent.setMatchesDrawn(opponent.getMatchesDrawn()+1);
                userRepository.save(user);
                userRepository.save(opponent);
            }
            else{ //winner by 1 and loser by 1
                user.setMatchesWon(user.getMatchesWon()+1);
                System.out.println("user "+user.getEmail()+" "+user.getMatchesPlayed()+" "+user.getMatchesWon());
                userRepository.save(user);
                opponent.setMatchesLost(user.getMatchesLost()+1);
                System.out.println("opponent "+opponent.getEmail()+" "+opponent.getMatchesPlayed()+" "+opponent.getMatchesWon());
                userRepository.save(opponent);
            }
        }
    }

    



}