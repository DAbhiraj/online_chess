package com.game.chess.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class GameStateDTO {
    private String fen;
    private String turn;
    private String status;
    private String winnerId;
    private int fullMoveNumber;
    private String from;
    private String to;
    private int whiteTimeLeft;
    private int blackTimeLeft;
}
