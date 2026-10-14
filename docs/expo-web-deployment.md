# Expo web deployment

- Framework preset: Other (not Vite).
- Root directory: repository root.
- Install command: npm ci.
- Build command: npm run build.
- Output directory: dist.

Expo SDK 54 uses Metro and single-page web output. index.js registers App;
app.js manages navigation in React state, without Expo Router. Vercel's
SPA fallback excludes /api so API failures are not returned as HTML.

The static export does not deploy server/index.mjs. The existing Express
API and its Supabase service credentials must remain on a restricted server.
Production needs a same-origin /api proxy to that deployed backend before
sales and reports work on Vercel. No backend URL was supplied, so this fix
does not invent one or expose the service role key. Never put that key in
EXPO_PUBLIC variables. Preserve the backend access controls and configure
its APP_ORIGIN for the production frontend.

The current Sign In is a local UI gate and is not credential validation.
This build fix preserves it without adding or changing authentication.
No database migrations or record changes are part of this deployment fix.

Reference: https://docs.expo.dev/guides/publishing-websites/
