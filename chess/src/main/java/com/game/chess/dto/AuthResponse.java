package com.game.chess.dto;

import com.game.chess.model.Role;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.Set;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private Long id;
    private String email;
    private String name;
    private Set<Role> roles;

}