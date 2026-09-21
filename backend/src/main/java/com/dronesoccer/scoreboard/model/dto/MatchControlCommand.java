package com.dronesoccer.scoreboard.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchControlCommand {
    public enum CommandType {
        // Clock controls
        START_TIMER,
        PAUSE_TIMER,
        TOGGLE_TIMER,
        RESET_SET_TIMER,
        ADJUST_TIMER_SECONDS,  // +10s, -10s via parameter
        SET_TIMER_EXACT_MS,    // exact ms via parameter
        
        // Score controls
        ADD_RED_SCORE,
        SUB_RED_SCORE,
        ADD_BLUE_SCORE,
        SUB_BLUE_SCORE,
        SET_RED_SCORE,
        SET_BLUE_SCORE,
        
        // Penalty controls
        ADD_RED_PENALTY,
        SUB_RED_PENALTY,
        ADD_BLUE_PENALTY,
        SUB_BLUE_PENALTY,
        SET_RED_PENALTY,
        SET_BLUE_PENALTY,
        
        // Set management
        AWARD_SET_RED,
        AWARD_SET_BLUE,
        AWARD_SET_TIE,
        NEXT_SET,
        PREV_SET,
        SWAP_SIDES,
        
        // Phase switches
        SET_PHASE,
        START_COUNTDOWN,
        START_TIMEOUT,
        START_INTERMISSION,
        START_SUDDEN_DEATH,
        SET_INTERMISSION_DURATION,
        
        // Buzzer
        TRIGGER_BUZZER,
        
        // Match state
        LOAD_MATCH,
        RESET_MATCH,
        UPDATE_TEAMS,
        CONFIRM_MATCH_END,
        DISMISS_WINNER_BANNER
    }

    private CommandType type;
    private Long arenaId;
    private Integer intValue;
    private Long longValue;
    private String stringValue;
    private MatchPhase phaseValue;
    private String teamRed;
    private String teamBlue;
    private String matchNumber;
    private String tournamentName;
}
