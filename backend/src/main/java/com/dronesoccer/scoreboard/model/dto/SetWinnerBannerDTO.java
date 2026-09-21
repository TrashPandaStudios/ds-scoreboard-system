package com.dronesoccer.scoreboard.model.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SetWinnerBannerDTO {
    private boolean active;
    private String winner;          // "RED", "BLUE", or "TIE"
    private String winnerName;      // Team display name or "Tie"
    private String winnerLogoUrl;   // Resolved logo URL if available
    private int redSetScore;        // Sets won by Red so far
    private int blueSetScore;       // Sets won by Blue so far
    private int setsWon;            // Sets won by the winning team
    private int currentSet;         // Set just concluded
    private int maxSets;            // Total sets in match (e.g. 3)

    @JsonProperty("isMatchWinner")
    private boolean isMatchWinner;  // True if this set win clinched the match

    @JsonProperty("isMatchWinner")
    public boolean isMatchWinner() {
        return this.isMatchWinner;
    }

    @JsonProperty("isMatchWinner")
    public void setMatchWinner(boolean matchWinner) {
        this.isMatchWinner = matchWinner;
    }
}
