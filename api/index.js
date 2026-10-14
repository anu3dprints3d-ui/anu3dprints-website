import app from "../server/app.js";

// Vercel runs the Express app as a single serverless function (an Express app is a valid (req, res) handler).
// vercel.json rewrites /api/*, /sitemap.xml, /robots.txt, /products/* and /categories/* here and keeps the
// original URL, so the normal Express routes match.
export default app;
