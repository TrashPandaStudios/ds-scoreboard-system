package com.dronesoccer.scoreboard.repository;

import com.dronesoccer.scoreboard.model.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {
    Optional<Team> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
    List<Team> findAllByOrderByNameAsc();
}
