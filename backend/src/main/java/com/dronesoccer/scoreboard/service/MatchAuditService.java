package com.dronesoccer.scoreboard.service;

import com.dronesoccer.scoreboard.model.entity.AuditLogEntry;
import com.dronesoccer.scoreboard.repository.AuditLogEntryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MatchAuditService {

    private final AuditLogEntryRepository auditLogEntryRepository;

    public void logEvent(Long arenaId, Long matchId, String eventType, String description, String payloadJson) {
        try {
            AuditLogEntry entry = AuditLogEntry.builder()
                    .arenaId(arenaId)
                    .matchId(matchId)
                    .eventType(eventType)
                    .description(description)
                    .payloadJson(payloadJson)
                    .timestamp(LocalDateTime.now())
                    .build();

            auditLogEntryRepository.save(entry);
            log.debug("AuditLog: Arena {} [Match {}] - {} : {}", arenaId, matchId, eventType, description);
        } catch (Exception e) {
            log.error("Failed to save audit log entry: {}", e.getMessage());
        }
    }

    public List<AuditLogEntry> getRecentLogs(Long arenaId) {
        if (arenaId != null) {
            return auditLogEntryRepository.findTop50ByArenaIdOrderByTimestampDesc(arenaId);
        }
        return auditLogEntryRepository.findTop50ByOrderByTimestampDesc();
    }
}
