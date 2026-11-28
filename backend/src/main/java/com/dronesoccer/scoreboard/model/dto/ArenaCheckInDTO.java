package com.dronesoccer.scoreboard.model.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;
import java.util.UUID;

public record ArenaCheckInDTO(String arenaName, String matchNumber, UUID matchToken,
                              boolean canCheckIn, boolean matchEnded, Team red, Team blue,
                              @JsonInclude(JsonInclude.Include.NON_NULL) ArenaStateDTO arenaState) {

    public enum Side { RED, BLUE }

    public record Team(String name, String logoUrl, Lineup lineup) {
    }

    public record Lineup(UUID version, List<TeamPlayerDTO> players, UUID strikerId) {
    }

    public Team team(Side side) {
        return side == Side.RED ? red : blue;
    }
}
