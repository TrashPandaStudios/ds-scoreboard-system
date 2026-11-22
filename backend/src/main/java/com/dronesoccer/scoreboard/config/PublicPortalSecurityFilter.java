package com.dronesoccer.scoreboard.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
@RequiredArgsConstructor
public class PublicPortalSecurityFilter extends OncePerRequestFilter {

    private final PublicPortalSecurity publicPortalSecurity;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        if (!publicPortalSecurity.isPublicRequest(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        response.setHeader("X-Scoreboard-Portal", "public");

        String method = request.getMethod();
        String path = request.getRequestURI();

        // 1) Allow WebSocket & SockJS transport endpoints (PublicPortalWebSocketInterceptor enforces subscribe-only STOMP lockdown)
        if (path.startsWith("/ws-scoreboard")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 2) Strictly read-only HTTP methods for all other public portal routes
        if (!"GET".equalsIgnoreCase(method)
                && !"HEAD".equalsIgnoreCase(method)
                && !"OPTIONS".equalsIgnoreCase(method)) {
            log.warn("Blocked non-read-only public request: {} {}", method, path);
            writeForbidden(response, "Read-only public portal: mutations are not permitted.");
            return;
        }

        // 3) Allowlist API routes exposed to the public spectator portal
        if (path.startsWith("/api/")) {
            if (!publicPortalSecurity.isAllowedPublicApiPath(path)) {
                log.warn("Blocked restricted API route on public portal: {} {}", method, path);
                writeForbidden(response, "This endpoint is not available on the public spectator portal.");
                return;
            }
            filterChain.doFilter(request, response);
            return;
        }

        // 4) Redirect any staff/admin/referee/overlay SPA routes cleanly back to the public live home
        if (publicPortalSecurity.isBlockedPublicSpaPath(path)) {
            response.setStatus(HttpServletResponse.SC_FOUND);
            response.setHeader("Location", "/");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void writeForbidden(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write("{\"error\":\"" + message.replace("\"", "\\\"") + "\"}");
    }
}
