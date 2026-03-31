import { config as loadEnv } from 'dotenv';
import type { Config } from 'drizzle-kit';

loadEnv({ path: '.env.local', override: true });

const config: Config = {
  schema: './src/db/schema.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url:
      process.env.SUPABASE_DB_URL ||
      process.env.DATABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      '',
    ssl: {
      rejectUnauthorized: false,
    },
  },
};

export default config;
