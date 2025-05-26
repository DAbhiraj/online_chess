package com.game.chess.dto;

import io.micrometer.common.lang.NonNull;
import lombok.Data;

@Data
public class RegistrationRequest {
    @NonNull
    private String email;
    @NonNull
    private String password;
}