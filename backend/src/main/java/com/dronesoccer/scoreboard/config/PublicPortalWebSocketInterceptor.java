package com.dronesoccer.scoreboard.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class PublicPortalWebSocketInterceptor implements HandshakeInterceptor, ChannelInterceptor {

    private final PublicPortalSecurity publicPortalSecurity;

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes
    ) {
        boolean isPublic = publicPortalSecurity.isPublicRequest(request);
        attributes.put(PublicPortalSecurity.WS_PUBLIC_PORTAL_ATTR, isPublic);
        return true;
    }

    @Override
    public void afterHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Exception exception
    ) {
        // No-op
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }

        Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
        boolean isPublicSession = sessionAttributes != null
                && Boolean.TRUE.equals(sessionAttributes.get(PublicPortalSecurity.WS_PUBLIC_PORTAL_ATTR));

        if (!isPublicSession) {
            return message;
        }

        StompCommand command = accessor.getCommand();
        String destination = accessor.getDestination();

        if (command == StompCommand.SEND) {
            log.warn("Blocked STOMP SEND from public spectator WebSocket session to {}", destination);
            throw new MessageDeliveryException("Public spectator WebSocket sessions are strictly read-only.");
        }

        if (command == StompCommand.SUBSCRIBE) {
            if (!publicPortalSecurity.isAllowedPublicStompSubscribeDestination(destination)) {
                log.warn("Blocked STOMP SUBSCRIBE from public spectator WebSocket session to {}", destination);
                throw new MessageDeliveryException("Subscription destination is not permitted on the public portal.");
            }
        }

        return message;
    }
}
