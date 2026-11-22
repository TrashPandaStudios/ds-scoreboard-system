#!/bin/sh
set -eu

TUNNEL_PID=""
JAVA_PID=""

cleanup() {
  if [ -n "$TUNNEL_PID" ]; then
    kill -TERM "$TUNNEL_PID" 2>/dev/null || true
  fi
  if [ -n "$JAVA_PID" ]; then
    kill -TERM "$JAVA_PID" 2>/dev/null || true
  fi
}

trap cleanup INT TERM

# Start the Spring Boot scoreboard engine
java $JAVA_OPTS -Djava.security.egd=file:/dev/./urandom -jar /app/scoreboard-engine.jar &
JAVA_PID=$!

# Optionally start Cloudflare Tunnel when CLOUDFLARE_TUNNEL_TOKEN is supplied
TRIMMED_TOKEN=$(printf '%s' "${CLOUDFLARE_TUNNEL_TOKEN:-}" | tr -d '[:space:]')
if [ -n "$TRIMMED_TOKEN" ]; then
  if [ -x /usr/local/bin/cloudflared ]; then
    echo "[entrypoint] CLOUDFLARE_TUNNEL_TOKEN detected — starting cloudflared tunnel (recommended public service URL: http://localhost:${PUBLIC_PORT:-8081})"
    /usr/local/bin/cloudflared tunnel --no-autoupdate run --token "$TRIMMED_TOKEN" &
    TUNNEL_PID=$!
  else
    echo "[entrypoint] WARNING: CLOUDFLARE_TUNNEL_TOKEN is set, but /usr/local/bin/cloudflared was not found."
  fi
else
  echo "[entrypoint] CLOUDFLARE_TUNNEL_TOKEN not set — running without Cloudflare Tunnel (read-only public portal listening on port ${PUBLIC_PORT:-8081})."
fi

# Wait for the Java application process and shut down tunnel cleanly on exit
set +e
wait "$JAVA_PID"
EXIT_CODE=$?
cleanup
wait 2>/dev/null || true
exit "$EXIT_CODE"
