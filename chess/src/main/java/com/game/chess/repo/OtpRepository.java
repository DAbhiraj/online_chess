package com.game.chess.repo;

import com.game.chess.model.OtpEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OtpRepository extends JpaRepository<OtpEntity, Long> {
    Optional<OtpEntity> findTopByEmailOrderByExpiryTimeDesc(String email);

    void deleteById(Long id);
}
