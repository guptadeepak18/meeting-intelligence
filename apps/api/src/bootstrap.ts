import { ValidationPipe, VersioningType } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { z } from 'zod';

const bootstrapEnvSchema = z.object({
  PORT: z.coerce.number().int().positive().optional(),
  API_PORT: z.coerce.number().int().positive().optional(),
  CLERK_JWT_ISSUER: z.string().url(),
});

export function parseBootstrapEnv() {
  const env = bootstrapEnvSchema.parse(process.env);
  return {
    ...env,
    // Railway injects PORT; fall back to API_PORT then 4000
    API_PORT: env.API_PORT ?? env.PORT ?? 4000,
  };
}

export async function configureApp(app: INestApplication) {
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Meeting Intelligence API')
    .setDescription('Backend API scaffold for meeting intelligence workflows')
    .setVersion('1.0.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
}