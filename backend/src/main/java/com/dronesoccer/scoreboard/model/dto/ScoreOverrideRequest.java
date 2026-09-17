package com.dronesoccer.scoreboard.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoreOverrideRequest {
    private Integer redScore;
    private Integer blueScore;
    private Integer redPenalties;
    private Integer bluePenalties;
    private Integer redSetScore;
    private Integer blueSetScore;
    private String teamRed;
    private String teamBlue;
}
