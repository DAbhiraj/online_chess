package com.game.chess.dto;

import java.util.Set;



import lombok.Data;

@Data
public class RegisterRequest {
    private String name;
    private String email;
    private String password;
}
