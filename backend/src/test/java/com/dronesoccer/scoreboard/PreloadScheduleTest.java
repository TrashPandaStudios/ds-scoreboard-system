package com.dronesoccer.scoreboard;

import com.dronesoccer.scoreboard.engine.ArenaManagerService;
import com.dronesoccer.scoreboard.engine.ArenaMatchEngine;
import com.dronesoccer.scoreboard.model.dto.MatchScheduleRequest;
import com.dronesoccer.scoreboard.model.dto.PreloadResultDTO;
import com.dronesoccer.scoreboard.model.dto.PreloadScheduleRequest;
import com.dronesoccer.scoreboard.model.entity.ScheduledMatch;
import com.dronesoccer.scoreboard.repository.ScheduledMatchRepository;
import com.dronesoccer.scoreboard.service.TournamentQueueService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import com.dronesoccer.scoreboard.service.TeamService;
import static org.mockito.Mockito.*;

class PreloadScheduleTest {

    private ScheduledMatchRepository scheduledMatchRepository;
    private ArenaManagerService arenaManagerService;
    private TeamService teamService;
    private TournamentQueueService queueService;

    @BeforeEach
    void setUp() {
        scheduledMatchRepository = mock(ScheduledMatchRepository.class);
        arenaManagerService = mock(ArenaManagerService.class);
        teamService = mock(TeamService.class);
        queueService = new TournamentQueueService(scheduledMatchRepository, arenaManagerService, teamService);
    }

    @Test
    void testParseCsvSchedule() {
        String csv = """
Match,Cage,Red Team,Blue Team,Time,Tournament
M-101,1,"Red Phoenix","Blue Comets",09:00,World Drone Soccer Championship
M-102,Cage 2,Thunder Hawks,Cyber Vipers,09:15,World Drone Soccer Championship
M-103,Arena 3,Nova Strikers,Shadow Drones,09:30,World Drone Soccer Championship
""";

        List<MatchScheduleRequest> matches = queueService.parseCsvSchedule(csv, "Default Tourney");

        assertEquals(3, matches.size());
        assertEquals("M-101", matches.get(0).getMatchNumber());
        assertEquals(1L, matches.get(0).getArenaId());
        assertEquals("Red Phoenix", matches.get(0).getTeamRed());
        assertEquals("Blue Comets", matches.get(0).getTeamBlue());

        assertEquals("M-102", matches.get(1).getMatchNumber());
        assertEquals(2L, matches.get(1).getArenaId());
        assertEquals("Thunder Hawks", matches.get(1).getTeamRed());
        assertEquals("Cyber Vipers", matches.get(1).getTeamBlue());

        assertEquals("M-103", matches.get(2).getMatchNumber());
        assertEquals(3L, matches.get(2).getArenaId());
        assertEquals("Nova Strikers", matches.get(2).getTeamRed());
        assertEquals("Shadow Drones", matches.get(2).getTeamBlue());
    }

    @Test
    void testPreloadMatchesWithAutoLoadArenas() {
        String csv = """
Match,Cage,Red Team,Blue Team
M-1,1,Alpha Team,Bravo Team
M-2,2,Charlie Team,Delta Team
M-3,1,Echo Team,Foxtrot Team
""";

        PreloadScheduleRequest req = PreloadScheduleRequest.builder()
                .csvContent(csv)
                .clearExisting(true)
                .autoLoadArenas(true)
                .defaultTournamentName("Drone Soccer Cup")
                .build();

        when(scheduledMatchRepository.saveAll(any())).thenAnswer(invocation -> {
            List<ScheduledMatch> list = invocation.getArgument(0);
            for (long i = 0; i < list.size(); i++) {
                list.get((int) i).setId(i + 1);
            }
            return list;
        });

        ArenaMatchEngine mockEngine1 = mock(ArenaMatchEngine.class);
        when(mockEngine1.getArenaName()).thenReturn("Arena 1 - Alpha Cage");
        when(arenaManagerService.getArena(1L)).thenReturn(mockEngine1);

        ArenaMatchEngine mockEngine2 = mock(ArenaMatchEngine.class);
        when(mockEngine2.getArenaName()).thenReturn("Arena 2 - Bravo Cage");
        when(arenaManagerService.getArena(2L)).thenReturn(mockEngine2);

        PreloadResultDTO result = queueService.preloadEventMatches(req);

        // Verify repository cleared prior matches
        verify(scheduledMatchRepository).deleteAll();
        assertEquals(3, result.getTotalMatchesLoaded());
        assertEquals(2, result.getTotalArenasPrimed());
        assertTrue(result.getUniqueTeams().contains("Alpha Team"));
        assertTrue(result.getUniqueTeams().contains("Bravo Team"));
        assertTrue(result.getUniqueTeams().contains("Charlie Team"));
        assertTrue(result.getUniqueTeams().contains("Delta Team"));

        // Verify Arena 1 received first match (M-1)
        verify(arenaManagerService).loadMatchIntoArena(1L, "Alpha Team", "Bravo Team", "M-1", "Drone Soccer Cup");
        // Verify Arena 2 received first match (M-2)
        verify(arenaManagerService).loadMatchIntoArena(2L, "Charlie Team", "Delta Team", "M-2", "Drone Soccer Cup");
    }

