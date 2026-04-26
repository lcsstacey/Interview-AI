# Interview Studio AI

A premium, Mac-installable AI **interview practice studio** — for mock sessions, behavioral coaching, coding practice, and post-session notes.

> Built for **practice and preparation**, not deception. Use it for mock interviews, study, and permitted recorded sessions — never as a hidden assist during a live interview.

![dark UI built around a sidebar / cockpit / coaching layout](./public/favicon.svg)

## What it does

- **Dashboard** — readiness score, recent sessions, quick actions.
- **Mock Session cockpit** — talk through behavioral or system-design questions with your mic. Live transcript on the left, AI coaching on the right, composer at the bottom with one-click *Improve / STAR / More concise / Explain* actions.
- **Coding Practice** — paste a problem (or attach a screenshot of one *you own*) and get clarifying questions, approach, complexity, a clean solution, walkthrough, and edge cases. Syntax-highlighted markdown.
- **Knowledge** — upload a resume (PDF / TXT / MD), paste notes, and build a **Story Bank** of STAR-shaped stories. Every answer can be grounded in your real experience.
- **Session Summary** — post-mock notes: questions covered, strongest answers, weak spots, action items, a 5-day practice plan, and a 0–100 readiness score.
- **Multi-provider** — Anthropic Claude (4.6 / 4.7 / 4.5) or OpenAI (4.1 / 4o / 4o-mini). Switch in the top bar.
- **Streaming** — answers stream in real-time over Server-Sent Events.

## Stack

- **Backend**: Node 20 + Express, multi-provider streaming (Anthropic SDK + OpenAI SDK), Whisper for optional audio uploads, `pdf-parse` for resume PDFs.
- **Frontend**: React 18 + Vite + Tailwind, React Router, Zustand for state (with localStorage persistence), `react-markdown` + `highlight.js`, `lucide-react` icons.
- **Routes** are cleanly split: `server/routes/{chat,upload,config}.js`, `server/providers/index.js`, `server/prompts.js`, `server/env.js`.

## Run locally on a Mac

```bash
bash install.sh        # checks Node, installs deps, copies .env
# open .env and paste at least one of:
#   ANTHROPIC_API_KEY=sk-ant-…
#   OPENAI_API_KEY=sk-…
./run.sh               # starts API (3001) + Vite (5173) and opens Chrome
```

Open `http://localhost:5173` in **Chrome** (Safari does not support the Web Speech API used for live mic transcription).

To run a single-port production build instead:

```bash
./run-prod.sh          # vite build → server serves dist/ at :3001
```

## How to use it

1. **Knowledge first.** Go to **Knowledge** and upload your resume PDF (or paste it). Optionally add 3–5 STAR-shaped stories to your Story Bank.
2. **Run a mock session.** Go to **Mock Session**, pick a mode (Behavioral / System Design / General), click **Start Mic**, and answer practice questions out loud.
   - The transcript builds on the left. Detected questions show up as chips.
   - Type a draft answer in the composer and tap **Improve my answer** or **STAR version** for instant coaching.
3. **End & save.** Click **End & Save** to generate a structured summary and store the session.
4. **Review** the summary on the **Last Summary** page, then loop.

## Coding practice

- Paste a LeetCode-style problem or pick a starter.
- Choose your language.
- Optionally attach an image of a problem **you own** (e.g. one you screenshotted from your own past attempts) — the vision model will read it.
- The solution panel returns clarifying questions → approach → complexity → solution → walkthrough → edge cases, with proper syntax highlighting.

## Privacy

- Everything stays on your laptop except the model calls you make.
- The Zustand store persists locally to `localStorage`. Nothing is uploaded automatically.
- No telemetry, no analytics, no remote logging.

## Project structure

```
.
├── index.html               # Vite entry
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── server/
│   ├── index.js             # Express bootstrap
│   ├── env.js               # env validation
│   ├── prompts.js           # system prompts per coaching action
│   ├── providers/index.js   # multi-provider streaming
│   └── routes/
│       ├── chat.js          # /api/chat/{answer,coach,summary}
│       ├── upload.js        # /api/upload/{document,audio}
│       └── config.js        # /api/config
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css            # Tailwind + design tokens
│   ├── components/          # Sidebar, TopBar, Markdown, EmptyState, StatCard
│   ├── hooks/               # useSpeechRecognition, useAnswerStream
│   ├── lib/                 # api.js (SSE), store.js (Zustand), format.js
│   └── pages/               # Dashboard, MockSession, CodingPractice, KnowledgeBase, SessionSummary
├── install.sh / run.sh / run-prod.sh
└── .env.example
```

## What was changed in this redesign

- **New product name and positioning** — Interview *Studio* AI, framed as a practice studio (not a live, undisclosed assistant).
- **Full rewrite of the frontend** in React + Vite + Tailwind, with a sidebar layout, multiple pages, glass cards, gradients, and microinteractions.
- **Server split into clean routes/providers/prompts modules** with proper streaming abstractions.
- **Coaching actions** — Improve / STAR / Concise / Explain are first-class buttons in the cockpit, each backed by a tuned system prompt.
- **Story Bank** — STAR-shaped stories that ground behavioral answers in real experience.
- **Persistent session history** with readiness score and dashboard stats.

## Future improvements

- **Electron / Tauri wrapper** for a real `.app` install. The current architecture is ready for it: Tauri can wrap the Vite build and proxy API calls to the embedded Node server. (Out of scope for this pass.)
- **Local Whisper** — run faster-whisper locally so audio doesn't leave the machine.
- **Multi-session analytics** — track readiness across weeks, surface weakest topics.
- **Export** — `.pdf` / `.md` export of session summaries.
- **Theme toggle** — a polished light theme.

## License

MIT
