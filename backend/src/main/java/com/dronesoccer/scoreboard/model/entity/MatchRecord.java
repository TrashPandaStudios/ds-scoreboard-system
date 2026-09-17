package com.dronesoccer.scoreboard.model.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "match_records")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "setRecords")
public class MatchRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String matchNumber;

    private Long arenaId;
    private String tournamentName;

    @Column(nullable = false)
    private String teamRed;

    @Column(nullable = false)
    private String teamBlue;

    @Builder.Default
    private int redSetScore = 0;

    @Builder.Default
    private int blueSetScore = 0;

    private String winner; // "RED", "BLUE", "TIE", or null if in progress

    @Column(nullable = false)
    private String status; // "IN_PROGRESS", "COMPLETED", "CANCELLED"

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    @Column(length = 2000)
    private String notes;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "matchRecord", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    @Builder.Default
    private List<SetRecord> setRecords = new ArrayList<>();
}
