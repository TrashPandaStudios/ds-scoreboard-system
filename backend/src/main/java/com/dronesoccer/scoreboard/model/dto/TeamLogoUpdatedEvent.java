package com.dronesoccer.scoreboard.model.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class TeamLogoUpdatedEvent {
    private final String teamName;
    private final String newLogoUrl;
}
