import { Router } from 'express';
import { env, hasAnthropic, hasOpenAI, MODELS } from '../env.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    providers: {
      anthropic: hasAnthropic,
      openai: hasOpenAI
    },
    defaultProvider: env.DEFAULT_PROVIDER,
    defaultModel: env.DEFAULT_MODEL,
    models: MODELS
  });
});

router.get('/health', (_req, res) => res.json({ ok: true }));

export default router;
