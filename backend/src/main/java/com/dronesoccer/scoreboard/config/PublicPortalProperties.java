package com.dronesoccer.scoreboard.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "scoreboard.public-portal")
public class PublicPortalProperties {

    /**
     * Enables the dedicated read-only public spectator HTTP listener.
     */
    private boolean enabled = true;

    /**
     * Dedicated HTTP port for read-only public spectator traffic (and Cloudflare Tunnel target).
     */
    private int port = 8081;

    /**
     * When true, any request containing Cloudflare Tunnel / proxy headers (CF-Ray, CF-Connecting-IP)
     * is automatically treated as a read-only public request even if forwarded to the main staff port.
     */
    private boolean lockdownCloudflareHeaders = true;

    /**
     * Optional public URL (e.g. https://live.example.com) displayed as a convenience link in the Admin Panel.
     */
    private String publicSiteUrl = "";

    /**
     * Optional Cloudflare Tunnel token passed via CLOUDFLARE_TUNNEL_TOKEN environment variable.
     * Used strictly to report a boolean configured status in the Admin Panel; never logged or exposed.
     */
    private String tunnelToken = "";

    public boolean isTunnelConfigured() {
        return tunnelToken != null && !tunnelToken.isBlank();
    }
}
