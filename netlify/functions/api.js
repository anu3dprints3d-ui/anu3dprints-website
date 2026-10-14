import serverless from "serverless-http";
import app from "../../server/app.js";

// The whole Express app (API + sitemap + product meta tags) runs as one Netlify Function.
const handle = serverless(app, { binary: ["application/octet-stream", "image/*"] });

export const handler = async (event, context) => {
  // Netlify rewrites (see netlify.toml) point public URLs at this function. Restore the original public
  // path (e.g. /api/actions/saveProduct) so the Express routes match exactly as they do on a normal server.
  try {
    const original = new URL(event.rawUrl).pathname.replace(/^\/\.netlify\/functions\/api/, "");
    event.path = original || "/";
  } catch {
    /* keep Netlify's path */
  }
  return handle(event, context);
};
