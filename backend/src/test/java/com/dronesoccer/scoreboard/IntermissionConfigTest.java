package com.dronesoccer.scoreboard;

import com.dronesoccer.scoreboard.engine.ArenaMatchEngine;
import com.dronesoccer.scoreboard.model.dto.ArenaStateDTO;
import com.dronesoccer.scoreboard.model.dto.MatchControlCommand;
import com.dronesoccer.scoreboard.model.dto.MatchPhase;
import com.dronesoccer.scoreboard.repository.MatchRecordRepository;
import com.dronesoccer.scoreboard.repository.SetRecordRepository;
import com.dronesoccer.scoreboard.service.HardwareBuzzerService;
import com.dronesoccer.scoreboard.service.MatchAuditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

class IntermissionConfigTest {

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
    void testInitialIntermissionDuration() {
        assertEquals(90000L, engine.getIntermissionDurationMs());
        ArenaStateDTO dto = engine.toDTO();
        assertEquals(90000L, dto.getIntermissionDurationMs());
    }

    @Test
    void testSetIntermissionDurationDirectly() {
        engine.setIntermissionDurationMs(120000L, false);
        assertEquals(120000L, engine.getIntermissionDurationMs());
        assertEquals(120000L, engine.toDTO().getIntermissionDurationMs());
    }

    @Test
    void testSetIntermissionDurationViaCommand() {
        MatchControlCommand cmd = MatchControlCommand.builder()
                .type(MatchControlCommand.CommandType.SET_INTERMISSION_DURATION)
                .arenaId(1L)
                .longValue(75000L)
                .build();
        engine.processCommand(cmd);

        assertEquals(75000L, engine.getIntermissionDurationMs());
        assertEquals(75000L, engine.toDTO().getIntermissionDurationMs());
    }

    @Test
    void testPhaseIntermissionUsesConfiguredDuration() {
        engine.setIntermissionDurationMs(45000L, true);
        engine.startIntermission();

        ArenaStateDTO dto = engine.toDTO();
        assertEquals(MatchPhase.INTERMISSION, dto.getPhase());
        assertEquals(45000L, dto.getTotalSetDurationMs());
        assertTrue(dto.getTimeRemainingMs() <= 45000L && dto.getTimeRemainingMs() > 0);
    }

    @Test
    void testAwardSetStartsIntermissionWithConfiguredDuration() {
        engine.setIntermissionDurationMs(60000L, false);
        // Award set to RED - under ADR 0003, holds in IDLE with winner banner
        engine.awardSet("RED");
        assertEquals(MatchPhase.IDLE, engine.toDTO().getPhase());

        // Referee starts intermission break
        engine.startIntermission();

        ArenaStateDTO dto = engine.toDTO();
        assertEquals(MatchPhase.INTERMISSION, dto.getPhase());
        assertEquals(60000L, dto.getTotalSetDurationMs());
        assertEquals(60000L, dto.getIntermissionDurationMs());
    }
}
