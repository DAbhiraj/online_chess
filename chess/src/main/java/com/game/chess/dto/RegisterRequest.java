package com.game.chess.dto;

import java.util.Set;

import com.game.chess.model.Role;

import lombok.Data;

@Data
public class RegisterRequest {
    private String name;
    private String email;
    private String password;
    private Set<Role> roles;
}
