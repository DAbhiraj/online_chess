// package com.game.chess.service;

// import com.game.chess.dto.AuthResponse;
// import com.game.chess.dto.LoginRequest;
// import com.game.chess.dto.VerificationRequest;
// import com.game.chess.model.User;
// import com.game.chess.repo.UserRepository;
// import com.game.chess.security.JwtTokenProvider;

// import lombok.AllArgsConstructor;

// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.security.authentication.AuthenticationManager;
// import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
// import org.springframework.security.core.Authentication;
// import org.springframework.security.core.authority.SimpleGrantedAuthority;
// import org.springframework.security.core.context.SecurityContextHolder;
// import org.springframework.security.core.userdetails.UserDetails;
// import org.springframework.security.core.userdetails.UsernameNotFoundException;
// import org.springframework.stereotype.Service;

// import java.util.Collections;
// import java.util.HashSet;
// import java.util.List;
// import java.util.Optional;
// import java.util.stream.Collectors;

// @Service
// @AllArgsConstructor
// public class AuthService {
   
//     @Autowired
//     private JwtTokenProvider tokenProvider;

//     @Autowired
//     private UserRepository repo;

//     private AuthResponse createAuthResponse(Authentication authentication, User user) {
//         String accessToken = tokenProvider.generateAccessToken(authentication);
//         String refreshToken = tokenProvider.generateRefreshToken(user.getEmail());

//         return new AuthResponse(
//                 accessToken,
//                 user.getId(),
//                 user.getEmail(),
//                 user.getName()
//         );
//     }

//     public AuthResponse authenticateWithGoogle(String token) {
//         try {
//             // Validate the Google ID token
//             System.out.println("received token is "+token);
//             System.out.println("hello ");
//             System.out.println("validate is "+googleTokenValidator.validateToken(token));
//             var payload = googleTokenValidator.validateToken(token);
//             System.out.println("payload is "+payload);

//             String email = payload.getEmail();
//             String name = (String) payload.get("name");

//             System.out.println(email + " email to name " + name);

//             // Check if user exists or create a new one
//             Optional<User> user = repo.findByEmail(email);

//             System.out.println("is user present?? "+user.isPresent());

//             //if user is not present then create a new one
//             Set<Role> roles = new HashSet<>();
//         roles.add(Role.USER);
//             User user2;
//             if(!user.isPresent()){
               
//                 User newUser = new User();
//                 newUser.setEmail(email);
//                 newUser.setName(name);
//                 newUser.setRoles(roles); 
//                 repo.save(newUser);
//                 user2=newUser;
//             }
//             else{
//                 user2=user.get();
//             }

//             System.out.println("user2 is "+user2.getEmail());
            
//             UserDetails userDetails = new org.springframework.security.core.userdetails.User(
//                 user2.getEmail(),
//                 "",
//                 List.of(new SimpleGrantedAuthority("ROLE_USER")
//                 ));
//                 System.out.println("userDetails is done ");
                
//                 Authentication authentication = new UsernamePasswordAuthenticationToken(
//                     userDetails, null, userDetails.getAuthorities()
//                     );
                    
//                     System.out.println("authentication is set ");
//         // Step 4: Generate access and refresh tokens using JwtTokenProvider
//         String accessToken = tokenProvider.generateAccessToken(authentication);
//         String refreshToken = tokenProvider.generateRefreshToken(user2.getEmail());

//         // Step 5: Return the AuthResponse
//         return new AuthResponse(accessToken, user2.getId(), user2.getEmail(),user2.getName());
  
//         } catch (Exception e) {
//            System.out.println("Invalid Google token");
//         }
        
//         return null;
//     }


// }
