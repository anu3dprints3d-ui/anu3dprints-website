# Anu3D Prints

Premium catalogue + admin dashboard for a custom 3D-printing business in Coimbatore.
**No payment gateway, no checkout.** Every product, custom-print and bulk enquiry is saved to Supabase and then handed to WhatsApp with a pre-filled message.

**Stack (all JavaScript):** React 19 + Vite + React Router + Tailwind CSS 4 (client) · Node/Express API (server) · Supabase (Postgres, Auth, S3-compatible Storage) · Zod · Vitest · Playwright.

```
client/    React SPA (Vite)        shared/   validation, WhatsApp + format helpers (used by both)
server/    Express API + S3 code   supabase/ migrations + seed
scripts/   migrate, bootstrap-admin, verify-rls
e2e/       Playwright tests
```

## 1. Security first: rotate exposed credentials

If any key was ever pasted into chat, email or a ticket, treat it as compromised and **rotate before going live**:

| Secret | Where to rotate |
| --- | --- |
| Supabase secret key (`sb_secret_…`) | Dashboard → Project Settings → API Keys |
| S3 access key / secret | Dashboard → Storage → S3 Connection → regenerate |
| Database password | Dashboard → Project Settings → Database → Reset password |

Only `VITE_*` variables reach the browser, and they hold only the **publishable** key. Everything else stays in `.env.local` (git-ignored) or your host's secret store.

## 2. Local setup

Node.js ≥ 20.19 and npm.

```bash
npm install
cp .env.example .env.local      # fill in values; never commit this file
npm run db:migrate -- --seed    # migrations + sample data (uses SUPABASE_DB_URL)
npm run verify-rls              # must print "All RLS checks passed"
npm run bootstrap-admin         # first Super Admin (then delete ADMIN_BOOTSTRAP_PASSWORD from .env.local)
npm run dev                     # web http://localhost:5173 (proxies /api to the API on :3001)
```

Production-style run: `npm run build && npm start` (Express serves `client/dist` and the API on one port).
Checks: `npm run lint`, `npm test` (unit), `npm run test:e2e` (needs `npx playwright install chromium`; the seeded-data tests skip themselves if the DB is empty; the admin workflow test needs `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` for a **non-production** Super Admin).

`SUPABASE_DB_URL`: use the **Session pooler** connection string if your network is IPv4-only.

### Supabase dashboard settings (cannot be automated)

- **Auth → Providers → Email**: turn **off** "Allow new users to sign up" (admins come from bootstrap/invite only).
- **Auth → URL Configuration**: Site URL = `SITE_URL`; add it and `http://localhost:5173` to Redirect URLs.
- **Auth → Email Templates** (Invite user and Reset password): link to
  `{{ .SiteURL }}/admin/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/admin/reset-password`
  (`type=recovery` for the reset template).
- **Auth → Attack protection / CAPTCHA**: enable it. Admin sign-in goes directly to Supabase Auth from the browser, so Supabase's rate limits and CAPTCHA are what protect the login form.

## 3. How it works

| Area | Notes |
| --- | --- |
| Reads | The browser reads the catalogue straight from Supabase with the publishable key. A separate **anonymous-only** client is used on the storefront, so even a signed-in admin sees only what the public sees. Postgres RLS enforces everything. |
| Writes | All writes go through the Express API (`POST /api/actions/:name`). The API verifies the Supabase JWT, loads the caller's roles, validates with Zod, then runs the query **with the caller's JWT** so RLS applies a second time. |
| Service key | Used only on the server: public enquiry insert (after validation + rate limit), staff e-mail lookup, admin invites, bootstrap. |
| Enquiries | `submitEnquiry` (public): honeypot, Zod, IP rate limit (5 / 10 min), **saved first**, private files uploaded, *then* the `wa.me` link is returned. A failed save returns no link and no false success. |
| Uploads | Server-side only: magic-byte type check, extension/MIME consistency, 5 MB cap, EXIF stripped, ≤1600 px, re-encoded to WebP, random key. Customer files go to the private bucket and are opened via a role-checked 5-minute signed URL. |
| WhatsApp | `shared/whatsapp.js` is the only place URLs/messages are built (`encodeURIComponent`); the number comes from Admin → Settings. |
| Roles | `super_admin`, `catalogue_manager`, `enquiry_manager`, enforced in the API, in route guards (UX only) and in RLS via `SECURITY DEFINER` helpers. |
| SEO | Express injects title/description/Open Graph/JSON-LD into the HTML for `/products/:slug` and `/categories/:slug`, and serves `/sitemap.xml` and `/robots.txt`. Other pages set their title client-side. |
| Security headers | Helmet with a strict CSP (self + your Supabase origin + Google Fonts), HSTS, no framing. |

Migrations: `…_schema.sql` (tables, constraints, indexes, triggers, role helpers) → `…_rls.sql` (RLS + policies) → `…_storage.sql` (buckets). The seed is **sample** content; replace it from the dashboard.

