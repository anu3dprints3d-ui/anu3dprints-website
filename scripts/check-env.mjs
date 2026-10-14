// Runs before `npm run dev` / `npm start`: fails with instructions instead of a cryptic Node error.
import fs from "node:fs";

if (!fs.existsSync(".env.local")) {
  console.error("\n.env.local not found.\n  1. Copy .env.example to .env.local\n  2. Fill in your Supabase values (use ROTATED keys; never commit this file)\n  3. Run this command again\n");
  process.exit(1);
}
process.loadEnvFile(".env.local");
const missing = ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SECRET_KEY", "SUPABASE_S3_ENDPOINT", "SUPABASE_S3_REGION", "SUPABASE_S3_ACCESS_KEY_ID", "SUPABASE_S3_SECRET_ACCESS_KEY"].filter((k) => !process.env[k] || /YOUR_|XXXX/.test(process.env[k]));
if (missing.length) {
  console.error(`\nStill placeholders or empty in .env.local: ${missing.join(", ")}\n`);
  process.exit(1);
}
