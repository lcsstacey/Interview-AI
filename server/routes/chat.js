import { Router } from 'express';
import { pickProvider, streamLLM } from '../providers/index.js';
import { buildPracticePrompt, SYSTEM_PROMPTS } from '../prompts.js';

const router = Router();

router.post('/answer', async (req, res) => {
  try {
    const { mode, question, transcript, resumeText, notesText, draft, provider, model, imageBase64 } = req.body;
    if (!question && !transcript && !draft && !imageBase64) {
      return res.status(400).json({ error: 'Provide a question, draft, transcript, or image.' });
    }
    const target = pickProvider({ provider, model });
    const { system, user } = buildPracticePrompt({ mode, question, transcript, resumeText, notesText, draft });
    await streamLLM(res, target, { system, user, imageBase64 });
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
    else res.end();
  }
});

router.post('/coach', async (req, res) => {
  try {
    const { kind, draft, question, resumeText, notesText, provider, model } = req.body;
    if (!draft) return res.status(400).json({ error: 'Draft is required.' });
    const system = SYSTEM_PROMPTS[kind] || SYSTEM_PROMPTS.improve;
    const user = [
      question ? `# Question\n${question}` : '',
      `# User's draft answer\n${draft}`,
      resumeText ? `# Resume context\n${resumeText.slice(0, 6000)}` : '',
      notesText ? `# Notes\n${notesText.slice(0, 6000)}` : '',
      'Respond now.'
    ]
      .filter(Boolean)
      .join('\n\n');

    const target = pickProvider({ provider, model });
    await streamLLM(res, target, { system, user });
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
    else res.end();
  }
});

router.post('/summary', async (req, res) => {
  try {
    const { transcript, provider, model } = req.body;
    if (!transcript || !transcript.trim()) {
      return res.status(400).json({ error: 'Transcript is required.' });
    }
    const target = pickProvider({ provider, model });
    const system = SYSTEM_PROMPTS.summary;
    const user = `# Practice transcript\n${transcript}`;
    await streamLLM(res, target, { system, user });
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
    else res.end();
  }
});

export default router;
