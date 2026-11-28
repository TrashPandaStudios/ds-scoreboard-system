package com.dronesoccer.scoreboard.controller;

import com.dronesoccer.scoreboard.engine.ArenaManagerService;
import com.dronesoccer.scoreboard.engine.ArenaMatchEngine;
import com.dronesoccer.scoreboard.model.dto.ArenaCheckInDTO;
import com.dronesoccer.scoreboard.model.dto.ArenaCheckInDTO.Side;
import com.dronesoccer.scoreboard.model.dto.TeamPlayerDTO;
import com.dronesoccer.scoreboard.service.TeamRosterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/arenas/{arenaId}/check-in")
@RequiredArgsConstructor
public class ArenaCheckInRestController {

    private static final int MAX_LINEUP_SIZE = 5;

    private final ArenaManagerService arenas;
    private final TeamRosterService rosters;

    @GetMapping
    public ResponseEntity<CheckInView> getCheckIn(@PathVariable Long arenaId,
            @RequestParam(defaultValue = "true") boolean includeRosters) {
        ArenaCheckInDTO match = requireArena(arenaId).getCheckIn();
        boolean showRosters = includeRosters && match.canCheckIn();
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(new CheckInView(
                match,
                showRosters ? rosters.getPlayersForTeam(match.red().name()) : List.of(),
                showRosters ? rosters.getPlayersForTeam(match.blue().name()) : List.of()));
    }

    @PutMapping("/{side}")
    public ArenaCheckInDTO checkInTeam(@PathVariable Long arenaId, @PathVariable Side side,
                                      @RequestBody CheckInRequest request) {
        ArenaMatchEngine arena = requireArena(arenaId);
        ArenaCheckInDTO match = arena.getCheckIn();
        if (match.matchToken() == null || !match.matchToken().equals(request.matchToken())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The match or its teams changed. Review the current match.");
        }
        List<UUID> requestedIds = request.playerIds();
        if (requestedIds == null || requestedIds.size() > MAX_LINEUP_SIZE) {
            throw invalidLineup();
        }
        List<TeamPlayerDTO> roster = rosters.getPlayersForTeam(match.team(side).name());
        if (requestedIds.isEmpty()) {
            if (request.strikerId() != null) {
                throw invalidLineup();
            }
            if (!roster.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "This team has registered players. Select at least one flying player and a striker.");
            }
            return arena.checkInTeam(request.matchToken(), side, request.lineupVersion(), List.of(), null);
        }
        Set<UUID> playerIds = new HashSet<>(requestedIds);
        List<TeamPlayerDTO> players = roster.stream()
                .filter(player -> playerIds.contains(player.id()))
                .toList();
        if (players.size() != requestedIds.size()) {
            throw invalidLineup();
        }
        return arena.checkInTeam(request.matchToken(), side, request.lineupVersion(), players, request.strikerId());
    }

    @PutMapping("/{side}/striker")
    public ArenaCheckInDTO changeStriker(@PathVariable Long arenaId, @PathVariable Side side,
                                        @RequestBody StrikerRequest request) {
        return requireArena(arenaId).changeStriker(request.matchToken(), side, request.lineupVersion(),
                request.strikerId());
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleCheckInError(ResponseStatusException error) {
        return ResponseEntity.status(error.getStatusCode()).body(Map.of("error", error.getReason()));
    }

    private ArenaMatchEngine requireArena(Long arenaId) {
        ArenaMatchEngine arena = arenas.findArena(arenaId);
        if (arena == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Arena not found.");
        }
        return arena;
    }

    private ResponseStatusException invalidLineup() {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose one to five different registered players from this team.");
    }

    public record CheckInView(ArenaCheckInDTO match, List<TeamPlayerDTO> redRoster, List<TeamPlayerDTO> blueRoster) {
    }

    public record CheckInRequest(UUID matchToken, UUID lineupVersion, List<UUID> playerIds, UUID strikerId) {
    }

    public record StrikerRequest(UUID matchToken, UUID lineupVersion, UUID strikerId) {
    }
}
