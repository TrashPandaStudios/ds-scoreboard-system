package com.dronesoccer.scoreboard.engine;

import com.dronesoccer.scoreboard.model.dto.*;
import com.dronesoccer.scoreboard.model.dto.ArenaCheckInDTO.Lineup;
import com.dronesoccer.scoreboard.model.dto.ArenaCheckInDTO.Side;
import com.dronesoccer.scoreboard.model.entity.MatchRecord;
import com.dronesoccer.scoreboard.model.entity.SetRecord;
import com.dronesoccer.scoreboard.repository.MatchRecordRepository;
import com.dronesoccer.scoreboard.repository.SetRecordRepository;
import com.dronesoccer.scoreboard.service.HardwareBuzzerService;
import com.dronesoccer.scoreboard.service.MatchAuditService;
import com.dronesoccer.scoreboard.service.TeamLogoResolver;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NavigableMap;
import java.util.Objects;
import java.util.TreeMap;
import java.util.UUID;
import java.util.concurrent.locks.ReentrantLock;
import java.util.stream.Collectors;

@Slf4j
public class ArenaMatchEngine {

    @Getter
    private final Long arenaId;
    @Getter
    private final String arenaName;

    private final SimpMessagingTemplate messagingTemplate;
    private final HardwareBuzzerService buzzerService;
    private final MatchRecordRepository matchRecordRepository;
    private final SetRecordRepository setRecordRepository;
    private final MatchAuditService auditService;

    private final ReentrantLock stateLock = new ReentrantLock();

    // Match Metadata
    private Long currentMatchId;
    private String matchAuditKey = UUID.randomUUID().toString();
    private String matchNumber = "TBD";
    private String tournamentName = "";

    // Teams
    private String teamRed = "TBD";
    private String teamBlue = "TBD";
    private String teamRedLogoUrl;
    private String teamBlueLogoUrl;
    private TeamLogoResolver teamLogoResolver;
    private UUID checkInMatchToken;
    private boolean matchStarted;
    private final Map<Side, Lineup> lineups = new EnumMap<>(Side.class);
    private final Map<Side, NavigableMap<Long, TeamPlayerDTO>> strikerHistory =
            Map.of(Side.RED, new TreeMap<>(), Side.BLUE, new TreeMap<>());

    // Live Set State
    private int redScore = 0;
    private int blueScore = 0;
    private final Map<Side, NavigableMap<Integer, TeamPlayerDTO>> goalCredits =
            Map.of(Side.RED, new TreeMap<>(), Side.BLUE, new TreeMap<>());
    private int redSetScore = 0;
    private int blueSetScore = 0;
    private int redPenalties = 0;
    private int bluePenalties = 0;

    // Set structure
    private int currentSet = 1;
    private int maxSets = 3;
    private final List<SetSummaryDTO> completedSets = new ArrayList<>();

    // Authoritative Timer & Clock Engine
    private final long defaultSetDurationMs;
    private final long defaultTimeoutDurationMs;
    private final long defaultIntermissionDurationMs;
    private final long defaultPenaltyDurationMs;
    private long intermissionDurationMs;

    private long timeRemainingMs;
    private long totalSetDurationMs;
    private volatile boolean timerRunning = false;
    private long timerStartNano = 0;
    private long timerInitialRemainingMs = 0;

    // Event-driven sync versioning, command idempotency, and heartbeat throttling
    private long stateVersion = 1L;
    private String lastCommandId = null;
    private final long runningBroadcastHeartbeatMs;
    private final long idleBroadcastHeartbeatMs;
    private volatile long lastBroadcastNano = 0L;
    private static final int MAX_DEDUP_COMMAND_IDS = 256;
    private final Map<String, Boolean> processedCommandIds = new LinkedHashMap<>(MAX_DEDUP_COMMAND_IDS, 0.75f, false) {
        @Override
        protected boolean removeEldestEntry(Map.Entry<String, Boolean> eldest) {
            return size() > MAX_DEDUP_COMMAND_IDS;
        }
    };

    private MatchPhase phase = MatchPhase.IDLE;
    private boolean sideSwap = false;
    private String matchWinner = null;
    private SetWinnerBannerDTO setWinnerBanner = null;
    private String recentEvent = "Arena Initialized";

    public ArenaMatchEngine(Long arenaId,
                            String arenaName,
                            SimpMessagingTemplate messagingTemplate,
                            HardwareBuzzerService buzzerService,
                            MatchRecordRepository matchRecordRepository,
                            SetRecordRepository setRecordRepository,
                            MatchAuditService auditService,
                            long defaultSetDurationMs,
                            long defaultTimeoutDurationMs,
                            long defaultIntermissionDurationMs,
                            long defaultPenaltyDurationMs) {
        this(arenaId, arenaName, messagingTemplate, buzzerService,
                matchRecordRepository, setRecordRepository, auditService,
                defaultSetDurationMs, defaultTimeoutDurationMs,
                defaultIntermissionDurationMs, defaultPenaltyDurationMs,
                2000L, 5000L);
    }

    public ArenaMatchEngine(Long arenaId,
                            String arenaName,
                            SimpMessagingTemplate messagingTemplate,
                            HardwareBuzzerService buzzerService,
                            MatchRecordRepository matchRecordRepository,
                            SetRecordRepository setRecordRepository,
                            MatchAuditService auditService,
                            long defaultSetDurationMs,
                            long defaultTimeoutDurationMs,
                            long defaultIntermissionDurationMs,
                            long defaultPenaltyDurationMs,
                            long runningBroadcastHeartbeatMs,
                            long idleBroadcastHeartbeatMs) {
        this.arenaId = arenaId;
        this.arenaName = arenaName;
        this.messagingTemplate = messagingTemplate;
        this.buzzerService = buzzerService;
        this.matchRecordRepository = matchRecordRepository;
        this.setRecordRepository = setRecordRepository;
        this.auditService = auditService;
        this.defaultSetDurationMs = defaultSetDurationMs;
        this.defaultTimeoutDurationMs = defaultTimeoutDurationMs;
        this.defaultIntermissionDurationMs = defaultIntermissionDurationMs;
        this.defaultPenaltyDurationMs = defaultPenaltyDurationMs;
        this.intermissionDurationMs = defaultIntermissionDurationMs;
        this.runningBroadcastHeartbeatMs = Math.max(250L, runningBroadcastHeartbeatMs);
        this.idleBroadcastHeartbeatMs = Math.max(1000L, idleBroadcastHeartbeatMs);

        this.timeRemainingMs = defaultSetDurationMs;
        this.totalSetDurationMs = defaultSetDurationMs;
    }

