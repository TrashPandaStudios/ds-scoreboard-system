package com.dronesoccer.scoreboard.engine;

import com.dronesoccer.scoreboard.model.dto.ArenaStateDTO;
import com.dronesoccer.scoreboard.model.dto.ArenaSummaryDTO;
import com.dronesoccer.scoreboard.model.dto.MatchControlCommand;
import com.dronesoccer.scoreboard.repository.MatchRecordRepository;
import com.dronesoccer.scoreboard.repository.SetRecordRepository;
import com.dronesoccer.scoreboard.model.dto.TeamLogoUpdatedEvent;
import com.dronesoccer.scoreboard.service.HardwareBuzzerService;
import com.dronesoccer.scoreboard.service.MatchAuditService;
import com.dronesoccer.scoreboard.service.TeamLogoResolver;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.concurrent.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ArenaManagerService {

    private final SimpMessagingTemplate messagingTemplate;
    private final HardwareBuzzerService buzzerService;
    private final MatchRecordRepository matchRecordRepository;
    private final SetRecordRepository setRecordRepository;
    private final MatchAuditService auditService;
    private final TeamLogoResolver teamLogoResolver;

    @Value("${scoreboard.match.default-set-duration-ms:180000}")
    private long defaultSetDurationMs;

    @Value("${scoreboard.match.default-timeout-duration-ms:60000}")
    private long defaultTimeoutDurationMs;

    @Value("${scoreboard.match.default-intermission-duration-ms:90000}")
    private long defaultIntermissionDurationMs;

    @Value("${scoreboard.match.default-penalty-duration-ms:30000}")
    private long defaultPenaltyDurationMs;

    @Value("${scoreboard.match.sync-interval-ms:100}")
    private long syncIntervalMs;

    private final Map<Long, ArenaMatchEngine> arenas = new ConcurrentHashMap<>();
    private ScheduledExecutorService tickExecutor;

    @PostConstruct
    public void init() {
        log.info("Initializing Drone Soccer Multi-Arena Engine at {}ms tick interval (10 Hz authoritative clock)...", syncIntervalMs);

        // Register default arenas
        registerArena(1L, "Arena 1 - Alpha Cage");
        registerArena(2L, "Arena 2 - Bravo Cage");
        registerArena(3L, "Arena 3 - Charlie Cage");

        // Start Authoritative 100ms Clock Engine
        tickExecutor = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "DS-AuthoritativeClock-Thread");
            t.setDaemon(true);
            return t;
        });

        tickExecutor.scheduleAtFixedRate(this::tickAllArenas, 0, syncIntervalMs, TimeUnit.MILLISECONDS);
    }

    public synchronized ArenaMatchEngine registerArena(Long id, String name) {
        return registerArena(id, name, defaultSetDurationMs);
    }

    public synchronized ArenaMatchEngine registerArena(Long id, String name, long setDurationMs) {
        if (!arenas.containsKey(id)) {
            ArenaMatchEngine engine = new ArenaMatchEngine(
                    id,
                    name,
                    messagingTemplate,
                    buzzerService,
                    matchRecordRepository,
                    setRecordRepository,
                    auditService,
                    setDurationMs > 0 ? setDurationMs : defaultSetDurationMs,
                    defaultTimeoutDurationMs,
                    defaultIntermissionDurationMs,
                    defaultPenaltyDurationMs
            );
            engine.setTeamLogoResolver(teamLogoResolver);
            arenas.put(id, engine);
            log.info("Registered Drone Soccer Arena [ID: {}, Name: '{}']", id, name);
            return engine;
        }
        return arenas.get(id);
    }

    public synchronized ArenaMatchEngine createNewArena(String name, Long customDurationMs) {
        long nextId = arenas.keySet().stream().mapToLong(v -> v).max().orElse(0L) + 1;
        String arenaName = (name != null && !name.isBlank()) ? name : "Arena " + nextId + " - Cage";
        long duration = (customDurationMs != null && customDurationMs > 0) ? customDurationMs : defaultSetDurationMs;
        ArenaMatchEngine engine = registerArena(nextId, arenaName, duration);
        broadcastSummary();
        return engine;
    }

    public synchronized boolean deleteArena(Long id) {
        if (arenas.containsKey(id)) {
            arenas.remove(id);
            log.info("Removed Drone Soccer Arena [ID: {}]", id);
            broadcastSummary();
            return true;
        }
        return false;
    }

    public ArenaMatchEngine getArena(Long id) {
        return arenas.computeIfAbsent(id, k -> {
            ArenaMatchEngine engine = new ArenaMatchEngine(
                    k,
                    "Arena " + k,
                    messagingTemplate,
                    buzzerService,
                    matchRecordRepository,
                    setRecordRepository,
                    auditService,
                    defaultSetDurationMs,
                    defaultTimeoutDurationMs,
                    defaultIntermissionDurationMs,
                    defaultPenaltyDurationMs
            );
            engine.setTeamLogoResolver(teamLogoResolver);
            return engine;
        });
    }

    public Collection<ArenaMatchEngine> getAllArenas() {
        return arenas.values();
    }

    public List<ArenaSummaryDTO> getAllSummaries() {
        return arenas.values().stream()
                .map(ArenaMatchEngine::toSummaryDTO)
                .collect(Collectors.toList());
    }

    public void processCommand(Long arenaId, MatchControlCommand command) {
        ArenaMatchEngine engine = getArena(arenaId);
        engine.processCommand(command);
        broadcastSummary();
    }

    public void loadMatchIntoArena(Long arenaId, String red, String blue, String matchNumber, String tournamentName) {
        ArenaMatchEngine engine = getArena(arenaId);
        engine.loadMatchDirect(red, blue, matchNumber, tournamentName);
        broadcastSummary();
        log.info("Loaded match '{}' ({} vs {}) into Arena {}", matchNumber, red, blue, arenaId);
    }

    @org.springframework.context.event.EventListener
    public void onTeamLogoUpdated(TeamLogoUpdatedEvent event) {
        log.info("Received TeamLogoUpdatedEvent for '{}', updating active arenas with logo '{}'", event.getTeamName(), event.getNewLogoUrl());
        for (ArenaMatchEngine engine : arenas.values()) {
            engine.updateTeamLogoIfMatching(event.getTeamName(), event.getNewLogoUrl());
        }
        broadcastSummary();
    }

    public void emergencyPauseAll() {
        log.warn("EMERGENCY: Pausing all active arena timers!");
        for (ArenaMatchEngine engine : arenas.values()) {
            engine.pauseTimer();
        }
        broadcastSummary();
    }

    public void emergencyResumeAll() {
        log.info("Resuming all paused arenas!");
        for (ArenaMatchEngine engine : arenas.values()) {
            engine.startTimer();
        }
        broadcastSummary();
    }

    public synchronized long getDefaultIntermissionDurationMs() {
        return defaultIntermissionDurationMs;
    }

    public synchronized void setDefaultIntermissionDurationMs(long defaultIntermissionDurationMs) {
        if (defaultIntermissionDurationMs > 0) {
            this.defaultIntermissionDurationMs = defaultIntermissionDurationMs;
        }
    }

    public synchronized void updateGlobalDefaultIntermission(long durationMs, boolean overrideAllArenas) {
        if (durationMs <= 0) return;
        this.defaultIntermissionDurationMs = durationMs;
        log.info("Global default intermission duration updated to {}ms (overrideAll={})", durationMs, overrideAllArenas);
        if (overrideAllArenas) {
            for (ArenaMatchEngine engine : arenas.values()) {
                engine.setIntermissionDurationMs(durationMs, true);
            }
        }
        broadcastSummary();
    }

    public void updateArenaIntermissionDuration(Long arenaId, long durationMs, boolean isAdminOverride) {
        ArenaMatchEngine engine = getArena(arenaId);
        engine.setIntermissionDurationMs(durationMs, isAdminOverride);
        broadcastSummary();
    }

    private void tickAllArenas() {
        try {
            for (ArenaMatchEngine engine : arenas.values()) {
                engine.tick();
            }
            // Send aggregated summary to /topic/arenas/summary
            broadcastSummary();
        } catch (Throwable t) {
            log.error("Error in clock tick cycle: {}", t.getMessage(), t);
        }
    }

    private void broadcastSummary() {
        try {
            List<ArenaSummaryDTO> summaries = getAllSummaries();
            messagingTemplate.convertAndSend("/topic/arenas/summary", summaries);
        } catch (Exception e) {
            // Ignore broadcast failure on shutdown or empty listeners
        }
    }

    @PreDestroy
    public void cleanup() {
        if (tickExecutor != null) {
            tickExecutor.shutdown();
        }
    }
}
