package com.game.chess.model;


import jakarta.persistence.*;
import lombok.Data;

import java.util.*;

@Entity
@Table(name = "allusers")
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private String email;
    @Column(nullable = false)
    private String name;
    @Column(nullable = false)
    private String password;

    private boolean isVerified = false;

    private int rating = 800;
    
    @ElementCollection(fetch = FetchType.EAGER)
    @Enumerated(EnumType.STRING)
    private Set<Role> roles = new HashSet<>();

    @ManyToMany(mappedBy = "players")
    @com.fasterxml.jackson.annotation.JsonBackReference
    private List<Lobby> lobbies;

    // @ManyToMany(mappedBy = "friends")
    // @com.fasterxml.jackson.annotation.JsonBackReference
    // private List<User> friends;

   

}
