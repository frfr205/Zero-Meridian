import { sql } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const configured = isDatabaseConfigured();
  let connected = false;
  let detail = configured ? "Connection not tested" : "DATABASE_URL is not set; browser persistence is active";
  if (db) {
    try {
      await db.execute(sql`select 1`);
      connected = true;
      detail = "PostgreSQL connection verified";
    } catch {
      detail = "PostgreSQL is configured but unreachable; browser persistence remains available";
    }
  }
  // The application is healthy even without Postgres: local persistence is an
  // explicit product mode, not a hidden successful server write.
  return Response.json({ ok: true, app: "ready", persistence: connected ? "server" : "local", database: { configured, connected, detail } }, { headers: { "Cache-Control": "no-store" } });
}
