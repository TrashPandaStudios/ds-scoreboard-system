package com.dronesoccer.scoreboard.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "scheduled_matches")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduledMatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String matchNumber;

    private String tournamentName;

    private Long arenaId;

    @Column(nullable = false)
    private String teamRed;

    @Column(nullable = false)
    private String teamBlue;

    @Builder.Default
    private String status = "SCHEDULED"; // "SCHEDULED", "IN_PROGRESS", "COMPLETED", "SKIPPED"

    private LocalDateTime scheduledTime;

    @Builder.Default
    private int orderIndex = 0;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