    public boolean isTimerRunning() {
        return timerRunning;
    }

    /**
     * 10 Hz (100ms) internal authoritative tick called by ArenaManagerService.
     * Evaluates exact 00:00 timer expiration at 100ms resolution while throttling
     * redundant WebSocket broadcasts to lightweight heartbeats (event-driven push on mutations).
     */
    public void tick() {
        tickWithBroadcastStatus();
    }

    /**
     * Runs one 100ms authoritative clock tick and returns true if a state mutation
     * (such as timer expiration / phase transition) occurred.
     */
    public boolean tickWithBroadcastStatus() {
        boolean stateMutated = false;
        boolean currentlyRunning;
        stateLock.lock();
        try {
            if (timerRunning) {
                if (phase == MatchPhase.SUDDEN_DEATH) {
                    long elapsedMs = (System.nanoTime() - timerStartNano) / 1_000_000;
                    timeRemainingMs = elapsedMs;
                } else {
                    long elapsedMs = (System.nanoTime() - timerStartNano) / 1_000_000;
                    long updated = timerInitialRemainingMs - elapsedMs;

                    if (updated <= 0) {
                        timeRemainingMs = 0;
                        timerRunning = false;
                        onTimerExpired();
                        stateVersion++;
                        stateMutated = true;
                    } else {
                        timeRemainingMs = updated;
                    }
                }
            }
            currentlyRunning = timerRunning;
        } finally {
            stateLock.unlock();
        }

        long nowNano = System.nanoTime();
        long elapsedSinceBroadcastMs = lastBroadcastNano == 0L
                ? Long.MAX_VALUE
                : (nowNano - lastBroadcastNano) / 1_000_000;
        long heartbeatThresholdMs = currentlyRunning ? runningBroadcastHeartbeatMs : idleBroadcastHeartbeatMs;

        if (stateMutated || elapsedSinceBroadcastMs >= heartbeatThresholdMs) {
            broadcastState();
        }

        return stateMutated;
    }

    private void onTimerExpired() {
        log.info("Arena {} - Timer reached 00:00 in phase {}", arenaId, phase);
        recentEvent = "Time Expired - Buzzer Triggered";

        // 1. Trigger hardware buzzer & WebSocket buzzer event
        buzzerService.triggerBuzzer(arenaId, "Timer 00:00 Expired in " + phase);
        broadcastBuzzerEvent("TIMER_ZERO");
        audit("BUZZER_ZERO", "Timer hit 00:00 in " + phase);

        // 2. Automated state progression based on phase
        if (phase == MatchPhase.COUNTDOWN) {
            phase = MatchPhase.NORMAL_PHASE;
            timeRemainingMs = defaultSetDurationMs;
            totalSetDurationMs = defaultSetDurationMs;
            startTimerInternal();
            recentEvent = "Set " + currentSet + " Started";
        } else if (phase == MatchPhase.NORMAL_PHASE || phase == MatchPhase.PENALTY_PHASE) {
            recentEvent = "Set " + currentSet + " Time Expired";
        } else if (phase == MatchPhase.TIMEOUT) {
            phase = MatchPhase.NORMAL_PHASE;
            recentEvent = "Timeout Ended - Ready to Resume";
        } else if (phase == MatchPhase.INTERMISSION) {
            phase = MatchPhase.IDLE;
            timeRemainingMs = defaultSetDurationMs;
            totalSetDurationMs = defaultSetDurationMs;
            recentEvent = "Intermission Ended - Ready for Set " + currentSet;
        }
    }

