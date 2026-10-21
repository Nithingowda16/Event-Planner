import { z } from 'zod';

const EnvSchema = z.object({
  PORT: z
    .string()
    .default('5000')
    .transform((val) => {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed) || parsed <= 0 || parsed > 65535) {
        throw new Error(`Invalid PORT: ${val}`);
      }
      return parsed;
    }),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z
    .string()
    .min(1, 'MONGODB_URI is required')
    .default('mongodb://localhost:27017/celebrateos'),
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters long for cryptographic security'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
});

export type EnvConfig = z.infer<typeof EnvSchema>;

export function loadEnvConfig(env: NodeJS.ProcessEnv = process.env): EnvConfig {
  const result = EnvSchema.safeParse(env);

  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `[CelebrateOS Server Configuration Error]\nFailed to validate environment variables:\n${errorDetails}`
    );
  }

  return result.data;
}

// In non-test environments or when imported, load safely
export let envConfig: EnvConfig;

try {
  // Use a fallback for test environments if JWT_SECRET isn't in process.env yet
  if (process.env['NODE_ENV'] === 'test' && !process.env['JWT_SECRET']) {
    process.env['JWT_SECRET'] = 'test-secret-key-that-is-at-least-32-chars-long';
  }
  envConfig = loadEnvConfig(process.env);
} catch (err) {
  // If running in development without .env or test, provide helpful diagnostic
  if (process.env['NODE_ENV'] !== 'test') {
    console.error(err instanceof Error ? err.message : String(err));
  }
  // Initialize with a safe default for static module imports in dev if needed
  envConfig = {
    PORT: 5000,
    NODE_ENV: 'development',
    MONGODB_URI: process.env['MONGODB_URI'] || 'mongodb://localhost:27017/celebrateos',
    JWT_SECRET: process.env['JWT_SECRET'] || 'fallback-dev-secret-key-at-least-32-chars-long-123456',
    JWT_EXPIRES_IN: '7d',
    CLIENT_ORIGIN: process.env['CLIENT_ORIGIN'] || 'http://localhost:5173',
    GEMINI_API_KEY: process.env['GEMINI_API_KEY'],
    GEMINI_MODEL: process.env['GEMINI_MODEL'] || 'gemini-2.5-flash',
  };
}
