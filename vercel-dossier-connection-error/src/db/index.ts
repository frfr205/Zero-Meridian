import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL?.trim();
const globalForDb = globalThis as typeof globalThis & { __zeroMeridianPool?: Pool };

export const pool = databaseUrl
  ? (globalForDb.__zeroMeridianPool ?? new Pool({ connectionString: databaseUrl, max: 4, connectionTimeoutMillis: 5000 }))
  : null;

if (pool && process.env.NODE_ENV !== "production") globalForDb.__zeroMeridianPool = pool;

// Null is intentional: a Vercel deployment without Postgres can still use the
// honest browser-persistence mode instead of crashing the entire application.
export const db = pool ? drizzle(pool) : null;

export function isDatabaseConfigured(): boolean {
  return Boolean(databaseUrl);
}
