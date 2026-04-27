# Interview Studio AI

A premium, Mac-installable AI **interview practice studio** — for mock sessions, behavioral coaching, coding practice, and post-session notes.

> Built for **practice and preparation**, not deception. Use it for mock interviews, study, and permitted recorded sessions — never as a hidden assist during a live interview.

---

## Two ways to install on your Mac

### Option A — Drag to Applications (recommended)

```bash
bash install.sh        # one-time: installs dev deps including Electron
bash package.sh        # builds the .dmg you can drag into Applications
```

You'll get a `.dmg` in `./release/`. Open it, drag **Interview Studio AI** into your **Applications** folder, then launch like any app. Add your API keys in the **Settings** page — no `.env` editing needed.

> **First launch**: macOS will say the app is from an unidentified developer because this is a local, unsigned build. Right-click the app → **Open** → confirm once. (Code signing requires an Apple Developer ID.)

### Option B — Run as a local web app

```bash
bash install.sh
./run.sh               # starts API + Vite, opens Chrome at http://localhost:5173
```

Add `ANTHROPIC_API_KEY` and/or `OPENAI_API_KEY` either via the in-app **Settings** page **or** in `.env`. Either works.

For a single-port production-style build:

```bash
./run-prod.sh          # vite build → server serves dist/ at :3001
```

---

## What it does

- **Dashboard** — readiness score, recent sessions, quick actions.
- **Mock Session cockpit** — talk through behavioral, system-design or general questions with your mic. Live transcript on the left, AI coaching on the right, composer at the bottom with one-click *Improve / STAR / More concise / Explain*.
- **Coding Practice** — paste a problem (or attach a screenshot of one *you own*) and get clarifying questions, approach, complexity, a clean solution, walkthrough, and edge cases. Markdown + syntax highlighting.
- **Knowledge** — upload a resume (PDF / TXT / MD), paste notes, and build a **Story Bank** of STAR-shaped stories. Every answer can be grounded in your real experience.
- **Session Summary** — post-mock notes: questions covered, strongest answers, weak spots, action items, a 5-day practice plan, and a 0–100 readiness score.
- **Settings** — API keys, default provider/model. Stored locally in your user-data folder, never sent anywhere except to the model provider.

---

## Stack

- **Backend** — Node 20 + Express, multi-provider streaming (Anthropic + OpenAI SDKs), Whisper for optional audio uploads, `pdf-parse` for resumes.
- **Frontend** — React 18 + Vite + Tailwind, React Router, Zustand (with localStorage persistence), `react-markdown` + `highlight.js`, `lucide-react`.
- **Desktop wrapper** — Electron 33 + electron-builder. The app boots an in-process Express server on an ephemeral port and loads the bundled React UI in a sandboxed `BrowserWindow`.

---

## How to use it

1. **Knowledge first.** Open **Knowledge** and upload your resume PDF (or paste it). Optionally add 3–5 STAR-shaped stories to your Story Bank.
2. **Run a mock session.** Open **Mock Session**, pick a mode (Behavioral / System Design / General), click **Start Mic**, and answer practice questions out loud. Detected questions appear as chips. Type a draft into the composer and tap **Improve my answer** or **STAR version** for instant coaching.
3. **End & save.** Click **End & Save** to generate a structured summary and store the session.
4. **Review** the summary on the **Last Summary** page, then loop.

### Coding practice

- Paste a LeetCode-style problem or pick a starter.
- Choose your language.
- Optionally attach an image of a problem **you own** — the vision model will read it.
- The solution panel returns clarifying questions → approach → complexity → solution → walkthrough → edge cases.

---

## Privacy

- API keys stored locally in `~/Library/Application Support/Interview Studio AI/interview-studio-ai/config.json` (in the packaged app) or in `.env` (web mode).
- Sessions, resume, notes and stories are persisted to `localStorage` only.
- Nothing is uploaded automatically. No telemetry, no analytics.

---

## Project structure

```
.
├── electron/
│   ├── main.cjs                 # Electron main: boots server, opens window
│   └── icon.svg                 # source icon (replace with .icns to brand)
├── electron-builder.config.cjs  # DMG/zip packaging config
├── index.html                   # Vite entry
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── server/
│   ├── index.js                 # node entry (web mode)
│   ├── start.js                 # exports startServer({port,userDataPath,distPath})
│   ├── env.js                   # effective config = stored ⊕ .env
│   ├── config-store.js          # JSON store in app userData folder
│   ├── prompts.js               # system prompts per coaching action
│   ├── providers/index.js       # multi-provider streaming, hot-reload safe
│   └── routes/
│       ├── chat.js              # /api/chat/{answer,coach,summary}
│       ├── upload.js            # /api/upload/{document,audio}
│       ├── config.js            # /api/config
│       └── settings.js          # /api/settings (read/write API keys)
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── components/              # Sidebar, TopBar, Markdown, EmptyState, StatCard
│   ├── hooks/                   # useSpeechRecognition, useAnswerStream
│   ├── lib/                     # api.js (SSE), store.js (Zustand), format.js
│   └── pages/                   # Dashboard, MockSession, CodingPractice, KnowledgeBase, SessionSummary, Settings
├── install.sh / run.sh / run-prod.sh / package.sh
└── .env.example
```

---

## What was added in this iteration

- **Drag-to-Applications Mac install** — Electron 33 wrapper + electron-builder DMG/zip targets. `bash package.sh` produces a real `.app` you install like any other Mac app.
- **In-app Settings page** — set Anthropic / OpenAI keys and defaults from the UI; saved to user-data, never to disk in the bundle.
- **Hot-reloadable providers** — saving keys reconfigures the SDKs in-place, no restart needed.
- **Cleaner server architecture** — `server/start.js` exports a reusable `startServer({...})` so Electron and `node` both consume the same code.

## Future improvements

- Code-signing + notarisation for a clean Gatekeeper experience (needs an Apple Developer ID).
- Universal binary (one DMG that runs on both Apple Silicon and Intel).
- Local Whisper for fully on-device transcription.
- Multi-week analytics and PDF export of session summaries.
- Light theme.

## License

MIT
