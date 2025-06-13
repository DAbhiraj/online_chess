package com.game.chess.dto;



import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.Set;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String accessToken;
    private Long id;
    private String email;
    private String name;
}