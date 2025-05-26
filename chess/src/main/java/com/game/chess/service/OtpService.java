package com.game.chess.service;



import com.game.chess.model.OtpEntity;
import com.game.chess.repo.OtpRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;

@Service
public class OtpService {

    @Autowired
    private OtpRepository otpRepository;

    @Value("${otp.validity.minutes}")
    private int otpValidityMinutes;

    public String generateOtp(String email) {
        String otp = String.format("%06d", new Random().nextInt(999999));

        OtpEntity otpEntity = new OtpEntity();
        otpEntity.setEmail(email);
        otpEntity.setOtp(otp);
        otpEntity.setExpiryTime(LocalDateTime.now().plusMinutes(otpValidityMinutes));

        otpRepository.save(otpEntity);

        return otp;
    }

    public boolean validateOtp(String email, String otp) {
        OtpEntity otpEntity = otpRepository.findTopByEmailOrderByExpiryTimeDesc(email)
                .orElse(null);

        if (otpEntity == null) {
            return false;
        }

        if(LocalDateTime.now().isAfter(otpEntity.getExpiryTime())){
            otpRepository.deleteById(otpEntity.getId());
            return false;
        }

        return !otpEntity.isUsed() &&
                otpEntity.getOtp().equals(otp) &&
                LocalDateTime.now().isBefore(otpEntity.getExpiryTime());
    }

    public void markOtpAsUsed(String email) {
        OtpEntity otpEntity = otpRepository.findTopByEmailOrderByExpiryTimeDesc(email)
                .orElse(null);
        if (otpEntity != null) {
            otpRepository.deleteById(otpEntity.getId());
        }


    }

}