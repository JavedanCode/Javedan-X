import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({
  path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
});

// Validate environment variables at startup so configuration errors are
// detected before the application begins accepting requests.
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  PORT: z.coerce.number().int().positive().default(3000),

  DATABASE_URL: z.string().min(1),

  CLIENT_URL: z.url(),
  CLIENT_ORIGIN: z.url(),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),

  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // OAuth providers are optional. Their strategies are only configured when
  // the required credentials and callback URL are present.
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.url().optional(),

  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_CALLBACK_URL: z.url().optional(),

  EMAIL_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),

  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().min(1),

  PASSWORD_RESET_URL: z.url(),
  EMAIL_CHANGE_URL: z.url(),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('Invalid environment configuration:');
  console.error(result.error.flatten().fieldErrors);
  process.exit(1);
}

if (result.data.EMAIL_ENABLED) {
  const requiredEmailConfig = [
    ['RESEND_API_KEY', result.data.RESEND_API_KEY],
    ['EMAIL_FROM', result.data.EMAIL_FROM],
    ['PASSWORD_RESET_URL', result.data.PASSWORD_RESET_URL],
    ['EMAIL_CHANGE_URL', result.data.EMAIL_CHANGE_URL],
  ];

  const missing = requiredEmailConfig.filter(([, value]) => !value).map(([key]) => key);

  if (missing.length > 0) {
    console.error('Missing email configuration:');
    console.error(missing);
    process.exit(1);
  }
}

export const env = result.data;
