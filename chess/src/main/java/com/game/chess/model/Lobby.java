package com.game.chess.model;

import java.time.LocalDateTime;
import java.util.List;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name="lobbies")
public class Lobby{
    
    @Id
    private String lobbyId;

    private String name;
    private int maxPlayers=20;
    private String ownerId;
    private LocalDateTime createdAt;
    @ManyToMany
    @JoinTable(
        name = "lobby_users",
        joinColumns = @JoinColumn(name = "lobby_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    @com.fasterxml.jackson.annotation.JsonManagedReference
    private List<User> players;



    

}