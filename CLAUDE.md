# CLAUDE.md — node-red Home Automation

## MANDATORY BEHAVIORS — Claude must always do these

**1. Session start:** Before doing anything else, read every file listed under "Stack snippets" in Section 1.

**2. After any merge to `main`:** Update this CLAUDE.md immediately — do not skip, do not defer. Follow the checklist in Section 5 ("On every merge to main").

These are non-negotiable. Do not mark any task complete if either has been skipped.

---

## 1. Project

| Field | Value |
|-------|-------|
| **Name** | node-red Home Automation |
| **Purpose** | Node-RED Docker Compose for home automation — backyard lights, valve control, MQTT/Zigbee integration, dashboards |
| **Repo** | git@github.com:geoffnichols1339/node-red.git |
| **Deployed service** | http://192.168.7.14:8040 |
| **Stack snippets** | _none yet — add `@snippets/docker.md` if Docker conventions grow_ |

---

## 2. Environment

- **Dev machine**: macOS (Mac mini) — local development and editing
- **Source control**: GitHub; always push/pull via `git`; authentication via SSH key — use `git@github.com:...` remotes, not HTTPS
- **Deploy target**: `avalon2` — Ubuntu 24.04, Intel i3-1220P, LAN at `192.168.7.14`, running Docker
  - No GUI, no display — never assume a desktop environment
  - All Docker commands require `sudo`
- **Secrets**: never hardcode; all secrets and configurable values live in `.env` (gitignored); `.env.example` is the canonical reference

### Existing infrastructure on avalon2

- **MQTT broker** (Mosquitto) — already running, address configured via `MQTT_HOST`/`MQTT_PORT`
- **Zigbee2MQTT** — already running, publishes/subscribes on the same MQTT broker; topic prefix configured via `Z2M_TOPIC_PREFIX`
- Node-RED connects to these as a client — does not replace or manage them

---

## 3. Stack

This is a **Docker Compose / Node-RED** project. There is no Python or Node build step — configuration is flows JSON + Docker Compose YAML.

- **Runtime**: Node-RED (official Docker image `nodered/node-red`)
- **Compose file**: `docker-compose.yml`
- **Persistent data**: `./data/` volume mounted to `/data` inside the container — flows, credentials, and settings live here
- **Protocols**: MQTT (via `node-red-contrib-mqtt` built-in) and Zigbee (via Zigbee2MQTT topics on MQTT)
- **Dashboards**: Node-RED Dashboard (`node-red-dashboard`) for quick panels; optionally an external FastAPI service (separate project) for richer UI
- **Shell scripts**: `bash` with `set -euo pipefail`; lint with `shellcheck`

### Node-RED conventions
- All MQTT credentials and broker addresses come from environment variables injected via `.env` — never hardcoded in flows
- Use `node-red-contrib-credentials` or the built-in credentials store for any secret used inside flows
- Flow files (`flows.json`) live in `data/` and are gitignored if they contain embedded secrets — use environment variable substitution instead
- Node-RED settings file: `data/settings.js` — override defaults here (admin auth, context storage, etc.)

---

## 4. Testing

No automated test suite for flows. Manual verification steps:

1. `sudo docker compose up -d` on avalon2 — confirm container starts cleanly
2. Open `http://192.168.7.14:1880` — confirm Node-RED UI loads
3. Check MQTT broker connection node shows green (connected)
4. Trigger a test MQTT message and verify the correct flow fires
5. Confirm backyard light / valve control responds as expected

Before declaring any task complete, confirm at minimum steps 1–3 above.

---

## 5. Git conventions & deploy commands

- **Never commit directly to `main`** — always work on a feature branch
- Merge to `main` only after user review and approval
- **On every merge to `main`** — mandatory CLAUDE.md update checklist:
  1. **Section 10 (File layout)**: add/rename/remove any files that changed
  2. **Section 11 (Gotchas)**: add any surprising behavior or workaround discovered
  3. **Section 12 (Planned features)**: mark completed items; add new ideas
  4. **Section 7 (Environment variables)**: add any new `.env` keys introduced
  5. Show the proposed diff to the user and get approval before committing
  6. Commit message: `docs: update CLAUDE.md post-merge`
  7. If nothing changed in those sections, explicitly say so — do not silently skip
