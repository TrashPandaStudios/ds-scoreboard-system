package com.dronesoccer.scoreboard;

import com.dronesoccer.scoreboard.controller.ArenaCheckInRestController;
import com.dronesoccer.scoreboard.controller.ArenaCheckInRestController.CheckInRequest;
import com.dronesoccer.scoreboard.controller.ArenaCheckInRestController.StrikerRequest;
import com.dronesoccer.scoreboard.engine.ArenaManagerService;
import com.dronesoccer.scoreboard.engine.ArenaMatchEngine;
import com.dronesoccer.scoreboard.model.dto.ArenaCheckInDTO.Side;
import com.dronesoccer.scoreboard.model.dto.MatchControlCommand;
import com.dronesoccer.scoreboard.model.dto.TeamPlayerDTO;
import com.dronesoccer.scoreboard.service.HardwareBuzzerService;
import com.dronesoccer.scoreboard.service.MatchAuditService;
import com.dronesoccer.scoreboard.service.TeamRosterService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.IntStream;

import static com.dronesoccer.scoreboard.model.dto.MatchControlCommand.CommandType.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ArenaCheckInTest {
    private ArenaMatchEngine arena;
    private ArenaCheckInRestController controller;
    private TeamRosterService rosters;
    private List<UUID> redIds;
    private List<UUID> blueIds;
    private UUID token;

    @BeforeEach
    void setUp() {
        arena = new ArenaMatchEngine(1L, "Arena 1", mock(SimpMessagingTemplate.class),
                mock(HardwareBuzzerService.class), null, null, mock(MatchAuditService.class),
                180000, 60000, 90000, 30000);

        ArenaManagerService arenas = mock(ArenaManagerService.class);
        when(arenas.findArena(1L)).thenReturn(arena);
        rosters = mock(TeamRosterService.class);
        List<TeamPlayerDTO> red = players("Red");
        List<TeamPlayerDTO> blue = players("Blue");
        when(rosters.getPlayersForTeam("Red Phoenix")).thenReturn(red);
        when(rosters.getPlayersForTeam("Blue Comets")).thenReturn(blue);
        redIds = red.stream().map(TeamPlayerDTO::id).toList();
        blueIds = blue.stream().map(TeamPlayerDTO::id).toList();

        controller = new ArenaCheckInRestController(arenas, rosters);
        arena.loadMatchDirect("Red Phoenix", "Blue Comets", "M-101", "Tournament");
        token = arena.getCheckIn().matchToken();
    }

    @Test
    void confirmsEachTeamAndChangesStrikerWhileTheClockRuns() {
        assertEquals(6, controller.getCheckIn(1L, true).getBody().redRoster().size());
        var red = controller.checkInTeam(1L, Side.RED, checkIn(redIds));
        assertEquals(5, red.red().lineup().players().size());
        assertNull(red.blue().lineup());
        var both = controller.checkInTeam(1L, Side.BLUE, checkIn(blueIds));
        assertNotNull(both.blue().lineup());
        command(START_TIMER);
        command(ADD_RED_SCORE);

        var updated = controller.changeStriker(1L, Side.RED,
                new StrikerRequest(token, both.red().lineup().version(), redIds.get(1)));

        assertFalse(updated.canCheckIn());
        assertEquals(redIds.get(1), updated.red().lineup().strikerId());
        assertEquals(blueIds.get(0), updated.blue().lineup().strikerId());
        assertTrue(arena.isTimerRunning());
        assertEquals(1, arena.toDTO().getRedScore());
        assertTrue(controller.getCheckIn(1L, true).getBody().redRoster().isEmpty());
        command(NEXT_SET);
        assertEquals(redIds.get(1), arena.getCheckIn().red().lineup().strikerId());
    }

    @Test
    void rejectsLineupsOverFiveDuplicatesAndPlayersFromTheOtherTeam() {
        assertRejected(400, () -> controller.checkInTeam(1L, Side.RED,
                new CheckInRequest(token, null, redIds, redIds.get(0))));
        List<UUID> invalid = new ArrayList<>(redIds.subList(0, 5));
        invalid.set(4, redIds.get(0));
        assertRejected(400, () -> controller.checkInTeam(1L, Side.RED, checkIn(invalid)));
        invalid.set(4, blueIds.get(0));
        assertRejected(400, () -> controller.checkInTeam(1L, Side.RED, checkIn(invalid)));
        assertRejected(400, () -> controller.checkInTeam(1L, Side.RED,
                new CheckInRequest(token, null, redIds.subList(0, 5), redIds.get(5))));
        assertNull(arena.getCheckIn().red().lineup());
    }

    @Test
    void acceptsShortLineupsAndAllowsStrikerChangesWithinThem() {
        TeamPlayerDTO redPlayer = new TeamPlayerDTO(redIds.get(0), "Red Pilot 1");
        when(rosters.getPlayersForTeam("Red Phoenix")).thenReturn(List.of(redPlayer));
        var red = controller.checkInTeam(1L, Side.RED, checkIn(List.of(redPlayer.id()))).red().lineup();
        assertEquals(List.of(redPlayer), red.players());
        assertEquals(redPlayer.id(), red.strikerId());

        List<UUID> blueLineup = blueIds.subList(0, 4);
        var blue = controller.checkInTeam(1L, Side.BLUE, checkIn(blueLineup)).blue().lineup();
        assertEquals(blueLineup, blue.players().stream().map(TeamPlayerDTO::id).toList());
        command(START_TIMER);
        var updated = controller.changeStriker(1L, Side.BLUE,
                new StrikerRequest(token, blue.version(), blueIds.get(2)));
        assertEquals(blueIds.get(2), updated.blue().lineup().strikerId());
        assertTrue(arena.isTimerRunning());
    }

    @Test
    void recordsCheckInWithoutPlayersForAnEmptyRoster() {
        when(rosters.getPlayersForTeam("Red Phoenix")).thenReturn(List.of());
        var request = new CheckInRequest(token, null, List.of(), null);
        var red = controller.checkInTeam(1L, Side.RED, request).red().lineup();

        assertTrue(red.players().isEmpty());
        assertNull(red.strikerId());
        assertEquals(red, controller.getCheckIn(1L, true).getBody().match().red().lineup());
        assertRejected(409, () -> controller.checkInTeam(1L, Side.RED, request));
        assertNotNull(controller.checkInTeam(1L, Side.BLUE, checkIn(blueIds)).blue().lineup());
        command(START_TIMER);
        assertTrue(arena.isTimerRunning());
        assertRejected(409, () -> controller.changeStriker(1L, Side.RED,
                new StrikerRequest(token, red.version(), blueIds.get(0))));
    }

    @Test
    void requiresAtLeastOneFlyingPlayerWhenAnyPlayersAreRegistered() {
        var request = new CheckInRequest(token, null, List.of(), null);
        assertRejected(409, () -> controller.checkInTeam(1L, Side.RED, request));

        when(rosters.getPlayersForTeam("Red Phoenix"))
                .thenReturn(List.of(new TeamPlayerDTO(redIds.get(0), "Red Pilot 1")));
        assertRejected(409, () -> controller.checkInTeam(1L, Side.RED, request));
        assertNull(arena.getCheckIn().red().lineup());
    }

    @Test
    void startsWithoutCheckInAndClosesLineupEditingAfterTheClockStarts() {
        command(START_TIMER);
        assertTrue(arena.isTimerRunning());
        command(PAUSE_TIMER);
        command(NEXT_SET);
        assertRejected(409, () -> controller.checkInTeam(1L, Side.RED, checkIn(redIds)));
    }

    @Test
    void rejectsStaleUpdatesAndStrikersOutsideTheLineup() {
        var lineup = controller.checkInTeam(1L, Side.RED, checkIn(redIds)).red().lineup();
        assertRejected(409, () -> controller.checkInTeam(1L, Side.RED, checkIn(redIds)));
        command(START_COUNTDOWN);
        assertRejected(400, () -> controller.changeStriker(1L, Side.RED,
                new StrikerRequest(token, lineup.version(), redIds.get(5))));

        arena.loadMatchDirect("Red Phoenix", "Blue Comets", "M-101", "Tournament");
        assertNotEquals(token, arena.getCheckIn().matchToken());
        assertNull(arena.getCheckIn().red().lineup());
        assertRejected(409, () -> controller.checkInTeam(1L, Side.RED, checkIn(redIds)));
    }

    private void command(MatchControlCommand.CommandType type) {
        arena.processCommand(MatchControlCommand.builder().type(type).build());
    }

    private void assertRejected(int status, Runnable action) {
        assertEquals(status, assertThrows(ResponseStatusException.class, action::run).getStatusCode().value());
    }

    private CheckInRequest checkIn(List<UUID> ids) {
        return new CheckInRequest(token, null, ids.subList(0, Math.min(ids.size(), 5)), ids.get(0));
    }

    private List<TeamPlayerDTO> players(String side) {
        return IntStream.rangeClosed(1, 6)
                .mapToObj(number -> new TeamPlayerDTO(UUID.randomUUID(), side + " Pilot " + number)).toList();
    }
}
