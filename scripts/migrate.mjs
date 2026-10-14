// Applies supabase/migrations/*.sql in order (tracked in public._migrations), then optionally the seed.
// Usage: npm run db:migrate            -> migrations only
//        npm run db:migrate -- --seed  -> migrations + supabase/seed.sql
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const url = process.env.SUPABASE_DB_URL;
if (!url) {
  console.error("SUPABASE_DB_URL is not set in .env.local (see .env.example).");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  await client.query(
    "create table if not exists public._migrations (name text primary key, applied_at timestamptz not null default now())",
  );
  const dir = path.resolve("supabase/migrations");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  const { rows } = await client.query("select name from public._migrations");
  const done = new Set(rows.map((r) => r.name));

  for (const file of files) {
    if (done.has(file)) continue;
    const sql = await readFile(path.join(dir, file), "utf8");
    console.log(`Applying ${file} ...`);
    await client.query("begin");
    try {
      await client.query(sql);
      await client.query("insert into public._migrations (name) values ($1)", [file]);
      await client.query("commit");
    } catch (err) {
      await client.query("rollback");
      throw err;
    }
  }
  // Keep the bookkeeping table private.
  await client.query("alter table public._migrations enable row level security");

  if (process.argv.includes("--seed")) {
    console.log("Applying seed.sql ...");
    await client.query(await readFile(path.resolve("supabase/seed.sql"), "utf8"));
  }
  console.log("Done.");
} finally {
  await client.end();
}
