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
public class ArenaStateDTO {
    private Long arenaId;
    private String arenaName;

    // Match Metadata
    private Long matchId;
    private String matchNumber;
    private String tournamentName;

    // Teams
    private String teamRed;
    private String teamBlue;

    // Live Set Scores
    private int redScore;
    private int blueScore;

    // Overall Sets Won
    private int redSetScore;
    private int blueSetScore;

    // Penalties (non-negative count)
    private int redPenalties;
    private int bluePenalties;

    // Set Progress
    private int currentSet;
    private int maxSets;

    // Authoritative Clock
    private long timeRemainingMs;
    private long totalSetDurationMs;
    private long intermissionDurationMs;
    private boolean timerRunning;
    private MatchPhase phase;

    // Orientation
    private boolean sideSwap; // false: Red on Left, Blue on Right; true: Blue on Left, Red on Right

    // Winner tracking
    private String matchWinner; // "RED", "BLUE", "TIE", or null

    // Telemetry and Sync
    private long serverEpochMs;
    private String recentEvent;

    // Completed sets history for this match
    private List<SetSummaryDTO> completedSets;
}
