package com.dronesoccer.scoreboard.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchScheduleRequest {
    private String matchNumber;
    private String tournamentName;
    private Long arenaId;
    private String teamRed;
    private String teamBlue;
    private LocalDateTime scheduledTime;
}
