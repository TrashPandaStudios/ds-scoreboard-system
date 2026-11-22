package com.dronesoccer.scoreboard;

import com.dronesoccer.scoreboard.config.PublicPortalProperties;
import com.dronesoccer.scoreboard.config.PublicPortalSecurity;
import com.dronesoccer.scoreboard.config.PublicPortalSecurityFilter;
import com.dronesoccer.scoreboard.config.PublicPortalWebSocketInterceptor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

class PublicPortalSecurityTest {

    private PublicPortalProperties properties;
    private PublicPortalSecurity security;
    private PublicPortalSecurityFilter filter;
    private PublicPortalWebSocketInterceptor wsInterceptor;

    @BeforeEach
    void setUp() {
        properties = new PublicPortalProperties();
        properties.setEnabled(true);
        properties.setPort(8081);
        properties.setLockdownCloudflareHeaders(true);
        security = new PublicPortalSecurity(properties);
        filter = new PublicPortalSecurityFilter(security);
        wsInterceptor = new PublicPortalWebSocketInterceptor(security);
    }

    @Test
    void testPublicPortAndCloudflareHeaderDetection() {
        MockHttpServletRequest staffReq = new MockHttpServletRequest("GET", "/master");
        staffReq.setLocalPort(8080);
        assertFalse(security.isPublicRequest(staffReq));

        MockHttpServletRequest publicPortReq = new MockHttpServletRequest("GET", "/");
        publicPortReq.setLocalPort(8081);
        assertTrue(security.isPublicRequest(publicPortReq));

        MockHttpServletRequest cfRayReq = new MockHttpServletRequest("GET", "/master");
        cfRayReq.setLocalPort(8080);
        cfRayReq.addHeader("CF-Ray", "8abc123456-IAD");
        assertTrue(security.isPublicRequest(cfRayReq));

        MockHttpServletRequest cfIpReq = new MockHttpServletRequest("GET", "/api/arenas");
        cfIpReq.setLocalPort(8080);
        cfIpReq.addHeader("CF-Connecting-IP", "203.0.113.42");
        assertTrue(security.isPublicRequest(cfIpReq));

        MockHttpServletRequest explicitHeaderReq = new MockHttpServletRequest("GET", "/");
        explicitHeaderReq.setLocalPort(8080);
        explicitHeaderReq.addHeader("X-Public-Portal", "true");
        assertTrue(security.isPublicRequest(explicitHeaderReq));
    }

    @Test
    void testPublicPortalBlocksAllMutations() throws Exception {
        String[] methods = {"POST", "PUT", "DELETE", "PATCH"};
        for (String method : methods) {
            MockHttpServletRequest req = new MockHttpServletRequest(method, "/api/arenas/1/command");
            req.setLocalPort(8081);
            MockHttpServletResponse res = new MockHttpServletResponse();
            MockFilterChain chain = new MockFilterChain();

            filter.doFilter(req, res, chain);

            assertEquals(403, res.getStatus(), method + " must be forbidden on public portal");
            assertNull(chain.getRequest(), "Filter chain must not proceed for " + method);
        }
    }

    @Test
    void testPublicPortalApiAllowlistAndBlocklist() throws Exception {
        String[] allowedPaths = {
                "/api/public/context",
                "/api/public/overview",
                "/api/public/arenas/1",
                "/api/arenas",
                "/api/arenas/2",
                "/api/matches",
                "/api/matches/42",
                "/api/matches/arena/1",
                "/api/queue",
                "/api/queue/arena/1",
                "/api/sponsors",
                "/api/teams",
                "/api/teams/logos/team_1.png"
        };

        for (String path : allowedPaths) {
            MockHttpServletRequest req = new MockHttpServletRequest("GET", path);
            req.setLocalPort(8081);
            MockHttpServletResponse res = new MockHttpServletResponse();
            MockFilterChain chain = new MockFilterChain();

            filter.doFilter(req, res, chain);

            assertEquals(200, res.getStatus(), "Expected 200 for allowed path " + path);
            assertNotNull(chain.getRequest(), "Expected chain execution for allowed path " + path);
            assertEquals("public", res.getHeader("X-Scoreboard-Portal"));
        }

        String[] blockedPaths = {
                "/api/matches/audit-logs",
                "/api/arenas/hardware/status",
                "/api/arenas/config/intermission",
                "/api/sponsors/all",
                "/api/queue/template",
                "/api/system/public-portal"
        };

        for (String path : blockedPaths) {
            MockHttpServletRequest req = new MockHttpServletRequest("GET", path);
            req.addHeader("CF-Ray", "8xyz-SJC");
            req.setLocalPort(8080);
            MockHttpServletResponse res = new MockHttpServletResponse();
            MockFilterChain chain = new MockFilterChain();

            filter.doFilter(req, res, chain);

            assertEquals(403, res.getStatus(), "Expected 403 for blocked path " + path);
            assertNull(chain.getRequest(), "Expected blocked chain for " + path);
        }
    }

