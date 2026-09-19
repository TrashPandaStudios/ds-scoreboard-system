package com.dronesoccer.scoreboard.model.dto;

import com.dronesoccer.scoreboard.config.FlexibleLocalDateTimeDeserializer;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
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

    @JsonDeserialize(using = FlexibleLocalDateTimeDeserializer.class)
    private LocalDateTime scheduledTime;
}
