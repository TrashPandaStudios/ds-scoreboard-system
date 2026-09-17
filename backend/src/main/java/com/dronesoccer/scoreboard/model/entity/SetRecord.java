package com.dronesoccer.scoreboard.model.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "set_records")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "matchRecord")
public class SetRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_record_id", nullable = false)
    @JsonBackReference
    private MatchRecord matchRecord;

    @Column(nullable = false)
    private int setNumber;

    @Builder.Default
    private int redScore = 0;

    @Builder.Default
    private int blueScore = 0;

    @Builder.Default
    private int redPenalties = 0;

    @Builder.Default
    private int bluePenalties = 0;

    private String winner; // "RED", "BLUE", "TIE"

    private long durationSeconds;

    @Builder.Default
    private LocalDateTime endedAt = LocalDateTime.now();
}
