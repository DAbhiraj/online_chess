package com.game.chess.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.game.chess.dto.LobbyDto;
import com.game.chess.dto.PlayerDTO;
import com.game.chess.model.Lobby;
import com.game.chess.model.User;
import com.game.chess.repo.LobbyRepository;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;


@Service
public class LobbyService {

    @Autowired
    private LobbyRepository lobbyrepo;
    
    @Autowired
    private UserService userService;

    @Autowired
    private GameService gameService;

public boolean addPlayer(String playerId, String lobbyId) {
    User user = userService.getPlayer(playerId);
    Lobby lobby = getLobby(lobbyId);

    List<User> playersInLobby = lobby.getPlayers();

    if (playersInLobby == null) {
        playersInLobby = new ArrayList<>(); // initialize the list if it's null
    }

    if (playersInLobby.isEmpty() || (playersInLobby.size() < lobby.getMaxPlayers() && !playersInLobby.contains(user))) {
        playersInLobby.add(user);
        lobby.setPlayers(playersInLobby);
        lobbyrepo.save(lobby);
        System.out.println("saved new lobby with added player");
        return true;
    }

    return false;
}


    public Lobby getLobby(String lobbyId){
        Optional<Lobby> lobbyopt = lobbyrepo.findById(lobbyId);
        if(!lobbyopt.isPresent()){
            throw new IllegalArgumentException("lobby not found with "+lobbyId);
        }
        Lobby lobby = lobbyopt.get();
        return lobby;
    }

    public void removePlayer(String playerId,String lobbyId) {
        User user = userService.getPlayer(playerId);
        Lobby lobby = getLobby(lobbyId);
        if(lobby.getOwnerId()==playerId){
            throw new IllegalArgumentException("CANNOT DELETE OWNER"+playerId);
        }
        List<User> playersInLobby = lobby.getPlayers();
        playersInLobby.remove(user);

        lobbyrepo.save(lobby);
    }

    public Lobby createLobby(String lobbyName,String ownerId){
        Lobby lobby = new Lobby();
        lobby.setName(lobbyName);
        lobby.setOwnerId(ownerId);
        lobby.setLobbyId("Guest" + new Random().nextInt(9000) + 1000);
        lobbyrepo.save(lobby);
        addPlayer(ownerId, lobby.getLobbyId());
        return lobby;
        
    }

    @Transactional
    public void deleteLobby(String lobbyId){
        lobbyrepo.deleteById(lobbyId);   
    }

    public Optional<User> getRandomOpponentInLobby(String lobbyId, String currentUserId) {
        Lobby lobby = getLobby(lobbyId);
        List<User> players = lobby.getPlayers();
        Collections.shuffle(players); // randomize list

        for (User candidate : players) {
            String candidateId = candidate.getId().toString();
            if (!candidateId.equals(currentUserId)
                && !gameService.isUserInActiveGame(candidateId)) {
                return Optional.of(candidate);
            }
        }

        return Optional.empty(); 
    }


    public List<User> getPlayersFromLobby(String lobbyId) {
        Lobby lobby = getLobby(lobbyId);
        return lobby.getPlayers();
    }

    @Transactional
    public LobbyDto getLobbyDTO(String lobbyId) {
    Lobby lobby = lobbyrepo.findById(lobbyId).orElseThrow(()->new EntityNotFoundException("not found" + lobbyId));
    List<PlayerDTO> players = lobby.getPlayers().stream()
        .map(user -> new PlayerDTO(user.getId(), user.getEmail()))
        .collect(Collectors.toList());

    return new LobbyDto(lobby.getLobbyId(),lobby.getOwnerId(), players);
}



}
