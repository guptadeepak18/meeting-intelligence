import 'reflect-metadata';
import express from 'express';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap';

const server = express();
let bootstrapPromise: Promise<void> | undefined;

async function ensureBootstrapped() {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const app = await NestFactory.create(
        AppModule,
        new ExpressAdapter(server),
        { cors: true },
      );
      await configureApp(app);
      await app.init();
    })();
  }

  await bootstrapPromise;
}

export default async function handler(req: any, res: any) {
  await ensureBootstrapped();
  return server(req, res);
}