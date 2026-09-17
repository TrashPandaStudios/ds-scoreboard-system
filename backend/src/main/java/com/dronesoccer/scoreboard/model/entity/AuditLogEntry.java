package com.dronesoccer.scoreboard.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_log_entries")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long arenaId;
    private Long matchId;

    @Column(nullable = false)
    private String eventType; // e.g. "SCORE_RED_PLUS", "TIMER_PAUSE", "SET_AWARD_RED", "BUZZER_FIRED"

    @Column(length = 1000)
    private String description;

    @Column(length = 4000)
    private String payloadJson;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
