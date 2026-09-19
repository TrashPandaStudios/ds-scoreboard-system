package com.dronesoccer.scoreboard.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArenaSummaryDTO {
    private Long arenaId;
    private String arenaName;
    private Long matchId;
    private String matchNumber;
    private String teamRed;
    private String teamBlue;
    private String teamRedLogoUrl;
    private String teamBlueLogoUrl;
    private int redScore;
    private int blueScore;
    private int redSetScore;
    private int blueSetScore;
    private int currentSet;
    private int maxSets;
    private long timeRemainingMs;
    private long intermissionDurationMs;
    private boolean timerRunning;
    private MatchPhase phase;
    private boolean sideSwap;
    private long serverEpochMs;
}
