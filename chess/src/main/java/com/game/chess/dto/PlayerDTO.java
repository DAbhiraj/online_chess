package com.game.chess.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class PlayerDTO {
    private Long id;
    private String email;
}
