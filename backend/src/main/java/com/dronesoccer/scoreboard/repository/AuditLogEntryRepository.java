package com.dronesoccer.scoreboard.repository;

import com.dronesoccer.scoreboard.model.entity.AuditLogEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogEntryRepository extends JpaRepository<AuditLogEntry, Long> {
    List<AuditLogEntry> findTop50ByOrderByTimestampDesc();
    List<AuditLogEntry> findTop50ByArenaIdOrderByTimestampDesc(Long arenaId);
    @Query("select entry from AuditLogEntry entry where entry.matchId = :matchId "
            + "or entry.matchAuditKey = :matchAuditKey order by entry.id asc")
    List<AuditLogEntry> findForMatch(@Param("matchId") Long matchId, @Param("matchAuditKey") String matchAuditKey);
}
