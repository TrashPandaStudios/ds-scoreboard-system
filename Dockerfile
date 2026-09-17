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
# Stage 3: Lightweight Alpine JRE Runtime Image
# ------------------------------------------------------------------------------
FROM eclipse-temurin:17-jre-alpine AS runner

LABEL maintainer="Drone Soccer Systems Engineering"
LABEL description="Drone Soccer Multi-Arena Scoreboard, Authoritative Clock Engine & OBS Overlays"

# Install udev / native serial libraries and tools
RUN apk add --no-cache tzdata udev

WORKDIR /app

# Ensure persistence and log directories exist
RUN mkdir -p /data /app/logs && chmod 777 /data

# Default environment variables
ENV SERVER_PORT=8080 \
    DATABASE_PATH=/data/scoreboard.db \
    SERIAL_ENABLED=true \
    SERIAL_PORT=/dev/ttyUSB0 \
    SERIAL_BAUD_RATE=9600 \
    SERIAL_PULSE_MS=800 \
    SPRING_PROFILES_ACTIVE=prod \
    JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC"

# Copy built JAR from builder stage
COPY --from=backend-builder /app/backend/target/scoreboard-engine-*.jar /app/scoreboard-engine.jar

# Expose Web & WebSocket STOMP Port
EXPOSE 8080

# Persistent volume for SQLite database
VOLUME ["/data"]

# Healthcheck
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/arenas || exit 1

# Launch Application
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Djava.security.egd=file:/dev/./urandom -jar /app/scoreboard-engine.jar"]
