package com.game.chess.dto;

import java.util.*;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LobbyDto {
    private String lobbyId;
    private String ownerId;
    private List<PlayerDTO> players;
}
