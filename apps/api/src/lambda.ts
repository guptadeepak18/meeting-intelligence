import 'reflect-metadata';
import express from 'express';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap';

const server = express();
let appInitialized = false;

async function initializeApp(): Promise<void> {
  if (appInitialized) return;
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), { cors: true });
  await configureApp(app);
  await app.init();
  appInitialized = true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any): Promise<void> {
  await initializeApp();
  server(req, res);
}
