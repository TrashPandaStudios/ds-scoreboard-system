package com.dronesoccer.scoreboard.model.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Entity
@Table(name = "team_players", indexes = @Index(columnList = "team_id"))
@Getter
@NoArgsConstructor
public class TeamPlayer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(length = 36)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @Setter
    @Column(nullable = false, length = 120)
    private String name;

    public TeamPlayer(Team team, String name) {
        this.team = team;
        this.name = name;
    }
}
