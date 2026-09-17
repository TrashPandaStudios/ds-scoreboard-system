# Drone Soccer Multi-Arena Scoreboard and Tournament Management System

A production-grade, authoritative real-time scoreboard, referee console, broadcast overlay engine, and tournament management platform for **FIDA / FAI Drone Soccer**.

Built with **Java 17 / Spring Boot 3**, **Spring WebSocket (STOMP)**, embedded **SQLite JPA**, native **jSerialComm Hardware Buzzer** driver, and a modern **React 18+ / TypeScript / Tailwind CSS** Single Page Application.

---

## ⚡ Key Architecture & Features

### 1. Server-Authoritative 10Hz Clock & Interpolation
- High-precision **`ScheduledExecutorService`** and **`System.nanoTime()`** timing loop executing at 10 Hz (100ms sync ticks).
- Real-time broadcast over STOMP topic `/topic/arena/{arenaId}/state`.
- Frontend clients execute continuous smooth 60fps/120fps local interpolation via **`requestAnimationFrame`** without clock drift.

### 2. Native Serial Hardware Buzzer
- Uses **`jSerialComm`** to pulse `0x01` over serial ports (e.g. `/dev/ttyUSB0` or `COM3`) on match timer `00:00` or manual trigger.
- Non-blocking asynchronous thread dispatch with configurable pulse width (`scoreboard.serial.pulse-ms=800`).
- Graceful simulation fallback with diagnostic logging if hardware is not plugged in.
- Web Audio API dual-harmonic stadium horn synthesizer synced on clients.

### 3. Crowd-Facing Stadium Display (`/arena/:id/display`)
- High-visibility scoreboard designed for stadium LED walls and arena monitors.
- Dynamic side-swap support (Red on Left/Right).
- Dynamic penalty counter with glowing numeric badges supporting arbitrary penalty counts.
- Animated hazard stripe banner during `PENALTY_PHASE`.
- Synchronized high-contrast border flash on `00:00`.
- Automated sponsor takeover carousel with upcoming match schedule during `IDLE` or `INTERMISSION`.

### 4. Referee Admin Console (`/arena/:id/admin`)
- Large touch-optimized buttons for tablet referees.
- **Safety-Guarded Hotkeys** (automatically disabled when typing in modal inputs):
  | Key | Action |
  | --- | --- |
  | `Space` | Start / Pause match timer |
  | `W` / `S` | Blue Score (+1 / -1) |
  | `↑` / `↓` | Red Score (+1 / -1) |
  | `E` / `D` | Blue Penalties (+1 / -1) |
  | `Shift + ↑` / `Shift + ↓` | Red Penalties (+1 / -1) |
  | `B` | Trigger Physical / Audio Buzzer |
- Inline click-to-edit overrides for Team Names, Scores, Penalties, and Clock (+10s, -10s, Reset 03:00, custom time).
- Set awarding (Red, Blue, Tie), side-swap toggle, and match persistence.

### 5. Transparent OBS Broadcast Overlays (`/arena/:id/overlay/*`)
- Dedicated zero-background (`background: transparent !important;`) endpoints:
  - `/arena/:id/overlay/lower-third` — 1920x1080 bottom esports HUD.
  - `/arena/:id/overlay/top-bar` — 1920x200 top aerial feed ticker.
  - `/arena/:id/overlay/penalty-alert` — dynamic pop-up hazard banner during penalty shootouts.

### 6. Event Staff Master Dashboard (`/master`)
- Multi-cage telemetry grid (Arena 1, 2, 3...) with active scores, running clocks, and emergency pause buttons.
- OBS Discovery Hub with copyable URLs, resolution badges, and live previews.
- Match History & Auditing table with granular set-by-set breakdown and CSV export.
- Tournament Match Queuing & Arena assignment.
- Sponsor partner banner manager.

---

## 🚀 Quick Start & Deployment

### Option A: Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/your-org/ds-scoreboard-flash.git
cd ds-scoreboard-flash

# Build and run the unified container
docker-compose up -d --build
```

Access the system at **`http://localhost:8080`**.

#### Hardware Buzzer Passthrough in Docker:
To connect a physical USB relay or Arduino buzzer to the container on Linux:
Uncomment the `devices:` section in `docker-compose.yml`:
```yaml
devices:
  - /dev/ttyUSB0:/dev/ttyUSB0
privileged: true
```

---

### Option B: Local Development

#### 1. Backend (Java 17+ & Maven)
```bash
cd backend
mvn clean package -DskipTests
java -jar target/scoreboard-engine-1.0.0.jar
```
Backend runs on `http://localhost:8080`.

#### 2. Frontend (Node.js 18+ & Vite)
```bash
cd frontend
npm install
npm run dev
```
Vite dev server runs on `http://localhost:3000` and automatically proxies `/api` and `/ws-scoreboard` to `http://localhost:8080`.

---

## 📡 API & WebSocket Reference

### WebSocket / STOMP Broker (`/ws-scoreboard`)
- **Subscribe:**
  - `/topic/arena/{arenaId}/state` — 10Hz authoritative state payload.
  - `/topic/arena/{arenaId}/buzzer` — Instant buzzer event triggers.
  - `/topic/arenas/summary` — Aggregate multi-arena telemetry.
- **Publish Commands:**
  - Destination: `/app/arena/{arenaId}/command`
  - Payload:
    ```json
    {
      "type": "START_TIMER",
      "arenaId": 1
    }
    ```

### REST Endpoints
| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/arenas` | Get all active arena telemetry summaries |
| `GET` | `/api/arenas/{id}` | Get full arena state snapshot |
| `POST` | `/api/arenas/{id}/command` | Dispatch control command |
| `POST` | `/api/arenas/{id}/override-score` | Manual score/penalty/team override |
| `POST` | `/api/arenas/{id}/timer` | Custom timer adjustment |
| `POST` | `/api/arenas/{id}/buzzer` | Trigger buzzer |
| `POST` | `/api/arenas/emergency-pause` | Emergency pause all cages |
| `POST` | `/api/arenas/emergency-resume` | Resume all cages |
| `GET` | `/api/matches` | Get historical match records |
| `GET` | `/api/matches/audit-logs` | Get event audit log |
| `GET` / `POST` | `/api/queue` | Manage scheduled match queue |
| `GET` / `POST` | `/api/sponsors` | Manage partner sponsor carousel |

---

## 🗄️ Database & Persistence
- **Storage:** Embedded SQLite at `/data/scoreboard.db` (or `./data/scoreboard.db`).
- Automatic schema creation via Spring Data JPA and Hibernate Community SQLite Dialect.
- Automatically seeds default sponsors, sample matches, and arena telemetry on initial startup.

---

## 📄 License
MIT License. Built for the Drone Soccer community.
