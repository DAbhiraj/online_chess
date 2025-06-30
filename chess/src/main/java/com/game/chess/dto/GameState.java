package com.game.chess.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class GameState {
    String gameId;
    String playerWhiteId;
    String playerBlackId;
           
}
