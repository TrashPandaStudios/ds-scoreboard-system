package com.dronesoccer.scoreboard.service;

import com.dronesoccer.scoreboard.engine.ArenaManagerService;
import com.dronesoccer.scoreboard.engine.ArenaMatchEngine;
import com.dronesoccer.scoreboard.model.dto.*;
import com.dronesoccer.scoreboard.model.entity.ScheduledMatch;
import com.dronesoccer.scoreboard.repository.ScheduledMatchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TournamentQueueService {

    private final ScheduledMatchRepository scheduledMatchRepository;
    private final ArenaManagerService arenaManagerService;

    public List<ScheduledMatch> getAllScheduledMatches() {
        return scheduledMatchRepository.findAllByOrderByOrderIndexAsc();
    }

    public List<ScheduledMatch> getPendingMatchesForArena(Long arenaId) {
        return scheduledMatchRepository.findByArenaIdAndStatusOrderByOrderIndexAsc(arenaId, "SCHEDULED");
    }

    public ScheduledMatch createScheduledMatch(MatchScheduleRequest request) {
        int nextOrder = (int) scheduledMatchRepository.count();
        ScheduledMatch match = ScheduledMatch.builder()
                .matchNumber(request.getMatchNumber() != null ? request.getMatchNumber() : "M-" + (nextOrder + 1))
                .tournamentName(request.getTournamentName() != null ? request.getTournamentName() : "Drone Soccer Cup")
                .arenaId(request.getArenaId() != null ? request.getArenaId() : 1L)
                .teamRed(request.getTeamRed() != null ? request.getTeamRed() : "Red Team")
                .teamBlue(request.getTeamBlue() != null ? request.getTeamBlue() : "Blue Team")
                .scheduledTime(request.getScheduledTime() != null ? request.getScheduledTime() : LocalDateTime.now().plusMinutes(15))
                .status("SCHEDULED")
                .orderIndex(nextOrder)
                .createdAt(LocalDateTime.now())
                .build();

        return scheduledMatchRepository.save(match);
    }

    @Transactional
    public ScheduledMatch updateStatus(Long id, String status) {
        Optional<ScheduledMatch> opt = scheduledMatchRepository.findById(id);
        if (opt.isPresent()) {
            ScheduledMatch match = opt.get();
            match.setStatus(status);
            return scheduledMatchRepository.save(match);
        }
        return null;
    }

    @Transactional
    public void deleteScheduledMatch(Long id) {
        scheduledMatchRepository.deleteById(id);
    }

    /**
     * Preloads tournament match schedule from structured requests or raw CSV text.
     * Optionally clears prior matches and arms active arena engines with their first scheduled match.
     */
    @Transactional
    public PreloadResultDTO preloadEventMatches(PreloadScheduleRequest request) {
        List<MatchScheduleRequest> incomingMatches = new ArrayList<>();

        // 1. Parse CSV content if provided
        if (request.getCsvContent() != null && !request.getCsvContent().isBlank()) {
            List<MatchScheduleRequest> parsedCsv = parseCsvSchedule(request.getCsvContent(), request.getDefaultTournamentName());
            incomingMatches.addAll(parsedCsv);
        }

        // 2. Include any structured match requests
        if (request.getMatches() != null) {
            incomingMatches.addAll(request.getMatches());
        }

        if (incomingMatches.isEmpty()) {
            throw new IllegalArgumentException("No match data provided in preload request.");
        }

        // 3. Clear existing matches if requested
        if (request.isClearExisting()) {
            log.info("Clearing existing scheduled match queue for tournament preload...");
            scheduledMatchRepository.deleteAll();
        }

        int startOrder = request.isClearExisting() ? 0 : (int) scheduledMatchRepository.count();
        List<ScheduledMatch> entitiesToSave = new ArrayList<>();
        Set<String> uniqueTeams = new LinkedHashSet<>();
        String fallbackTournament = (request.getDefaultTournamentName() != null && !request.getDefaultTournamentName().isBlank())
                ? request.getDefaultTournamentName()
                : "World Drone Soccer Championship";

        for (int i = 0; i < incomingMatches.size(); i++) {
            MatchScheduleRequest item = incomingMatches.get(i);
            String red = (item.getTeamRed() != null && !item.getTeamRed().isBlank()) ? item.getTeamRed().trim() : "Red Team " + (i + 1);
            String blue = (item.getTeamBlue() != null && !item.getTeamBlue().isBlank()) ? item.getTeamBlue().trim() : "Blue Team " + (i + 1);
            uniqueTeams.add(red);
            uniqueTeams.add(blue);

            Long arenaId = (item.getArenaId() != null && item.getArenaId() > 0) ? item.getArenaId() : 1L;
            String matchNum = (item.getMatchNumber() != null && !item.getMatchNumber().isBlank())
                    ? item.getMatchNumber().trim()
                    : "M-" + (startOrder + i + 101);
            String tourney = (item.getTournamentName() != null && !item.getTournamentName().isBlank())
                    ? item.getTournamentName().trim()
                    : fallbackTournament;
            LocalDateTime schedTime = item.getScheduledTime() != null
                    ? item.getScheduledTime()
                    : LocalDateTime.now().plusMinutes(20L * (startOrder + i));

            ScheduledMatch entity = ScheduledMatch.builder()
                    .matchNumber(matchNum)
                    .arenaId(arenaId)
                    .teamRed(red)
                    .teamBlue(blue)
                    .tournamentName(tourney)
                    .scheduledTime(schedTime)
                    .status("SCHEDULED")
                    .orderIndex(startOrder + i)
                    .createdAt(LocalDateTime.now())
                    .build();

            entitiesToSave.add(entity);
        }

        List<ScheduledMatch> savedMatches = scheduledMatchRepository.saveAll(entitiesToSave);
        log.info("Saved {} preloaded matches into database.", savedMatches.size());

        List<PrimedArenaDTO> primedArenas = new ArrayList<>();

        // 4. Optionally auto-prime active arenas with their opening match
        if (request.isAutoLoadArenas()) {
            // Group by arenaId and find earliest match for each arena
            Map<Long, List<ScheduledMatch>> byArena = savedMatches.stream()
                    .collect(Collectors.groupingBy(ScheduledMatch::getArenaId));

            for (Map.Entry<Long, List<ScheduledMatch>> entry : byArena.entrySet()) {
                Long arenaId = entry.getKey();
                List<ScheduledMatch> arenaMatches = entry.getValue();
                arenaMatches.sort(Comparator.comparingInt(ScheduledMatch::getOrderIndex));

                ScheduledMatch firstMatch = arenaMatches.get(0);

                // Stage into authoritative engine
                arenaManagerService.loadMatchIntoArena(
                        arenaId,
                        firstMatch.getTeamRed(),
                        firstMatch.getTeamBlue(),
                        firstMatch.getMatchNumber(),
                        firstMatch.getTournamentName()
                );

                firstMatch.setStatus("IN_PROGRESS");
                scheduledMatchRepository.save(firstMatch);

                ArenaMatchEngine engine = arenaManagerService.getArena(arenaId);
                String arenaName = (engine != null && engine.getArenaName() != null)
                        ? engine.getArenaName()
                        : "Arena " + arenaId;

                primedArenas.add(PrimedArenaDTO.builder()
                        .arenaId(arenaId)
                        .arenaName(arenaName)
                        .matchNumber(firstMatch.getMatchNumber())
                        .teamRed(firstMatch.getTeamRed())
                        .teamBlue(firstMatch.getTeamBlue())
                        .tournamentName(firstMatch.getTournamentName())
                        .build());
            }

            log.info("Primed {} arenas with their respective opening matches.", primedArenas.size());
        }

        return PreloadResultDTO.builder()
                .totalMatchesLoaded(savedMatches.size())
                .totalArenasPrimed(primedArenas.size())
                .uniqueTeams(new ArrayList<>(uniqueTeams))
                .primedArenas(primedArenas)
                .scheduledMatches(savedMatches)
                .message("Successfully preloaded " + savedMatches.size() + " matches across " + uniqueTeams.size() + " teams.")
                .build();
    }

    /**
     * Re-stages the first pending match for each active arena cage.
     */
    @Transactional
    public PreloadResultDTO primeAllArenasWithFirstMatches() {
        Collection<ArenaMatchEngine> allArenas = arenaManagerService.getAllArenas();
        List<PrimedArenaDTO> primedList = new ArrayList<>();

        for (ArenaMatchEngine engine : allArenas) {
            Long arenaId = engine.getArenaId();
            // Find earliest match for this arena that is SCHEDULED or IN_PROGRESS
            List<ScheduledMatch> pending = scheduledMatchRepository.findByArenaIdAndStatusOrderByOrderIndexAsc(arenaId, "SCHEDULED");
            if (pending.isEmpty()) {
                pending = scheduledMatchRepository.findByArenaIdAndStatusOrderByOrderIndexAsc(arenaId, "IN_PROGRESS");
            }

            if (!pending.isEmpty()) {
                ScheduledMatch match = pending.get(0);
                arenaManagerService.loadMatchIntoArena(
                        arenaId,
                        match.getTeamRed(),
                        match.getTeamBlue(),
                        match.getMatchNumber(),
                        match.getTournamentName()
                );

                match.setStatus("IN_PROGRESS");
                scheduledMatchRepository.save(match);

                primedList.add(PrimedArenaDTO.builder()
                        .arenaId(arenaId)
                        .arenaName(engine.getArenaName())
                        .matchNumber(match.getMatchNumber())
                        .teamRed(match.getTeamRed())
                        .teamBlue(match.getTeamBlue())
                        .tournamentName(match.getTournamentName())
                        .build());
            }
        }

        return PreloadResultDTO.builder()
                .totalArenasPrimed(primedList.size())
                .primedArenas(primedList)
                .message("Primed " + primedList.size() + " arenas with opening match lineups.")
                .build();
    }

    /**
     * Parses CSV or TSV schedule content into MatchScheduleRequest models.
     */
    public List<MatchScheduleRequest> parseCsvSchedule(String csvContent, String defaultTournament) {
        List<MatchScheduleRequest> matches = new ArrayList<>();
        if (csvContent == null || csvContent.isBlank()) {
            return matches;
        }

        String[] lines = csvContent.split("\\r?\\n");
        if (lines.length == 0) return matches;

        // Detect delimiter: check header line for tab vs semicolon vs comma
        String firstLine = lines[0];
        String delimiter = ",";
        if (firstLine.contains("\t")) {
            delimiter = "\t";
        } else if (firstLine.contains(";") && !firstLine.contains(",")) {
            delimiter = ";";
        }

        int matchCol = -1;
        int arenaCol = -1;
        int redCol = -1;
        int blueCol = -1;
        int timeCol = -1;
        int tourneyCol = -1;

        int startIndex = 0;
        String[] headerCols = splitRow(lines[0], delimiter);

        // Check if line 0 is a header
        boolean hasHeader = false;
        for (int i = 0; i < headerCols.length; i++) {
            String col = headerCols[i].toLowerCase().trim();
            if (col.contains("match")) { matchCol = i; hasHeader = true; }
            else if (col.contains("arena") || col.contains("cage") || col.contains("pitch") || col.contains("court")) { arenaCol = i; hasHeader = true; }
            else if (col.contains("red") || col.contains("team1") || col.contains("team 1")) { redCol = i; hasHeader = true; }
            else if (col.contains("blue") || col.contains("team2") || col.contains("team 2")) { blueCol = i; hasHeader = true; }
            else if (col.contains("time") || col.contains("sched") || col.contains("start")) { timeCol = i; hasHeader = true; }
            else if (col.contains("tourn") || col.contains("event")) { tourneyCol = i; hasHeader = true; }
        }

        if (hasHeader) {
            startIndex = 1;
        } else {
            // Default column assumption: Match, Arena, Red, Blue, Time, Tournament
            matchCol = 0;
            arenaCol = 1;
            redCol = 2;
            blueCol = 3;
            timeCol = 4;
            tourneyCol = 5;
        }

        Pattern arenaNumPattern = Pattern.compile("(\\d+)");

        for (int i = startIndex; i < lines.length; i++) {
            String line = lines[i].trim();
            if (line.isBlank() || line.startsWith("#")) continue;

            String[] cols = splitRow(line, delimiter);
            if (cols.length < 2) continue;

            String matchNumber = (matchCol >= 0 && matchCol < cols.length) ? stripQuotes(cols[matchCol]) : "M-" + (matches.size() + 101);
            String arenaStr = (arenaCol >= 0 && arenaCol < cols.length) ? stripQuotes(cols[arenaCol]) : "1";
            String teamRed = (redCol >= 0 && redCol < cols.length) ? stripQuotes(cols[redCol]) : "";
            String teamBlue = (blueCol >= 0 && blueCol < cols.length) ? stripQuotes(cols[blueCol]) : "";
            String timeStr = (timeCol >= 0 && timeCol < cols.length) ? stripQuotes(cols[timeCol]) : "";
            String tournament = (tourneyCol >= 0 && tourneyCol < cols.length) ? stripQuotes(cols[tourneyCol]) : defaultTournament;

            // Extract numeric arena ID
            Long arenaId = 1L;
            Matcher matcher = arenaNumPattern.matcher(arenaStr);
            if (matcher.find()) {
                try {
                    arenaId = Long.parseLong(matcher.group(1));
                } catch (NumberFormatException ignored) {}
            }

            // Parse time if given
            LocalDateTime schedTime = parseTime(timeStr);

            if (tournament == null || tournament.isBlank()) {
                tournament = (defaultTournament != null && !defaultTournament.isBlank())
                        ? defaultTournament
                        : "World Drone Soccer Championship";
            }

            matches.add(MatchScheduleRequest.builder()
                    .matchNumber(matchNumber)
                    .arenaId(arenaId)
                    .teamRed(teamRed)
                    .teamBlue(teamBlue)
                    .tournamentName(tournament)
                    .scheduledTime(schedTime)
                    .build());
        }

        return matches;
    }

    private String[] splitRow(String row, String delimiter) {
        if (delimiter.equals("\t")) {
            return row.split("\t", -1);
        }
        // Split on delimiter while ignoring delimiters inside quotes
        String regex = delimiter + "(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)";
        return row.split(regex, -1);
    }

    private String stripQuotes(String str) {
        if (str == null) return "";
        return str.replaceAll("^\"|\"$", "").trim();
    }

    private LocalDateTime parseTime(String timeStr) {
        return com.dronesoccer.scoreboard.config.FlexibleLocalDateTimeDeserializer.parseFlexible(timeStr);
    }

    /**
     * Generates a sample CSV template for tournament directors.
     */
    public String getCsvTemplate() {
        return """
Match,Cage,Red Team,Blue Team,Time,Tournament
M-101,1,Red Phoenix,Blue Comets,09:00,World Drone Soccer Championship
M-102,2,Thunder Hawks,Cyber Vipers,09:00,World Drone Soccer Championship
M-103,3,Nova Strikers,Shadow Drones,09:00,World Drone Soccer Championship
M-104,1,Solar Flares,Apex Predators,09:20,World Drone Soccer Championship
M-105,2,Hyperion,Titanium Wings,09:20,World Drone Soccer Championship
M-106,3,Velocity,Skyline,09:20,World Drone Soccer Championship
""";
    }
}
