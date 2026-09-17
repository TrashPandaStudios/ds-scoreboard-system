package com.dronesoccer.scoreboard.controller;

import com.dronesoccer.scoreboard.engine.ArenaManagerService;
import com.dronesoccer.scoreboard.engine.ArenaMatchEngine;
import com.dronesoccer.scoreboard.model.dto.*;
import com.dronesoccer.scoreboard.service.HardwareBuzzerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/arenas")
@RequiredArgsConstructor
public class ArenaRestController {

    private final ArenaManagerService arenaManagerService;
    private final HardwareBuzzerService buzzerService;

    @GetMapping
    public ResponseEntity<List<ArenaSummaryDTO>> getAllArenas() {
        return ResponseEntity.ok(arenaManagerService.getAllSummaries());
    }

    @PostMapping
    public ResponseEntity<ArenaStateDTO> createArena(@RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        Number durationNumber = (Number) body.get("durationMs");
        Long durationMs = durationNumber != null ? durationNumber.longValue() : null;
        ArenaMatchEngine engine = arenaManagerService.createNewArena(name, durationMs);
        return ResponseEntity.ok(engine.toDTO());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteArena(@PathVariable Long id) {
        boolean deleted = arenaManagerService.deleteArena(id);
        return ResponseEntity.ok(Map.of("deleted", deleted, "arenaId", id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ArenaStateDTO> getArenaState(@PathVariable Long id) {
        ArenaMatchEngine engine = arenaManagerService.getArena(id);
        return ResponseEntity.ok(engine.toDTO());
    }

    @PostMapping("/{id}/command")
    public ResponseEntity<ArenaStateDTO> sendCommand(@PathVariable Long id, @RequestBody MatchControlCommand command) {
        command.setArenaId(id);
        arenaManagerService.processCommand(id, command);
        return ResponseEntity.ok(arenaManagerService.getArena(id).toDTO());
    }

    @PostMapping("/{id}/override-score")
    public ResponseEntity<ArenaStateDTO> overrideScore(@PathVariable Long id, @RequestBody ScoreOverrideRequest req) {
        ArenaMatchEngine engine = arenaManagerService.getArena(id);
        if (req.getRedScore() != null) engine.setScore(true, req.getRedScore());
        if (req.getBlueScore() != null) engine.setScore(false, req.getBlueScore());
        if (req.getRedPenalties() != null) engine.setPenalty(true, req.getRedPenalties());
        if (req.getBluePenalties() != null) engine.setPenalty(false, req.getBluePenalties());
        if (req.getTeamRed() != null || req.getTeamBlue() != null) {
            engine.updateTeams(req.getTeamRed(), req.getTeamBlue(), null);
        }
        return ResponseEntity.ok(engine.toDTO());
    }

    @PostMapping("/{id}/timer")
    public ResponseEntity<ArenaStateDTO> controlTimer(@PathVariable Long id, @RequestBody TimerControlRequest req) {
        ArenaMatchEngine engine = arenaManagerService.getArena(id);
        if (req.getExactMs() != null) {
            engine.setTimerExact(req.getExactMs());
        }
        if (req.getAdjustSeconds() != null) {
            engine.adjustTimer(req.getAdjustSeconds());
        }
        if (req.getPhase() != null) {
            engine.setPhase(req.getPhase());
        }
        return ResponseEntity.ok(engine.toDTO());
    }

    @PostMapping("/{id}/buzzer")
    public ResponseEntity<Map<String, Object>> triggerBuzzer(@PathVariable Long id) {
        MatchControlCommand cmd = MatchControlCommand.builder()
                .type(MatchControlCommand.CommandType.TRIGGER_BUZZER)
                .arenaId(id)
                .build();
        arenaManagerService.processCommand(id, cmd);
        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("arenaId", id);
        resp.put("hardwareConnected", buzzerService.isConnected());
        resp.put("serialPort", buzzerService.getCurrentPortName());
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/emergency-pause")
    public ResponseEntity<Map<String, String>> emergencyPause() {
        arenaManagerService.emergencyPauseAll();
        return ResponseEntity.ok(Map.of("status", "PAUSED_ALL"));
    }

    @PostMapping("/emergency-resume")
    public ResponseEntity<Map<String, String>> emergencyResume() {
        arenaManagerService.emergencyResumeAll();
        return ResponseEntity.ok(Map.of("status", "RESUMED_ALL"));
    }

    @GetMapping("/hardware/status")
    public ResponseEntity<Map<String, Object>> getHardwareStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("connected", buzzerService.isConnected());
        status.put("currentPort", buzzerService.getCurrentPortName());
        status.put("availablePorts", buzzerService.getAvailablePortNames());
        return ResponseEntity.ok(status);
    }

    @GetMapping("/config/intermission")
    public ResponseEntity<Map<String, Object>> getIntermissionConfig() {
        Map<String, Object> resp = new HashMap<>();
        resp.put("defaultIntermissionDurationMs", arenaManagerService.getDefaultIntermissionDurationMs());
        List<Map<String, Object>> arenaConfigs = arenaManagerService.getAllArenas().stream().map(a -> {
            Map<String, Object> item = new HashMap<>();
            item.put("arenaId", a.getArenaId());
            item.put("arenaName", a.getArenaName());
            item.put("intermissionDurationMs", a.getIntermissionDurationMs());
            return item;
        }).toList();
        resp.put("arenas", arenaConfigs);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/config/intermission")
    public ResponseEntity<Map<String, Object>> updateGlobalIntermissionConfig(@RequestBody Map<String, Object> body) {
        Number durationNum = (Number) (body.containsKey("defaultIntermissionDurationMs") 
                ? body.get("defaultIntermissionDurationMs") 
                : body.get("durationMs"));
        boolean overrideAll = Boolean.TRUE.equals(body.get("overrideAllArenas")) || Boolean.TRUE.equals(body.get("overrideAll"));
        if (durationNum != null && durationNum.longValue() > 0) {
            arenaManagerService.updateGlobalDefaultIntermission(durationNum.longValue(), overrideAll);
        }
        return getIntermissionConfig();
    }

    @PostMapping("/{id}/intermission-duration")
    public ResponseEntity<ArenaStateDTO> setArenaIntermissionDuration(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Number durationNum = (Number) body.get("durationMs");
        boolean adminOverride = Boolean.TRUE.equals(body.get("adminOverride")) || Boolean.TRUE.equals(body.get("isAdminOverride"));
        if (durationNum != null && durationNum.longValue() > 0) {
            arenaManagerService.updateArenaIntermissionDuration(id, durationNum.longValue(), adminOverride);
        }
        return ResponseEntity.ok(arenaManagerService.getArena(id).toDTO());
    }
}
