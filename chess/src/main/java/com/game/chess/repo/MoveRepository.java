package com.game.chess.repo;

import com.game.chess.model.MoveHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MoveRepository extends JpaRepository<MoveHistory,Integer> {
    List<MoveHistory> findByGameIdOrderByMoveNumberAsc(String gameId);
}
