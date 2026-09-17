package com.dronesoccer.scoreboard.service;

import com.dronesoccer.scoreboard.config.SerialPortProperties;
import com.fazecast.jSerialComm.SerialPort;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class HardwareBuzzerService {

    private final SerialPortProperties serialProperties;
    private final ExecutorService buzzerExecutor = Executors.newSingleThreadExecutor();
    
    private SerialPort activeSerialPort;
    private boolean portOpened = false;

    @PostConstruct
    public void init() {
        if (!serialProperties.isEnabled()) {
            log.info("Hardware buzzer is disabled by configuration (scoreboard.serial.enabled=false).");
            return;
        }

        initializePort();
    }

    public synchronized void initializePort() {
        try {
            SerialPort[] ports = SerialPort.getCommPorts();
            log.info("Discovered {} serial/COM port(s) on host:", ports.length);
            for (SerialPort p : ports) {
                log.info("  - System Port: '{}', Description: '{}', Baud: {}", 
                        p.getSystemPortName(), p.getDescriptivePortName(), p.getBaudRate());
            }

            String targetPortName = serialProperties.getPort();
            SerialPort targetPort = null;

            // Try exact match first (e.g. /dev/ttyUSB0 or COM3)
            for (SerialPort p : ports) {
                if (p.getSystemPortName().equalsIgnoreCase(targetPortName) || 
                    p.getSystemPortPath().equalsIgnoreCase(targetPortName) ||
                    targetPortName.contains(p.getSystemPortName())) {
                    targetPort = p;
                    break;
                }
            }

            // If not found by exact name, try to find first USB serial adapter if target was default
            if (targetPort == null && ports.length > 0) {
                for (SerialPort p : ports) {
                    if (p.getDescriptivePortName().toLowerCase().contains("usb") || 
                        p.getDescriptivePortName().toLowerCase().contains("ch340") ||
                        p.getDescriptivePortName().toLowerCase().contains("cp210") ||
                        p.getDescriptivePortName().toLowerCase().contains("ftdi")) {
                        targetPort = p;
                        log.info("Auto-selected detected USB serial device: {}", p.getSystemPortName());
                        break;
                    }
                }
            }

            if (targetPort != null) {
                targetPort.setBaudRate(serialProperties.getBaudRate());
                targetPort.setNumDataBits(8);
                targetPort.setNumStopBits(SerialPort.ONE_STOP_BIT);
                targetPort.setParity(SerialPort.NO_PARITY);
                targetPort.setComPortTimeouts(SerialPort.TIMEOUT_NONBLOCKING, 0, 0);

                if (targetPort.openPort()) {
                    activeSerialPort = targetPort;
                    portOpened = true;
                    log.info("SUCCESS: Opened hardware buzzer serial port '{}' (Baud: {}). Ready for 0x01 triggers.", 
                            targetPort.getSystemPortName(), serialProperties.getBaudRate());
                } else {
                    log.warn("Could not open serial port '{}'. Hardware buzzer will run in SIMULATION fallback mode.", 
                            targetPort.getSystemPortName());
                    activeSerialPort = null;
                    portOpened = false;
                }
            } else {
                log.info("Configured serial port '{}' not currently plugged in. Hardware buzzer in SIMULATION fallback mode.", 
                        targetPortName);
                activeSerialPort = null;
                portOpened = false;
            }
        } catch (Throwable t) {
            log.warn("Exception during serial port initialization (will use fallback simulation): {}", t.getMessage());
            activeSerialPort = null;
            portOpened = false;
        }
    }

    /**
     * Triggers the hardware buzzer asynchronously by sending byte 0x01.
     * Keeps the buzzer HIGH for pulseMs, then writes 0x00.
     */
    public void triggerBuzzer(Long arenaId, String reason) {
        buzzerExecutor.submit(() -> {
            try {
                log.info(">>> [BUZZER TRIGGER] Arena {} - Reason: '{}' <<<", arenaId, reason);
                
                if (portOpened && activeSerialPort != null && activeSerialPort.isOpen()) {
                    byte[] highSignal = new byte[]{0x01};
                    byte[] lowSignal = new byte[]{0x00};

                    activeSerialPort.writeBytes(highSignal, highSignal.length);
                    log.info("Hardware buzzer sent 0x01 HIGH to port {}", activeSerialPort.getSystemPortName());

                    Thread.sleep(Math.max(100, serialProperties.getPulseMs()));

                    activeSerialPort.writeBytes(lowSignal, lowSignal.length);
                    log.debug("Hardware buzzer sent 0x00 LOW to port {}", activeSerialPort.getSystemPortName());
                } else {
                    log.info("[SIMULATED HARDWARE BUZZER] Arena {} - 0x01 pulse simulated for {}ms (Reason: {})", 
                            arenaId, serialProperties.getPulseMs(), reason);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } catch (Exception e) {
                log.error("Error during hardware buzzer trigger: {}", e.getMessage(), e);
            }
        });
    }

    public boolean isConnected() {
        return portOpened && activeSerialPort != null && activeSerialPort.isOpen();
    }

    public String getCurrentPortName() {
        return activeSerialPort != null ? activeSerialPort.getSystemPortName() : serialProperties.getPort();
    }

    public List<String> getAvailablePortNames() {
        return Arrays.stream(SerialPort.getCommPorts())
                .map(p -> p.getSystemPortName() + " (" + p.getDescriptivePortName() + ")")
                .collect(Collectors.toList());
    }

    @PreDestroy
    public void cleanup() {
        buzzerExecutor.shutdown();
        if (activeSerialPort != null && activeSerialPort.isOpen()) {
            try {
                activeSerialPort.closePort();
                log.info("Closed hardware buzzer serial port.");
            } catch (Exception e) {
                log.warn("Error closing serial port: {}", e.getMessage());
            }
        }
    }
}
