# Guess The Song

A music-guessing trivia game where players identify songs based on metadata clues (view count, release date, duration) then reveal the answer with an embedded YouTube player.

This is a modern rewrite of [Guess](https://github.com/Sakyawira/Guess), originally built with React as a university project in 2019.

## Tech Stack

- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Icons:** Lucide React
- **Real-time:** Socket.io-client
- **Language:** TypeScript (strict)

## Features

- **Trivia questions** generated dynamically from the video library:
  - Superlatives — "Which video has the most views?", "Which is the longest?"
  - Specifics — "Which video has X views?", "Which was released on [date]?"
- **YouTube embed** auto-plays a snippet (25% into the track) when the answer is revealed
- **Lives system** — 3 lives, game over on depletion
- **Score tracking** with leaderboard submission
- **Real-time** online user count via WebSocket
- **Personal favourites** — saved in this browser, without modifying shared videos
- **Paginated library** — load more videos to expand the question pool
- **Dark/light theme** toggle

## Getting Started

```bash
npm install
cp .env.example .env   # set VITE_API_BASE and the matching gameplay VITE_API_KEY
npm run dev
```

The [NestJS backend](https://github.com/Sakyawira/nestjs-learn) must be running (default `http://localhost:3000`).

## Build & Deploy

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build
```

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and publishes to GitHub Pages. Set the `VITE_API_BASE` repository variable and `VITE_API_KEY` Actions secret. The gameplay key must match the backend `API_KEY`. The workflow prefers the secret and temporarily supports the legacy variable.

## Project Structure

```
src/
├── App.tsx                    # Main game layout and state
├── main.tsx                   # Entry point
├── lib/
│   ├── api.ts                 # Typed REST client + response normalisation
│   ├── socket.ts              # Socket.io hook (online count, broadcasts)
│   └── useTheme.ts            # Dark/light theme toggle
└── components/
    ├── Header.tsx             # Title, online badge, theme toggle
    ├── QuestionArea.tsx       # Question generation + answer reveal
    ├── VideoList.tsx          # Video library + pagination + local favourites
    ├── LeaderBoard.tsx        # Score submission + rankings
    └── ui/                    # shadcn/ui primitives
```

## Related Projects

| Project | Description |
|---------|-------------|
| [nestjs-learn](https://github.com/Sakyawira/nestjs-learn) | NestJS backend (this app's API) |
| [Guess](https://github.com/Sakyawira/Guess) | Original Angular frontend (university project, 2019) |
| [GuessSongAPI](https://github.com/Sakyawira/GuessSongAPI) | Original C#/ASP.NET backend (university project, 2019) |

## Security and backend compatibility

This GitHub Pages app is gameplay-only. It has no import, deletion, or shared-video
update API calls. Administrators manage the library through a trusted server-side
admin flow or HTTP client using the backend's separate `X-Admin-Key` credential.
**Never put `ADMIN_API_KEY` in a `VITE_*` variable, frontend bundle, or this repo.**
`VITE_API_KEY` is browser-visible and is only a gameplay identifier.

Favourites are stored under `guess-remake:favourites:v1` in local storage. They are
personal to the current browser/site origin and do not modify MongoDB. The legacy
server favourite flag is intentionally ignored. If storage is blocked, favourites
still work for the current session and the app displays a warning.

The video library initially requests `limit=100&offset=0`; **Load more videos**
requests the next bounded page. Questions use the videos currently loaded. A short
page ends pagination; the API's maximum offset is respected. Refresh events reload
the first page while retaining personal favourites. The leaderboard displays the
**top 100 scores**. Failed loads retain existing data and can be retried.

API errors, rate limits and live-update connection failures are shown in the UI.
A saved score is not submitted twice if the subsequent leaderboard request fails.
This remains a casual game: scores are client-reported, not server-verified anti-cheat.

### Coordinated deployment checklist

1. Merge/deploy the backend security branch only after setting Render's patched
   `NODE_VERSION`, `API_KEY`, distinct server-only `ADMIN_API_KEY`, and `CORS_ORIGINS`.
2. For default GitHub Pages hosting, include **`https://sakyawira.github.io`** in
   backend `CORS_ORIGINS`. Do not include `/guess-remake/` or a trailing slash. A
   custom domain requires its own exact origin. Add localhost origins for local testing.
3. Set this repository's `VITE_API_BASE` variable (HTTPS backend URL) and
   `VITE_API_KEY` Actions secret (matching gameplay key), then deploy the frontend.
   A GitHub secret still becomes browser-visible when compiled as a Vite variable.
4. Confirm video loading, local favourites, load-more, score submission and WebSocket
   updates. Import/delete controls must not appear in the public UI.

Node is pinned in `.node-version` to the same patched release used by the backend.
The workflow audits dependencies and runs type checking, lint, tests and builds on
`fix`, `main`, and pull requests. **Only main is published to GitHub Pages.** Fix-branch
CI validates the production build but intentionally skips publishing. Main deployment
fails early if its required public configuration is absent. No real credentials are
used by local automated tests. The shadcn CLI is a development-only dependency.

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm audit
```

### Configure the gameplay key with GitHub CLI

Run `gh secret set VITE_API_KEY --repo Sakyawira/guess-remake` and enter the gameplay
key at the secure prompt. Do not pass credentials with `--body` or paste them into
logs. This is not an administrator secret: Vite embeds it in the public browser
bundle. Keep `ADMIN_API_KEY` only in the backend repository/Render configuration.