    @Test
    void testPublicPortalRedirectsStaffSpaRoutesToRoot() throws Exception {
        String[] staffRoutes = {"/master", "/admin", "/admin-panel", "/referee", "/arena/1/referee", "/arena/1/admin"};
        for (String route : staffRoutes) {
            MockHttpServletRequest req = new MockHttpServletRequest("GET", route);
            req.setLocalPort(8081);
            MockHttpServletResponse res = new MockHttpServletResponse();
            MockFilterChain chain = new MockFilterChain();

            filter.doFilter(req, res, chain);

            assertEquals(302, res.getStatus(), "Expected redirect for staff route " + route);
            assertEquals("/", res.getHeader("Location"));
        }

        // Public live routes pass through cleanly
        for (String publicRoute : new String[]{"/", "/live", "/live/arena/1"}) {
            MockHttpServletRequest req = new MockHttpServletRequest("GET", publicRoute);
            req.setLocalPort(8081);
            MockHttpServletResponse res = new MockHttpServletResponse();
            MockFilterChain chain = new MockFilterChain();

            filter.doFilter(req, res, chain);

            assertEquals(200, res.getStatus(), "Expected 200 for public route " + publicRoute);
            assertNotNull(chain.getRequest());
        }
    }

    @Test
    void testStaffLanRequestsBypassPublicLockdown() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/arenas/1/command");
        req.setLocalPort(8080);
        MockHttpServletResponse res = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(req, res, chain);

        assertEquals(200, res.getStatus());
        assertNotNull(chain.getRequest());
        assertNull(res.getHeader("X-Scoreboard-Portal"));
    }

    @Test
    void testSockJsTransportAllowedThroughFilterWhileStompInterceptorProtectsCommands() throws Exception {
        MockHttpServletRequest sockJsReq = new MockHttpServletRequest("POST", "/ws-scoreboard/123/abc/xhr_streaming");
        sockJsReq.setLocalPort(8081);
        MockHttpServletResponse res = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(sockJsReq, res, chain);

        assertEquals(200, res.getStatus());
        assertNotNull(chain.getRequest());
    }

    @Test
    void testWebSocketInterceptorEnforcesReadOnlyPublicSessions() {
        MessageChannel channel = mock(MessageChannel.class);
        Map<String, Object> publicAttrs = new HashMap<>();
        publicAttrs.put(PublicPortalSecurity.WS_PUBLIC_PORTAL_ATTR, true);

        // SEND must be rejected on public session
        StompHeaderAccessor sendAccessor = StompHeaderAccessor.create(StompCommand.SEND);
        sendAccessor.setDestination("/app/arena/1/command");
        sendAccessor.setSessionAttributes(publicAttrs);
        Message<byte[]> sendMsg = MessageBuilder.createMessage(new byte[0], sendAccessor.getMessageHeaders());
        assertThrows(MessageDeliveryException.class, () -> wsInterceptor.preSend(sendMsg, channel));

        // SUBSCRIBE to allowed public topics must succeed
        for (String dest : new String[]{"/topic/arenas/summary", "/topic/arena/1/state", "/topic/arena/2/buzzer"}) {
            StompHeaderAccessor subAccessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
            subAccessor.setDestination(dest);
            subAccessor.setSessionAttributes(publicAttrs);
            Message<byte[]> subMsg = MessageBuilder.createMessage(new byte[0], subAccessor.getMessageHeaders());
            assertSame(subMsg, wsInterceptor.preSend(subMsg, channel));
        }

        // SUBSCRIBE to non-public destination must be rejected
        StompHeaderAccessor badSubAccessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        badSubAccessor.setDestination("/app/arena/1/command");
        badSubAccessor.setSessionAttributes(publicAttrs);
        Message<byte[]> badSubMsg = MessageBuilder.createMessage(new byte[0], badSubAccessor.getMessageHeaders());
        assertThrows(MessageDeliveryException.class, () -> wsInterceptor.preSend(badSubMsg, channel));

        // Staff session SEND must be permitted
        Map<String, Object> staffAttrs = new HashMap<>();
        staffAttrs.put(PublicPortalSecurity.WS_PUBLIC_PORTAL_ATTR, false);
        StompHeaderAccessor staffSend = StompHeaderAccessor.create(StompCommand.SEND);
        staffSend.setDestination("/app/arena/1/command");
        staffSend.setSessionAttributes(staffAttrs);
        Message<byte[]> staffSendMsg = MessageBuilder.createMessage(new byte[0], staffSend.getMessageHeaders());
        assertSame(staffSendMsg, wsInterceptor.preSend(staffSendMsg, channel));
    }
}
