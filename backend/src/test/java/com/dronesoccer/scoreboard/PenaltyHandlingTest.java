package com.dronesoccer.scoreboard;

import com.dronesoccer.scoreboard.engine.ArenaMatchEngine;
import com.dronesoccer.scoreboard.model.dto.ArenaStateDTO;
import com.dronesoccer.scoreboard.model.dto.MatchControlCommand;
import com.dronesoccer.scoreboard.repository.MatchRecordRepository;
import com.dronesoccer.scoreboard.repository.SetRecordRepository;
import com.dronesoccer.scoreboard.service.HardwareBuzzerService;
import com.dronesoccer.scoreboard.service.MatchAuditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

class PenaltyHandlingTest {

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
                30000L
        );
    }

    @Test
    void testAddPenaltyBeyondThree() {
        // Red penalties can be incremented beyond 3
        for (int i = 0; i < 7; i++) {
            engine.addPenalty(true, 1);
        }
        ArenaStateDTO dto = engine.toDTO();
        assertEquals(7, dto.getRedPenalties());
        assertTrue(dto.getRecentEvent().contains("Red Penalty +1 (Total: 7)"));

        // Blue penalties can also be incremented beyond 3
        for (int i = 0; i < 5; i++) {
            engine.addPenalty(false, 1);
        }
        dto = engine.toDTO();
        assertEquals(5, dto.getBluePenalties());
        assertTrue(dto.getRecentEvent().contains("Blue Penalty +1 (Total: 5)"));
    }

    @Test
    void testPenaltyDecrementStopsAtZero() {
        engine.addPenalty(true, 1);
        engine.addPenalty(true, -1);
        engine.addPenalty(true, -1); // should not drop below 0

        ArenaStateDTO dto = engine.toDTO();
        assertEquals(0, dto.getRedPenalties());
    }

    @Test
    void testSetPenaltyArbitraryNumber() {
        engine.setPenalty(true, 10);
        engine.setPenalty(false, 15);

        ArenaStateDTO dto = engine.toDTO();
        assertEquals(10, dto.getRedPenalties());
        assertEquals(15, dto.getBluePenalties());
    }

    @Test
    void testProcessCommandAddPenaltyBeyondThree() {
        MatchControlCommand addCmd = MatchControlCommand.builder()
                .type(MatchControlCommand.CommandType.ADD_RED_PENALTY)
                .arenaId(1L)
                .build();

        for (int i = 0; i < 6; i++) {
            engine.processCommand(addCmd);
        }

        ArenaStateDTO dto = engine.toDTO();
        assertEquals(6, dto.getRedPenalties());
    }
}
