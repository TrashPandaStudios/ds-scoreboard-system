package com.dronesoccer.scoreboard.model.dto;

import com.dronesoccer.scoreboard.model.entity.ScheduledMatch;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PreloadResultDTO {
    private int totalMatchesLoaded;
    private int totalArenasPrimed;
    private List<String> uniqueTeams;
    private List<PrimedArenaDTO> primedArenas;
    private List<ScheduledMatch> scheduledMatches;
    private String message;
}