    /**
     * Executes commands sent from Referee Console or Master Dashboard.
     * Supports idempotent deduplication via commandId so wireless retries never double-execute.
     */
    public void processCommand(MatchControlCommand command) {
        boolean executed = false;
        stateLock.lock();
        try {
            // Reject stale offline-replayed commands if the match or set has already moved on
            if (command.getExpectedMatchSessionId() != null && !matchAuditKey.equals(command.getExpectedMatchSessionId())) {
                log.warn("Arena {} - Ignoring command '{}' from a previous match session", arenaId, command.getCommandId());
                return;
            }
            if (command.getExpectedMatchNumber() != null
                    && !command.getExpectedMatchNumber().isBlank()
                    && !command.getExpectedMatchNumber().equals(this.matchNumber)) {
                log.warn("Arena {} - Ignoring stale command '{}' ({}) from match '{}' (active match: '{}')",
                        arenaId, command.getCommandId(), command.getType(),
                        command.getExpectedMatchNumber(), this.matchNumber);
                return;
            }
            if (command.getExpectedSet() != null && command.getExpectedSet() != this.currentSet) {
                log.warn("Arena {} - Ignoring stale command '{}' ({}) from Set {} (active Set: {})",
                        arenaId, command.getCommandId(), command.getType(),
                        command.getExpectedSet(), this.currentSet);
                return;
            }

            String cmdId = command.getCommandId();
            if (cmdId != null && !cmdId.isBlank()) {
                if (processedCommandIds.containsKey(cmdId)) {
                    log.debug("Arena {} - Ignoring duplicate retried commandId '{}' ({})",
                            arenaId, cmdId, command.getType());
                    return;
                }
                processedCommandIds.put(cmdId, Boolean.TRUE);
            }

            switch (command.getType()) {
                case START_TIMER -> startTimer();
                case PAUSE_TIMER -> pauseTimer();
                case TOGGLE_TIMER -> {
                    if (timerRunning) pauseTimer();
                    else startTimer();
                }
                case RESET_SET_TIMER -> resetSetTimer();
                case ADJUST_TIMER_SECONDS -> adjustTimer(command.getIntValue() != null ? command.getIntValue() : 0);
                case SET_TIMER_EXACT_MS -> setTimerExact(command.getLongValue() != null ? command.getLongValue() : 0);
                
                case ADD_RED_SCORE -> addScore(true, 1, command.getObservedStateVersion());
                case SUB_RED_SCORE -> addScore(true, -1);
                case ADD_BLUE_SCORE -> addScore(false, 1, command.getObservedStateVersion());
                case SUB_BLUE_SCORE -> addScore(false, -1);
                case SET_RED_SCORE -> setScore(true, command.getIntValue() != null ? command.getIntValue() : 0);
                case SET_BLUE_SCORE -> setScore(false, command.getIntValue() != null ? command.getIntValue() : 0);

                case ADD_RED_PENALTY -> addPenalty(true, 1);
                case SUB_RED_PENALTY -> addPenalty(true, -1);
                case ADD_BLUE_PENALTY -> addPenalty(false, 1);
                case SUB_BLUE_PENALTY -> addPenalty(false, -1);
                case SET_RED_PENALTY -> setPenalty(true, command.getIntValue() != null ? command.getIntValue() : 0);
                case SET_BLUE_PENALTY -> setPenalty(false, command.getIntValue() != null ? command.getIntValue() : 0);

                case AWARD_SET_RED -> awardSet("RED");
                case AWARD_SET_BLUE -> awardSet("BLUE");
                case AWARD_SET_TIE -> awardSet("TIE");
                case NEXT_SET -> advanceToNextSet();
                case PREV_SET -> returnToPrevSet();
                case SWAP_SIDES -> {
                    sideSwap = !sideSwap;
                    recentEvent = "Arena Sides Swapped";
                    audit("SWAP_SIDES", "Side swap toggled to " + sideSwap);
                }

                case SET_PHASE -> {
                    if (command.getPhaseValue() != null) {
                        setPhase(command.getPhaseValue());
                    }
                }
                case START_COUNTDOWN -> startCountdown();
                case START_TIMEOUT -> startTimeout();
                case START_INTERMISSION -> startIntermission();
                case SET_INTERMISSION_DURATION -> {
                    if (command.getLongValue() != null && command.getLongValue() > 0) {
                        setIntermissionDurationInternal(command.getLongValue(), false);
                    }
                }

                case TRIGGER_BUZZER -> {
                    buzzerService.triggerBuzzer(arenaId, "Manual Referee Buzzer");
                    broadcastBuzzerEvent("MANUAL");
                    recentEvent = "Manual Buzzer Fired";
                    audit("BUZZER_MANUAL", "Manual Buzzer Triggered");
                }

                case LOAD_MATCH -> loadMatch(command);
                case RESET_MATCH -> resetMatch();
                case UPDATE_TEAMS -> updateTeams(command.getTeamRed(), command.getTeamBlue(), command.getMatchNumber());
                case CONFIRM_MATCH_END -> confirmMatchEnd();
                case START_SUDDEN_DEATH -> startSuddenDeath();
                case DISMISS_WINNER_BANNER -> dismissWinnerBanner();
            }
            if (cmdId != null && !cmdId.isBlank()) {
                this.lastCommandId = cmdId;
            }
            stateVersion++;
            executed = true;
        } finally {
            stateLock.unlock();
        }

        if (executed) {
            // Instant WebSocket push on mutation
            broadcastState();
        }
    }

    public void applyScoreOverride(ScoreOverrideRequest req) {
        stateLock.lock();
        try {
            if (req.getRedScore() != null) setScore(true, req.getRedScore());
            if (req.getBlueScore() != null) setScore(false, req.getBlueScore());
            if (req.getRedPenalties() != null) setPenalty(true, req.getRedPenalties());
            if (req.getBluePenalties() != null) setPenalty(false, req.getBluePenalties());
            if (req.getTeamRed() != null || req.getTeamBlue() != null) {
                updateTeams(req.getTeamRed(), req.getTeamBlue(), null);
            }
            stateVersion++;
        } finally {
            stateLock.unlock();
        }
        broadcastState();
    }

    public void applyTimerControl(TimerControlRequest req) {
        stateLock.lock();
        try {
            if (req.getExactMs() != null) {
                setTimerExact(req.getExactMs());
            }
            if (req.getAdjustSeconds() != null) {
                adjustTimer(req.getAdjustSeconds());
            }
            if (req.getPhase() != null) {
                setPhase(req.getPhase());
            }
            stateVersion++;
        } finally {
            stateLock.unlock();
        }
        broadcastState();
    }

    public boolean emergencyPause() {
        boolean changed = false;
        stateLock.lock();
        try {
            if (timerRunning) {
                pauseTimer();
                stateVersion++;
                changed = true;
            }
        } finally {
            stateLock.unlock();
        }
        if (changed) {
            broadcastState();
        }
        return changed;
    }

    public boolean emergencyResume() {
        boolean changed = false;
        stateLock.lock();
        try {
            if (!timerRunning && timeRemainingMs > 0) {
                startTimer();
                stateVersion++;
                changed = true;
            }
        } finally {
            stateLock.unlock();
        }
        if (changed) {
            broadcastState();
        }
        return changed;
    }

    public void startTimer() {
        if (!timerRunning && timeRemainingMs > 0) {
            startTimerInternal();
            if (phase == MatchPhase.IDLE) {
                phase = MatchPhase.NORMAL_PHASE;
            }
            recentEvent = "Timer Started";
            audit("TIMER_START", "Timer started at " + timeRemainingMs + "ms");
        }
    }

    private void startTimerInternal() {
        if (phase == MatchPhase.IDLE || phase == MatchPhase.COUNTDOWN || phase == MatchPhase.NORMAL_PHASE
                || phase == MatchPhase.PENALTY_PHASE || phase == MatchPhase.SUDDEN_DEATH) {
            matchStarted = true;
        }
        timerRunning = true;
        timerStartNano = System.nanoTime();
        timerInitialRemainingMs = timeRemainingMs;
    }

