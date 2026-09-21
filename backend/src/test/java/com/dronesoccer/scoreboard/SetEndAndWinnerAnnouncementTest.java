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

class SetEndAndWinnerAnnouncementTest {

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
    void testAwardSetCreatesWinnerBannerWithoutAutoStartingIntermission() {
        // Red scores 5, Blue scores 2 in Set 1
        engine.addScore(true, 5);
        engine.addScore(false, 2);

        // Award Set 1 to Red
        engine.awardSet("RED");

        ArenaStateDTO state = engine.toDTO();
        assertNotNull(state.getSetWinnerBanner());
        assertTrue(state.getSetWinnerBanner().isActive());
        assertEquals("RED", state.getSetWinnerBanner().getWinner());
        assertEquals(1, state.getSetWinnerBanner().getSetsWon());
        assertEquals(1, state.getSetWinnerBanner().getCurrentSet());
        assertFalse(state.getSetWinnerBanner().isMatchWinner());
        assertEquals(MatchPhase.IDLE, state.getPhase()); // Does not auto-start intermission!

        // Now referee triggers startIntermission()
        engine.startIntermission();
        ArenaStateDTO intermissionState = engine.toDTO();
        assertNull(intermissionState.getSetWinnerBanner()); // Banner dismissed
        assertEquals(MatchPhase.INTERMISSION, intermissionState.getPhase());
        assertEquals(2, intermissionState.getCurrentSet()); // Advanced to Set 2
        assertEquals(0, intermissionState.getRedScore());  // Reset live score
        assertEquals(0, intermissionState.getBlueScore());
    }

    @Test
    void testMatchWinnerClinchedOnThreshold() {
        // Set 1: Red wins
        engine.awardSet("RED");
        engine.startIntermission();

        // Set 2: Red wins again (2 sets in best-of-3 clinches match)
        engine.awardSet("RED");

        ArenaStateDTO state = engine.toDTO();
        assertNotNull(state.getSetWinnerBanner());
        assertTrue(state.getSetWinnerBanner().isActive());
        assertTrue(state.getSetWinnerBanner().isMatchWinner());
        assertEquals("RED", state.getSetWinnerBanner().getWinner());
        assertEquals(2, state.getSetWinnerBanner().getSetsWon());
        assertEquals(MatchPhase.MATCH_ENDED, state.getPhase());
        assertEquals("RED", state.getMatchWinner());
    }

    @Test
    void testSuddenDeathFirstGoalWinsSet() {
        // Set 1: Tied 4-4
        engine.addScore(true, 4);
        engine.addScore(false, 4);

        // Referee starts sudden death
        engine.startSuddenDeath();

        ArenaStateDTO suddenDeathState = engine.toDTO();
        assertEquals(MatchPhase.SUDDEN_DEATH, suddenDeathState.getPhase());
        assertTrue(suddenDeathState.isTimerRunning());

        // Blue scores sudden death golden goal!
        engine.addScore(false, 1);

        ArenaStateDTO awardedState = engine.toDTO();
        assertNotNull(awardedState.getSetWinnerBanner());
        assertEquals("BLUE", awardedState.getSetWinnerBanner().getWinner());
        assertEquals(1, awardedState.getSetWinnerBanner().getSetsWon());
        assertEquals(1, awardedState.getBlueSetScore());
    }

    @Test
    void testDismissWinnerBannerCommand() {
        engine.awardSet("BLUE");
        assertTrue(engine.toDTO().getSetWinnerBanner().isActive());

        MatchControlCommand dismissCmd = MatchControlCommand.builder()
                .type(MatchControlCommand.CommandType.DISMISS_WINNER_BANNER)
                .arenaId(1L)
                .build();
        engine.processCommand(dismissCmd);

        assertNull(engine.toDTO().getSetWinnerBanner());
    }
}
