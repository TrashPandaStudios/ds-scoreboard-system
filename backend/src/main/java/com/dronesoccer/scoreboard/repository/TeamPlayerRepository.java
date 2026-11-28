package com.dronesoccer.scoreboard.repository;

import com.dronesoccer.scoreboard.model.entity.TeamPlayer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TeamPlayerRepository extends JpaRepository<TeamPlayer, UUID> {
    List<TeamPlayer> findByTeamIdOrderByNameAscIdAsc(Long teamId);
    List<TeamPlayer> findByTeamNameIgnoreCaseOrderByNameAscIdAsc(String teamName);
    Optional<TeamPlayer> findByIdAndTeamId(UUID id, Long teamId);
}
