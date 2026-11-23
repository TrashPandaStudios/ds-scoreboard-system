package com.dronesoccer.scoreboard;

import com.dronesoccer.scoreboard.config.PublicPortalProperties;
import com.dronesoccer.scoreboard.config.PublicPortalSecurity;
import com.dronesoccer.scoreboard.controller.PublicPortalRestController;
import com.dronesoccer.scoreboard.engine.ArenaManagerService;
import com.dronesoccer.scoreboard.engine.ArenaMatchEngine;
import com.dronesoccer.scoreboard.model.dto.ArenaStateDTO;
import com.dronesoccer.scoreboard.model.dto.ArenaSummaryDTO;
import com.dronesoccer.scoreboard.model.dto.MatchPhase;
import com.dronesoccer.scoreboard.model.dto.PublicScheduledMatchDTO;
import com.dronesoccer.scoreboard.model.entity.ScheduledMatch;
import com.dronesoccer.scoreboard.repository.MatchRecordRepository;
import com.dronesoccer.scoreboard.repository.SponsorItemRepository;
import com.dronesoccer.scoreboard.service.TeamLogoResolver;
import com.dronesoccer.scoreboard.service.TournamentQueueService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PublicPortalArenaEndpointsTest {

    private ArenaManagerService arenaManagerService;
    private MatchRecordRepository matchRecordRepository;
    private TournamentQueueService queueService;
    private SponsorItemRepository sponsorItemRepository;
    private TeamLogoResolver teamLogoResolver;
    private PublicPortalRestController controller;

    @BeforeEach
    void setUp() {
        arenaManagerService = mock(ArenaManagerService.class);
        matchRecordRepository = mock(MatchRecordRepository.class);
        queueService = mock(TournamentQueueService.class);
        sponsorItemRepository = mock(SponsorItemRepository.class);
        teamLogoResolver = mock(TeamLogoResolver.class);

        PublicPortalProperties properties = new PublicPortalProperties();
        PublicPortalSecurity security = new PublicPortalSecurity(properties);

        controller = new PublicPortalRestController(
                arenaManagerService,
                matchRecordRepository,
                queueService,
                sponsorItemRepository,
                teamLogoResolver,
                security,
                properties
        );
    }

    private ArenaMatchEngine mockArena(long arenaId, String arenaName, String matchNumber, String red, String blue) {
        ArenaMatchEngine engine = mock(ArenaMatchEngine.class);
        ArenaStateDTO state = ArenaStateDTO.builder()
                .arenaId(arenaId)
                .arenaName(arenaName)
                .matchNumber(matchNumber)
                .tournamentName("National Championship")
                .teamRed(red)
                .teamBlue(blue)
                .redScore(3)
                .blueScore(2)
                .redSetScore(1)
                .blueSetScore(0)
                .currentSet(2)
                .maxSets(3)
                .timeRemainingMs(95000L)
                .totalSetDurationMs(180000L)
                .timerRunning(true)
                .phase(MatchPhase.NORMAL_PHASE)
                .completedSets(List.of())
                .build();
        when(engine.toDTO()).thenReturn(state);
        return engine;
    }

    @Test
    @SuppressWarnings("unchecked")
    void testPublicArenaDetailCurrentNextAndUpcomingEndpoints() {
        ArenaMatchEngine engine = mockArena(1L, "Arena 1 - Alpha", "M-101", "Red Phoenix", "Blue Comets");
        when(arenaManagerService.findArena(1L)).thenReturn(engine);

        ScheduledMatch duplicateActive = ScheduledMatch.builder()
                .id(1L).arenaId(1L).matchNumber("M-101").teamRed("Red Phoenix").teamBlue("Blue Comets")
                .status("SCHEDULED").orderIndex(0).scheduledTime(LocalDateTime.of(2026, 11, 23, 10, 0)).build();
        ScheduledMatch next = ScheduledMatch.builder()
                .id(2L).arenaId(1L).matchNumber("M-102").teamRed("Solar Flares").teamBlue("Apex Predators")
                .status("SCHEDULED").orderIndex(1).scheduledTime(LocalDateTime.of(2026, 11, 23, 10, 20)).build();
        ScheduledMatch third = ScheduledMatch.builder()
                .id(3L).arenaId(1L).matchNumber("M-103").teamRed("Hyperion").teamBlue("Titanium Wings")
                .status("SCHEDULED").orderIndex(2).scheduledTime(LocalDateTime.of(2026, 11, 23, 10, 40)).build();
        ScheduledMatch fourth = ScheduledMatch.builder()
                .id(4L).arenaId(1L).matchNumber("M-104").teamRed("Velocity").teamBlue("Skyline")
                .status("SCHEDULED").orderIndex(3).scheduledTime(LocalDateTime.of(2026, 11, 23, 11, 0)).build();

        when(queueService.getPendingMatchesForArena(1L)).thenReturn(List.of(duplicateActive, next, third, fourth));
        when(matchRecordRepository.findByArenaIdOrderByCreatedAtDesc(1L)).thenReturn(List.of());
        when(sponsorItemRepository.findByActiveTrueOrderByOrderIndexAsc()).thenReturn(List.of());
        when(teamLogoResolver.resolveLogoUrl("Solar Flares")).thenReturn("/api/teams/logos/solar.png");
        when(teamLogoResolver.resolveLogoUrl("Apex Predators")).thenReturn("/api/teams/logos/apex.png");

        // 1) Full arena detail includes currentMatch, nextMatch (deduped from active), upcomingMatches with logos
        ResponseEntity<Map<String, Object>> detailRes = controller.getPublicArenaDetail(1L, null);
        assertEquals(HttpStatus.OK, detailRes.getStatusCode());
        Map<String, Object> detailBody = detailRes.getBody();
        assertNotNull(detailBody);
        assertSame(detailBody.get("arena"), detailBody.get("currentMatch"));

        PublicScheduledMatchDTO nextDto = (PublicScheduledMatchDTO) detailBody.get("nextMatch");
        assertNotNull(nextDto);
        assertEquals("M-102", nextDto.getMatchNumber());
        assertEquals(1, nextDto.getQueuePosition());
        assertTrue(nextDto.isNext());
        assertEquals("/api/teams/logos/solar.png", nextDto.getTeamRedLogoUrl());
        assertEquals("/api/teams/logos/apex.png", nextDto.getTeamBlueLogoUrl());

        List<PublicScheduledMatchDTO> upcoming = (List<PublicScheduledMatchDTO>) detailBody.get("upcomingMatches");
        assertEquals(3, upcoming.size());
        assertEquals(3, detailBody.get("upcomingCount"));
        assertEquals("M-103", upcoming.get(1).getMatchNumber());
        assertEquals(2, upcoming.get(1).getQueuePosition());
        assertFalse(upcoming.get(1).isNext());

        // 2) Current match endpoint
        ResponseEntity<Map<String, Object>> currentRes = controller.getPublicArenaCurrentMatch(1L);
        assertEquals(HttpStatus.OK, currentRes.getStatusCode());
        assertNotNull(currentRes.getBody());
        assertEquals(1L, currentRes.getBody().get("arenaId"));
        ArenaStateDTO currentMatch = (ArenaStateDTO) currentRes.getBody().get("currentMatch");
        assertEquals("M-101", currentMatch.getMatchNumber());

        // 3) Next match endpoint
        ResponseEntity<Map<String, Object>> nextRes = controller.getPublicArenaNextMatch(1L);
        assertEquals(HttpStatus.OK, nextRes.getStatusCode());
        assertNotNull(nextRes.getBody());
        assertEquals(Boolean.TRUE, nextRes.getBody().get("hasNextMatch"));
        assertEquals("M-102", ((PublicScheduledMatchDTO) nextRes.getBody().get("nextMatch")).getMatchNumber());

        // 4) Upcoming endpoint with includeNext=false & limit=1
        ResponseEntity<Map<String, Object>> upcomingRes = controller.getPublicArenaUpcomingMatches(1L, 1, false);
        assertEquals(HttpStatus.OK, upcomingRes.getStatusCode());
        assertNotNull(upcomingRes.getBody());
        List<PublicScheduledMatchDTO> filtered = (List<PublicScheduledMatchDTO>) upcomingRes.getBody().get("upcomingMatches");
        assertEquals(1, filtered.size());
        assertEquals("M-103", filtered.get(0).getMatchNumber());
        assertEquals(3, upcomingRes.getBody().get("totalUpcoming"));
    }

    @Test
    @SuppressWarnings("unchecked")
    void testPublicArenasListAndNotFoundHandling() {
        ArenaMatchEngine engine = mockArena(2L, "Arena 2 - Bravo", "M-201", "Team A", "Team B");
        ArenaSummaryDTO summary = ArenaSummaryDTO.builder()
                .arenaId(2L).arenaName("Arena 2 - Bravo").matchNumber("M-201")
                .teamRed("Team A").teamBlue("Team B").phase(MatchPhase.IDLE).build();
        when(arenaManagerService.getAllSummaries()).thenReturn(List.of(summary));
        when(arenaManagerService.findArena(2L)).thenReturn(engine);
        when(queueService.getPendingMatchesForArena(2L)).thenReturn(List.of());

        ResponseEntity<Map<String, Object>> listRes = controller.getPublicArenas();
        assertEquals(HttpStatus.OK, listRes.getStatusCode());
        List<Map<String, Object>> arenas = (List<Map<String, Object>>) listRes.getBody().get("arenas");
        assertEquals(1, arenas.size());
        assertEquals(2L, arenas.get(0).get("arenaId"));
        assertNull(arenas.get(0).get("nextMatch"));
        assertEquals(0, arenas.get(0).get("upcomingCount"));

        // Unknown arena returns 404 on all arena-scoped endpoints
        when(arenaManagerService.findArena(99L)).thenReturn(null);
        assertEquals(HttpStatus.NOT_FOUND, controller.getPublicArenaDetail(99L, null).getStatusCode());
        assertEquals(HttpStatus.NOT_FOUND, controller.getPublicArenaCurrentMatch(99L).getStatusCode());
        assertEquals(HttpStatus.NOT_FOUND, controller.getPublicArenaNextMatch(99L).getStatusCode());
        assertEquals(HttpStatus.NOT_FOUND, controller.getPublicArenaUpcomingMatches(99L, null, true).getStatusCode());
    }
}
