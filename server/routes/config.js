import { Router } from 'express';
import { getEffectiveConfig, MODELS } from '../env.js';
import { getProviderStatus } from '../providers/index.js';

const router = Router();

router.get('/', (_req, res) => {
  const cfg = getEffectiveConfig();
  res.json({
    providers: getProviderStatus(),
    defaultProvider: cfg.DEFAULT_PROVIDER,
    defaultModel: cfg.DEFAULT_MODEL,
    models: MODELS
  });
});

router.get('/health', (_req, res) => res.json({ ok: true }));

export default router;
