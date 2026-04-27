import { startServer } from './start.js';

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
