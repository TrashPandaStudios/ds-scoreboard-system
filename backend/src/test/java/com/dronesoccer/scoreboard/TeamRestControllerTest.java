package com.dronesoccer.scoreboard;

import com.dronesoccer.scoreboard.controller.TeamRestController;
import com.dronesoccer.scoreboard.model.dto.TeamDTO;
import com.dronesoccer.scoreboard.model.entity.Team;
import com.dronesoccer.scoreboard.service.TeamService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class TeamRestControllerTest {

    private TeamService teamService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        teamService = mock(TeamService.class);
        TeamRestController controller = new TeamRestController(teamService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void testGetAllTeams() throws Exception {
        TeamDTO t1 = TeamDTO.builder().id(1L).name("Red Phoenix").logoUrl("/api/teams/logos/p.png").build();
        TeamDTO t2 = TeamDTO.builder().id(2L).name("Blue Comets").build();
        when(teamService.getAllTeams()).thenReturn(List.of(t1, t2));

        mockMvc.perform(get("/api/teams"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].name").value("Red Phoenix"))
                .andExpect(jsonPath("$[0].logoUrl").value("/api/teams/logos/p.png"))
                .andExpect(jsonPath("$[1].name").value("Blue Comets"));
    }

    @Test
    void testUploadLogo() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "test.png", "image/png", new byte[]{1, 2, 3});
        TeamDTO updated = TeamDTO.builder().id(1L).name("Red Phoenix").logoUrl("/api/teams/logos/team-1.png").build();
        when(teamService.uploadLogo(eq(1L), any())).thenReturn(updated);

        mockMvc.perform(multipart("/api/teams/1/logo").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.logoUrl").value("/api/teams/logos/team-1.png"));
    }

    @Test
    void testServeLogo() throws Exception {
        ByteArrayResource resource = new ByteArrayResource(new byte[]{1, 2, 3, 4}) {
            @Override
            public String getFilename() {
                return "logo.png";
            }
        };
        when(teamService.loadLogoAsResource("logo.png")).thenReturn(resource);
        when(teamService.getMediaTypeForFilename("logo.png")).thenReturn(MediaType.IMAGE_PNG);

        mockMvc.perform(get("/api/teams/logos/logo.png"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "image/png"))
                .andExpect(header().exists("Cache-Control"));
    }

    @Test
    void testServeLogoNotFound() throws Exception {
        when(teamService.loadLogoAsResource("nonexistent.png")).thenReturn(null);

        mockMvc.perform(get("/api/teams/logos/nonexistent.png"))
                .andExpect(status().isNotFound());
    }
}
