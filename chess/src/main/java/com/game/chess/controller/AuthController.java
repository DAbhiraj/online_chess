package com.game.chess.controller;

import java.util.Collections;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.game.chess.dto.AuthResponse;
import com.game.chess.dto.LoginRequest;
import com.game.chess.model.User;
import com.game.chess.repo.UserRepository;
import com.game.chess.security.JwtTokenProvider;
//import com.game.chess.service.AuthService;
import com.game.chess.service.EmailService;

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "https://sweet-bublanina-8cd739.netlify.app")
@Slf4j
public class AuthController {



    @Autowired
    private EmailService emailService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserRepository userRepository;

    // private final AuthService authService;

    // public AuthController(AuthService authService) {
    //     this.authService = authService;
    // }



    @PostMapping("/send-magic-link")
    public ResponseEntity<?> sendMagicLink(@RequestBody LoginRequest loginReq) {
        emailService.sendMagicLink(loginReq.getEmail(),loginReq.getName());
        return ResponseEntity.ok("Magic link sent.");
    }

    @GetMapping("/verify")
    public ResponseEntity<?> verifyToken(@RequestParam String token) {
        LoginRequest req = emailService.verifyToken(token);
        log.debug("email in controller "+ req.getEmail()+" "+req.getName());
        if (req.getEmail() == null && req.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or expired link.");
        }
        User user = userRepository.findByEmail(req.getEmail()).orElseGet(() -> {
        // If not found, create new user
        User newUser = new User();
        newUser.setEmail(req.getEmail());
        newUser.setName(req.getName());
        log.debug("going to save to userRepo");
        return userRepository.save(newUser);
    });
        String accessToken = jwtTokenProvider.generateRefreshToken(req.getEmail());
        AuthResponse authResponse = new AuthResponse(accessToken,user.getId(),user.getEmail(),user.getName());
        return ResponseEntity.ok(authResponse);
    }
    
    
}

