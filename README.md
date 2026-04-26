# InterviewSpark AI (Practical multi-model copilot)

A local macOS-friendly web app inspired by real-time interview copilots.

## What is improved
- **Live mic transcription** in-browser (Web Speech API).
- **Live tab/system audio transcription** (share tab/window audio) via OpenAI STT endpoint.
- **Provider switcher** for answer generation and summaries:
  - OpenAI
  - Anthropic
  - Google Gemini
  - Ollama (local)
- **Model override** from the UI each session.
- Resume + notes grounding.

## Quick start on MacBook
1. Install Node.js 20+.
2. Install dependencies and setup env:
   ```bash
   npm install
   cp .env.example .env
   ```
3. Fill keys in `.env` for any providers you want.
4. Run:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000` in Chrome.

## Practical usage flow
1. Pick provider + model.
2. Start **Mic STT** for your own speech.
3. Start **Tab/System Audio** and share a tab/window with audio enabled to capture interview audio.
4. Let transcript build, then click **Generate Answer**.
5. Click **Summarize Transcript** after session.

## Notes
- For system/tab audio transcription, provider is currently OpenAI only (`/api/transcribe`).
- If you choose Ollama, run a local Ollama server first.
- Built for coaching/prep workflows and ethical use.
