package com.game.chess.config;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;
import org.springframework.web.util.UriComponentsBuilder;

import javax.crypto.SecretKey;
import java.security.Principal;
import java.util.Base64;
import java.util.Map;

@Configuration
@EnableWebSocketMessageBroker
@Slf4j
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${security.jwt.secret-key}")
    private String jwtSecretBase64;

    private SecretKey secretKey;



    //private static final Logger logger = LoggerFactory.getLogger(WebSocketConfig.class);


    @PostConstruct
    public void init() {
        byte[] decodedKey = Base64.getDecoder().decode(jwtSecretBase64);
        this.secretKey = Keys.hmacShaKeyFor(decodedKey);
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
      registry.addEndpoint("/ws")
            .setHandshakeHandler(new DefaultHandshakeHandler() {
                @Override
                protected Principal determineUser(ServerHttpRequest request, 
                    WebSocketHandler wsHandler, Map<String, Object> attributes) {
                    return (Principal) attributes.get("user");
                }
            })
            .addInterceptors(new JwtHandshakeInterceptor())
            .setAllowedOriginPatterns("*") // Adjust for production
            .withSockJS();
    }

    
    private class JwtHandshakeInterceptor implements HandshakeInterceptor {

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Map<String, Object> attributes) {

    String token = UriComponentsBuilder.fromUri(request.getURI())
        .build()
        .getQueryParams()
        .getFirst("token");

    log.debug("token is "+token);

    if (token == null || token.isBlank()|| token.equalsIgnoreCase("null")) {
        // Allow guest access
        String guestId = "guest-" + java.util.UUID.randomUUID();
        System.out.println("Allowing guest connection with ID: " + guestId);
        Principal principal = () -> guestId;
        attributes.put("user", principal);
        return true;
    }

    try {
        Claims claims = Jwts.parserBuilder()
            .setSigningKey(secretKey)
            .build()
            .parseClaimsJws(token)
            .getBody();

        String username = claims.getSubject();
        System.out.println("Authenticating WebSocket connection for user: " + username);

        Principal principal = () -> username;
        attributes.put("user", principal);
        return true;

    } catch (ExpiredJwtException e) {
        log.error("JWT expired: " + e.getMessage());
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
    } catch (JwtException e) {
        log.error("Invalid JWT: "+token+" "+ e.getMessage());
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
    }

    return false;
}


    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                             WebSocketHandler wsHandler, Exception exception) {
        // No cleanup needed
    }


}
}
