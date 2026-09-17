package com.dronesoccer.scoreboard.repository;

import com.dronesoccer.scoreboard.model.entity.SponsorItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SponsorItemRepository extends JpaRepository<SponsorItem, Long> {
    List<SponsorItem> findByActiveTrueOrderByOrderIndexAsc();
    List<SponsorItem> findAllByOrderByOrderIndexAsc();
}
