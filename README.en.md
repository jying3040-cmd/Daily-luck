<div align="center">

# ✨ Daily Luck 每日运势

**A local-first daily fortune dashboard** — BaZi chart · luck scores · Huangli almanac · 7-day trends

Your name and birth details never leave your computer: encrypted in a local SQLite database, fully offline, zero telemetry.

[![CI](https://github.com/jying3040-cmd/Daily-luck/actions/workflows/ci.yml/badge.svg)](https://github.com/jying3040-cmd/Daily-luck/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/node-%E2%89%A522.12-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Vue 3](https://img.shields.io/badge/Vue-3-4FC08D?logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)

English | [简体中文](README.md)

![Daily Luck dashboard](docs/screenshots/dashboard.png)

</div>

---

## Why Daily Luck?

Most fortune apps are either ad-ridden web pages or services that ask you to upload your birth data to someone else's server. This project does the opposite:

- 🔒 **100% local data**: profiles live in a local SQLite database; names and phone tails are encrypted with AES-256-GCM before hitting disk. The server only listens on `127.0.0.1` — no accounts, no analytics, no tracking.
- 🔁 **Deterministic results**: the same date + the same profile always produce the same reading, locked down by tests. No random reshuffling on every refresh.
- 🧧 **Real traditional calendars**: stems, branches, Huangli do/don't lists and zodiac clashes are computed from `lunar-typescript`, not made up.
- 🧑‍💻 **Fully engineered**: full-stack TypeScript, API integration tests, CI, Dependabot, and issue templates — a solid reference project for Vue 3 + Fastify.

## Preview

![Huangli almanac and 7-day trend chart](docs/screenshots/trend.png)

## Features

- 📋 **Profile management**: name, birth date, birth time, phone tail, blood type and gender — stored locally with encryption
- 🀄 **BaZi chart**: four pillars, star sign, Chinese zodiac, life path number and day-master element
- 📊 **Five luck scores**: career, wealth, love, health and social — plus an overall score with interpretation
- 📜 **Huangli almanac**: lucky color, number, direction, benefactor zodiacs and clash warnings
- 📈 **7-day trend**: a luck curve centered on today (±3 days)
- 💾 **SQLite cache**: daily reports are cached, so repeat visits cost zero computation

## How are scores generated?

Daily Luck is a deterministic entertainment product, not a prediction model. The same profile and date always produce the same reading; the integer scores on screen express relative trends, not statistical probabilities or the likelihood of real events.

| Data source | Role in the product | Nature |
| --- | --- | --- |
| `lunar-typescript` | Lunar calendar, BaZi, zodiac, almanac, clashes and directions | Calendar data and traditional rules |
| Birth date and time | Four pillars, star sign, zodiac, life path number, element relations | Traditional/pop-culture mapping |
| Blood type, phone tail, name length | Small bonuses applied to category scores | Custom entertainment rules |
| Hash of profile and date | Generates a stable base score with small variations | Deterministic pseudo-randomness, not prediction |

Each category score starts from a stable base, applies the rules above, is clamped to a fixed range, and the overall score is their average. The implementation lives in [`server/src/fortune.ts`](server/src/fortune.ts) and is fully open to review, modification and testing.

So read `69` or `74` as relative standings under one set of entertainment rules — not a 69% or 74% "accuracy rate".

## Getting Started

### Requirements

- Node.js `22.12.0` or later
- npm `10` or later

### Option 1: npm

```bash
# Development (frontend at http://localhost:5173, API at http://127.0.0.1:3000)
npm install
npm run dev

# Production (single port http://127.0.0.1:3000, Fastify serves both frontend and API)
npm install
npm run build
npm start
```

In development, Vite proxies `/api` requests to the backend. Press `Ctrl+C` to stop both processes.

Windows users can also double-click [`start.bat`](start.bat) to install, build and launch in one step.

### Option 2: One-click live demo (Render free tier)

Don't want to install anything? Click the button to spin up a hosted demo in minutes:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/jying3040-cmd/Daily-luck)

> Free instances sleep when idle (first visit takes 30–60s) and don't include a persistent disk, so demo data resets on redeploy.

### Option 3: Docker

```bash
docker build -t daily-luck .
docker run --rm -p 3000:3000 -v daily-luck-data:/app/data daily-luck
```

Then open <http://127.0.0.1:3000>. Profiles persist in the `daily-luck-data` volume.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start frontend and backend dev servers together |
| `npm run test` | Run server API and cache tests |
| `npm run build` | Type-check and build both workspaces |
| `npm run verify` | Sanity-check calendar, SQLite and Fastify runtime |
| `npm run check` | Run tests, build and verify in sequence |
| `npm start` | Start the built single-port production server |

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Vue 3, TypeScript, Vite, Tailwind CSS 4, Lucide Icons |
| Backend | Node.js, Fastify, `node:sqlite` |
| Calendar | `lunar-typescript` |
| Testing | Node.js Test Runner, Fastify `inject()` |

## Project Structure

```text
.
├── .github/                 # CI, Dependabot and collaboration templates
├── docs/screenshots/        # README screenshots
├── frontend/                # Vue frontend
│   └── src/
├── server/                  # Fastify backend
│   └── src/
│       ├── app.ts           # App factory, database and API
│       ├── app.test.ts      # API integration tests
│       ├── fortune.ts       # Chart building and fortune rules
│       └── crypto.ts        # Local field encryption
├── scripts/dev.mjs          # Cross-platform dev process launcher
├── start.bat                # Windows one-click launcher
└── package.json             # npm workspaces and root scripts
```

## API

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/health` | Health check |
| `GET` | `/api/today` | Calendar engine probe |
| `GET` | `/api/profile` | Read profile and chart |
| `PUT` | `/api/profile` | Validate and save profile |
| `GET` | `/api/reports?start=YYYY-MM-DD&end=YYYY-MM-DD` | Get up to 366 days of reports |

## Data & Privacy

- Data is written to `data/fortune.db` in the project root.
- Name and phone tail are encrypted with AES-256-GCM before being stored.
- A local key is generated at `data/secret.key` on first run.
- `data/`, build artifacts, dependencies and env files are all gitignored.
- The server only listens on `127.0.0.1` and does not allow cross-origin API access.
- Back up both the database and the key; encrypted fields cannot be recovered if `secret.key` is lost.

> ⚠️ Never commit `data/fortune.db`, `data/secret.key` or real personal data to GitHub.

## Contributing

Issues and PRs are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first and run at least:

```bash
npm run check
npm audit --audit-level=high
```

Please report security issues privately as described in [SECURITY.md](SECURITY.md).

## License

Released under the [MIT License](LICENSE).

---

> **Disclaimer**: fortune-telling content belongs to traditional culture and entertainment. It is for amusement only and does not constitute medical, financial, legal or any other real-world advice.
