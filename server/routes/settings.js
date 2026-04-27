import { Router } from 'express';
import { getRedactedConfig, setStoredConfig } from '../config-store.js';
import { reloadProviders, getProviderStatus } from '../providers/index.js';
import { MODELS, getEffectiveConfig } from '../env.js';

const router = Router();

router.get('/', (_req, res) => {
  const cfg = getEffectiveConfig();
  res.json({
    redacted: getRedactedConfig(),
    providers: getProviderStatus(),
    defaultProvider: cfg.DEFAULT_PROVIDER,
    defaultModel: cfg.DEFAULT_MODEL,
    models: MODELS
  });
});

router.post('/', (req, res) => {
  try {
    setStoredConfig(req.body || {});
    reloadProviders();
    res.json({ ok: true, redacted: getRedactedConfig(), providers: getProviderStatus() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