    public void pauseTimer() {
        if (timerRunning) {
            long elapsedMs = (System.nanoTime() - timerStartNano) / 1_000_000;
            timeRemainingMs = Math.max(0, timerInitialRemainingMs - elapsedMs);
            timerRunning = false;
            recentEvent = "Timer Paused";
            audit("TIMER_PAUSE", "Timer paused at " + timeRemainingMs + "ms");
        }
    }

    public void resetSetTimer() {
        pauseTimer();
        timeRemainingMs = defaultSetDurationMs;
        totalSetDurationMs = defaultSetDurationMs;
        recentEvent = "Timer Reset to 03:00";
    }

    public void adjustTimer(int seconds) {
        long deltaMs = seconds * 1000L;
        if (timerRunning) {
            pauseTimer();
            timeRemainingMs = Math.max(0, timeRemainingMs + deltaMs);
            startTimerInternal();
        } else {
            timeRemainingMs = Math.max(0, timeRemainingMs + deltaMs);
        }
        recentEvent = "Timer Adjusted by " + (seconds > 0 ? "+" : "") + seconds + "s";
    }

    public void setTimerExact(long exactMs) {
        pauseTimer();
        timeRemainingMs = Math.max(0, exactMs);
        totalSetDurationMs = Math.max(totalSetDurationMs, exactMs);
        recentEvent = "Timer set to " + (exactMs / 1000) + "s";
    }

    public void addScore(boolean isRed, int delta) {
        addScore(isRed, delta, null);
    }

    private void addScore(boolean isRed, int delta, Long observedStateVersion) {
        int previousScore = isRed ? redScore : blueScore;
        int score = (int) Math.max(0, Math.min(Integer.MAX_VALUE, (long) previousScore + delta));
        Side side = isRed ? Side.RED : Side.BLUE;
        recentEvent = (isRed ? "Red" : "Blue") + " Score " + (delta > 0 ? "+1" : "-1") + " (" + score + ")";
        updateScore(side, score, false, observedStateVersion);

        // Sudden death rule: first team to score (+1) immediately wins the set
        if (phase == MatchPhase.SUDDEN_DEATH && delta > 0) {
            log.info("Arena {} - Sudden Death Goal scored by {} team!", arenaId, isRed ? "RED" : "BLUE");
            awardSet(isRed ? "RED" : "BLUE");
        }
    }

    public void setScore(boolean isRed, int score) {
        int newScore = Math.max(0, score);
        recentEvent = (isRed ? "Red" : "Blue") + " Score set to " + newScore;
        updateScore(isRed ? Side.RED : Side.BLUE, newScore, true, null);
    }

    private void updateScore(Side side, int score, boolean override, Long observedStateVersion) {
        int previousScore = side == Side.RED ? redScore : blueScore;
        if (score == previousScore) return;
        if (side == Side.RED) redScore = score;
        else blueScore = score;

        NavigableMap<Integer, TeamPlayerDTO> credits = goalCredits.get(side);
        Map<TeamPlayerDTO, Integer> creditChanges = new LinkedHashMap<>();
        if (score < previousScore) {
            var removed = credits.tailMap(score, false);
            removed.values().forEach(player -> creditChanges.merge(player, -1, Integer::sum));
            removed.clear();
        } else if (!override) {
            long version = observedStateVersion == null ? stateVersion : observedStateVersion;
            var assigned = strikerHistory.get(side).floorEntry(version);
            if (assigned != null && assigned.getValue() != null) {
                TeamPlayerDTO striker = assigned.getValue();
                for (int prior = previousScore; prior < score; prior++) {
                    credits.put(prior + 1, striker);
                }
                creditChanges.put(striker, score - previousScore);
            }
        }

        String team = side == Side.RED ? teamRed : teamBlue;
        boolean scored = score > previousScore;
        String event = "SCORE_" + side + (override ? "_SET" : scored ? "_PLUS" : "_MINUS");
        String description = "Set " + currentSet + " · " + team + " · "
                + (override || !scored ? "Score correction " : "Score ") + previousScore + " → " + score;
        if (!creditChanges.isEmpty()) {
            String scorers = creditChanges.entrySet().stream()
                    .map(entry -> entry.getKey().name() + (Math.abs(entry.getValue()) == 1 ? "" : " ×" + Math.abs(entry.getValue())))
                    .collect(Collectors.joining(", "));
            description += scored ? ". Credited to " + scorers : ". Removed credit from " + scorers;
        } else if (scored && !override) {
            description += ". Unattributed goal.";
        }
        var changes = creditChanges.entrySet().stream()
                .map(entry -> new StrikerCredit(entry.getKey().id(), entry.getKey().name(), entry.getValue()))
                .toList();
        auditService.logEvent(arenaId, currentMatchId, matchAuditKey, event, description,
                new ScoreAudit(currentSet, side, team, previousScore, score, changes));
    }

    private record StrikerCredit(UUID playerId, String playerName, int goals) {}

    private record ScoreAudit(int setNumber, Side side, String team, int previousScore, int score,
                              List<StrikerCredit> strikerCredits) {}

    public void addPenalty(boolean isRed, int delta) {
        if (isRed) {
            redPenalties = Math.max(0, redPenalties + delta);
            recentEvent = "Red Penalty " + (delta > 0 ? "+1" : "-1") + " (Total: " + redPenalties + ")";
            audit("PENALTY_RED", "Red Penalties: " + redPenalties);
        } else {
            bluePenalties = Math.max(0, bluePenalties + delta);
            recentEvent = "Blue Penalty " + (delta > 0 ? "+1" : "-1") + " (Total: " + bluePenalties + ")";
            audit("PENALTY_BLUE", "Blue Penalties: " + bluePenalties);
        }
    }

    public void setPenalty(boolean isRed, int count) {
        if (isRed) redPenalties = Math.max(0, count);
        else bluePenalties = Math.max(0, count);
    }

