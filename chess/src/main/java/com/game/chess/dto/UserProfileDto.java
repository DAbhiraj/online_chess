package com.game.chess.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserProfileDto {

    private int matchesPlayed;
    private int matchesWon;
    private int matchesLost;
    private int matchesDrawn;
    private int rating;

}
