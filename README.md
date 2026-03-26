# Acheulit Frontend

SvelteKit frontend for Acheulit, an AI-assisted content and workflow platform for smaller teams.

## Environment

Create `.env` from `.env.example` and point it at the FastAPI backend:

```bash
cp .env.example .env
```

Required variables:

- `PUBLIC_API_BASE_URL`
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`

## Node version

Use Node 22 or another version that satisfies the engine requirement in `package.json`.

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## UI development integrity

For frontend changes, use all three checks before calling the work complete:

```bash
npm run check
npm run build
```

Then run a quick visual QA pass in the browser for:

- layout balance and spacing
- header/sidebar alignment
- desktop and mobile viewport fit
- empty or low-content states

For dashboard and app-shell work, prefer these composition rules:

- keep the header focused on global controls, not page-specific content
- keep the sidebar focused on navigation plus one primary action
- use the main canvas for page identity, summaries, and working content
- avoid stacking too many small cards that compete for attention
- add visual polish through spacing, hierarchy, and proportion before adding more features

## Backend

By default the app expects the FastAPI backend at `http://127.0.0.1:8000`.