- Conventional commit prefixes: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`
- `.env` and `data/` (except `data/settings.js`) are gitignored

### Deploy commands

**After pushing a feature branch:**
```bash
# On avalon2
git pull origin <branch-name>
sudo docker compose up -d --build
```

**After merging to main:**
```bash
# On avalon2
git pull origin main
sudo docker compose up -d --build
```

**View logs:**
```bash
sudo docker compose logs -f node-red
```

**Restart without rebuild:**
```bash
sudo docker compose restart node-red
```

---

## 6. Ports

| Service | Internal port | External port (avalon2) |
|---------|--------------|------------------------|
| Node-RED UI | 1880 | **8040** |
| Node-RED Dashboard | 1880 (`/ui`) | **8040** (same) |

MQTT broker and Zigbee2MQTT ports are managed by those existing services — not defined here.

---

## 7. Environment variables

All variables must be present in `.env` on avalon2. See `.env.example` for the full list with descriptions.

| Variable | Default / Example | Purpose |
|----------|------------------|--------|
| `NODE_RED_CREDENTIAL_SECRET` | _(random string)_ | Encrypts stored credentials in flows |
| `NODE_RED_ADMIN_USERNAME` | `admin` | Node-RED editor login username |
| `NODE_RED_ADMIN_PASSWORD_HASH` | _(bcrypt hash)_ | Node-RED editor login password (bcrypt) |
| `MQTT_HOST` | `192.168.7.14` | MQTT broker hostname or IP |
| `MQTT_PORT` | `1883` | MQTT broker port |
| `MQTT_USERNAME` | _(set in .env)_ | MQTT broker username |
| `MQTT_PASSWORD` | _(set in .env)_ | MQTT broker password |
| `Z2M_TOPIC_PREFIX` | `zigbee2mqtt` | Zigbee2MQTT base topic prefix |
| `TZ` | `Europe/Helsinki` | Container timezone (Salo, Finland) |

---

## 8. Claude Code tool permissions

`.claude/settings.json` is already present. Add project-specific allows as needed.

```json
{
  "permissions": {
    "allow": [
      "Bash(git*)",
      "Bash(docker*)",
      "Bash(find*)",
      "Bash(cat*)",
      "Bash(ls*)",
      "Bash(cp*)",
      "Bash(mv*)"
    ]
  }
}
```

---

## 9. .gitignore defaults

```
# Secrets
.env
.env.*
!.env.example

# Node-RED runtime data (flows may contain embedded secrets)
data/flows*.json
data/flows_cred*.json
data/.config.*
data/context/
data/node_modules/
data/package-lock.json

# macOS
.DS_Store

# Editor
.vscode/
.idea/

# Claude Code
.claude/settings.local.json
```

---

## 10. File layout

```
docker-compose.yml       Main Compose definition
.env.example             All required env vars with descriptions (committed)
.env                     Actual secrets — gitignored, lives only on avalon2
.gitignore
CLAUDE.md

data/                    Mounted into Node-RED container at /data (mostly gitignored)
  settings.js            Node-RED settings overrides (committed — no secrets here)
  flows.json             Active flows (gitignored — may contain embedded values)

.claude/
  settings.json          Claude Code tool permissions
```

---

## 11. Gotchas & known quirks

> **`data/` volume ownership** — Node-RED container runs as UID 1000. If `data/` is owned by root on the host, the container will fail to write flows. Fix: `sudo chown -R 1000:1000 ./data` on avalon2 after first `docker compose up`.

> **NODE_RED_ADMIN_PASSWORD_HASH must be a bcrypt hash, not a plain password.** Generate with:
> `docker run --rm nodered/node-red node -e "const bcrypt=require('bcryptjs'); bcrypt.hash('yourpassword',8,(e,h)=>console.log(h))"`
> Plain passwords will silently fail authentication.

> **MQTT credential injection** — Node-RED stores MQTT credentials encrypted in `data/flows_cred.json`. Changing `NODE_RED_CREDENTIAL_SECRET` after flows are deployed will break decryption. Set the secret once and never rotate it without re-entering credentials.

---

## 12. Planned features

- [ ] Backyard lights on/off control via MQTT/Zigbee (initial feature)
- [ ] Valve control for backyard (solenoid valves via Zigbee)
- [ ] Schedule-based automation (time-of-day triggers for lights/valves)
- [ ] Node-RED Dashboard panels for manual override
- [ ] FastAPI external dashboard integration (separate project)
- [ ] Notifications (e.g. Pushover/email) on automation events

---

## 13. Working style

- **Be direct** — no filler words, no preamble, no affirmations
- **Stay on task** — don't drift into adjacent suggestions mid-task
- **Correct the user when wrong** — say so clearly and explain why
- **Ask before guessing** — if a requirement is ambiguous, ask rather than assume
- **Stay in scope** — ask before touching code outside the stated task
- No unnecessary comments — well-named config is self-documenting
- No speculative abstractions — solve the actual problem, not hypothetical future ones
- Show proposed changes to `CLAUDE.md` to the user for approval before committing
