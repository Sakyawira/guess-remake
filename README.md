# Guess The Song

A music-guessing game. React + Vite + Tailwind + shadcn/ui frontend, talking to
the NestJS Guess API (REST + socket.io).

## Develop

```bash
npm install
cp .env.example .env   # set VITE_API_BASE to your NestJS API
npm run dev
```

The NestJS API must be running (default `http://localhost:3000`).

## Build

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build
```

## Deploy (GitHub Pages)

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and
publishes `dist/` to GitHub Pages. Set the `VITE_API_BASE` repository **variable**
(Settings -> Secrets and variables -> Actions -> Variables) to your deployed API URL.

## Structure

- `src/lib/api.ts` - typed REST client + response normalisation
- `src/lib/socket.ts` - socket.io hook (online count, video add/delete events)
- `src/lib/useTheme.ts` - light/dark theme toggle
- `src/components/` - Header, QuestionArea, VideoList, LeaderBoard
- `src/components/ui/` - shadcn/ui primitives (button, card, input, badge)
