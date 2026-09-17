package com.dronesoccer.scoreboard.controller;

import com.dronesoccer.scoreboard.model.entity.AuditLogEntry;
import com.dronesoccer.scoreboard.model.entity.MatchRecord;
import com.dronesoccer.scoreboard.repository.AuditLogEntryRepository;
import com.dronesoccer.scoreboard.repository.MatchRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
public class MatchHistoryRestController {

    private final MatchRecordRepository matchRecordRepository;
    private final AuditLogEntryRepository auditLogEntryRepository;

    @GetMapping
    public ResponseEntity<List<MatchRecord>> getAllMatches() {
        return ResponseEntity.ok(matchRecordRepository.findByOrderByCreatedAtDesc());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MatchRecord> getMatchById(@PathVariable Long id) {
        return matchRecordRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/arena/{arenaId}")
    public ResponseEntity<List<MatchRecord>> getMatchesByArena(@PathVariable Long arenaId) {
        return ResponseEntity.ok(matchRecordRepository.findByArenaIdOrderByCreatedAtDesc(arenaId));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLogEntry>> getAuditLogs(@RequestParam(required = false) Long arenaId) {
        if (arenaId != null) {
            return ResponseEntity.ok(auditLogEntryRepository.findTop50ByArenaIdOrderByTimestampDesc(arenaId));
        }
        return ResponseEntity.ok(auditLogEntryRepository.findTop50ByOrderByTimestampDesc());
    }
}
