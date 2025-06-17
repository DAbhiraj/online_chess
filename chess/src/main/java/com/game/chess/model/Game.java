package com.game.chess.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;


import java.io.Serializable;

@Entity
@Table(name="games")
@Data
@NoArgsConstructor
public class Game implements Serializable {
    private static final long serialVersionUID = 1L; // Recommended for Serializable

    @Id
    private String id; 
    private String fen; 
    private String turn; // "w" for white, "b" for black
    private String player1Id; // ID of Player 1 (White)
    private String player2Id; // ID of Player 2 (Black)
    private String status; // E.g., "ONGOING", "CHECKMATE", "STALEMATE", "DRAW", "RESIGNED"
    private String winnerId;
    private long lastMoveTime; // Timestamp of the last move, useful for clocks
    private int whiteTimeLeft;
    private int blackTimeLeft;
    private int fullMoveNumber;


    public Game(String id, String player1Id, String player2Id,int whiteTimeLeft,int blackTimeLeft) {
        this.id = id;
        this.fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"; // Initial FEN
        this.turn = "w";
        this.player1Id = player1Id;
        this.player2Id = player2Id;
        this.status = "ONGOING";
        this.lastMoveTime = System.currentTimeMillis();
        this.fullMoveNumber = 1;
        this.whiteTimeLeft = whiteTimeLeft;
        this.blackTimeLeft = blackTimeLeft;
    }
}
