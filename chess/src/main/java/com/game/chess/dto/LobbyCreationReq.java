package com.game.chess.dto;

import lombok.Data;

@Data
public class LobbyCreationReq {
    private String OwnerId;
    private String lobbyId;
}
