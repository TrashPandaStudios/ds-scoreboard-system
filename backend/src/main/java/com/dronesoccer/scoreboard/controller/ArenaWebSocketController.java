package com.dronesoccer.scoreboard.controller;

import com.dronesoccer.scoreboard.engine.ArenaManagerService;
import com.dronesoccer.scoreboard.engine.ArenaMatchEngine;
import com.dronesoccer.scoreboard.model.dto.ArenaStateDTO;
import com.dronesoccer.scoreboard.model.dto.MatchControlCommand;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.annotation.SubscribeMapping;
import org.springframework.stereotype.Controller;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ArenaWebSocketController {

    private final ArenaManagerService arenaManagerService;

    @MessageMapping("/arena/{arenaId}/command")
    public void handleCommand(@DestinationVariable Long arenaId, @Payload MatchControlCommand command) {
        log.info("Received WS command for Arena {}: {}", arenaId, command.getType());
        arenaManagerService.processCommand(arenaId, command);
    }

    @SubscribeMapping("/arena/{arenaId}/state")
    public ArenaStateDTO onSubscribeArenaState(@DestinationVariable Long arenaId) {
        ArenaMatchEngine engine = arenaManagerService.findArena(arenaId);
        if (engine == null) {
            return null;
        }
        return engine.toDTO();
    }

    @MessageMapping("/master/emergency-pause")
    public void emergencyPause() {
        arenaManagerService.emergencyPauseAll();
    }

    @MessageMapping("/master/emergency-resume")
    public void emergencyResume() {
        arenaManagerService.emergencyResumeAll();
    }
}
