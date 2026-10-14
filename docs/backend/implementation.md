# Spot Garage backend implementation and approval review

## Verified existing database
Project: `spot-garage` (`ufdxfrjpkxqaapbsgnnf`), inspected through the linked Supabase CLI Management API using read-only SQL. No Docker or `supabase db pull` was used.

- `monthly_sales`: id bigint PK; sales_year integer nullable; month_number integer; receipts integer; net_sales numeric; pos_average_sale numeric nullable; created_at timestamptz. Unique(year, month); valid-month and nonnegative receipt checks.
- `monthly_top_items`: id bigint PK; monthly_sales_id bigint FK; product_name text; units_sold integer; item_sales numeric. Existing UNIQUE(monthly_sales_id) permits one top item per month. Preserved.
- Both existing tables have RLS enabled and no policies. Records: six monthly rows and six top-item rows, March-August 2026. Total PHP604,880; 3,281 receipts; weighted recalculated average PHP184.3584273.
- Excel POS source matches receipts, net sales and top items. August POS average is 184.94 in Excel versus 184.91 in Supabase. No correction was applied. Net sales for several months were rounded in the original POS screenshots; do not imply finer original precision.
- The workbook's app growth percentages are not used as month-over-month comparisons. Current MoM compares consecutive calendar months only.

## Page/query/action mapping
| Page | Source | Calculations and actions |
|---|---|---|
| Home | monthly_sales; sales_entries; database status | Available month count, historical import timestamp, manual-record count, navigation |
| Sales Performance | monthly_sales | Month/year selection; net sales; receipts; recalculated average; retained POS average; MoM; highest/lowest; exports |
| Sales Trends | monthly_sales | Monthly sales/receipts and MoM; unavailable daily/hourly/prior-year placeholders |
| Products & Menus | categories; products; sales_entries | Authoritative price; new-quantity save; additive daily totals; timestamped history; server-side new product; exports |
| Daily Transactions | sales_entries; sales_entry_audit_logs | Date/product/search/sort filters; pagination; details; confirmed reversal with reason; replacement via new sale; exports |
| Peak & Off-Peak | monthly_sales separately from sales_entries | Monthly threshold classification; manual recorded-hour/weekday totals; rankings; exports |
| Reports | historical tables separately from manual tables; report_exports | Shared server preview/export calculations; type/date/category filters; CSV/XLSX/PDF; print; paged history |

Manual entries are not POS receipts. Historical and manual sales are never added together. Missing product coverage, payment methods, hourly history, customer data, costs, profits, and forecasts are not fabricated. Empty recorded periods are not treated as zero sales.

## Prepared migrations — not applied
1. `supabase/migrations/20261014000100_menu_sales_reports.sql`: creates categories, products, sales_entries, sales_entry_audit_logs and report_exports; enables RLS; denies anon/authenticated access; creates restricted server RPCs for idempotent saves and audited reversals.
2. `supabase/migrations/20261014000200_seed_existing_menu.sql`: inserts the project's existing 9 categories / 56 exact menu products into the new tables.

Neither migration alters, recreates, inserts into, updates, nor deletes from monthly_sales or monthly_top_items. There is no historical reimport and no overwrite of local prototype records.

The user approved these migrations on October 14, 2026. Applied with `npx supabase db push --linked --yes` after a dry run. Both versions are recorded remotely. No Docker or schema pull was used.

## Local operation
- Server: `npm run serve`, bound to 127.0.0.1:8090 by default.
- Frontend: `npm run build:web`, then open http://localhost:8090. The Node server serves the Expo export and same-origin API.
- Existing `npm run web` runs Expo only and does not supply the Node API.
- `.env.server` is ignored by Git and contains server-only Supabase URL/key. No `EXPO_PUBLIC_` variable contains a privileged key. `.env.server.example` documents configuration.
- New tables are installed. Products and daily entries now use Supabase; no local-storage fallback silently claims a database save.
- Historical reads, database save/retry/reversal functions and export-history operations have passed live checks. Verification sales were rolled back.

## Security and deployment
No in-app login, registration, password reset, or Supabase Auth UI was added. The local server is loopback-only with Host validation and same-origin/header protections for writes.

