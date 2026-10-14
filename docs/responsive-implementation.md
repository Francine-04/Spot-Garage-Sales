# Responsive implementation

The app retains React Native Web, brown/cream branding, existing routes and desktop layouts.

## Changes
- Collapsible desktop sidebar; dismissible tablet/mobile drawer.
- Compact mobile header with a separate search toolbar.
- Adaptive Home cards; mobile product cards and transaction cards.
- Shared product save logic, cumulative totals, Philippine timestamps and reset-to-zero behavior.
- Bounded menu scrolling, wrapping analytics panels, larger small-screen text and internal table/chart scrolling.
- Shared scrollable option dialogs, accessible control names, visible keyboard focus and selected navigation states.
- On-demand screen bundles and loading indicators.
- Unrestricted Expo orientation; web safe-area styles.
- PWA manifest, existing logo, service worker and offline navigation fallback. Offline sales writes are blocked; there is no pending-sync queue.

## Run checks
1. `npm run build:web`
2. `python -m http.server 8088 --directory dist`
3. `npm run test:entries`
4. `npm run test:responsive`
5. `npm run test:interactions`

The browser suite uses Playwright. Install test binaries with `npx playwright install firefox webkit`. The default is installed Microsoft Edge. In PowerShell, set `$env:BROWSER` to `chrome`, `firefox`, or `webkit` for other engines.

All seven main pages are checked at 320x568, 375x667, 390x844, 430x932, 768x1024, 820x1180, 1024x768, 1280x800, 1366x768, 1440x900, 1536x864, 1920x1080 and 2560x1440.

Checks cover page overflow, navigation, runtime errors, mobile saves (5+5+3=13), input reset, reload persistence, search and offline blocking. Repository tests cover Manila midnight boundaries, invalid quantities and failed writes. Additional tests cover dropdown selection, rotation, menu dialogs and the service-worker offline fallback.

## Limits
- Existing analytics datasets remain demo data. No database integration has been added or claimed.
- Product saves use browser storage and the device clock formatted in Asia/Manila. Native storage is session-only. These are not database records or server timestamps.
- Added menu items remain session-only. Existing saved sales have not been migrated or erased.
- Desktop Chrome/Edge and Playwright Firefox/WebKit tests are not physical-device certification. Real iOS/Android devices, Samsung Internet, native Expo builds, screen-reader audits and actual browser zoom controls still need manual verification. Narrow viewport tests cover reflow but do not certify 400% zoom accessibility.
- Serve `dist` at the site root over HTTPS. No hosting destination was supplied, so no site was deployed. Verify home-screen installation on the deployed origin.
- The service worker caches only the logo and offline fallback, never sales requests. It does not claim local records are synchronized.
- Browser connectivity status cannot prove a future database is reachable. A real backend must acknowledge writes before reporting database success.