    public void setPhase(MatchPhase newPhase) {
        pauseTimer();
        this.phase = newPhase;
        if (newPhase == MatchPhase.PENALTY_PHASE) {
            this.timeRemainingMs = defaultPenaltyDurationMs;
            this.totalSetDurationMs = defaultPenaltyDurationMs;
            recentEvent = "Switched to PENALTY PHASE";
        } else if (newPhase == MatchPhase.TIMEOUT) {
            this.timeRemainingMs = defaultTimeoutDurationMs;
            this.totalSetDurationMs = defaultTimeoutDurationMs;
            recentEvent = "TIMEOUT Called (1:00)";
        } else if (newPhase == MatchPhase.INTERMISSION) {
            this.timeRemainingMs = intermissionDurationMs;
            this.totalSetDurationMs = intermissionDurationMs;
            recentEvent = "INTERMISSION Break (" + (intermissionDurationMs / 1000) + "s)";
        } else if (newPhase == MatchPhase.SUDDEN_DEATH) {
            this.timeRemainingMs = 0;
            this.totalSetDurationMs = 0;
            recentEvent = "SUDDEN DEATH Phase - Next Goal Wins!";
        } else if (newPhase == MatchPhase.NORMAL_PHASE) {
            recentEvent = "NORMAL GAMEPLAY Phase";
        }
        audit("PHASE_CHANGE", "Phase changed to " + newPhase);
    }

    public void startCountdown() {
        pauseTimer();
        this.phase = MatchPhase.COUNTDOWN;
        this.timeRemainingMs = 5000;
        this.totalSetDurationMs = 5000;
        startTimerInternal();
        this.recentEvent = "5-Second Countdown Started";
    }

    public void startTimeout() {
        setPhase(MatchPhase.TIMEOUT);
        startTimer();
    }

    public void startSuddenDeath() {
        pauseTimer();
        dismissWinnerBanner();
        this.phase = MatchPhase.SUDDEN_DEATH;
        this.timeRemainingMs = 0;
        this.totalSetDurationMs = 0;
        startTimerInternal();
        recentEvent = "SUDDEN DEATH Started - First Goal Wins!";
        audit("SUDDEN_DEATH_START", recentEvent);
    }

    public void startIntermission() {
        dismissWinnerBanner();
        // If current set has been awarded, advance to next set and reset live set scores
        boolean setAlreadyAwarded = completedSets.stream().anyMatch(s -> s.getSetNumber() == currentSet);
        if (setAlreadyAwarded && currentSet < maxSets && phase != MatchPhase.MATCH_ENDED) {
            currentSet++;
            resetSetScores();
            redPenalties = 0;
            bluePenalties = 0;
        }
        setPhase(MatchPhase.INTERMISSION);
        startTimer();
    }

    public void setIntermissionDurationMs(long durationMs, boolean isAdminOverride) {
        stateLock.lock();
        try {
            setIntermissionDurationInternal(durationMs, isAdminOverride);
            stateVersion++;
        } finally {
            stateLock.unlock();
        }
        broadcastState();
    }

    private void setIntermissionDurationInternal(long durationMs, boolean isAdminOverride) {
        if (durationMs <= 0) return;
        this.intermissionDurationMs = durationMs;
        if (phase == MatchPhase.INTERMISSION) {
            if (!timerRunning) {
                this.timeRemainingMs = durationMs;
                this.totalSetDurationMs = durationMs;
            } else {
                this.totalSetDurationMs = durationMs;
            }
        }
        String overrideSuffix = isAdminOverride ? " (Admin Override)" : "";
        recentEvent = "Intermission Duration set to " + (durationMs / 1000) + "s" + overrideSuffix;
        audit("INTERMISSION_CONFIG", "Intermission duration set to " + durationMs + "ms" + overrideSuffix);
    }

    public long getIntermissionDurationMs() {
        return this.intermissionDurationMs;
    }

    public void awardSet(String winner) {
        if (phase == MatchPhase.MATCH_ENDED) {
            log.warn("Arena {} - Cannot award set: Match has already concluded.", arenaId);
            return;
        }

        pauseTimer();

        // Check if current set has already been awarded to prevent runaway set wins
        SetSummaryDTO existingSet = completedSets.stream()
                .filter(s -> s.getSetNumber() == currentSet)
                .findFirst()
                .orElse(null);

        if (existingSet != null) {
            if (winner.equalsIgnoreCase(existingSet.getWinner())) {
                log.info("Arena {} - Set {} already awarded to {}. Ignoring duplicate award.", arenaId, currentSet, winner);
                return;
            }
            // Reversing previous winner for this set
            if ("RED".equalsIgnoreCase(existingSet.getWinner())) {
                redSetScore = Math.max(0, redSetScore - 1);
            } else if ("BLUE".equalsIgnoreCase(existingSet.getWinner())) {
                blueSetScore = Math.max(0, blueSetScore - 1);
            }
        }

        if ("RED".equalsIgnoreCase(winner)) {
            redSetScore++;
        } else if ("BLUE".equalsIgnoreCase(winner)) {
            blueSetScore++;
        }

        SetSummaryDTO setSummary = SetSummaryDTO.builder()
                .setNumber(currentSet)
                .redScore(redScore)
                .blueScore(blueScore)
                .redPenalties(redPenalties)
                .bluePenalties(bluePenalties)
                .winner(winner)
                .durationSeconds((defaultSetDurationMs - timeRemainingMs) / 1000)
                .build();

        completedSets.removeIf(s -> s.getSetNumber() == currentSet);
        completedSets.add(setSummary);
        matchStarted = true;

        recentEvent = "Set " + currentSet + " Awarded to " + winner;
        audit("SET_AWARD", "Set " + currentSet + " Winner: " + winner);

        // Check if match won
        int setsNeededToWin = (maxSets / 2) + 1;
        boolean isMatchWon = (redSetScore >= setsNeededToWin || blueSetScore >= setsNeededToWin);

        String winnerName = "RED".equalsIgnoreCase(winner) ? teamRed : ("BLUE".equalsIgnoreCase(winner) ? teamBlue : "Tie");
        String winnerLogoUrl = "RED".equalsIgnoreCase(winner) ? teamRedLogoUrl : ("BLUE".equalsIgnoreCase(winner) ? teamBlueLogoUrl : null);
        int setsWon = "RED".equalsIgnoreCase(winner) ? redSetScore : ("BLUE".equalsIgnoreCase(winner) ? blueSetScore : 0);

        this.setWinnerBanner = SetWinnerBannerDTO.builder()
                .active(true)
                .winner(winner)
                .winnerName(winnerName)
                .winnerLogoUrl(winnerLogoUrl)
                .redSetScore(redSetScore)
                .blueSetScore(blueSetScore)
                .setsWon(setsWon)
                .currentSet(currentSet)
                .maxSets(maxSets)
                .isMatchWinner(isMatchWon)
                .build();

        if (isMatchWon || currentSet >= maxSets) {
            confirmMatchEnd();
        } else {
            // Decoupled intermission: Hold in IDLE with timer paused at 00:00 awaiting referee to trigger intermission or dismiss banner
            phase = MatchPhase.IDLE;
            timeRemainingMs = 0;
        }
    }