For deployment, use a staff-authenticated reverse proxy/access gateway, a private backend origin, HTTPS, `ACCESS_MODE=proxy`, `PROXY_ACCESS_SECRET` (32+ random characters), and `APP_ORIGIN`. The gateway must strip untrusted access/identity headers and inject X-Spot-Garage-Access plus verified X-Staff-Identity only after staff access is authorized. Never put this secret in frontend JavaScript. Do not expose the origin directly. A public anonymous dashboard cannot distinguish authorized staff; do not deploy it publicly without that restriction.

API requests are rate-limited. Server RPCs use actual database prices, price snapshots and server-generated timestamps. Idempotency key retries are serialized, checked against the original payload, and return the original entry. Client drafts reset only after acknowledgment. On an ambiguous network failure, retry the same quantity with the same in-memory key; avoid reloading until confirmed. Browser prototype entries are not imported automatically.

RLS remains enabled. No unrestricted anonymous policies are added. The service-role client lives only in `server/`. See Supabase official guidance: https://supabase.com/docs/guides/database/secure-data and https://supabase.com/docs/guides/database/functions .

## Reports
Immediate downloads only. No Storage bucket is needed or created, and no retained download is falsely offered. History records show that files are not retained. Generate again for another download; data may have changed. Server preview and export share the same preparation function. CSV escapes spreadsheet formula prefixes; XLSX writes data as values; PDF paginates with repeated headings and page numbers. PDF uses PHP currency labels. Print opens an escaped report-only document.

History completion means generated successfully and response prepared; it cannot prove that the browser saved the file to disk. If history writes fail, the export fails visibly. No files are embedded in database rows.

## Validation
- `npm run test:backend`: isolated PGlite PostgreSQL-compatible tests without Docker; migrations, authoritative price, 5+5+3=13/845, duplicate retry, invalid quantities, reversal/audit, grants/RLS, date boundaries, monthly comparisons, CSV/XLSX/PDF output.
- `node scripts/live-read-check.mjs`: real Supabase read-only counts, years, totals and exports generated from actual rows. It does not create export-history or sales records.
- `node scripts/connected-check.cjs`: connected page navigation/reflow across the 13 representative viewport sizes; all database-backed screens load.
- `docs/backend/historical-baseline.json`: read-only comparison baseline for before/after migration verification.

Remaining: configure restricted HTTPS deployment and perform physical-device testing. Native Expo API transport and native file download are not implemented; this backend integration targets the existing web dashboard.

The repository's existing Expo/React Native toolchain and ExcelJS transitive dependencies have npm audit findings. A forced dependency downgrade/major upgrade was not performed as part of database integration; review separately before public deployment.

## Applied migration verification
- Both reviewed migrations applied successfully following explicit user approval.
- Historical monthly rows and top items compared field-for-field with the saved baseline: unchanged.
- 9 categories and 56 products installed; zero sales entries and zero audit rows left by verification.
- Live PostgreSQL transaction tested 5+5+3=13 / PHP845, idempotent retry, database price and timestamp, reversal, audit count, export-history insertion and anonymous access restrictions. The whole test transaction was rolled back.
- Live API generated CSV, XLSX and PDF monthly exports using actual historical data; all three history records are completed. These real export-history records remain; no sales records were created.
- Local connected dashboard: http://localhost:8090 (start with `npm run serve`).

## Automatic daily sales propagation
Successful saves/refunds refetch shared database state. Sales Performance and Sales Trends default to daily sales once manual entries exist; Historical POS remains separately selectable. Reports automatically selects Daily Entries until the user chooses a report and shows live daily-sales KPIs. Month/year choices include manually recorded dates. Current filters continue to apply; saving an October sale does not change a March-only report. Open tabs receive BroadcastChannel invalidation; other sessions refresh on focus/online and at 15-second intervals. Reversals are excluded from revenue and quantity totals. Manual entries are never called POS receipts or added to imported monthly summaries.

Validation: scripts/sales-sync-check.cjs intercepts test writes and checks save-to-screen propagation plus mobile reflow; scripts/live-sales-check.mjs checks filtering and reversal exclusion. No test sales were persisted.
