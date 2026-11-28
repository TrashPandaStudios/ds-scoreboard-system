package com.dronesoccer.scoreboard.controller;

import com.dronesoccer.scoreboard.model.dto.TeamPlayerDTO;
import com.dronesoccer.scoreboard.service.TeamRosterService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/teams/{teamId}/players")
@RequiredArgsConstructor
public class TeamRosterRestController {

    private final TeamRosterService rosterService;

    @GetMapping
    public ResponseEntity<List<TeamPlayerDTO>> getPlayers(@PathVariable Long teamId) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(rosterService.getPlayers(teamId));
    }

    @PostMapping
    public TeamPlayerDTO addPlayer(@PathVariable Long teamId, @Valid @RequestBody PlayerName request) {
        return rosterService.addPlayer(teamId, request.name());
    }

    @PutMapping("/{playerId}")
    public TeamPlayerDTO renamePlayer(@PathVariable Long teamId, @PathVariable UUID playerId,
                                     @Valid @RequestBody PlayerName request) {
        return rosterService.renamePlayer(teamId, playerId, request.name());
    }

    @DeleteMapping("/{playerId}")
    public ResponseEntity<Void> removePlayer(@PathVariable Long teamId, @PathVariable UUID playerId) {
        rosterService.removePlayer(teamId, playerId);
        return ResponseEntity.noContent().build();
    }

    public record PlayerName(@NotBlank @Size(max = 120) String name) {
    }
}
