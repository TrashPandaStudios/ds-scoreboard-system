package com.dronesoccer.scoreboard;

import com.dronesoccer.scoreboard.model.dto.TeamDTO;
import com.dronesoccer.scoreboard.model.dto.TeamLogoUpdatedEvent;
import com.dronesoccer.scoreboard.model.entity.Team;
import com.dronesoccer.scoreboard.repository.TeamRepository;
import com.dronesoccer.scoreboard.service.TeamService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.ArgumentCaptor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class TeamServiceTest {

    private TeamRepository teamRepository;
    private ApplicationEventPublisher eventPublisher;
    private TeamService teamService;

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() {
        teamRepository = mock(TeamRepository.class);
        eventPublisher = mock(ApplicationEventPublisher.class);
        teamService = new TeamService(teamRepository, eventPublisher);
        ReflectionTestUtils.setField(teamService, "logosPathString", tempDir.toString());
        teamService.init();
    }

    @Test
    void testAutoProvisionNewTeam() {
        when(teamRepository.findByNameIgnoreCase("Thunder Birds")).thenReturn(Optional.empty());
        when(teamRepository.save(any(Team.class))).thenAnswer(invocation -> {
            Team t = invocation.getArgument(0);
            t.setId(10L);
            return t;
        });

        Team result = teamService.autoProvisionTeam("Thunder Birds");

        assertNotNull(result);
        assertEquals(10L, result.getId());
        assertEquals("Thunder Birds", result.getName());
        assertNull(result.getLogoUrl());
        verify(teamRepository, times(1)).save(any(Team.class));
    }

    @Test
    void testAutoProvisionExistingTeam() {
        Team existing = Team.builder().id(5L).name("Existing Team").logoUrl("/api/teams/logos/logo.png").build();
        when(teamRepository.findByNameIgnoreCase("Existing Team")).thenReturn(Optional.of(existing));

        Team result = teamService.autoProvisionTeam("Existing Team");

        assertNotNull(result);
        assertEquals(5L, result.getId());
        verify(teamRepository, never()).save(any(Team.class));
    }

    @Test
    void testResolveLogoUrl() {
        Team existing = Team.builder().id(1L).name("Red Phoenix").logoUrl("/api/teams/logos/team-1-abc.png").build();
        when(teamRepository.findByNameIgnoreCase("Red Phoenix")).thenReturn(Optional.of(existing));
        when(teamRepository.findByNameIgnoreCase("Unknown Team")).thenReturn(Optional.empty());

        assertEquals("/api/teams/logos/team-1-abc.png", teamService.resolveLogoUrl("Red Phoenix"));
        assertNull(teamService.resolveLogoUrl("Unknown Team"));
        assertNull(teamService.resolveLogoUrl(""));
        assertNull(teamService.resolveLogoUrl(null));
    }

    @Test
    void testUploadLogoSuccess() throws IOException {
        Team team = Team.builder().id(1L).name("Red Phoenix").build();
        when(teamRepository.findById(1L)).thenReturn(Optional.of(team));
        when(teamRepository.save(any(Team.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "phoenix.png",
                "image/png",
                new byte[]{1, 2, 3, 4}
        );

        TeamDTO result = teamService.uploadLogo(1L, file);

        assertNotNull(result);
        assertNotNull(result.getLogoUrl());
        assertTrue(result.getLogoUrl().startsWith("/api/teams/logos/team-1-"));
        assertTrue(result.getLogoUrl().endsWith(".png"));

        ArgumentCaptor<TeamLogoUpdatedEvent> eventCaptor = ArgumentCaptor.forClass(TeamLogoUpdatedEvent.class);
        verify(eventPublisher, times(1)).publishEvent(eventCaptor.capture());
        assertEquals("Red Phoenix", eventCaptor.getValue().getTeamName());
        assertEquals(result.getLogoUrl(), eventCaptor.getValue().getNewLogoUrl());
    }

    @Test
    void testUploadLogoRejectsUnsupportedFormat() {
        Team team = Team.builder().id(1L).name("Red Phoenix").build();
        when(teamRepository.findById(1L)).thenReturn(Optional.of(team));

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "bad.exe",
                "application/octet-stream",
                new byte[]{1, 2, 3}
        );

        assertThrows(IllegalArgumentException.class, () -> teamService.uploadLogo(1L, file));
    }

    @Test
    void testUploadLogoRejectsOversizedFile() {
        Team team = Team.builder().id(1L).name("Red Phoenix").build();
        when(teamRepository.findById(1L)).thenReturn(Optional.of(team));

        byte[] largeBytes = new byte[6 * 1024 * 1024]; // 6MB
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "huge.png",
                "image/png",
                largeBytes
        );

        assertThrows(IllegalArgumentException.class, () -> teamService.uploadLogo(1L, file));
    }

    @Test
    void testClearLogo() {
        Team team = Team.builder().id(1L).name("Red Phoenix").logoUrl("/api/teams/logos/team-1-test.png").build();
        when(teamRepository.findById(1L)).thenReturn(Optional.of(team));
        when(teamRepository.save(any(Team.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TeamDTO result = teamService.clearLogo(1L);

        assertNull(result.getLogoUrl());
        ArgumentCaptor<TeamLogoUpdatedEvent> eventCaptor = ArgumentCaptor.forClass(TeamLogoUpdatedEvent.class);
        verify(eventPublisher, times(1)).publishEvent(eventCaptor.capture());
        assertEquals("Red Phoenix", eventCaptor.getValue().getTeamName());
        assertNull(eventCaptor.getValue().getNewLogoUrl());
    }
}
