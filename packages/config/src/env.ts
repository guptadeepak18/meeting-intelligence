import { z } from 'zod';

const appEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url(),
  CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_JWT_ISSUER: z.string().url(),
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1).default('meeting-intelligence'),
  HF_API_KEY: z.string().min(1),
  HF_ASR_MODEL: z.string().min(1),
  HF_LLM_MODEL: z.string().min(1),
  WEBHOOK_SECRET: z.string().min(1),
  ENCRYPTION_KEY: z.string().min(1),
  API_PORT: z.coerce.number().int().positive().default(4000),
});

export type AppEnv = z.infer<typeof appEnvSchema>;

export function loadEnv(env: NodeJS.ProcessEnv = process.env): AppEnv {
  const parsed = appEnvSchema.safeParse(env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
  }
  return parsed.data;
}
