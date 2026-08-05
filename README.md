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
- **Video management** — import by YouTube URL, toggle favourites, delete
- **Dark/light theme** toggle

## Getting Started

```bash
npm install
cp .env.example .env   # set VITE_API_BASE to your NestJS API
npm run dev
```

The [NestJS backend](https://github.com/Sakyawira/nestjs-learn) must be running (default `http://localhost:3000`).

## Build & Deploy

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build
```

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and publishes to GitHub Pages. Set the `VITE_API_BASE` repository variable (Settings → Variables) to your deployed API URL.

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
    ├── VideoList.tsx          # Video library + import + favourites
    ├── LeaderBoard.tsx        # Score submission + rankings
    └── ui/                    # shadcn/ui primitives
```

## Related Projects

| Project | Description |
|---------|-------------|
| [nestjs-learn](https://github.com/Sakyawira/nestjs-learn) | NestJS backend (this app's API) |
| [Guess](https://github.com/Sakyawira/Guess) | Original Angular frontend (university project, 2019) |
| [GuessSongAPI](https://github.com/Sakyawira/GuessSongAPI) | Original C#/ASP.NET backend (university project, 2019) |
