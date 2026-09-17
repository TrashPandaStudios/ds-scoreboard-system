package com.dronesoccer.scoreboard.controller;

import com.dronesoccer.scoreboard.model.dto.MatchScheduleRequest;
import com.dronesoccer.scoreboard.model.entity.ScheduledMatch;
import com.dronesoccer.scoreboard.service.TournamentQueueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/queue")
@RequiredArgsConstructor
public class QueueRestController {

    private final TournamentQueueService queueService;

    @GetMapping
    public ResponseEntity<List<ScheduledMatch>> getAllScheduledMatches() {
        return ResponseEntity.ok(queueService.getAllScheduledMatches());
    }

    @GetMapping("/arena/{arenaId}")
    public ResponseEntity<List<ScheduledMatch>> getArenaPendingMatches(@PathVariable Long arenaId) {
        return ResponseEntity.ok(queueService.getPendingMatchesForArena(arenaId));
    }

    @PostMapping
    public ResponseEntity<ScheduledMatch> createScheduledMatch(@RequestBody MatchScheduleRequest request) {
        return ResponseEntity.ok(queueService.createScheduledMatch(request));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ScheduledMatch> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String status = body.getOrDefault("status", "SCHEDULED");
        ScheduledMatch updated = queueService.updateStatus(id, status);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteScheduledMatch(@PathVariable Long id) {
        queueService.deleteScheduledMatch(id);
        return ResponseEntity.noContent().build();
    }
}
