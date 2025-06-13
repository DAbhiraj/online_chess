package com.game.chess.service;

import java.util.UUID;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.game.chess.dto.LoginRequest;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class EmailService {
    // @Value("${app.frontend.url}")
    private String frontendUrl="http://localhost:5173";

    private static String MAGIC_LINK_KEY = "magiclink:";
    private static String MAGIC_LINK_NAME = "magicName:";

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    public void sendMagicLink(String email,String name) {
        String token = UUID.randomUUID().toString();
        String redisKey = MAGIC_LINK_KEY + token;
        String nameRedisKey = MAGIC_LINK_NAME+token;

        
        redisTemplate.opsForValue().set(redisKey, email, 15, TimeUnit.MINUTES);
        redisTemplate.opsForValue().set(nameRedisKey, name, 15, TimeUnit.MINUTES);

        String link = frontendUrl + "/magic-login?token=" + token;

        // send email
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Your magic login link");
        message.setText("Click to login: " + link);
        mailSender.send(message);
    }

    public LoginRequest verifyToken(String token) {
        String email = redisTemplate.opsForValue().get(MAGIC_LINK_KEY + token);
        String name = redisTemplate.opsForValue().get(MAGIC_LINK_NAME + token);
        log.debug("email and name in emailService "+email+" "+name);
        if (email != null && name!=null) {
            redisTemplate.delete(MAGIC_LINK_KEY + token); // one-time use
            redisTemplate.delete(MAGIC_LINK_NAME + token); // one-time use
        }
        return new LoginRequest(email,name);
    }
}
