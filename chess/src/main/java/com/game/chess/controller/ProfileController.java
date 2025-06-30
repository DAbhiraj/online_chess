package com.game.chess.controller;

import org.springframework.web.bind.annotation.RestController;

import com.game.chess.dto.UserProfileDto;
import com.game.chess.model.Game;
import com.game.chess.model.User;
import com.game.chess.repo.GameRepository;
import com.game.chess.service.UserService;

import lombok.extern.slf4j.Slf4j;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;



@RestController
@RequestMapping("/api/profile")
@Slf4j
public class ProfileController {
    
    @Autowired
    private UserService userService; 

    @Autowired
    private GameRepository gameRepository;

    @GetMapping("/{emailId}")
    public UserProfileDto getUserProfile(@PathVariable String emailId) {
        log.info("received "+emailId);
        User user = userService.getPlayer(emailId);
        log.info("got user");
        System.out.println(user.getMatchesPlayed()+" "+user.getEmail()+" "+user.getMatchesWon()+" "+user.getRating());
        UserProfileDto userProfileDto = new UserProfileDto(user.getMatchesPlayed(), user.getMatchesWon(), user.getMatchesLost(), user.getMatchesDrawn(), user.getRating());

        return userProfileDto;
    }

    @GetMapping("previous/{emailId}")
    public List<Game> getUserMatchesHistory(@PathVariable String emailId) {
        log.info("received "+emailId);
        List<Game> game = gameRepository.findByPlayer1IdOrPlayer2Id(emailId);
        return game;
    }

    
    
}
