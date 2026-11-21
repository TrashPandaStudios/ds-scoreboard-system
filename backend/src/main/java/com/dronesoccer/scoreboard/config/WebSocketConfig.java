package com.dronesoccer.scoreboard.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Bean
    public ThreadPoolTaskScheduler stompHeartbeatScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(2);
        scheduler.setThreadNamePrefix("DS-WS-Heartbeat-");
        scheduler.initialize();
        return scheduler;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable 3s/3s STOMP heartbeats so stalled/half-open wireless sockets under drone RF interference
        // are rapidly detected and recycled instead of silently freezing clients.
        config.enableSimpleBroker("/topic", "/queue")
                .setTaskScheduler(stompHeartbeatScheduler())
                .setHeartbeatValue(new long[]{3000, 3000});
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void configureWebSocketTransport(WebSocketTransportRegistration registration) {
        // Bound per-session send time and buffer size so a single congested wireless client
        // cannot accumulate stale frame backlogs or stall broadcasts to other displays.
        registration
                .setSendTimeLimit(3000)
                .setSendBufferSizeLimit(256 * 1024)
                .setMessageSizeLimit(64 * 1024)
                .setTimeToFirstMessage(10000);
    }

    @Override
    public void configureClientOutboundChannel(ChannelRegistration registration) {
        registration.taskExecutor()
                .corePoolSize(4)
                .maxPoolSize(8)
                .queueCapacity(64);
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Dedicated low-overhead native WebSocket endpoint (no SockJS HTTP/XHR framing overhead)
        registry.addEndpoint("/ws-scoreboard-raw")
                .setAllowedOriginPatterns("*");

        // Backward-compatible SockJS fallback endpoint
        registry.addEndpoint("/ws-scoreboard")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}
