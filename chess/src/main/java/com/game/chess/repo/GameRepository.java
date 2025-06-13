package com.game.chess.repo;

import com.game.chess.model.Game;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface GameRepository extends JpaRepository<Game, String> {
    @Query("SELECT g FROM Game g WHERE g.player1Id = :email OR g.player2Id = :email")
    List<Game> findByPlayer1IdOrPlayer2Id(@Param("email") String email);
}
