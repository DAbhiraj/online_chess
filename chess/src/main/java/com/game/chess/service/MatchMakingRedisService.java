package com.game.chess.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Service;
import com.game.chess.dto.MatchMakingResponse;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class MatchMakingRedisService {

    private static final String PENDING_PREFIX = "match:pending:";
    private static final String SUBSCRIBED_PREFIX = "match:subscribed:";

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private SimpMessageSendingOperations messagingTemplate;

    

    public void storePendingMatch(String userId, MatchMakingResponse response) {
        redisTemplate.opsForValue().set(PENDING_PREFIX + userId, response);
    }

    public void markUserSubscribed(String userId) {
        redisTemplate.opsForValue().set(SUBSCRIBED_PREFIX + userId, true);
        log.info("✅ markUserSubscribed: {}", userId);

        MatchMakingResponse pending = (MatchMakingResponse) redisTemplate.opsForValue().get(PENDING_PREFIX + userId);
        log.info("⏳ Pending matchmaking response: {}", pending);
        if (pending == null) return;

        String opponentId = pending.getOpponentId();

        Boolean userSubscribed = (Boolean) redisTemplate.opsForValue().get(SUBSCRIBED_PREFIX + userId);
        Boolean opponentSubscribed = (Boolean) redisTemplate.opsForValue().get(SUBSCRIBED_PREFIX + opponentId);

        log.info("📡 Subscribed status - {}: {}, {}: {}", userId, userSubscribed, opponentId, opponentSubscribed);

        if (Boolean.TRUE.equals(userSubscribed) && Boolean.TRUE.equals(opponentSubscribed)) {
            messagingTemplate.convertAndSendToUser(userId, "/queue/matchmaking", pending);

            MatchMakingResponse opponentMatch = (MatchMakingResponse) redisTemplate
                .opsForValue()
                .get(PENDING_PREFIX + opponentId);

            messagingTemplate.convertAndSendToUser(opponentId, "/queue/matchmaking", opponentMatch);

            // Cleanup
            redisTemplate.delete(PENDING_PREFIX + userId);
            redisTemplate.delete(PENDING_PREFIX + opponentId);
            redisTemplate.delete(SUBSCRIBED_PREFIX + userId);
            redisTemplate.delete(SUBSCRIBED_PREFIX + opponentId);

            log.info("✅ Sent matchmaking details and cleaned Redis for {} and {}", userId, opponentId);
        }
    }


    
}
