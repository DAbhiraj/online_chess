package com.game.chess.controller;

import java.util.Collections;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.game.chess.dto.AuthResponse;
import com.game.chess.dto.LoginRequest;
import com.game.chess.model.User;
import com.game.chess.repo.UserRepository;
import com.game.chess.security.JwtTokenProvider;
import com.game.chess.service.EmailService;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import lombok.extern.slf4j.Slf4j;


@RestController
@RequestMapping("/api/auth")
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

    private final String CLIENT_ID = "1087092754597-05j77ogikqgqtv82aak8dsiukgiga8pv.apps.googleusercontent.com";


    


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

    @SuppressWarnings("deprecation")
    @PostMapping("/google")
    public ResponseEntity<?> authenticate(@RequestBody Map<String, String> body) throws Exception {
        String idTokenString = body.get("token");
        log.info(idTokenString);
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), JacksonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(CLIENT_ID))
                .build();

        GoogleIdToken idToken = verifier.verify(idTokenString);
        log.info("going to idToken ");
        System.out.println(idToken);
        if (idToken != null) {
            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            String name = (String) payload.get("name");

            // Optionally save user to DB
            User user = userRepository.findByEmail(email).orElseGet(() -> {
                // If not found, create new user
                User newUser = new User();
                newUser.setEmail(email);
                newUser.setName(name);
                log.debug("going to save to userRepo by google");
                return userRepository.save(newUser);
            });

            // Generate JWT
            String accessToken = jwtTokenProvider.generateAccessToken(email, name);
            AuthResponse authResponse = new AuthResponse(accessToken,user.getId(),user.getEmail(),user.getName());
            return ResponseEntity.ok(authResponse);
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
        }
    }
    
}

