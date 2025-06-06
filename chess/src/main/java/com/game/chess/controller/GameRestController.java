package com.game.chess.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import com.game.chess.dto.GameStateDTO;
import com.game.chess.dto.PlayerResponse;
import com.game.chess.model.Game;
import com.game.chess.service.GameService;

@RestController
public class GameRestController {

    @Autowired
    private GameService gameService;

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

    @GetMapping("game/gameOver/{gameId}")
    public PlayerResponse getPlayersId(@PathVariable String gameId) {
        System.out.println("going to get player ids");
        Game game = gameService.getGuestGame(gameId);
        PlayerResponse playerResponse = new PlayerResponse(game.getPlayer1Id(),game.getPlayer2Id());
       
        System.out.println("getting player ids "+playerResponse.getPlayer1Id()+" "+playerResponse.getPlayer2Id());
        
            
        return playerResponse;
    }

    
}
