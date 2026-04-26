# InterviewSpark AI (MacBook-ready)

A local web app inspired by interview AI copilots.

## What this app does
- Live speech recognition (browser mic) for interview practice.
- Instant AI-generated answers using OpenAI models.
- Coding interview mode with structured output.
- Resume + notes upload for personalized responses.
- Transcript summarization into key points and action items.

## Quick start (macOS)
1. Install Node.js 20+.
2. In this folder:
   ```bash
   npm install
   cp .env.example .env
   ```
3. Add your OpenAI key to `.env`:
   ```bash
   OPENAI_API_KEY=...
   MODEL=gpt-5
   PORT=3000
   ```
4. Run:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000` in Chrome.

## Notes
- Speech recognition relies on the browser Web Speech API (best in Chromium-based browsers).
- This is intended for interview practice and coaching workflows.
