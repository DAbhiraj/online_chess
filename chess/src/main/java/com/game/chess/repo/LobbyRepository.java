package com.game.chess.repo;

import org.springframework.data.jpa.repository.JpaRepository;

import com.game.chess.model.Lobby;
import java.util.List;


public interface LobbyRepository extends JpaRepository<Lobby,String> {
    public List<Lobby> findByName(String name);
}
