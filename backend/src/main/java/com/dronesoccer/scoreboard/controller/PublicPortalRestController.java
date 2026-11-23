package com.dronesoccer.scoreboard.controller;

import com.dronesoccer.scoreboard.config.PublicPortalProperties;
import com.dronesoccer.scoreboard.config.PublicPortalSecurity;
import com.dronesoccer.scoreboard.engine.ArenaManagerService;
import com.dronesoccer.scoreboard.engine.ArenaMatchEngine;
import com.dronesoccer.scoreboard.model.dto.ArenaStateDTO;
import com.dronesoccer.scoreboard.model.dto.ArenaSummaryDTO;
import com.dronesoccer.scoreboard.model.dto.MatchPhase;
import com.dronesoccer.scoreboard.model.dto.PublicScheduledMatchDTO;
import com.dronesoccer.scoreboard.model.entity.MatchRecord;
import com.dronesoccer.scoreboard.model.entity.ScheduledMatch;
import com.dronesoccer.scoreboard.model.entity.SponsorItem;
import com.dronesoccer.scoreboard.repository.MatchRecordRepository;
import com.dronesoccer.scoreboard.repository.SponsorItemRepository;
import com.dronesoccer.scoreboard.service.TeamLogoResolver;
import com.dronesoccer.scoreboard.service.TournamentQueueService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class PublicPortalRestController {

    private final ArenaManagerService arenaManagerService;
    private final MatchRecordRepository matchRecordRepository;
    private final TournamentQueueService queueService;
    private final SponsorItemRepository sponsorItemRepository;
    private final TeamLogoResolver teamLogoResolver;
    private final PublicPortalSecurity publicPortalSecurity;
    private final PublicPortalProperties publicPortalProperties;

    @GetMapping("/api/public/context")
    public ResponseEntity<Map<String, Object>> getPortalContext(HttpServletRequest request) {
        boolean isPublic = publicPortalSecurity.isPublicRequest(request);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("publicPortal", isPublic);
        body.put("portalMode", isPublic ? "public" : "staff");
        body.put("serverEpochMs", System.currentTimeMillis());
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(body);
    }

    @GetMapping("/api/public/overview")
    public ResponseEntity<Map<String, Object>> getPublicOverview() {
        List<ArenaSummaryDTO> arenas = arenaManagerService.getAllSummaries().stream()
                .sorted(Comparator.comparing(ArenaSummaryDTO::getArenaId))
                .toList();

        List<MatchRecord> recentMatches = matchRecordRepository.findByOrderByCreatedAtDesc().stream()
                .limit(50)
                .toList();

        List<ScheduledMatch> upcomingMatches = queueService.getAllScheduledMatches().stream()
                .filter(m -> !"COMPLETED".equalsIgnoreCase(m.getStatus()) && !"SKIPPED".equalsIgnoreCase(m.getStatus()))
                .toList();

        List<SponsorItem> sponsors = sponsorItemRepository.findByActiveTrueOrderByOrderIndexAsc();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("arenas", arenas);
        body.put("recentMatches", recentMatches);
        body.put("upcomingMatches", upcomingMatches);
        body.put("sponsors", sponsors);
        body.put("serverEpochMs", System.currentTimeMillis());

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(body);
    }

    /**
     * Public listing of all active arenas with their live summary, next match on deck,
     * and upcoming queue count. Useful for arena signage discovery and tournament overview displays.
     */
    @GetMapping("/api/public/arenas")
    public ResponseEntity<Map<String, Object>> getPublicArenas() {
        List<ArenaSummaryDTO> summaries = arenaManagerService.getAllSummaries().stream()
                .sorted(Comparator.comparing(ArenaSummaryDTO::getArenaId))
                .toList();

        List<Map<String, Object>> arenaEntries = new ArrayList<>();
        for (ArenaSummaryDTO summary : summaries) {
            ArenaMatchEngine engine = arenaManagerService.findArena(summary.getArenaId());
            ArenaStateDTO state = engine != null ? engine.toDTO() : null;
            List<PublicScheduledMatchDTO> upcoming = resolveUpcomingMatches(summary.getArenaId(), state);
            PublicScheduledMatchDTO nextMatch = upcoming.isEmpty() ? null : upcoming.get(0);

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("arenaId", summary.getArenaId());
            entry.put("arenaName", summary.getArenaName());
            entry.put("currentMatch", summary);
            entry.put("nextMatch", nextMatch);
            entry.put("upcomingCount", upcoming.size());
            arenaEntries.add(entry);
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("arenas", arenaEntries);
        body.put("serverEpochMs", System.currentTimeMillis());

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(body);
    }

    @GetMapping("/api/public/arenas/{id}")
    public ResponseEntity<Map<String, Object>> getPublicArenaDetail(
            @PathVariable Long id,
            @RequestParam(value = "upcomingLimit", required = false) Integer upcomingLimit
    ) {
        ArenaMatchEngine engine = arenaManagerService.findArena(id);
        if (engine == null) {
            return ResponseEntity.notFound().build();
        }

        ArenaStateDTO arenaState = engine.toDTO();
        List<PublicScheduledMatchDTO> allUpcoming = resolveUpcomingMatches(id, arenaState);
        PublicScheduledMatchDTO nextMatch = allUpcoming.isEmpty() ? null : allUpcoming.get(0);
        List<PublicScheduledMatchDTO> upcomingMatches = applyLimit(allUpcoming, upcomingLimit);

        List<MatchRecord> recentMatches = matchRecordRepository.findByArenaIdOrderByCreatedAtDesc(id).stream()
                .limit(15)
                .toList();
        List<SponsorItem> sponsors = sponsorItemRepository.findByActiveTrueOrderByOrderIndexAsc();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("arena", arenaState);
        body.put("currentMatch", arenaState);
        body.put("nextMatch", nextMatch);
        body.put("upcomingMatches", upcomingMatches);
        body.put("upcomingCount", allUpcoming.size());
        body.put("recentMatches", recentMatches);
        body.put("sponsors", sponsors);
        body.put("serverEpochMs", System.currentTimeMillis());

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(body);
    }

    /**
     * Granular public endpoint returning only the currently running match state for a specific arena.
     */
    @GetMapping("/api/public/arenas/{id}/current")
    public ResponseEntity<Map<String, Object>> getPublicArenaCurrentMatch(@PathVariable Long id) {
        ArenaMatchEngine engine = arenaManagerService.findArena(id);
        if (engine == null) {
            return ResponseEntity.notFound().build();
        }

        ArenaStateDTO arenaState = engine.toDTO();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("arenaId", arenaState.getArenaId());
        body.put("arenaName", arenaState.getArenaName());
        body.put("currentMatch", arenaState);
        body.put("serverEpochMs", System.currentTimeMillis());

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(body);
    }

    /**
     * Granular public endpoint returning only the next scheduled match on deck for a specific arena.
     */
    @GetMapping("/api/public/arenas/{id}/next")
    public ResponseEntity<Map<String, Object>> getPublicArenaNextMatch(@PathVariable Long id) {
        ArenaMatchEngine engine = arenaManagerService.findArena(id);
        if (engine == null) {
            return ResponseEntity.notFound().build();
        }

        ArenaStateDTO arenaState = engine.toDTO();
        List<PublicScheduledMatchDTO> upcoming = resolveUpcomingMatches(id, arenaState);
        PublicScheduledMatchDTO nextMatch = upcoming.isEmpty() ? null : upcoming.get(0);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("arenaId", arenaState.getArenaId());
        body.put("arenaName", arenaState.getArenaName());
        body.put("nextMatch", nextMatch);
        body.put("hasNextMatch", nextMatch != null);
        body.put("upcomingCount", upcoming.size());
        body.put("serverEpochMs", System.currentTimeMillis());

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(body);
    }

    /**
     * Granular public endpoint returning the upcoming scheduled matches queue for a specific arena.
     * Supports optional ?limit=N and ?includeNext=false (to return only matches after the next match).
     */
    @GetMapping("/api/public/arenas/{id}/upcoming")
    public ResponseEntity<Map<String, Object>> getPublicArenaUpcomingMatches(
            @PathVariable Long id,
            @RequestParam(value = "limit", required = false) Integer limit,
            @RequestParam(value = "includeNext", defaultValue = "true") boolean includeNext
    ) {
        ArenaMatchEngine engine = arenaManagerService.findArena(id);
        if (engine == null) {
            return ResponseEntity.notFound().build();
        }

        ArenaStateDTO arenaState = engine.toDTO();
        List<PublicScheduledMatchDTO> allUpcoming = resolveUpcomingMatches(id, arenaState);
        PublicScheduledMatchDTO nextMatch = allUpcoming.isEmpty() ? null : allUpcoming.get(0);

        List<PublicScheduledMatchDTO> filtered = (!includeNext && allUpcoming.size() > 1)
                ? allUpcoming.subList(1, allUpcoming.size())
                : (!includeNext ? List.of() : allUpcoming);

        List<PublicScheduledMatchDTO> result = applyLimit(filtered, limit);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("arenaId", arenaState.getArenaId());
        body.put("arenaName", arenaState.getArenaName());
        body.put("nextMatch", nextMatch);
        body.put("upcomingMatches", result);
        body.put("totalUpcoming", allUpcoming.size());
        body.put("serverEpochMs", System.currentTimeMillis());

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(body);
    }

    /**
     * Internal staff-only status endpoint (blocked on the public spectator port & Cloudflare Tunnel).
     * Never returns the raw Cloudflare tunnel token.
     */
    @GetMapping("/api/system/public-portal")
    public ResponseEntity<Map<String, Object>> getSystemPublicPortalStatus() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("publicPortEnabled", publicPortalProperties.isEnabled());
        body.put("publicPort", publicPortalProperties.getPort());
        body.put("tunnelConfigured", publicPortalProperties.isTunnelConfigured());
        body.put("publicSiteUrl", publicPortalProperties.getPublicSiteUrl() != null
                ? publicPortalProperties.getPublicSiteUrl().trim()
                : "");
        body.put("lockdownCloudflareHeaders", publicPortalProperties.isLockdownCloudflareHeaders());
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(body);
    }

    private List<PublicScheduledMatchDTO> resolveUpcomingMatches(Long arenaId, ArenaStateDTO currentState) {
        List<ScheduledMatch> pending = queueService.getPendingMatchesForArena(arenaId);
        List<PublicScheduledMatchDTO> result = new ArrayList<>();

        int position = 1;
        for (ScheduledMatch match : pending) {
            if (isSameAsActiveMatch(match, currentState)) {
                continue;
            }
            result.add(PublicScheduledMatchDTO.builder()
                    .id(match.getId())
                    .matchNumber(match.getMatchNumber())
                    .tournamentName(match.getTournamentName())
                    .arenaId(match.getArenaId())
                    .teamRed(match.getTeamRed())
                    .teamBlue(match.getTeamBlue())
                    .teamRedLogoUrl(teamLogoResolver.resolveLogoUrl(match.getTeamRed()))
                    .teamBlueLogoUrl(teamLogoResolver.resolveLogoUrl(match.getTeamBlue()))
                    .status(match.getStatus())
                    .scheduledTime(match.getScheduledTime())
                    .orderIndex(match.getOrderIndex())
                    .queuePosition(position)
                    .next(position == 1)
                    .build());
            position++;
        }
        return result;
    }

    private boolean isSameAsActiveMatch(ScheduledMatch scheduled, ArenaStateDTO state) {
        if (state == null || scheduled == null || state.getPhase() == MatchPhase.MATCH_ENDED) {
            return false;
        }
        if (state.getMatchNumber() == null || scheduled.getMatchNumber() == null) {
            return false;
        }
        return state.getMatchNumber().equalsIgnoreCase(scheduled.getMatchNumber())
                && equalsIgnoreCaseSafe(state.getTeamRed(), scheduled.getTeamRed())
                && equalsIgnoreCaseSafe(state.getTeamBlue(), scheduled.getTeamBlue());
    }

    private boolean equalsIgnoreCaseSafe(String a, String b) {
        if (a == null || b == null) {
            return false;
        }
        return a.trim().equalsIgnoreCase(b.trim());
    }

    private <T> List<T> applyLimit(List<T> items, Integer limit) {
        if (limit == null || limit <= 0 || limit >= items.size()) {
            return items;
        }
        return items.subList(0, limit);
    }
}
