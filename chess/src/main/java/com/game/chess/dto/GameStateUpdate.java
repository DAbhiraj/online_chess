package com.game.chess.dto;

import lombok.Data;

@Data
public class GameStateUpdate {
        public String gameId;
        public String fen; // The FEN string to broadcast
        // No game over flags here, as the client determines game end in this setup.
}