import { z } from "zod";

const schema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(10),
  SUPABASE_SECRET_KEY: z.string().min(10),
  SUPABASE_S3_ENDPOINT: z.string().url(),
  SUPABASE_S3_REGION: z.string().min(2),
  SUPABASE_S3_ACCESS_KEY_ID: z.string().min(4),
  SUPABASE_S3_SECRET_ACCESS_KEY: z.string().min(4),
  SUPABASE_S3_PUBLIC_BUCKET: z.string().min(3).default("public-media"),
  SUPABASE_S3_PRIVATE_BUCKET: z.string().min(3).default("private-uploads"),
});

let cached;

/** Lazily validated server config. The error names missing variables, never their values. */
export function serverEnv() {
  if (cached) return cached;
  const parsed = schema.safeParse({
    ...process.env,
    SUPABASE_URL: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  });
  if (!parsed.success) {
    const names = [...new Set(parsed.error.issues.map((i) => i.path.join(".")))].join(", ");
    throw new Error(`Missing or invalid environment variables: ${names}. See .env.example.`);
  }
  cached = parsed.data;
  return cached;
}
