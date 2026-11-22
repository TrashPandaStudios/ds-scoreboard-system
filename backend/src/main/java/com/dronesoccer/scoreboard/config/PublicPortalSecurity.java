package com.dronesoccer.scoreboard.config;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.stereotype.Component;

import java.net.InetSocketAddress;
import java.util.List;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
public class PublicPortalSecurity {

    public static final String WS_PUBLIC_PORTAL_ATTR = "publicPortal";

    private static final Pattern PUBLIC_ARENAS_API = Pattern.compile("^/api/arenas(?:/\\d+)?/?$");
    private static final Pattern PUBLIC_MATCHES_API = Pattern.compile("^/api/matches(?:/\\d+|/arena/\\d+)?/?$");
    private static final Pattern PUBLIC_QUEUE_API = Pattern.compile("^/api/queue(?:/arena/\\d+)?/?$");
    private static final Pattern PUBLIC_TEAMS_API = Pattern.compile("^/api/teams(?:/\\d+)?/?$");
    private static final Pattern PUBLIC_TEAM_LOGOS_API = Pattern.compile("^/api/teams/logos/[^/]+$");
    private static final Pattern PUBLIC_SPONSORS_API = Pattern.compile("^/api/sponsors/?$");

    private static final Pattern PUBLIC_WS_TOPIC = Pattern.compile(
            "^/topic/(?:arenas/summary|arena/\\d+/(?:state|buzzer))$"
    );

    private static final Pattern BLOCKED_PUBLIC_SPA_PATHS = Pattern.compile(
            "^/(?:master|admin|admin-panel|referee|display|arena)(?:/.*)?$"
    );

    private final PublicPortalProperties properties;

    public boolean isPublicRequest(HttpServletRequest request) {
        if (request == null) {
            return false;
        }
        if (properties.isEnabled() && properties.getPort() > 0 && request.getLocalPort() == properties.getPort()) {
            return true;
        }
        if (hasText(request.getHeader("X-Public-Portal"))
                && "true".equalsIgnoreCase(request.getHeader("X-Public-Portal").trim())) {
            return true;
        }
        if (properties.isLockdownCloudflareHeaders()) {
            if (hasText(request.getHeader("CF-Ray")) || hasText(request.getHeader("CF-Connecting-IP"))) {
                return true;
            }
        }
        return false;
    }

    public boolean isPublicRequest(ServerHttpRequest request) {
        if (request == null) {
            return false;
        }
        InetSocketAddress localAddress = request.getLocalAddress();
        if (properties.isEnabled() && properties.getPort() > 0 && localAddress != null
                && localAddress.getPort() == properties.getPort()) {
            return true;
        }
        HttpHeaders headers = request.getHeaders();
        String explicit = firstHeader(headers, "X-Public-Portal");
        if (hasText(explicit) && "true".equalsIgnoreCase(explicit.trim())) {
            return true;
        }
        if (properties.isLockdownCloudflareHeaders()) {
            if (hasText(firstHeader(headers, "CF-Ray")) || hasText(firstHeader(headers, "CF-Connecting-IP"))) {
                return true;
            }
        }
        return false;
    }

    public boolean isAllowedPublicApiPath(String path) {
        if (path == null) {
            return false;
        }
        if (path.startsWith("/api/public/") || path.equals("/api/public")) {
            return true;
        }
        return PUBLIC_ARENAS_API.matcher(path).matches()
                || PUBLIC_MATCHES_API.matcher(path).matches()
                || PUBLIC_QUEUE_API.matcher(path).matches()
                || PUBLIC_SPONSORS_API.matcher(path).matches()
                || PUBLIC_TEAMS_API.matcher(path).matches()
                || PUBLIC_TEAM_LOGOS_API.matcher(path).matches();
    }

    public boolean isAllowedPublicStompSubscribeDestination(String destination) {
        return destination != null && PUBLIC_WS_TOPIC.matcher(destination).matches();
    }

    public boolean isBlockedPublicSpaPath(String path) {
        return path != null && BLOCKED_PUBLIC_SPA_PATHS.matcher(path).matches();
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private static String firstHeader(HttpHeaders headers, String name) {
        List<String> values = headers.get(name);
        if (values == null || values.isEmpty()) {
            return null;
        }
        return values.get(0);
    }
}
