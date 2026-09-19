package com.dronesoccer.scoreboard.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrimedArenaDTO {
    private Long arenaId;
    private String arenaName;
    private String matchNumber;
    private String teamRed;
    private String teamBlue;
    private String tournamentName;
}
