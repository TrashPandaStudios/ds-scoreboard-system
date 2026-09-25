package com.dronesoccer.scoreboard;

import com.dronesoccer.scoreboard.repository.MatchRecordRepository;
import com.dronesoccer.scoreboard.repository.ScheduledMatchRepository;
import com.dronesoccer.scoreboard.repository.SponsorItemRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.io.File;

import com.dronesoccer.scoreboard.repository.TeamRepository;

@Slf4j
@SpringBootApplication
public class DroneSoccerScoreboardApplication {

    public static void main(String[] args) {
        // Ensure data directory exists for SQLite
        File dataDir = new File("./data");
        if (!dataDir.exists()) {
            dataDir.mkdirs();
        }

        SpringApplication.run(DroneSoccerScoreboardApplication.class, args);
    }

    @Bean
    public CommandLineRunner seedInitialData(
            TeamRepository teamRepo,
            SponsorItemRepository sponsorRepo,
            ScheduledMatchRepository matchQueueRepo,
            MatchRecordRepository matchRecordRepo) {
        return args -> {

        };
    }
}
