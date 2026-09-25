package com.dronesoccer.scoreboard;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.File;

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
}
