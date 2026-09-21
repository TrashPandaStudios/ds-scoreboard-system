package com.dronesoccer.scoreboard.engine;

import com.dronesoccer.scoreboard.model.dto.*;
import com.dronesoccer.scoreboard.model.entity.MatchRecord;
import com.dronesoccer.scoreboard.model.entity.SetRecord;
import com.dronesoccer.scoreboard.repository.MatchRecordRepository;
import com.dronesoccer.scoreboard.repository.SetRecordRepository;
import com.dronesoccer.scoreboard.service.HardwareBuzzerService;
import com.dronesoccer.scoreboard.service.MatchAuditService;
import com.dronesoccer.scoreboard.service.TeamLogoResolver;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.locks.ReentrantLock;

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
    private String matchNumber = "M-101";
    private String tournamentName = "National Drone Soccer Cup";

    // Teams
    private String teamRed = "Red Phoenix";
    private String teamBlue = "Blue Comets";
    private String teamRedLogoUrl;
    private String teamBlueLogoUrl;
    private TeamLogoResolver teamLogoResolver;

    // Live Set State
    private int redScore = 0;
    private int blueScore = 0;
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
    private boolean timerRunning = false;
    private long timerStartNano = 0;
    private long timerInitialRemainingMs = 0;

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

        this.timeRemainingMs = defaultSetDurationMs;
        this.totalSetDurationMs = defaultSetDurationMs;
    }

    /**
     * 10 Hz (100ms) authoritative tick called by ArenaManagerService.
     */
    public void tick() {
        boolean broadcastRequired = false;
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
                        broadcastRequired = true;
                    } else {
                        timeRemainingMs = updated;
                    }
                }
            }
        } finally {
            stateLock.unlock();
        }

        // Broadcast authoritative state every 100ms
        broadcastState();
    }

    private void onTimerExpired() {
        log.info("Arena {} - Timer reached 00:00 in phase {}", arenaId, phase);
        recentEvent = "Time Expired - Buzzer Triggered";

        // 1. Trigger hardware buzzer & WebSocket buzzer event
        buzzerService.triggerBuzzer(arenaId, "Timer 00:00 Expired in " + phase);
        broadcastBuzzerEvent("TIMER_ZERO");
        auditService.logEvent(arenaId, currentMatchId, "BUZZER_ZERO", "Timer hit 00:00 in " + phase, null);

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
     */
    public void processCommand(MatchControlCommand command) {
        stateLock.lock();
        try {
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
                
                case ADD_RED_SCORE -> addScore(true, 1);
                case SUB_RED_SCORE -> addScore(true, -1);
                case ADD_BLUE_SCORE -> addScore(false, 1);
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
                    auditService.logEvent(arenaId, currentMatchId, "SWAP_SIDES", "Side swap toggled to " + sideSwap, null);
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
                    auditService.logEvent(arenaId, currentMatchId, "BUZZER_MANUAL", "Manual Buzzer Triggered", null);
                }

                case LOAD_MATCH -> loadMatch(command);
                case RESET_MATCH -> resetMatch();
                case UPDATE_TEAMS -> updateTeams(command.getTeamRed(), command.getTeamBlue(), command.getMatchNumber());
                case CONFIRM_MATCH_END -> confirmMatchEnd();
                case START_SUDDEN_DEATH -> startSuddenDeath();
                case DISMISS_WINNER_BANNER -> dismissWinnerBanner();
            }
        } finally {
            stateLock.unlock();
        }

        // Instant WebSocket push on mutation
        broadcastState();
    }

    public void startTimer() {
        if (!timerRunning && timeRemainingMs > 0) {
            startTimerInternal();
            if (phase == MatchPhase.IDLE) {
                phase = MatchPhase.NORMAL_PHASE;
            }
            recentEvent = "Timer Started";
            auditService.logEvent(arenaId, currentMatchId, "TIMER_START", "Timer started at " + timeRemainingMs + "ms", null);
        }
    }

    private void startTimerInternal() {
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
            auditService.logEvent(arenaId, currentMatchId, "TIMER_PAUSE", "Timer paused at " + timeRemainingMs + "ms", null);
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
        if (isRed) {
            redScore = Math.max(0, redScore + delta);
            recentEvent = "Red Score " + (delta > 0 ? "+1" : "-1") + " (" + redScore + ")";
            auditService.logEvent(arenaId, currentMatchId, delta > 0 ? "SCORE_RED_PLUS" : "SCORE_RED_MINUS", "Red Score: " + redScore, null);
        } else {
            blueScore = Math.max(0, blueScore + delta);
            recentEvent = "Blue Score " + (delta > 0 ? "+1" : "-1") + " (" + blueScore + ")";
            auditService.logEvent(arenaId, currentMatchId, delta > 0 ? "SCORE_BLUE_PLUS" : "SCORE_BLUE_MINUS", "Blue Score: " + blueScore, null);
        }

        // Sudden death rule: first team to score (+1) immediately wins the set
        if (phase == MatchPhase.SUDDEN_DEATH && delta > 0) {
            log.info("Arena {} - Sudden Death Goal scored by {} team!", arenaId, isRed ? "RED" : "BLUE");
            awardSet(isRed ? "RED" : "BLUE");
        }
    }

    public void setScore(boolean isRed, int score) {
        if (isRed) {
            redScore = Math.max(0, score);
            recentEvent = "Red Score set to " + redScore;
        } else {
            blueScore = Math.max(0, score);
            recentEvent = "Blue Score set to " + blueScore;
        }
    }

    public void addPenalty(boolean isRed, int delta) {
        if (isRed) {
            redPenalties = Math.max(0, redPenalties + delta);
            recentEvent = "Red Penalty " + (delta > 0 ? "+1" : "-1") + " (Total: " + redPenalties + ")";
            auditService.logEvent(arenaId, currentMatchId, "PENALTY_RED", "Red Penalties: " + redPenalties, null);
        } else {
            bluePenalties = Math.max(0, bluePenalties + delta);
            recentEvent = "Blue Penalty " + (delta > 0 ? "+1" : "-1") + " (Total: " + bluePenalties + ")";
            auditService.logEvent(arenaId, currentMatchId, "PENALTY_BLUE", "Blue Penalties: " + bluePenalties, null);
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
        auditService.logEvent(arenaId, currentMatchId, "PHASE_CHANGE", "Phase changed to " + newPhase, null);
    }

    public void startCountdown() {
        pauseTimer();
        this.phase = MatchPhase.COUNTDOWN;
        this.timeRemainingMs = 5000;
        this.totalSetDurationMs = 5000;
        this.timerRunning = true;
        this.timerStartNano = System.nanoTime();
        this.timerInitialRemainingMs = 5000;
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
        this.timerRunning = true;
        this.timerStartNano = System.nanoTime();
        this.timerInitialRemainingMs = 0;
        recentEvent = "SUDDEN DEATH Started - First Goal Wins!";
        auditService.logEvent(arenaId, currentMatchId, "SUDDEN_DEATH_START", recentEvent, null);
    }

    public void startIntermission() {
        dismissWinnerBanner();
        // If current set has been awarded, advance to next set and reset live set scores
        boolean setAlreadyAwarded = completedSets.stream().anyMatch(s -> s.getSetNumber() == currentSet);
        if (setAlreadyAwarded && currentSet < maxSets && phase != MatchPhase.MATCH_ENDED) {
            currentSet++;
            redScore = 0;
            blueScore = 0;
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
        auditService.logEvent(arenaId, currentMatchId, "INTERMISSION_CONFIG",
                "Intermission duration set to " + durationMs + "ms" + overrideSuffix, null);
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

        recentEvent = "Set " + currentSet + " Awarded to " + winner;
        auditService.logEvent(arenaId, currentMatchId, "SET_AWARD", "Set " + currentSet + " Winner: " + winner, null);

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
            auditService.logEvent(arenaId, currentMatchId, "BANNER_DISMISS", "Winner banner dismissed", null);
        }
    }

    public void advanceToNextSet() {
        if (currentSet < maxSets) {
            dismissWinnerBanner();
            currentSet++;
            redScore = 0;
            blueScore = 0;
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
        auditService.logEvent(arenaId, currentMatchId, "MATCH_END", "Match Ended. Winner: " + matchWinner, null);

        // Persist to database
        saveMatchToDatabase();
    }

    private void saveMatchToDatabase() {
        try {
            MatchRecord record = MatchRecord.builder()
                    .id(currentMatchId)
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
        auditService.logEvent(arenaId, currentMatchId, "MATCH_LOAD", recentEvent, null);
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
            auditService.logEvent(arenaId, currentMatchId, "MATCH_LOAD", recentEvent, null);
        } finally {
            stateLock.unlock();
        }
        broadcastState();
    }

    public void updateTeams(String red, String blue, String matchNum) {
        if (red != null && !red.isBlank()) {
            this.teamRed = red;
            this.teamRedLogoUrl = teamLogoResolver != null ? teamLogoResolver.resolveLogoUrl(this.teamRed) : null;
        }
        if (blue != null && !blue.isBlank()) {
            this.teamBlue = blue;
            this.teamBlueLogoUrl = teamLogoResolver != null ? teamLogoResolver.resolveLogoUrl(this.teamBlue) : null;
        }
        if (matchNum != null && !matchNum.isBlank()) this.matchNumber = matchNum;
        recentEvent = "Updated Teams: " + this.teamRed + " vs " + this.teamBlue;
    }

    public void resetMatch() {
        resetMatchState();
        recentEvent = "Match Reset to Beginning";
        auditService.logEvent(arenaId, currentMatchId, "MATCH_RESET", "Match Reset", null);
    }

    private void resetMatchState() {
        pauseTimer();
        currentMatchId = null;
        redScore = 0;
        blueScore = 0;
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
                .teamRed(full.getTeamRed())
                .teamBlue(full.getTeamBlue())
                .teamRedLogoUrl(full.getTeamRedLogoUrl())
                .teamBlueLogoUrl(full.getTeamBlueLogoUrl())
                .redScore(full.getRedScore())
                .blueScore(full.getBlueScore())
                .redSetScore(full.getRedSetScore())
                .blueSetScore(full.getBlueSetScore())
                .currentSet(full.getCurrentSet())
                .maxSets(full.getMaxSets())
                .timeRemainingMs(full.getTimeRemainingMs())
                .intermissionDurationMs(full.getIntermissionDurationMs())
                .timerRunning(full.isTimerRunning())
                .phase(full.getPhase())
                .sideSwap(full.isSideSwap())
                .setWinnerBanner(full.getSetWinnerBanner())
                .serverEpochMs(full.getServerEpochMs())
                .build();
    }

    private void broadcastState() {
        try {
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
