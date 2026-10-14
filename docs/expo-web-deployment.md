# Production: Expo web + Express on Vercel

## Deployment settings

Use the repository root, Framework Preset **Other**, Install `npm ci`,
Build `npm run build`, Output `dist`. Node.js 22 or 24 is supported by
this project's dependencies. `vercel.json` sends `/api/*` to the Node
function `api/index.mjs`; other paths use the Expo SPA. All seven dashboard
pages retain their React-state navigation. No external API proxy is needed.
PDFKit font data is explicitly included in the function bundle.

## Required server environment variables

Configure these in Vercel Production (and separately for Preview if needed):

| Variable | Value |
| --- | --- |
| SUPABASE_URL | Existing project's HTTPS URL |
| SUPABASE_SERVICE_ROLE_KEY | Existing service-role secret; server only |
| ADMIN_USER_IDS | Comma-separated UUIDs of approved, confirmed Supabase Auth users |
| APP_ORIGIN | Exact HTTPS frontend origin, without a trailing slash |

Never prefix credentials with EXPO_PUBLIC. No public Supabase key is needed
by the browser. Missing administrator configuration denies API access.
Do not reuse production credentials in untrusted preview deployments.
Preview login needs its exact APP_ORIGIN; do not use a wildcard.
ACCESS_MODE and PROXY_ACCESS_SECRET are no longer used.

Locally use ignored `.env.server`, set APP_ORIGIN to the exact URL you open
(e.g. http://localhost:8090), then `npm run serve`.

## Supabase setup required BEFORE enabling administrator login

1. In Authentication settings, turn OFF **Allow new users to sign up** and
   anonymous sign-in. Keep email/password sign-in enabled. Disable unused
   OAuth/phone providers. The committed local config disables signup but
   does NOT update hosted Supabase settings automatically.
2. Use existing confirmed staff accounts, or explicitly create approved
   administrators in Supabase's dashboard. Copy their user UUIDs to
   ADMIN_USER_IDS. No users were created or edited by this change.
3. Set Supabase Site URL to the production site. This app does not expose
   signup or password-reset endpoints. Forgotten passwords are handled by
   the project administrator.
4. Redeploy after environment variable changes.

## Security and database access

The server calls Supabase signInWithPassword using an isolated auth client.
Only a confirmed user whose immutable UUID is allowlisted receives a session.
Sessions use HttpOnly, SameSite=Strict cookies; production cookies use Secure
and the __Host- prefix. Tokens are never returned to JavaScript or stored in
localStorage. Every data request validates the access token with Supabase
getUser and rechecks the allowlist. No role is trusted from user_metadata.

Sessions expire at the Supabase access-token expiry and require sign-in again;
there is deliberately no long-lived refresh token in the browser. Remember me
retains the cookie across browser restarts only until that expiry. Logout
clears the cookie and requests local Supabase session sign-out. As with
Supabase JWTs generally, a previously stolen access token can remain valid
until expiry; removing its UUID from the allowlist denies it immediately
once the updated configuration is deployed.

Mutation endpoints require the configured exact Origin and custom request
header, including login and logout. Authentication is mandatory locally too.
Old proxy headers cannot authorize a request. Sale audit actors use the
verified administrator UUID, not a browser-provided name.

Read-only live inspection confirmed RLS is enabled on monthly_sales,
monthly_top_items, categories, products, sales_entries, sales_entry_audit_logs,
and report_exports, with no client-access policies. record_sale/reverse_sale
are callable only by service_role (and postgres). Browser anon/authenticated
roles cannot access this data directly. The server is the authorization
boundary before service-role DB calls. No migrations or production records
were modified. Do not later grant browser roles direct table/RPC access.

## Functions limits and validation

Function maxDuration is 60 seconds. Exports remain in-memory, with no local
filesystem writes. Downloads over 4 MB are rejected with a shorter-range
message, below Vercel's 4.5 MB response limit. Very large JSON entry lists also
need shorter date ranges. For larger workloads, the smallest alternative is
this same Express app on a persistent Node host (`npm run build`, then
`npm run serve`) behind HTTPS; no UI rewrite is necessary.

Login throttling is per function instance, not a distributed global limit.
Configure Vercel Firewall rate limiting for `/api/auth/login`; retain Supabase
Auth rate limits. Passwords and session tokens are not logged by the app.

Verified locally: production Expo export; API denial without a session;
forged, expired, non-admin and unconfirmed user rejection; admin acceptance;
CSRF checks; isolated database save/retry/reversal/audit tests; CSV/XLSX/PDF
content tests. Tests use dummy auth and an isolated database, not live writes.
Real administrator sign-in and Vercel function execution still require the
above environment variables, hosted signup setting, and a deployed smoke test.

Smoke test: signed out `/api/products` returns 401; bad credentials cannot
open Home; an approved administrator can navigate all seven pages, read
historical/menu data and generate a report; a non-admin cannot. Verify logout
and session expiry. Any production sale/export test writes records and should
be done only with explicit approval (or on a staging project).

Sources:
- https://vercel.com/docs/frameworks/backend/express
- https://vercel.com/docs/functions/limitations
- https://docs.expo.dev/guides/publishing-websites/
- https://supabase.com/docs/guides/auth/general-configuration
