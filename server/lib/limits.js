/**
 * Serverless hosts cap request bodies: Vercel ~4.5 MB, Netlify/AWS Lambda ~6 MB (and base64 adds a third),
 * so on serverless we cap uploads at 4 MB. On a normal Node server the limit is 24 MB.
 * The browser bundle gets the same number at build time (see client/vite.config.js).
 */
export const IS_SERVERLESS = Boolean(process.env.VERCEL || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);
export const MAX_UPLOAD_MB = IS_SERVERLESS ? 4 : 24;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
