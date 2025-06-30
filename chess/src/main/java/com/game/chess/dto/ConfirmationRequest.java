package com.game.chess.dto;

import lombok.Data;

@Data
public class ConfirmationRequest {
    private String gameId;
    private boolean confirmed;
    private String initiatorEmail;
}
