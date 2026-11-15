# CV project notes

Generates `dist/index.html` and `latest/Hossein-Margani-CV.pdf` from `src/cv.json` + `src/cv.njk`.
`npm test` and `npm run verify:pdf` (needs poppler-utils) must pass before a PR.
No sandbox or production deploy: merging to `main` only regenerates the PDF in CI.

## Lessons (date = when learned)

- 2026-11-15: The HTML must stay self-contained. A CDN font made Chrome embed Type 3
  fonts, and a slow CDN could commit a broken PDF. `build-pdf.js` aborts on any
  non-`data:` request; do not add a `<link>`, `@import` or remote `<script>`.
- 2026-11-15: Chrome's sandbox is blocked on Ubuntu 23.10+ (this laptop and
  `ubuntu-24.04` runners). Run the PDF build with `CI=1` (adds `--no-sandbox`); safe
  because the page is local and has no network access.
- 2026-11-15: `page.pdf()` returns a `Uint8Array`, not a `Buffer`. `.toString("latin1")`
  on it gives comma-separated numbers, so wrap it in `Buffer.from` before comparing.
- 2026-11-15: PDFs differ between machines in float digits of vector icons, so the
  committed PDF is always the CI one. Never commit a locally built PDF; CI compares
  CI-to-CI and keeps the old file when only timestamps/ID changed.
- 2026-11-15: Do not `require.resolve("<pkg>/package.json")` for asset packages;
  packages with an `exports` map (ionicons 8) throw. Use `packageDir()` in `src/lib.js`.
- 2026-11-15: CI must checkout with `fetch-depth: 0`. A shallow clone made "updated"
  show the HEAD date (3 Nov 2026) instead of the last `cv.json` commit.
- 2026-11-15: Date math is whole calendar months (`dateDiff`); the old 30/365-day
  version returned an empty span for Feb to Mar.
