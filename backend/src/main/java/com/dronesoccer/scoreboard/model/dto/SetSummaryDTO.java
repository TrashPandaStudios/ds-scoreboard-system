package com.dronesoccer.scoreboard.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SetSummaryDTO {
    private int setNumber;
    private int redScore;
    private int blueScore;
    private int redPenalties;
    private int bluePenalties;
    private String winner; // "RED", "BLUE", "TIE"
    private long durationSeconds;
}
