package com.game.chess.dto;

import lombok.Data;

@Data
public class VerificationRequest {
    private String email;
    private String otp;
}
