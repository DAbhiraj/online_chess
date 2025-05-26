package com.game.chess.model;


import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;

import java.time.Instant;

@Entity
@Data
public class MoveHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // For auto-incrementing integer ID
    private Integer moveId; // Use Long for auto-incrementing primary keys
    // Use String to match the Game entity's ID (UUID)
    private String gameId;
    private Integer moveNumber; // Sequence of moves within a game
    private String movingPlayerId;
    private String fromSquare;
    private String toSquare;
    private String promotionDetails; // Can be null if no promotion
    private String fenAfterMove;

    private Instant timestamp; // Using Instant for accurate timestamp

    public MoveHistory(String gameId, Integer moveNumber, String movingPlayerId, String fromSquare, String toSquare, String promotionDetails, String fenAfterMove) {
        this.gameId = gameId;
        this.moveNumber = moveNumber;
        this.movingPlayerId = movingPlayerId;
        this.fromSquare = fromSquare;
        this.toSquare = toSquare;
        this.promotionDetails = promotionDetails;
        this.fenAfterMove = fenAfterMove;
        this.timestamp = Instant.now(); // Set current timestamp on creation
    }
}
