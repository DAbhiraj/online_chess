package com.game.chess.service;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.game.chess.model.User;
import com.game.chess.repo.UserRepository;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;

    // @Autowired
    // private EmailService emailService;

    // @Autowired
    // private OtpService otpService;

    // @Autowired
    // private BCryptPasswordEncoder passwordEncoder;

    

    // public boolean verifyEmail(String email, String otp) {

    //     if (otpService.validateOtp(email, otp)) {
    //         User user = userRepository.findByEmail(email)
    //                 .orElseThrow(() -> new RuntimeException("User not found"));
           
    //         userRepository.save(user);
    //         otpService.markOtpAsUsed(email);

    //         return true;
    //     }
    //     return false;
    // }



    // public boolean verifyFpOtp(String email, String otp){
    //     if (!otpService.validateOtp(email, otp)) {
    //         User user = userRepository.findByEmail(email)
    //                 .orElseThrow(() -> new RuntimeException("User not found"));
            
    //         return false;
    //     }

    //     User user = userRepository.findByEmail(email)
    //             .orElseThrow(() -> new RuntimeException("User not found"));
       
    //     otpService.markOtpAsUsed(email);

    //     return true;
    // }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getPlayer(String playerId){
        Optional<User> useropt = userRepository.findByEmail(playerId);
        if(!useropt.isPresent()){
            throw new IllegalArgumentException("player not found with "+playerId);
        }
        User user = useropt.get();

        return user;
        
    }
}
