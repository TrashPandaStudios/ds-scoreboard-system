package com.dronesoccer.scoreboard.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "sponsor_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SponsorItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 1000)
    private String logoUrl;

    private String tagline;

    @Builder.Default
    private int displayDurationSec = 8;

    @Builder.Default
    private boolean active = true;

    @Builder.Default
    private int orderIndex = 0;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
