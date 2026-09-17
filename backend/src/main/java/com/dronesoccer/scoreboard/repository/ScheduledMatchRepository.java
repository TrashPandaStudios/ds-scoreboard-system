package com.dronesoccer.scoreboard.repository;

import com.dronesoccer.scoreboard.model.entity.ScheduledMatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScheduledMatchRepository extends JpaRepository<ScheduledMatch, Long> {
    List<ScheduledMatch> findByStatusOrderByOrderIndexAsc(String status);
    List<ScheduledMatch> findByArenaIdAndStatusOrderByOrderIndexAsc(Long arenaId, String status);
    List<ScheduledMatch> findAllByOrderByOrderIndexAsc();
}