    @Test
    void testPrimeAllArenasWithFirstMatches() {
        ArenaMatchEngine arena1 = mock(ArenaMatchEngine.class);
        when(arena1.getArenaId()).thenReturn(1L);
        when(arena1.getArenaName()).thenReturn("Cage 1");

        when(arenaManagerService.getAllArenas()).thenReturn(List.of(arena1));

        ScheduledMatch match = ScheduledMatch.builder()
                .id(10L)
                .matchNumber("M-99")
                .arenaId(1L)
                .teamRed("Red Stars")
                .teamBlue("Blue Moons")
                .tournamentName("Championship")
                .status("SCHEDULED")
                .orderIndex(0)
                .build();

        when(scheduledMatchRepository.findByArenaIdAndStatusOrderByOrderIndexAsc(1L, "SCHEDULED"))
                .thenReturn(List.of(match));

        PreloadResultDTO result = queueService.primeAllArenasWithFirstMatches();

        assertEquals(1, result.getTotalArenasPrimed());
        verify(arenaManagerService).loadMatchIntoArena(1L, "Red Stars", "Blue Moons", "M-99", "Championship");
        verify(scheduledMatchRepository).save(match);
        assertEquals("IN_PROGRESS", match.getStatus());
    }

    @Test
    void testGetCsvTemplate() {
        String template = queueService.getCsvTemplate();
        assertNotNull(template);
        assertTrue(template.contains("Match,Cage,Red Team,Blue Team"));
        assertTrue(template.contains("M-101"));
    }

    @Test
    void testJsonDeserializationOfTimes() throws Exception {
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();

        // 1. HH:mm format e.g. "09:00"
        String json1 = "{\"matchNumber\":\"M-1\",\"scheduledTime\":\"09:00\"}";
        MatchScheduleRequest req1 = mapper.readValue(json1, MatchScheduleRequest.class);
        assertNotNull(req1.getScheduledTime());
        assertEquals(9, req1.getScheduledTime().getHour());
        assertEquals(0, req1.getScheduledTime().getMinute());

        // 2. 12-hour AM/PM format e.g. "2:30 PM"
        String json2 = "{\"matchNumber\":\"M-2\",\"scheduledTime\":\"2:30 PM\"}";
        MatchScheduleRequest req2 = mapper.readValue(json2, MatchScheduleRequest.class);
        assertNotNull(req2.getScheduledTime());
        assertEquals(14, req2.getScheduledTime().getHour());
        assertEquals(30, req2.getScheduledTime().getMinute());

        // 3. ISO-8601 string
        String json3 = "{\"matchNumber\":\"M-3\",\"scheduledTime\":\"2026-09-20T11:45:00\"}";
        MatchScheduleRequest req3 = mapper.readValue(json3, MatchScheduleRequest.class);
        assertNotNull(req3.getScheduledTime());
        assertEquals(11, req3.getScheduledTime().getHour());
        assertEquals(45, req3.getScheduledTime().getMinute());

        // 4. Blank string or invalid time does not crash with HttpMessageNotReadableException
        String json4 = "{\"matchNumber\":\"M-4\",\"scheduledTime\":\"\"}";
        MatchScheduleRequest req4 = mapper.readValue(json4, MatchScheduleRequest.class);
        assertNull(req4.getScheduledTime());

        String json5 = "{\"matchNumber\":\"M-5\",\"scheduledTime\":\"TBD\"}";
        MatchScheduleRequest req5 = mapper.readValue(json5, MatchScheduleRequest.class);
        assertNull(req5.getScheduledTime());
    }
}
