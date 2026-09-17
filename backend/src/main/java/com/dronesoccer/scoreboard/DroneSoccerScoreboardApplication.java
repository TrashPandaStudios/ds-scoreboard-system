package com.dronesoccer.scoreboard;

import com.dronesoccer.scoreboard.model.entity.MatchRecord;
import com.dronesoccer.scoreboard.model.entity.ScheduledMatch;
import com.dronesoccer.scoreboard.model.entity.SetRecord;
import com.dronesoccer.scoreboard.model.entity.SponsorItem;
import com.dronesoccer.scoreboard.repository.MatchRecordRepository;
import com.dronesoccer.scoreboard.repository.ScheduledMatchRepository;
import com.dronesoccer.scoreboard.repository.SponsorItemRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.io.File;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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
            SponsorItemRepository sponsorRepo,
            ScheduledMatchRepository matchQueueRepo,
            MatchRecordRepository matchRecordRepo) {
        return args -> {
            // 1. Seed Sponsors if none exist
            if (sponsorRepo.count() == 0) {
                log.info("Seeding initial tournament sponsor partners...");
                List<SponsorItem> sponsors = List.of(
                        SponsorItem.builder()
                                .name("FIDA Global Drone Soccer")
                                .logoUrl("https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=300&auto=format&fit=crop&q=80")
                                .tagline("Official International Federation of Drone Soccer")
                                .displayDurationSec(8)
                                .active(true)
                                .orderIndex(0)
                                .build(),
                        SponsorItem.builder()
                                .name("SkyGrid Aero Robotics")
                                .logoUrl("https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=300&auto=format&fit=crop&q=80")
                                .tagline("Precision FPV Racing Spheres & Telemetry Hardware")
                                .displayDurationSec(8)
                                .active(true)
                                .orderIndex(1)
                                .build(),
                        SponsorItem.builder()
                                .name("Vortex Dynamic Propulsion")
                                .logoUrl("https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&auto=format&fit=crop&q=80")
                                .tagline("Ultra High RPM Carbon Fiber Rotors")
                                .displayDurationSec(8)
                                .active(true)
                                .orderIndex(2)
                                .build(),
                        SponsorItem.builder()
                                .name("Titan Lithium Systems")
                                .logoUrl("https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=300&auto=format&fit=crop&q=80")
                                .tagline("120C High-Discharge Tournament Lipo Power")
                                .displayDurationSec(8)
                                .active(true)
                                .orderIndex(3)
                                .build()
                );
                sponsorRepo.saveAll(sponsors);
            }

            // 2. Seed Queue if none exist
            if (matchQueueRepo.count() == 0) {
                log.info("Seeding initial tournament match queue...");
                List<ScheduledMatch> queue = List.of(
                        ScheduledMatch.builder()
                                .matchNumber("M-101")
                                .tournamentName("World Drone Soccer Championship")
                                .arenaId(1L)
                                .teamRed("Red Phoenix")
                                .teamBlue("Blue Comets")
                                .status("IN_PROGRESS")
                                .scheduledTime(LocalDateTime.now())
                                .orderIndex(0)
                                .build(),
                        ScheduledMatch.builder()
                                .matchNumber("M-102")
                                .tournamentName("World Drone Soccer Championship")
                                .arenaId(2L)
                                .teamRed("Thunder Hawks")
                                .teamBlue("Cyber Vipers")
                                .status("SCHEDULED")
                                .scheduledTime(LocalDateTime.now().plusMinutes(15))
                                .orderIndex(1)
                                .build(),
                        ScheduledMatch.builder()
                                .matchNumber("M-103")
                                .tournamentName("World Drone Soccer Championship")
                                .arenaId(3L)
                                .teamRed("Nova Strikers")
                                .teamBlue("Shadow Drones")
                                .status("SCHEDULED")
                                .scheduledTime(LocalDateTime.now().plusMinutes(30))
                                .orderIndex(2)
                                .build(),
                        ScheduledMatch.builder()
                                .matchNumber("M-104")
                                .tournamentName("World Drone Soccer Championship")
                                .arenaId(1L)
                                .teamRed("Solar Flares")
                                .teamBlue("Apex Predators")
                                .status("SCHEDULED")
                                .scheduledTime(LocalDateTime.now().plusMinutes(45))
                                .orderIndex(3)
                                .build()
                );
                matchQueueRepo.saveAll(queue);
            }

            // 3. Seed Sample Completed Match for History/Audit verification
            if (matchRecordRepo.count() == 0) {
                log.info("Seeding initial match history record...");
                MatchRecord match1 = MatchRecord.builder()
                        .matchNumber("M-100")
                        .arenaId(1L)
                        .tournamentName("World Drone Soccer Championship")
                        .teamRed("Red Phoenix")
                        .teamBlue("Shadow Drones")
                        .redSetScore(2)
                        .blueSetScore(1)
                        .winner("RED")
                        .status("COMPLETED")
                        .startTime(LocalDateTime.now().minusMinutes(40))
                        .endTime(LocalDateTime.now().minusMinutes(20))
                        .notes("Grand Opening Exhibition Match. Intense Set 3 finish.")
                        .setRecords(new ArrayList<>())
                        .build();

                SetRecord s1 = SetRecord.builder()
                        .matchRecord(match1)
                        .setNumber(1)
                        .redScore(12)
                        .blueScore(9)
                        .redPenalties(1)
                        .bluePenalties(2)
                        .winner("RED")
                        .durationSeconds(180)
                        .endedAt(LocalDateTime.now().minusMinutes(35))
                        .build();

                SetRecord s2 = SetRecord.builder()
                        .matchRecord(match1)
                        .setNumber(2)
                        .redScore(8)
                        .blueScore(14)
                        .redPenalties(0)
                        .bluePenalties(1)
                        .winner("BLUE")
                        .durationSeconds(180)
                        .endedAt(LocalDateTime.now().minusMinutes(28))
                        .build();

                SetRecord s3 = SetRecord.builder()
                        .matchRecord(match1)
                        .setNumber(3)
                        .redScore(15)
                        .blueScore(13)
                        .redPenalties(2)
                        .bluePenalties(1)
                        .winner("RED")
                        .durationSeconds(180)
                        .endedAt(LocalDateTime.now().minusMinutes(20))
                        .build();

                match1.getSetRecords().add(s1);
                match1.getSetRecords().add(s2);
                match1.getSetRecords().add(s3);
                matchRecordRepo.save(match1);
            }
        };
    }
}
