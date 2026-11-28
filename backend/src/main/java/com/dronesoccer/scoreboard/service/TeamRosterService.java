package com.dronesoccer.scoreboard.service;

import com.dronesoccer.scoreboard.model.dto.TeamPlayerDTO;
import com.dronesoccer.scoreboard.model.entity.Team;
import com.dronesoccer.scoreboard.model.entity.TeamPlayer;
import com.dronesoccer.scoreboard.repository.TeamPlayerRepository;
import com.dronesoccer.scoreboard.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TeamRosterService {

    private final TeamPlayerRepository players;
    private final TeamRepository teams;

    @Transactional(readOnly = true)
    public List<TeamPlayerDTO> getPlayers(Long teamId) {
        requireTeam(teamId);
        return players.findByTeamIdOrderByNameAscIdAsc(teamId).stream().map(this::toDTO).toList();
    }

    public List<TeamPlayerDTO> getPlayersForTeam(String teamName) {
        return players.findByTeamNameIgnoreCaseOrderByNameAscIdAsc(teamName.trim()).stream().map(this::toDTO).toList();
    }

    @Transactional
    public TeamPlayerDTO addPlayer(Long teamId, String name) {
        return toDTO(players.save(new TeamPlayer(requireTeam(teamId), name.strip())));
    }

    @Transactional
    public TeamPlayerDTO renamePlayer(Long teamId, UUID playerId, String name) {
        TeamPlayer player = requirePlayer(teamId, playerId);
        player.setName(name.strip());
        return toDTO(player);
    }

    @Transactional
    public void removePlayer(Long teamId, UUID playerId) {
        players.delete(requirePlayer(teamId, playerId));
    }

    private Team requireTeam(Long teamId) {
        return teams.findById(teamId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found."));
    }

    private TeamPlayer requirePlayer(Long teamId, UUID playerId) {
        return players.findByIdAndTeamId(playerId, teamId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Player not found on this team."));
    }

    private TeamPlayerDTO toDTO(TeamPlayer player) {
        return new TeamPlayerDTO(player.getId(), player.getName());
    }
}