    public void dismissWinnerBanner() {
        if (this.setWinnerBanner != null) {
            this.setWinnerBanner.setActive(false);
            this.setWinnerBanner = null;
            recentEvent = "Winner Banner Dismissed";
            audit("BANNER_DISMISS", "Winner banner dismissed");
        }
    }

    public void advanceToNextSet() {
        if (currentSet < maxSets) {
            dismissWinnerBanner();
            currentSet++;
            resetSetScores();
            redPenalties = 0;
            bluePenalties = 0;
            resetSetTimer();
            phase = MatchPhase.IDLE;
            recentEvent = "Advanced to Set " + currentSet;
        }
    }

    public void returnToPrevSet() {
        if (currentSet > 1) {
            currentSet--;
            recentEvent = "Returned to Set " + currentSet;
        }
    }

    public void confirmMatchEnd() {
        pauseTimer();
        phase = MatchPhase.MATCH_ENDED;
        if (redSetScore > blueSetScore) {
            matchWinner = "RED";
        } else if (blueSetScore > redSetScore) {
            matchWinner = "BLUE";
        } else {
            matchWinner = "TIE";
        }
        recentEvent = "MATCH CONCLUDED - Winner: " + matchWinner;
        audit("MATCH_END", "Match Ended. Winner: " + matchWinner);

        // Persist to database
        saveMatchToDatabase();
    }

    private void saveMatchToDatabase() {
        try {
            MatchRecord record = MatchRecord.builder()
                    .id(currentMatchId)
                    .matchAuditKey(matchAuditKey)
                    .matchNumber(matchNumber)
                    .arenaId(arenaId)
                    .tournamentName(tournamentName)
                    .teamRed(teamRed)
                    .teamBlue(teamBlue)
                    .redSetScore(redSetScore)
                    .blueSetScore(blueSetScore)
                    .winner(matchWinner)
                    .status("COMPLETED")
                    .startTime(LocalDateTime.now().minusMinutes(15))
                    .endTime(LocalDateTime.now())
                    .setRecords(new ArrayList<>())
                    .build();

            for (SetSummaryDTO setDTO : completedSets) {
                SetRecord setRec = SetRecord.builder()
                        .matchRecord(record)
                        .setNumber(setDTO.getSetNumber())
                        .redScore(setDTO.getRedScore())
                        .blueScore(setDTO.getBlueScore())
                        .redPenalties(setDTO.getRedPenalties())
                        .bluePenalties(setDTO.getBluePenalties())
                        .winner(setDTO.getWinner())
                        .durationSeconds(setDTO.getDurationSeconds())
                        .endedAt(LocalDateTime.now())
                        .build();
                record.getSetRecords().add(setRec);
            }

            MatchRecord saved = matchRecordRepository.save(record);
            this.currentMatchId = saved.getId();
            log.info("Persisted match record ID {} to SQLite database.", saved.getId());
        } catch (Exception e) {
            log.error("Failed to persist completed match to SQLite: {}", e.getMessage(), e);
        }
    }

    public void setTeamLogoResolver(TeamLogoResolver resolver) {
        stateLock.lock();
        try {
            this.teamLogoResolver = resolver;
            if (resolver != null) {
                this.teamRedLogoUrl = resolver.resolveLogoUrl(this.teamRed);
                this.teamBlueLogoUrl = resolver.resolveLogoUrl(this.teamBlue);
            }
        } finally {
            stateLock.unlock();
        }
    }

    public void updateTeamLogoIfMatching(String teamName, String newLogoUrl) {
        stateLock.lock();
        boolean changed = false;
        try {
            if (this.teamRed != null && this.teamRed.equalsIgnoreCase(teamName)) {
                this.teamRedLogoUrl = newLogoUrl;
                changed = true;
            }
            if (this.teamBlue != null && this.teamBlue.equalsIgnoreCase(teamName)) {
                this.teamBlueLogoUrl = newLogoUrl;
                changed = true;
            }
            if (changed) {
                stateVersion++;
            }
        } finally {
            stateLock.unlock();
        }
        if (changed) {
            broadcastState();
        }
    }

    public void loadMatch(MatchControlCommand cmd) {
        pauseTimer();
        if (cmd.getTeamRed() != null) {
            this.teamRed = cmd.getTeamRed();
            this.teamRedLogoUrl = teamLogoResolver != null ? teamLogoResolver.resolveLogoUrl(this.teamRed) : null;
        }
        if (cmd.getTeamBlue() != null) {
            this.teamBlue = cmd.getTeamBlue();
            this.teamBlueLogoUrl = teamLogoResolver != null ? teamLogoResolver.resolveLogoUrl(this.teamBlue) : null;
        }
        if (cmd.getMatchNumber() != null) this.matchNumber = cmd.getMatchNumber();
        if (cmd.getTournamentName() != null) this.tournamentName = cmd.getTournamentName();

        resetMatchState();
        recentEvent = "Loaded Match " + this.matchNumber + " (" + this.teamRed + " vs " + this.teamBlue + ")";
        audit("MATCH_LOAD", recentEvent);
    }

