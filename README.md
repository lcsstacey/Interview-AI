# Interview Copilot

A local, ParakeetAI-style real-time interview copilot you run on your MacBook.
Live transcription, automatic question detection, streaming AI answers, screen-capture for coding questions, and post-call notes.

**100% local.** Nothing runs in the cloud except the LLM call you choose.

## Features
- 🎙️ **Mic transcription** — captures your voice (Web Speech API, Chrome).
- 🔊 **Meeting audio capture** — captures the *interviewer's* voice from any Zoom/Meet/Teams tab via Chrome's "Share audio". Streamed to Whisper for transcription.
- ✨ **Auto-pilot** — detects when the interviewer asks a question and starts streaming an answer instantly. No clicks.
- 🤖 **Multi-provider** — Anthropic Claude (Sonnet 4.6 / Opus 4.7) or OpenAI (GPT-5 / 4.1 / 4o). Pick per question.
- 💻 **Coding mode** — clarifying questions → approach → complexity → solution → walkthrough. Markdown + syntax highlighting.
- 🖼️ **Screenshot a coding question** — vision model reads it from your screen and solves it.
- 📄 **Resume + knowledge base** — upload PDF/MD/TXT, answers get personalised.
- 📝 **Post-call notes** — summarises the transcript into key points, study plan, action items.
- 🧠 **System Design / Behavioral / General** modes.

## Install (macOS)

```bash
bash install.sh
```

Then open `.env` and paste at least one API key:

```env
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...        # also enables Whisper for tab-audio transcription
```

## Run

```bash
./run.sh
```

That launches the server and opens `http://localhost:3000` in your browser.

> **Use Chrome.** Safari does not support the Web Speech API or `getDisplayMedia` audio.

## How to use it in a real interview

1. Start the copilot and join the call in Chrome (Zoom/Meet/Teams web).
2. Click **Start Mic** — your speech goes into the transcript.
3. Click **Capture Meeting Audio** → in the picker, select the Chrome tab with the interview and **check "Share audio"**. The interviewer's audio is now transcribed too.
4. Leave **Auto-pilot** on. When the interviewer asks something, an answer streams into the right pane within a second or two.
5. For LeetCode / HackerRank: click **Screenshot Question** → pick the screen with the problem → **Ask Now**. The model reads the screenshot and solves it.

## Privacy
- Audio + transcript stay on your laptop until *you* hit ask. The only outbound calls are to the model providers you configured.
- The screen-share picker stays in your control; nothing is captured without it.
- Nothing is written to disk.

## Models
- **Anthropic**: `claude-opus-4-7` (best), `claude-sonnet-4-6` (default, fast + smart), `claude-haiku-4-5-20251001` (fastest).
- **OpenAI**: `gpt-5`, `gpt-4.1`, `gpt-4o`, `gpt-4o-mini`.

Default is Claude Sonnet 4.6 — best speed/quality for live interviews.

## Troubleshooting
- **"Browser speech recognition unavailable"** → use Chrome, not Safari.
- **Tab capture has no audio** → in the picker, select the **tab** (not screen) and tick **Share tab audio**.
- **Whisper errors** → set `OPENAI_API_KEY` in `.env`.
- **Mic not picking up audio on Mac** → System Settings → Privacy & Security → Microphone → enable Chrome.
