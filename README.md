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
- Each arena has a **Team check-in** page at `/arena/:id/check-in`. After loading a match, select either team, choose one to five flying players, and select one of them as striker. Then check in the other team or return to the referee console.
- If a team has no registered players, the referee can choose **Check in without players** and continue.
- Referees can start any match without check-in. Once play starts, the flying lineup is fixed. Use **Change striker** on the referee console to select another player from that lineup during the match. Loading or resetting a match clears the previous check-ins.

### 5. Transparent OBS Broadcast Overlays (`/arena/:id/overlay/*`)
- Dedicated zero-background (`background: transparent !important;`) endpoints:
  - `/arena/:id/overlay/lower-third` — 1920x1080 bottom esports HUD.
  - `/arena/:id/overlay/top-bar` — 1920x1080 top esports HUD (mirrors lower-third layout at top of stream).
  - `/arena/:id/overlay/penalty-alert` — dynamic pop-up hazard banner during penalty shootouts.

### 6. Event Staff Master Dashboard (`/master`)
- Multi-cage telemetry grid (Arena 1, 2, 3...) with active scores, running clocks, and emergency pause buttons.
- OBS Discovery Hub with copyable URLs, resolution badges, and live previews.
- Match History & Auditing table with granular set-by-set breakdown and CSV export.
- Tournament Match Queuing & Arena assignment.
- Use **Teams → Manage players** to add, rename, or remove players for manually registered and schedule-imported teams.
- Sponsor partner banner manager.

### 7. Public Live Spectator Portal & Arena Info Displays (`/live`, `/live/arena/:id/display` & Dedicated Port `8081` + Optional Cloudflare Tunnel)
- Mobile-first, read-only public interface for spectators to browse all active flight cages, click into any match for a live scoreboard & set-by-set breakdown, view completed results, and check the upcoming schedule.
- **Public Arena Information Displays (`/live/arena/:id/display`, aliased at `/live/arena/:id/info` & `/live/arena/:id/board`)**:
  - Designed for tournament TVs, staging monitors, pit displays, and spectators via the Cloudflare-tunneled public portal.
  - Displays **Current Match Running**, **Next Match (On Deck)**, and **Upcoming Matches Queue** (plus optional Set Breakdown, Recent Results, and Sponsors) with live WebSocket sync.
  - **Configurable Visibility (Interactive Drawer & URL Query Parameters)**:
    - Hide any elements via `?hide=current,clock,scores,next,upcoming,header,controls` (or `?current=0`, `?next=0`, `?upcoming=0`).
    - Show extra sections via `?show=sets,recent,sponsors`, or restrict strictly with `?only=next,upcoming`.
    - Clean kiosk mode with `?kiosk=1` (hides toolbar controls; press `C` to reopen Customize drawer, `F` for fullscreen), queue limit `?limit=5`, and theme lock `?theme=dark|light`.
    - Built-in presets (`?preset=full|staging|current-next|scoreboard`), e.g. `/live/arena/1/display?hide=current&kiosk=1` for pit/staging queues.
- Served automatically on a dedicated read-only HTTP port (`PUBLIC_PORT=8081`, mapped to `8090` in Docker Compose) and also previewable on LAN at `/live`.
- **Optional Cloudflare Tunnel**: Pass `CLOUDFLARE_TUNNEL_TOKEN` (via `.env` or environment variable) and `cloudflared` automatically starts inside the container — no extra container or open firewall ports required.
- **Read-Only Security Lockdown**: All requests arriving on `PUBLIC_PORT` (`8081`) or via Cloudflare Tunnel headers (`CF-Ray` / `CF-Connecting-IP`) are strictly restricted at both the HTTP and WebSocket STOMP layers:
  - Only `GET` / `HEAD` / `OPTIONS` to public spectator endpoints (`/api/public/**`, `/api/arenas`, `/api/matches`, `/api/queue`, `/api/sponsors`, `/api/teams/logos/**`) are permitted.
  - All mutations (`POST`/`PUT`/`DELETE`/`PATCH`), internal audit/config APIs, and STOMP `SEND` commands (`/app/**`) are rejected (`403` / `MessageDeliveryException`).
  - Admin and Referee routes (`/master`, `/admin`, `/referee`, `/arena/*/referee`) redirect cleanly to the public live home (`/`).

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

Access the staff/referee interface at **`http://localhost:8089`** and the read-only public spectator portal locally at **`http://localhost:8090`** (or `/live`).

#### Publishing Live Results Publicly with Cloudflare Tunnel (Optional):
1. Copy `.env.example` to `.env` and set your tunnel token (and optional public URL):
   ```env
   CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoi...
   PUBLIC_SITE_URL=https://live.yourtournament.com
   ```
2. In the **Cloudflare Zero Trust Dashboard** → **Networks** → **Tunnels** → your tunnel → **Public Hostname**, configure:
   - **Service Type:** `HTTP`
   - **URL:** `localhost:8081`
3. Start or restart the container:
   ```bash
   docker-compose up -d --build
   ```
   When `CLOUDFLARE_TUNNEL_TOKEN` is blank or omitted, the container runs normally without starting `cloudflared`.

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
| `GET` | `/api/public/context` | Public/staff portal mode detection |
| `GET` | `/api/public/overview` | All arenas, recent results, schedule, and sponsors for public hub |
| `GET` | `/api/public/arenas` | Public list of active arenas with live summary, next match, and upcoming count |
| `GET` | `/api/public/arenas/{id}` | Full public arena details (`currentMatch`, `nextMatch`, `upcomingMatches`, `recentMatches`, `sponsors`) |
| `GET` | `/api/public/arenas/{id}/current` | Currently running match state for a specific arena |
| `GET` | `/api/public/arenas/{id}/next` | Next scheduled match on deck for a specific arena |
| `GET` | `/api/public/arenas/{id}/upcoming` | Upcoming scheduled queue for a specific arena (`?limit=N&includeNext=true\|false`) |
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
