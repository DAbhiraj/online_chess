package com.game.chess.dto;

import lombok.Data;

@Data
public class MoveRequest {
    private String gameId;
    private String playerId; // Assuming this is the 'movingPlayerId'
    private String from; // e.g., "e2"
    private String to;   // e.g., "e4"
    private String promotion; // "q" for queen if needed (can be null)
    private String fenAfterMove; // The FEN string AFTER the move was made and validated
}
