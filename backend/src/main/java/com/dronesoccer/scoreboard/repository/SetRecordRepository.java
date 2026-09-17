package com.dronesoccer.scoreboard.repository;

import com.dronesoccer.scoreboard.model.entity.SetRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SetRecordRepository extends JpaRepository<SetRecord, Long> {
    List<SetRecord> findByMatchRecordIdOrderBySetNumberAsc(Long matchRecordId);
}
