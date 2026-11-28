package com.dronesoccer.scoreboard;

import com.dronesoccer.scoreboard.controller.ArenaCheckInRestController;
import com.dronesoccer.scoreboard.controller.ArenaCheckInRestController.CheckInRequest;
import com.dronesoccer.scoreboard.controller.ArenaCheckInRestController.StrikerRequest;
import com.dronesoccer.scoreboard.engine.ArenaManagerService;
import com.dronesoccer.scoreboard.engine.ArenaMatchEngine;
import com.dronesoccer.scoreboard.model.dto.ArenaCheckInDTO.Side;
import com.dronesoccer.scoreboard.model.dto.MatchControlCommand;
import com.dronesoccer.scoreboard.model.dto.TeamPlayerDTO;
import com.dronesoccer.scoreboard.model.entity.MatchRecord;
import com.dronesoccer.scoreboard.repository.MatchRecordRepository;
import com.dronesoccer.scoreboard.service.HardwareBuzzerService;
import com.dronesoccer.scoreboard.service.MatchAuditService;
import com.dronesoccer.scoreboard.service.TeamRosterService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
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
    private MatchAuditService audit;
    private MatchRecordRepository matches;
    private List<UUID> redIds;
    private List<UUID> blueIds;
    private UUID token;

    @BeforeEach
    void setUp() {
        audit = mock(MatchAuditService.class);
        matches = mock(MatchRecordRepository.class);
        arena = new ArenaMatchEngine(1L, "Arena 1", mock(SimpMessagingTemplate.class),
                mock(HardwareBuzzerService.class), matches, null, audit,
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

    @Test
    void creditsTheActiveStrikerAndKeepsEarlierCreditForARetriedGoal() {
        var red = controller.checkInTeam(1L, Side.RED, checkIn(redIds)).red().lineup();
        command(START_TIMER);
        command(ADD_RED_SCORE);
        var beforeSwitch = arena.toDTO();
        controller.changeStriker(1L, Side.RED, new StrikerRequest(token, red.version(), redIds.get(1)));
        command(ADD_RED_SCORE);

        var queuedGoal = MatchControlCommand.builder()
                .type(ADD_RED_SCORE)
                .commandId("queued-before-switch")
                .expectedMatchSessionId(beforeSwitch.getMatchSessionId())
                .observedStateVersion(beforeSwitch.getStateVersion())
                .build();
        arena.processCommand(queuedGoal);
        arena.processCommand(queuedGoal);
        command(SUB_RED_SCORE);

        List<JsonNode> goals = auditedScores("SCORE_RED_PLUS", 3);
        assertCredit(goals.get(0), redIds.get(0), 1);
        assertCredit(goals.get(1), redIds.get(1), 1);
        assertCredit(goals.get(2), redIds.get(0), 1);
        assertCredit(auditedScores("SCORE_RED_MINUS", 1).get(0), redIds.get(0), -1);
        assertEquals(2, arena.toDTO().getRedScore());

        when(matches.save(any(MatchRecord.class))).thenAnswer(invocation -> {
            MatchRecord saved = invocation.getArgument(0);
            saved.setId(42L);
            return saved;
        });
        command(CONFIRM_MATCH_END);
        verify(matches).save(argThat(match -> beforeSwitch.getMatchSessionId().equals(match.getMatchAuditKey())));

        arena.loadMatchDirect("Red Phoenix", "Blue Comets", "M-101", "Tournament");
        queuedGoal.setCommandId("unprocessed-tap-from-previous-match");
        arena.processCommand(queuedGoal);
        assertNotEquals(beforeSwitch.getMatchSessionId(), arena.toDTO().getMatchSessionId());
        assertEquals(0, arena.toDTO().getRedScore());
    }

    @Test
    void recordsUnattributedGoalsAndReversesCreditsOnScoreOverrides() {
        var red = controller.checkInTeam(1L, Side.RED, checkIn(redIds)).red().lineup();
        command(START_TIMER);
        command(ADD_BLUE_SCORE);
        command(ADD_RED_SCORE);
        controller.changeStriker(1L, Side.RED, new StrikerRequest(token, red.version(), redIds.get(1)));
        command(ADD_RED_SCORE);

        arena.processCommand(MatchControlCommand.builder().type(SET_RED_SCORE).intValue(4).build());
        arena.processCommand(MatchControlCommand.builder().type(SET_RED_SCORE).intValue(0).build());

        assertTrue(auditedScores("SCORE_BLUE_PLUS", 1).get(0).path("strikerCredits").isEmpty());
        List<JsonNode> overrides = auditedScores("SCORE_RED_SET", 2);
        assertTrue(overrides.get(0).path("strikerCredits").isEmpty());
        assertEquals(2, overrides.get(1).path("strikerCredits").size());
        assertCredit(overrides.get(1), redIds.get(0), -1);
        assertCredit(overrides.get(1), redIds.get(1), -1);
    }

    private List<JsonNode> auditedScores(String type, int count) {
        ArgumentCaptor<Object> payloads = ArgumentCaptor.forClass(Object.class);
        verify(audit, times(count)).logEvent(eq(1L), isNull(), eq(arena.toDTO().getMatchSessionId()), eq(type),
                anyString(), payloads.capture());
        ObjectMapper mapper = new ObjectMapper();
        return payloads.getAllValues().stream().<JsonNode>map(mapper::valueToTree).toList();
    }

    private void assertCredit(JsonNode score, UUID playerId, int goals) {
        for (JsonNode credit : score.path("strikerCredits")) {
            if (credit.path("playerId").asText().equals(playerId.toString())) {
                assertEquals(goals, credit.path("goals").asInt());
                return;
            }
        }
        fail("Missing credit for player " + playerId);
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
