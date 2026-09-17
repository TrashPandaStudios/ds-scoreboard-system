package com.dronesoccer.scoreboard.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "scoreboard.serial")
public class SerialPortProperties {
    private boolean enabled = true;
    private String port = "/dev/ttyUSB0";
    private int baudRate = 9600;
    private int pulseMs = 800;
}
