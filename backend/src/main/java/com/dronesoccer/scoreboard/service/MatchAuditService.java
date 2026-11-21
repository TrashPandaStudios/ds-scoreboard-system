package com.dronesoccer.scoreboard.service;

import com.dronesoccer.scoreboard.model.entity.AuditLogEntry;
import com.dronesoccer.scoreboard.repository.AuditLogEntryRepository;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class MatchAuditService {

    private final AuditLogEntryRepository auditLogEntryRepository;

    // Dedicated single-threaded daemon writer so SQLite disk I/O never blocks ArenaMatchEngine.stateLock
    private final ExecutorService auditWriterExecutor = Executors.newSingleThreadExecutor(r -> {
        Thread t = new Thread(r, "DS-AuditLog-Thread");
        t.setDaemon(true);
        return t;
    });

    public void logEvent(Long arenaId, Long matchId, String eventType, String description, String payloadJson) {
        LocalDateTime eventTime = LocalDateTime.now();
        auditWriterExecutor.execute(() -> {
            try {
                AuditLogEntry entry = AuditLogEntry.builder()
                        .arenaId(arenaId)
                        .matchId(matchId)
                        .eventType(eventType)
                        .description(description)
                        .payloadJson(payloadJson)
                        .timestamp(eventTime)
                        .build();

                auditLogEntryRepository.save(entry);
                log.debug("AuditLog: Arena {} [Match {}] - {} : {}", arenaId, matchId, eventType, description);
            } catch (Exception e) {
                log.error("Failed to save audit log entry: {}", e.getMessage());
            }
        });
    }

    public List<AuditLogEntry> getRecentLogs(Long arenaId) {
        if (arenaId != null) {
            return auditLogEntryRepository.findTop50ByArenaIdOrderByTimestampDesc(arenaId);
        }
        return auditLogEntryRepository.findTop50ByOrderByTimestampDesc();
    }

    @PreDestroy
    public void shutdown() {
        auditWriterExecutor.shutdown();
        try {
            if (!auditWriterExecutor.awaitTermination(2, TimeUnit.SECONDS)) {
                auditWriterExecutor.shutdownNow();
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            auditWriterExecutor.shutdownNow();
        }
    }
}
