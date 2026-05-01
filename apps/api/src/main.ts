import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp, parseBootstrapEnv } from './bootstrap';

async function bootstrap() {
  const env = parseBootstrapEnv();
  const app = await NestFactory.create(AppModule, { cors: true });
  await configureApp(app);

  const port = env.API_PORT;
  await app.listen(port);
  Logger.log(`API listening on http://localhost:${port}/api/v1`, 'Bootstrap');
}

bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to bootstrap API', error as object);
  process.exit(1);
});
