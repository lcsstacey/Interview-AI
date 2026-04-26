import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env, hasAnthropic, hasOpenAI } from './env.js';
import chatRoutes from './routes/chat.js';
import uploadRoutes from './routes/upload.js';
import configRoutes from './routes/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const app = express();
app.use(express.json({ limit: '20mb' }));

app.use('/api/chat', chatRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/config', configRoutes);

if (env.NODE_ENV === 'production') {
  const dist = path.join(ROOT, 'dist');
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.listen(env.PORT, () => {
  const banner = `
  ╭───────────────────────────────────────────────╮
  │  Interview Studio AI                          │
  │  → http://localhost:${env.PORT}                       │
  │  Provider: ${env.DEFAULT_PROVIDER.padEnd(10)}  Model: ${env.DEFAULT_MODEL}
  │  Anthropic: ${hasAnthropic ? 'on ' : 'off'}  OpenAI: ${hasOpenAI ? 'on ' : 'off'}
  ╰───────────────────────────────────────────────╯
`;
  console.log(banner);
  if (env.NODE_ENV !== 'production') {
    console.log('  In dev: visit the Vite dev server at http://localhost:5173');
  }
});
