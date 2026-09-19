package com.dronesoccer.scoreboard.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PreloadScheduleRequest {
    private List<MatchScheduleRequest> matches;
    @Builder.Default
    private boolean clearExisting = true;
    @Builder.Default
    private boolean autoLoadArenas = true;
    private String defaultTournamentName;
    private String csvContent;
}
