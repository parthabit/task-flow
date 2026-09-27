import { createApp } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { logger } from './utils/logger';

async function bootstrap() {
  await connectDB();
  const app = createApp();

  const server = app.listen(env.port, () => {
    logger.info(`TaskFlow API running on port ${env.port} [${env.nodeEnv}]`);
    logger.info(`API docs available at http://localhost:${env.port}/api/docs`);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', reason);
    server.close(() => process.exit(1));
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => process.exit(0));
  });
}

bootstrap();
