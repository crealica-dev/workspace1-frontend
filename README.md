# Workspace Frontend

Minimal SvelteKit frontend for the Workspace content studio.

## Environment

Create `.env` from `.env.example` and point it at the FastAPI backend:

```bash
cp .env.example .env
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Backend

By default the app expects the FastAPI backend at `http://127.0.0.1:8000`.