    public void loadMatchDirect(String red, String blue, String matchNum, String tournament) {
        stateLock.lock();
        try {
            pauseTimer();
            if (red != null && !red.isBlank()) {
                this.teamRed = red;
                this.teamRedLogoUrl = teamLogoResolver != null ? teamLogoResolver.resolveLogoUrl(this.teamRed) : null;
            }
            if (blue != null && !blue.isBlank()) {
                this.teamBlue = blue;
                this.teamBlueLogoUrl = teamLogoResolver != null ? teamLogoResolver.resolveLogoUrl(this.teamBlue) : null;
            }
            if (matchNum != null && !matchNum.isBlank()) this.matchNumber = matchNum;
            if (tournament != null && !tournament.isBlank()) this.tournamentName = tournament;

            resetMatchState();
            recentEvent = "Loaded Match " + this.matchNumber + " (" + this.teamRed + " vs " + this.teamBlue + ")";
            audit("MATCH_LOAD", recentEvent);
            stateVersion++;
        } finally {
            stateLock.unlock();
        }
        broadcastState();
    }

    public void updateTeams(String red, String blue, String matchNum) {
        String previousRed = teamRed;
        String previousBlue = teamBlue;
        if (red != null && !red.isBlank()) {
            this.teamRed = red;
            this.teamRedLogoUrl = teamLogoResolver != null ? teamLogoResolver.resolveLogoUrl(this.teamRed) : null;
        }
        if (blue != null && !blue.isBlank()) {
            this.teamBlue = blue;
            this.teamBlueLogoUrl = teamLogoResolver != null ? teamLogoResolver.resolveLogoUrl(this.teamBlue) : null;
        }
        if (matchNum != null && !matchNum.isBlank()) this.matchNumber = matchNum;
        boolean redChanged = !previousRed.strip().equalsIgnoreCase(teamRed.strip());
        boolean blueChanged = !previousBlue.strip().equalsIgnoreCase(teamBlue.strip());
        if (redChanged) clearLineup(Side.RED);
        if (blueChanged) clearLineup(Side.BLUE);
        if (redChanged || blueChanged) refreshCheckInMatchToken();
        recentEvent = "Updated Teams: " + this.teamRed + " vs " + this.teamBlue;
    }

    public void resetMatch() {
        resetMatchState();
        recentEvent = "Match Reset to Beginning";
        audit("MATCH_RESET", "Match Reset");
    }

    private void resetMatchState() {
        pauseTimer();
        currentMatchId = null;
        matchAuditKey = UUID.randomUUID().toString();
        lineups.clear();
        strikerHistory.values().forEach(Map::clear);
        refreshCheckInMatchToken();
        matchStarted = false;
        resetSetScores();
        redSetScore = 0;
        blueSetScore = 0;
        redPenalties = 0;
        bluePenalties = 0;
        currentSet = 1;
        matchWinner = null;
        setWinnerBanner = null;
        phase = MatchPhase.IDLE;
        completedSets.clear();
        timeRemainingMs = defaultSetDurationMs;
        totalSetDurationMs = defaultSetDurationMs;
    }

    private void resetSetScores() {
        redScore = 0;
        blueScore = 0;
        goalCredits.values().forEach(Map::clear);
    }

    private void clearLineup(Side side) {
        lineups.remove(side);
        strikerHistory.get(side).put(stateVersion + 1, null);
    }

    private void audit(String event, String description) {
        auditService.logEvent(arenaId, currentMatchId, matchAuditKey, event, description, null);
    }

    private void refreshCheckInMatchToken() {
        checkInMatchToken = hasNamedTeam(teamRed) && hasNamedTeam(teamBlue) ? UUID.randomUUID() : null;
    }

    private boolean hasNamedTeam(String name) {
        return !name.isBlank() && !"TBD".equalsIgnoreCase(name.strip());
    }

    public ArenaCheckInDTO getCheckIn() {
        stateLock.lock();
        try {
            return checkInSnapshot(null);
        } finally {
            stateLock.unlock();
        }
    }

    private ArenaCheckInDTO checkInSnapshot(ArenaStateDTO arenaState) {
        return new ArenaCheckInDTO(arenaName, matchNumber, checkInMatchToken, canCheckIn(),
                phase == MatchPhase.MATCH_ENDED,
                new ArenaCheckInDTO.Team(teamRed, teamRedLogoUrl, lineups.get(Side.RED)),
                new ArenaCheckInDTO.Team(teamBlue, teamBlueLogoUrl, lineups.get(Side.BLUE)),
                arenaState);
    }

    public ArenaCheckInDTO checkInTeam(UUID matchToken, Side side, UUID lineupVersion,
                                      List<TeamPlayerDTO> players, UUID strikerId) {
        ArenaCheckInDTO snapshot;
        stateLock.lock();
        try {
            requireCurrentLineup(matchToken, side, lineupVersion);
            if (!canCheckIn()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Lineups close when the match starts.");
            }
            String details;
            TeamPlayerDTO striker = null;
            if (players.isEmpty() && strikerId == null) {
                details = "Checked in without registered players.";
            } else {
                striker = findStriker(players, strikerId);
                details = "Flying players: " + String.join(", ", players.stream().map(TeamPlayerDTO::name).toList())
                        + ". Striker: " + striker.name();
            }
            lineups.put(side, new Lineup(UUID.randomUUID(), List.copyOf(players), strikerId));
            strikerHistory.get(side).put(++stateVersion, striker);
            audit("TEAM_CHECK_IN", checkInAuditPrefix(side) + details);
            snapshot = checkInSnapshot(toDTO());
        } finally {
            stateLock.unlock();
        }
        broadcastState();
        return snapshot;
    }

