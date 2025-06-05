package com.game.chess.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class GameOverReq {
    private String Reason;
    private String WinnerId;
    private String LoserId;
}
