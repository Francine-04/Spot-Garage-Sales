# Layout and spacing refinement

Shared values live in `src/theme/designTokens.js`. The responsive style hook uses the measured content width after sidebar and padding, rather than only the browser width.

- Spacing: 8px icon gaps, 12px control/card gaps, 16px card padding, 20–24px section separation.
- Page headings: 24px mobile / 28px desktop. Section headings: 17–18px. Table text: 13px; supporting text: at least 12px; chart axes: 11px.
- Controls: consistent 44px primary buttons; centered quantity input; separate history actions.
- Shell: 232px desktop sidebar, 68px header, 12–28px content padding and 2080px maximum content width.
- KPI grids select one, two or four columns from available content width.
- Products: six-column entry table with category beneath the product name; history opens separately. Mobile product cards share the same save logic. The table scrolls within a bounded panel.
- Reports: wrapping filters and wider summary panels preserve readable columns.
- Home: shorter hero, restrained illustrations and content-based navigation-card columns.

Validation uses the existing responsive, sales-entry and interaction suites, plus `scripts/text-overflow-check.cjs` for text extending beyond the viewport outside intentional horizontal scrollers. `scripts/layout-capture.cjs` captures phone, desktop and ultrawide screenshots for visual review.

No data calculations, automatic timestamps or cumulative-save semantics were changed. Real hardware and manual assistive-technology testing remain separate from browser automation.

## Short laptop screens (1366×768)
- Height-aware spacing reduces the Home hero and navigation image areas without reducing text or button sizes.
- KPI cards use smaller icons and omit decorative, non-data-bearing mini-charts. Values use tabular numerals.
- The menu table and a 292px summary rail fit beside one another; the table retains its readable minimum width and internal scrolling.
- Mobile saved history and entry help open on demand, preserving access without duplicating rows in every card.
- Monthly charts measure their actual containers so all 12 months fit when there is room; narrow containers keep internal scrolling.
- Peak/off-peak ranking cards use two columns on laptops, reserving four columns for larger content widths.
- `node scripts/laptop-cards-check.cjs` captures each main screen at exactly 1366×768 for visual review.
