package com.game.chess.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class MatchMakingConfirmation {
    private String userId;
    private String lobbyId;
}
