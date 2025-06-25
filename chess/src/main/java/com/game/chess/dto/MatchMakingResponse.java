package com.game.chess.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MatchMakingResponse {
    private String status; // waiting, found, timeout, already_in_queue, already_in_game
    private String gameId;
    private String opponentId;
    private String fen;
    private String color; // Only for "found" status

}
