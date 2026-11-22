package com.dronesoccer.scoreboard.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.catalina.connector.Connector;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class PublicPortalServerConfig {

    private final PublicPortalProperties publicPortalProperties;

    @Value("${server.port:8080}")
    private int serverPort;

    @Bean
    public WebServerFactoryCustomizer<TomcatServletWebServerFactory> publicPortalConnectorCustomizer() {
        return factory -> {
            if (!publicPortalProperties.isEnabled()) {
                log.info("Public spectator portal listener is disabled.");
                return;
            }

            int publicPort = publicPortalProperties.getPort();
            if (publicPort <= 0 || serverPort <= 0 || publicPort == serverPort) {
                log.info("Skipping separate public portal connector (serverPort={}, publicPort={}).", serverPort, publicPort);
                return;
            }

            Connector connector = new Connector(TomcatServletWebServerFactory.DEFAULT_PROTOCOL);
            connector.setPort(publicPort);
            factory.addAdditionalTomcatConnectors(connector);
            log.info("Registered dedicated read-only Public Spectator Portal HTTP connector on port {} (Cloudflare Tunnel configured: {})",
                    publicPort, publicPortalProperties.isTunnelConfigured());
        };
    }
}
