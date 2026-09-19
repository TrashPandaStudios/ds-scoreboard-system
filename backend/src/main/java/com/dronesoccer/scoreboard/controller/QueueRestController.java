package com.dronesoccer.scoreboard.controller;

import com.dronesoccer.scoreboard.model.dto.MatchScheduleRequest;
import com.dronesoccer.scoreboard.model.dto.PreloadResultDTO;
import com.dronesoccer.scoreboard.model.dto.PreloadScheduleRequest;
import com.dronesoccer.scoreboard.model.entity.ScheduledMatch;
import com.dronesoccer.scoreboard.service.TournamentQueueService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/queue")
@RequiredArgsConstructor
public class QueueRestController {

    private final TournamentQueueService queueService;

    @GetMapping
    public ResponseEntity<List<ScheduledMatch>> getAllScheduledMatches() {
        return ResponseEntity.ok(queueService.getAllScheduledMatches());
    }

    @GetMapping("/arena/{arenaId}")
    public ResponseEntity<List<ScheduledMatch>> getArenaPendingMatches(@PathVariable Long arenaId) {
        return ResponseEntity.ok(queueService.getPendingMatchesForArena(arenaId));
    }

    @PostMapping
    public ResponseEntity<ScheduledMatch> createScheduledMatch(@RequestBody MatchScheduleRequest request) {
        return ResponseEntity.ok(queueService.createScheduledMatch(request));
    }

    @PostMapping("/preload")
    public ResponseEntity<PreloadResultDTO> preloadMatches(@RequestBody PreloadScheduleRequest request) {
        return ResponseEntity.ok(queueService.preloadEventMatches(request));
    }

    @PostMapping(value = "/upload-csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PreloadResultDTO> uploadCsvSchedule(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "clearExisting", defaultValue = "true") boolean clearExisting,
            @RequestParam(value = "autoLoadArenas", defaultValue = "true") boolean autoLoadArenas,
            @RequestParam(value = "tournamentName", required = false) String tournamentName) {
        try {
            String csvContent = new String(file.getBytes(), StandardCharsets.UTF_8);
            PreloadScheduleRequest req = PreloadScheduleRequest.builder()
                    .csvContent(csvContent)
                    .clearExisting(clearExisting)
                    .autoLoadArenas(autoLoadArenas)
                    .defaultTournamentName(tournamentName)
                    .build();
            return ResponseEntity.ok(queueService.preloadEventMatches(req));
        } catch (Exception e) {
            log.error("Failed to parse uploaded CSV file: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(PreloadResultDTO.builder()
                    .message("Failed to parse CSV: " + e.getMessage())
                    .build());
        }
    }

    @PostMapping("/prime-first-matches")
    public ResponseEntity<PreloadResultDTO> primeFirstMatches() {
        return ResponseEntity.ok(queueService.primeAllArenasWithFirstMatches());
    }

    @GetMapping("/template")
    public ResponseEntity<String> getCsvTemplate() {
        String template = queueService.getCsvTemplate();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"drone_soccer_schedule_template.csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(template);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ScheduledMatch> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String status = body.getOrDefault("status", "SCHEDULED");
        ScheduledMatch updated = queueService.updateStatus(id, status);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteScheduledMatch(@PathVariable Long id) {
        queueService.deleteScheduledMatch(id);
        return ResponseEntity.noContent().build();
    }
}
