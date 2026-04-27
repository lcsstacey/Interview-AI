import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getEffectiveConfig } from './env.js';
import { initConfigStore } from './config-store.js';
import { getProviderStatus } from './providers/index.js';
import chatRoutes from './routes/chat.js';
import uploadRoutes from './routes/upload.js';
import configRoutes from './routes/config.js';
import settingsRoutes from './routes/settings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

/**
 * Boot the API + (optionally) static UI on `port`.
 * Returns the http server instance.
 */
export async function startServer({ port, userDataPath, distPath } = {}) {
  initConfigStore(userDataPath);

  const app = express();
  app.use(express.json({ limit: '20mb' }));
  app.use('/api/chat', chatRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/config', configRoutes);
  app.use('/api/settings', settingsRoutes);

  const dist = distPath || path.join(ROOT, 'dist');
  // Serve dist if it exists (production mode / packaged app).
  app.use(express.static(dist, { fallthrough: true }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(dist, 'index.html'), (err) => err && next(err));
  });

  const cfg = getEffectiveConfig();
  const usePort = port != null ? port : cfg.PORT;

  return new Promise((resolve, reject) => {
    const server = app.listen(usePort, '127.0.0.1', () => {
      const { port: actualPort } = server.address();
      const status = getProviderStatus();
      console.log(`Interview Studio AI server → http://localhost:${actualPort}`);
      console.log(`Providers: anthropic=${status.anthropic ? 'on' : 'off'} openai=${status.openai ? 'on' : 'off'}`);
      resolve(server);
    });
    server.on('error', reject);
  });
}
