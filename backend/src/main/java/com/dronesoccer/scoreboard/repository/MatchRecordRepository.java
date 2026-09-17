package com.dronesoccer.scoreboard.repository;

import com.dronesoccer.scoreboard.model.entity.MatchRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MatchRecordRepository extends JpaRepository<MatchRecord, Long> {
    List<MatchRecord> findByOrderByCreatedAtDesc();
    List<MatchRecord> findByArenaIdOrderByCreatedAtDesc(Long arenaId);
    List<MatchRecord> findByStatusOrderByCreatedAtDesc(String status);
}
