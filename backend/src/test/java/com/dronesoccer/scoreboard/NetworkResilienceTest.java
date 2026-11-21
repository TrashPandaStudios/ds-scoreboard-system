package com.dronesoccer.scoreboard;

import com.dronesoccer.scoreboard.engine.ArenaMatchEngine;
import com.dronesoccer.scoreboard.model.dto.ArenaStateDTO;
import com.dronesoccer.scoreboard.model.dto.MatchControlCommand;
import com.dronesoccer.scoreboard.model.dto.MatchPhase;
import com.dronesoccer.scoreboard.model.dto.ScoreOverrideRequest;
import com.dronesoccer.scoreboard.model.dto.TimerControlRequest;
import com.dronesoccer.scoreboard.repository.MatchRecordRepository;
import com.dronesoccer.scoreboard.repository.SetRecordRepository;
import com.dronesoccer.scoreboard.service.HardwareBuzzerService;
import com.dronesoccer.scoreboard.service.MatchAuditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class NetworkResilienceTest {

    private SimpMessagingTemplate messagingTemplate;
    private HardwareBuzzerService buzzerService;
    private MatchRecordRepository matchRecordRepository;
    private SetRecordRepository setRecordRepository;
    private MatchAuditService auditService;
    private ArenaMatchEngine engine;

    @BeforeEach
    void setUp() {
        messagingTemplate = mock(SimpMessagingTemplate.class);
        buzzerService = mock(HardwareBuzzerService.class);
        matchRecordRepository = mock(MatchRecordRepository.class);
        setRecordRepository = mock(SetRecordRepository.class);
        auditService = mock(MatchAuditService.class);

        engine = new ArenaMatchEngine(
                1L,
                "Arena 1 - Test",
                messagingTemplate,
                buzzerService,
                matchRecordRepository,
                setRecordRepository,
                auditService,
                180000L,
                60000L,
                90000L,
                30000L,
                2000L,
                5000L
        );
    }

    @Test
    void testDuplicateCommandIdIsIdempotent() {
        long initialVersion = engine.toDTO().getStateVersion();

        MatchControlCommand cmd = MatchControlCommand.builder()
                .type(MatchControlCommand.CommandType.ADD_RED_SCORE)
                .arenaId(1L)
                .commandId("phone-cmd-001")
                .build();

        // Simulate wireless retry sending the exact same command 3 times (e.g. WS + HTTP fallback)
        engine.processCommand(cmd);
        engine.processCommand(cmd);
        engine.processCommand(cmd);

        ArenaStateDTO state = engine.toDTO();
        assertEquals(1, state.getRedScore(), "Retried command with same commandId must only apply once");
        assertEquals(initialVersion + 1, state.getStateVersion(), "stateVersion should only increment once");
        verify(messagingTemplate, times(1)).convertAndSend(eq("/topic/arena/1/state"), any(ArenaStateDTO.class));
    }

    @Test
    void testDistinctCommandIdsAllApply() {
        engine.processCommand(MatchControlCommand.builder()
                .type(MatchControlCommand.CommandType.ADD_BLUE_SCORE)
                .arenaId(1L)
                .commandId("cmd-a")
                .build());
        engine.processCommand(MatchControlCommand.builder()
                .type(MatchControlCommand.CommandType.ADD_BLUE_SCORE)
                .arenaId(1L)
                .commandId("cmd-b")
                .build());

        assertEquals(2, engine.toDTO().getBlueScore());
        verify(messagingTemplate, times(2)).convertAndSend(eq("/topic/arena/1/state"), any(ArenaStateDTO.class));
    }

    @Test
    void testTickThrottlesRedundantBroadcasts() {
        // First tick broadcasts initial heartbeat; subsequent rapid ticks within heartbeat window must NOT spam WS
        for (int i = 0; i < 20; i++) {
            engine.tick();
        }
        verify(messagingTemplate, times(1)).convertAndSend(eq("/topic/arena/1/state"), any(ArenaStateDTO.class));
    }

    @Test
    void testScoreOverrideAndTimerControlBumpVersionAndBroadcast() {
        long v0 = engine.toDTO().getStateVersion();

        ScoreOverrideRequest scoreReq = new ScoreOverrideRequest();
        scoreReq.setRedScore(7);
        scoreReq.setBlueScore(4);
        engine.applyScoreOverride(scoreReq);

        ArenaStateDTO afterScore = engine.toDTO();
        assertEquals(7, afterScore.getRedScore());
        assertEquals(4, afterScore.getBlueScore());
        assertEquals(v0 + 1, afterScore.getStateVersion());

        TimerControlRequest timerReq = new TimerControlRequest();
        timerReq.setExactMs(45000L);
        timerReq.setPhase(MatchPhase.NORMAL_PHASE);
        engine.applyTimerControl(timerReq);

        ArenaStateDTO afterTimer = engine.toDTO();
        assertEquals(45000L, afterTimer.getTimeRemainingMs());
        assertEquals(v0 + 2, afterTimer.getStateVersion());

        verify(messagingTemplate, times(2)).convertAndSend(eq("/topic/arena/1/state"), any(ArenaStateDTO.class));
    }

    @Test
    void testEmergencyPauseAndResumeBroadcastImmediately() {
        engine.processCommand(MatchControlCommand.builder()
                .type(MatchControlCommand.CommandType.START_TIMER)
                .arenaId(1L)
                .build());
        assertTrue(engine.isTimerRunning());

        assertTrue(engine.emergencyPause());
        assertFalse(engine.isTimerRunning());
        assertFalse(engine.emergencyPause(), "Second pause while already paused should be a no-op");

        assertTrue(engine.emergencyResume());
        assertTrue(engine.isTimerRunning());
    }

    @Test
    void testStaleOfflineCommandFromPreviousSetOrMatchIsRejected() {
        engine.loadMatchDirect("Red Alpha", "Blue Beta", "M-201", "Finals");
        assertEquals(1, engine.toDTO().getCurrentSet());

        // Advance to Set 2
        engine.processCommand(MatchControlCommand.builder()
                .type(MatchControlCommand.CommandType.NEXT_SET)
                .arenaId(1L)
                .commandId("cmd-next-set")
                .build());
        assertEquals(2, engine.toDTO().getCurrentSet());

        long versionInSet2 = engine.toDTO().getStateVersion();

        // Delayed offline score tap from Set 1 arrives late -> must be ignored
        engine.processCommand(MatchControlCommand.builder()
                .type(MatchControlCommand.CommandType.ADD_RED_SCORE)
                .arenaId(1L)
                .commandId("cmd-stale-set1")
                .expectedMatchNumber("M-201")
                .expectedSet(1)
                .build());

        // Delayed offline score tap from previous match M-200 -> must be ignored
        engine.processCommand(MatchControlCommand.builder()
                .type(MatchControlCommand.CommandType.ADD_BLUE_SCORE)
                .arenaId(1L)
                .commandId("cmd-stale-match200")
                .expectedMatchNumber("M-200")
                .expectedSet(2)
                .build());

        ArenaStateDTO state = engine.toDTO();
        assertEquals(0, state.getRedScore());
        assertEquals(0, state.getBlueScore());
        assertEquals(versionInSet2, state.getStateVersion());

        // Valid Set 2 command with matching matchNumber and set applies cleanly and reports lastCommandId
        engine.processCommand(MatchControlCommand.builder()
                .type(MatchControlCommand.CommandType.ADD_RED_SCORE)
                .arenaId(1L)
                .commandId("cmd-valid-set2")
                .expectedMatchNumber("M-201")
                .expectedSet(2)
                .build());

        ArenaStateDTO updated = engine.toDTO();
        assertEquals(1, updated.getRedScore());
        assertEquals("cmd-valid-set2", updated.getLastCommandId());
        assertEquals(versionInSet2 + 1, updated.getStateVersion());
    }
}
