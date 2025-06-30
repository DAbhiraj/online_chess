package com.game.chess.controller;





import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.game.chess.dto.LobbyCreationReq;
import com.game.chess.model.Lobby;
import com.game.chess.model.User;
import com.game.chess.service.LobbyService;
import com.game.chess.service.UserService;



@RestController
@RequestMapping("/api/lobby")
public class LobbyController {
    
    @Autowired
    LobbyService lobbyService;

    @Autowired
    UserService userService;

    @PostMapping("/create")
    public ResponseEntity<Lobby> createLobby(@RequestBody LobbyCreationReq lobbyCreationreq) {
        String lobbyName = lobbyCreationreq.getLobbyId();
        String ownerId = lobbyCreationreq.getOwnerId();
        Lobby lobby = lobbyService.createLobby(lobbyName, ownerId);
        return new ResponseEntity<>(lobby, HttpStatus.CREATED);
    }

    @PostMapping("/{lobbyId}/join/{userId}")
    public ResponseEntity<?> joinLobby(@PathVariable String lobbyId,@PathVariable String userId) {
        if (lobbyService.addPlayer(userId,lobbyId)) {
            return ResponseEntity.ok().build();
        }
        return new ResponseEntity<>("Failed to join lobby.", HttpStatus.BAD_REQUEST);
    }

    @DeleteMapping("/{lobbyId}/delete")
    public ResponseEntity<?> deleteLobby(@PathVariable String lobbyId) {
        lobbyService.deleteLobby(lobbyId);
        return new ResponseEntity<>("deleted lobby", HttpStatus.OK);
    }
    
    @PostMapping("/{lobbyId}/leave/{userId}")
    public ResponseEntity<?> leaveLobby(@PathVariable String lobbyId,@PathVariable String userId) {
        lobbyService.removePlayer(userId, lobbyId);
        return new ResponseEntity<>("left lobby", HttpStatus.OK);
    }
    
    @GetMapping("mylobby/{userId}")
    public ResponseEntity<?> lobbyByUserId(@PathVariable String userId) {
        User user = userService.getPlayer(userId);
        return new ResponseEntity<>(user.getLobbies(),HttpStatus.OK);
        
    }

    @GetMapping("{lobbyId}/players")
    public ResponseEntity<?> getPlayersFromLobby(@PathVariable String lobbyId) {
        return new ResponseEntity<>(lobbyService.getPlayersFromLobby(lobbyId),HttpStatus.OK);
    }
    


}
