import env from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import app from './app.js';

await connectDB();

const server = app.listen(env.port, () => {
  console.log(`[server] CHOLAN WEAR API running on http://localhost:${env.port} (${env.isProd ? 'production' : 'development'})`);
});

const shutdown = async (signal) => {
  console.log(`\n[server] ${signal} received, shutting down...`);
  server.close(async () => {
    await disconnectDB();
    process.exit(0);
  });
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
