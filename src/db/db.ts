import { config as loadEnv } from 'dotenv';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

loadEnv({ path: '.env.local', override: false, quiet: true });

const rawConnectionString =
  process.env.SUPABASE_DB_URL ||
  process.env.DATABASE_URL;

const connectionString = rawConnectionString
  ? (() => {
      const parsed = new URL(rawConnectionString);

      // Suppress upcoming pg/libpq compatibility warning while preserving current behavior.
      if (parsed.searchParams.get('sslmode') === 'require' && !parsed.searchParams.has('uselibpqcompat')) {
        parsed.searchParams.set('uselibpqcompat', 'true');
      }

      return parsed.toString();
    })()
  : '';

if (!connectionString) {
  throw new Error(
    'Missing Supabase Postgres connection string. Set SUPABASE_DB_URL or DATABASE_URL in your env.',
  );
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

export const db = drizzle(pool, { schema });
