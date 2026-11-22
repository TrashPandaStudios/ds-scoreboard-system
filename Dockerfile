# ==============================================================================
# Drone Soccer Multi-Arena Scoreboard & Tournament Engine
# Multi-Stage Production Dockerfile (Single Unified Container)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build React 18+ TypeScript Frontend SPA
# ------------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Build Spring Boot 3 Backend with Static SPA Bundle
# ------------------------------------------------------------------------------
FROM maven:3.9-eclipse-temurin-17-alpine AS backend-builder
WORKDIR /app/backend

# Cache dependencies
COPY backend/pom.xml ./
RUN mvn dependency:go-offline -B

# Copy backend source
COPY backend/src ./src

# Copy compiled frontend assets into Spring Boot's static resources directory
COPY --from=frontend-builder /app/frontend/dist ./src/main/resources/static

# Build production executable JAR
RUN mvn clean package -DskipTests

# ------------------------------------------------------------------------------
# Stage 3: Extract Official cloudflared Binary for Optional Public Tunneling
# ------------------------------------------------------------------------------
FROM cloudflare/cloudflared:latest AS cloudflared-bin

# ------------------------------------------------------------------------------
# Stage 4: Lightweight Alpine JRE Runtime Image
# ------------------------------------------------------------------------------
FROM eclipse-temurin:17-jre-alpine AS runner

LABEL maintainer="Drone Soccer Systems Engineering"
LABEL description="Drone Soccer Multi-Arena Scoreboard, Authoritative Clock Engine & OBS Overlays"

# Install udev / native serial libraries, timezone data, and CA certs for Cloudflare Tunnel TLS
RUN apk add --no-cache tzdata udev ca-certificates

WORKDIR /app

# Ensure persistence and log directories exist
RUN mkdir -p /data /app/logs && chmod 777 /data

# Default environment variables
ENV SERVER_PORT=8080 \
  PUBLIC_ENABLED=true \
  PUBLIC_PORT=8081 \
  PUBLIC_LOCKDOWN_CLOUDFLARE_HEADERS=true \
  CLOUDFLARE_TUNNEL_TOKEN="" \
  PUBLIC_SITE_URL="" \
  DATABASE_PATH=/data/scoreboard.db \
  SERIAL_ENABLED=true \
  SERIAL_PORT=/dev/ttyUSB0 \
  SERIAL_BAUD_RATE=9600 \
  SERIAL_PULSE_MS=800 \
  SPRING_PROFILES_ACTIVE=prod \
  JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC"

# Copy built JAR from builder stage and cloudflared binary
COPY --from=backend-builder /app/backend/target/scoreboard-engine-*.jar /app/scoreboard-engine.jar
COPY --from=cloudflared-bin /usr/local/bin/cloudflared /usr/local/bin/cloudflared
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN sed -i 's/\r$//' /app/docker-entrypoint.sh && chmod +x /app/docker-entrypoint.sh

# Expose Staff/Admin Web & WebSocket Port (8080) and Dedicated Read-Only Public Spectator Port (8081)
EXPOSE 8080 8081

# Persistent volume for SQLite database
VOLUME ["/data"]

# Healthcheck
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/arenas || exit 1

# Launch Application (and optional Cloudflare Tunnel if CLOUDFLARE_TUNNEL_TOKEN is provided)
ENTRYPOINT ["/app/docker-entrypoint.sh"]