## 4. Deploy

### Vercel (one project: static client + the API as a Vercel Function)

`vercel.json` is already set up: output folder `client/dist`, the Express app runs as the function `api/index.js`, and
`/api/*`, `/sitemap.xml`, `/robots.txt`, `/products/*`, `/categories/*` are rewritten to it (everything else falls back to the SPA).

1. Import the GitHub repo in Vercel. Leave the framework as detected; build settings come from `vercel.json`.
2. **Settings -> Environment Variables**: add every variable from `.env.example` **except** `PORT`, `ADMIN_BOOTSTRAP_*` and `SUPABASE_DB_URL`
   (use your rotated keys; mark the secret ones **Sensitive**). Set `SITE_URL` to your Vercel/custom-domain URL, no trailing slash.
   `VITE_*` variables are read at build time, so **redeploy after changing any variable**.
3. In Supabase -> Authentication -> URL Configuration, set the Site URL and add `SITE_URL` to Redirect URLs.
4. Open `/admin/login`. If actions return 404, check **Deployments -> Functions** for `api/index`.

Vercel limits: request bodies are capped at ~4.5 MB, so uploads are limited to **4 MB** (photos are shrunk in the browser first;
send big STL/ZIP files on WhatsApp). The rate limiter is in-memory per function instance, so it is a soft limit.

### Netlify (one site: static client + the API as a Netlify Function)

`netlify.toml` is already set up: it builds the client, runs the Express app as `/.netlify/functions/api`, and rewrites
`/api/*`, `/sitemap.xml`, `/robots.txt`, `/products/*` and `/categories/*` to it (everything else falls back to the SPA).

1. Push to GitHub and import the repo in Netlify (build settings are read from `netlify.toml`).
2. **Site configuration -> Environment variables**: add every variable from `.env.example` **except** `PORT`, `ADMIN_BOOTSTRAP_*` and `SUPABASE_DB_URL`.
   Mark `SUPABASE_SECRET_KEY` and `SUPABASE_S3_*` as secret. Set `SITE_URL` to your Netlify/custom-domain URL (no trailing slash).
   `VITE_*` variables must be set **before** the build; after changing any variable, trigger a new deploy.
3. In Supabase -> Authentication -> URL Configuration, set the Site URL and add `SITE_URL` to Redirect URLs.
4. Open `/admin/login`. If an action says "Unknown action" or returns 404, the function did not deploy: check **Deploys -> Functions** for `api`.

Netlify limits to know about:
- Function requests are capped at ~6 MB, so uploads are limited to **4 MB** on Netlify (the browser shrinks photos to ~1600 px WebP before uploading, so photos fit easily).
  Custom-print attachments (STL/ZIP) over 4 MB should be sent on WhatsApp. On a normal Node host the limit is 24 MB.
- The in-memory rate limiter resets per function instance, so it is a soft limit on Netlify. Add Netlify's rate limiting / a CAPTCHA for strict protection.
- Functions have a 10 s default timeout; image processing of one photo takes well under that.

### Any Node host (Render, Railway, Fly.io, a VPS)

1. Set every variable from `.env.example` in the host's secret store (`SITE_URL` = your public https URL).
2. Build command `npm install && npm run build`; start command `npm start`.
3. Keep it behind HTTPS (the app sets `trust proxy`).

For both: run `npm run db:migrate` once against production, bootstrap the first admin, then run `npm run verify-rls`.

**Backups:** enable Supabase backups or schedule `pg_dump`; storage buckets are not part of DB backups.

## 5. Troubleshooting

| Symptom | Check |
| --- | --- |
| "Configuration missing" screen | `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` set **before** `npm run build`. |
| "Missing or invalid environment variables: …" | Names are listed in the message; fix `.env.local`, restart the server. |
| Images don't show | Bucket `public-media` exists and is public? `VITE_SUPABASE_URL` correct? |
| "Upload to storage failed" | Admin → Settings → Storage status shows the failing bucket/error class; check endpoint, region, keys, bucket names. |
| Can't sign in | The user needs a row in `user_roles` and an active profile. Wrong role → "No access". |
| Invite/reset link invalid | Email templates must use the `token_hash` URL above. |
| Upload rejected | Netlify: 4 MB per request (photos are shrunk automatically). Node host: custom-print attachments 24 MB total. Product/gallery images are shrunk to <=1600 px before sending. |

## 6. Known limitations

- Because this is a single-page app, non-product pages get their `<title>`/description from JavaScript (search engines that run JS handle this; product and category pages are server-injected).
- Admin forms use native `<form>` + `useActionState` rather than React Hook Form.
- Upload "progress" is per-file (n of m), not byte-level.
- Legal pages are **template text** – have them reviewed.
- Nothing has been run against your live Supabase project yet: apply the migrations and run `verify-rls` and the admin e2e test with real credentials before launch.
