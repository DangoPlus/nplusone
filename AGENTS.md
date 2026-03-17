# AGENTS.md

## Cursor Cloud specific instructions

This is a static Next.js 15 app (N+1 severance compensation calculator). No backend, no database, no external services required.

### Key commands

See `package.json` scripts:
- `npm run dev` — start dev server with Turbopack on port 3000
- `npm run build` — static export build (`output: 'export'` in `next.config.ts`)
- `npm run lint` — ESLint via `next lint`

### Gotchas

- The ESLint config (`eslint.config.mjs`) uses `next/core-web-vitals` only (not `next/typescript`), because the codebase has a pre-existing unused variable in `app/page.tsx` that would fail the stricter `next/typescript` rules.
- `npm run build` runs ESLint as part of the build step. If you add `next/typescript` to the ESLint config, the build will fail unless you also fix the lint error in `app/page.tsx`.
- The visitor counter shown at the bottom of the page is fetched from an external Cloudflare Worker (`nplus.dnext.click/counter`). In development, if the external service is unreachable, it falls back to displaying "999".
