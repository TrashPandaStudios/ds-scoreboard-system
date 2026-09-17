package com.dronesoccer.scoreboard.repository;

import com.dronesoccer.scoreboard.model.entity.AuditLogEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogEntryRepository extends JpaRepository<AuditLogEntry, Long> {
    List<AuditLogEntry> findTop50ByOrderByTimestampDesc();
    List<AuditLogEntry> findTop50ByArenaIdOrderByTimestampDesc(Long arenaId);
    List<AuditLogEntry> findByMatchIdOrderByTimestampAsc(Long matchId);
}
