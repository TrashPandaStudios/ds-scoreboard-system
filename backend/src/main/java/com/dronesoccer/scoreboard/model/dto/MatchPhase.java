package com.dronesoccer.scoreboard.model.dto;

public enum MatchPhase {
    IDLE,               // Between matches or pre-match setup
    COUNTDOWN,          // 5-second countdown to set start
    NORMAL_PHASE,       // Active 3-minute set gameplay
    PENALTY_PHASE,      // Active penalty shootout / foul resolution
    SUDDEN_DEATH,       // Sudden death overtime (first team to score wins the set)
    TIMEOUT,            // Team or referee timeout in progress
    INTERMISSION,       // Break between sets (sponsor takeover active)
    MATCH_ENDED         // Match completed, winner confirmed
}
