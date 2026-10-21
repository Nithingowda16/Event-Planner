import 'dotenv/config';
import { app } from './app.js';
import { envConfig } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';

async function bootstrap() {
  try {
    // 1. Establish Database Connection
    await connectDatabase(envConfig.MONGODB_URI);

    // 2. Start HTTP Server
    const server = app.listen(envConfig.PORT, () => {
      console.log(
        `[CelebrateOS Server] running on http://localhost:${envConfig.PORT} in ${envConfig.NODE_ENV} mode`
      );
    });

    // 3. Graceful Shutdown Handlers
    const shutdown = async (signal: string) => {
      console.log(`\n[CelebrateOS Server] Received ${signal}. Initiating graceful shutdown...`);
      server.close(async () => {
        console.log('[CelebrateOS Server] Closed pending HTTP connections.');
        await disconnectDatabase();
        process.exit(0);
      });

      // Force terminate if graceful shutdown hangs
      setTimeout(() => {
        console.error('[CelebrateOS Server] Forced shutdown after timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    console.error('[CelebrateOS Server] Fatal startup failure:', err);
    process.exit(1);
  }
}

bootstrap();
