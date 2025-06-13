package com.game.chess.model;


import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.*;

@Entity
@Table(name = "allusers")
@Data
@NoArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private String email;
    @Column(nullable = false)
    private String name;

    private int rating = 800;

    @ManyToMany(mappedBy = "players")
    @com.fasterxml.jackson.annotation.JsonBackReference
    private List<Lobby> lobbies;

    private int matchesPlayed;
    private int matchesWon;  
    private int matchesLost;
    private int matchesDrawn;



   

}