    public ArenaCheckInDTO changeStriker(UUID matchToken, Side side, UUID lineupVersion, UUID strikerId) {
        ArenaCheckInDTO snapshot;
        stateLock.lock();
        try {
            Lineup lineup = requireCurrentLineup(matchToken, side, lineupVersion);
            if (phase == MatchPhase.MATCH_ENDED || lineup == null) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "A checked-in team in an open match is required.");
            }
            if (lineup.players().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Check in a flying lineup before changing the striker.");
            }
            TeamPlayerDTO striker = findStriker(lineup.players(), strikerId);
            if (strikerId.equals(lineup.strikerId())) return checkInSnapshot(toDTO());

            lineups.put(side, new Lineup(UUID.randomUUID(), lineup.players(), strikerId));
            strikerHistory.get(side).put(++stateVersion, striker);
            audit("STRIKER_CHANGE", checkInAuditPrefix(side) + "New striker " + striker.name());
            snapshot = checkInSnapshot(toDTO());
        } finally {
            stateLock.unlock();
        }
        broadcastState();
        return snapshot;
    }

    private boolean canCheckIn() {
        return checkInMatchToken != null && !matchStarted && phase != MatchPhase.MATCH_ENDED;
    }

    private Lineup requireCurrentLineup(UUID matchToken, Side side, UUID lineupVersion) {
        if (checkInMatchToken == null || !checkInMatchToken.equals(matchToken)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The match or its teams changed. Review the current match.");
        }
        Lineup lineup = lineups.get(side);
        if (!Objects.equals(lineupVersion, lineup == null ? null : lineup.version())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This team's lineup changed. Review it and try again.");
        }
        return lineup;
    }

    private TeamPlayerDTO findStriker(List<TeamPlayerDTO> players, UUID strikerId) {
        return players.stream().filter(player -> player.id().equals(strikerId)).findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Choose a striker from the flying lineup."));
    }

    private String checkInAuditPrefix(Side side) {
        return "Match " + matchNumber + ", " + (side == Side.RED ? teamRed : teamBlue) + " (" + side + "). ";
    }

    public ArenaStateDTO toDTO() {
        stateLock.lock();
        try {
            long currentRemaining = timeRemainingMs;
            if (timerRunning) {
                if (phase == MatchPhase.SUDDEN_DEATH) {
                    long elapsed = (System.nanoTime() - timerStartNano) / 1_000_000;
                    currentRemaining = elapsed;
                } else {
                    long elapsed = (System.nanoTime() - timerStartNano) / 1_000_000;
                    currentRemaining = Math.max(0, timerInitialRemainingMs - elapsed);
                }
            }

            return ArenaStateDTO.builder()
                    .arenaId(arenaId)
                    .arenaName(arenaName)
                    .matchId(currentMatchId)
                    .matchSessionId(matchAuditKey)
                    .matchNumber(matchNumber)
                    .tournamentName(tournamentName)
                    .teamRed(teamRed)
                    .teamBlue(teamBlue)
                    .teamRedLogoUrl(teamRedLogoUrl)
                    .teamBlueLogoUrl(teamBlueLogoUrl)
                    .redScore(redScore)
                    .blueScore(blueScore)
                    .redSetScore(redSetScore)
                    .blueSetScore(blueSetScore)
                    .redPenalties(redPenalties)
                    .bluePenalties(bluePenalties)
                    .currentSet(currentSet)
                    .maxSets(maxSets)
                    .timeRemainingMs(currentRemaining)
                    .totalSetDurationMs(totalSetDurationMs)
                    .intermissionDurationMs(intermissionDurationMs)
                    .timerRunning(timerRunning)
                    .phase(phase)
                    .sideSwap(sideSwap)
                    .matchWinner(matchWinner)
                    .setWinnerBanner(setWinnerBanner)
                    .stateVersion(stateVersion)
                    .lastCommandId(lastCommandId)
                    .serverEpochMs(System.currentTimeMillis())
                    .recentEvent(recentEvent)
                    .completedSets(new ArrayList<>(completedSets))
                    .build();
        } finally {
            stateLock.unlock();
        }
    }

    public ArenaSummaryDTO toSummaryDTO() {
        ArenaStateDTO full = toDTO();
        return ArenaSummaryDTO.builder()
                .arenaId(full.getArenaId())
                .arenaName(full.getArenaName())
                .matchId(full.getMatchId())
                .matchNumber(full.getMatchNumber())
                .tournamentName(full.getTournamentName())
                .teamRed(full.getTeamRed())
                .teamBlue(full.getTeamBlue())
                .teamRedLogoUrl(full.getTeamRedLogoUrl())
                .teamBlueLogoUrl(full.getTeamBlueLogoUrl())
                .redScore(full.getRedScore())
                .blueScore(full.getBlueScore())
                .redSetScore(full.getRedSetScore())
                .blueSetScore(full.getBlueSetScore())
                .redPenalties(full.getRedPenalties())
                .bluePenalties(full.getBluePenalties())
                .currentSet(full.getCurrentSet())
                .maxSets(full.getMaxSets())
                .timeRemainingMs(full.getTimeRemainingMs())
                .totalSetDurationMs(full.getTotalSetDurationMs())
                .intermissionDurationMs(full.getIntermissionDurationMs())
                .timerRunning(full.isTimerRunning())
                .phase(full.getPhase())
                .sideSwap(full.isSideSwap())
                .matchWinner(full.getMatchWinner())
                .setWinnerBanner(full.getSetWinnerBanner())
                .stateVersion(full.getStateVersion())
                .serverEpochMs(full.getServerEpochMs())
                .build();
    }

    private void broadcastState() {
        try {
            lastBroadcastNano = System.nanoTime();
            ArenaStateDTO state = toDTO();
            messagingTemplate.convertAndSend("/topic/arena/" + arenaId + "/state", state);
        } catch (Exception e) {
            log.warn("Failed to broadcast state for Arena {}: {}", arenaId, e.getMessage());
        }
    }

    private void broadcastBuzzerEvent(String reason) {
        try {
            messagingTemplate.convertAndSend("/topic/arena/" + arenaId + "/buzzer", 
                    Collections.singletonMap("buzzerEvent", reason));
        } catch (Exception e) {
            log.warn("Failed to broadcast buzzer event for Arena {}: {}", arenaId, e.getMessage());
        }
    }
}
