package com.dronesoccer.scoreboard.controller;

import com.dronesoccer.scoreboard.config.PublicPortalProperties;
import com.dronesoccer.scoreboard.config.PublicPortalSecurity;
import com.dronesoccer.scoreboard.engine.ArenaManagerService;
import com.dronesoccer.scoreboard.engine.ArenaMatchEngine;
import com.dronesoccer.scoreboard.model.dto.ArenaStateDTO;
import com.dronesoccer.scoreboard.model.dto.ArenaSummaryDTO;
import com.dronesoccer.scoreboard.model.entity.MatchRecord;
import com.dronesoccer.scoreboard.model.entity.ScheduledMatch;
import com.dronesoccer.scoreboard.model.entity.SponsorItem;
import com.dronesoccer.scoreboard.repository.MatchRecordRepository;
import com.dronesoccer.scoreboard.repository.SponsorItemRepository;
import com.dronesoccer.scoreboard.service.TournamentQueueService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

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

    @GetMapping("/api/public/arenas/{id}")
    public ResponseEntity<Map<String, Object>> getPublicArenaDetail(@PathVariable Long id) {
        ArenaMatchEngine engine = arenaManagerService.findArena(id);
        if (engine == null) {
            return ResponseEntity.notFound().build();
        }

        ArenaStateDTO arenaState = engine.toDTO();
        List<ScheduledMatch> upcomingMatches = queueService.getPendingMatchesForArena(id);
        List<MatchRecord> recentMatches = matchRecordRepository.findByArenaIdOrderByCreatedAtDesc(id).stream()
                .limit(15)
                .toList();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("arena", arenaState);
        body.put("upcomingMatches", upcomingMatches);
        body.put("recentMatches", recentMatches);
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
}
