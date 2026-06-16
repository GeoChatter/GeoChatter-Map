# GeoChatter-Map v2 Implementation Progress

This document tracks what has been built for the v2 rewrite described in `FEATURES.md` and explains the implementation so others can continue.

## Architecture

- `client/` — Svelte 5 SPA built with Vite. Leaflet for the 2D map, Tailwind CSS + daisyUI for styling, Socket.io-client for real-time communication.
- `server/` — Node.js + Express + Socket.io + SQLite (`better-sqlite3`). JWT auth via Socket.io handshake middleware. Dev token endpoint for local development.
- `FEATURES.md` — full specification.
- `PROGRESS.md` — this file.

## How to run

### With Nix (recommended)

```bash
nix develop
# inside the shell:
dev
```

### Without Nix

```bash
# Terminal 1 — server
cd server
npm run dev        # runs tsx watch on src/index.ts, port 3000

# Terminal 2 — client
cd client
npm run dev        # runs Vite on port 5173, proxies /dev and /socket.io to :3000
```

Open `http://localhost:5173`. In dev mode the login card asks for a display name and whether you will stream.

Production build:

```bash
cd server && npm run build   # tsc --noEmit type check
cd client && npm run build   # Vite production build -> dist/
```

## Implemented

### Server

- **Database** (`server/src/db.ts`)
  - SQLite tables: `locations`, `players`, `games`, `rounds`, `guesses`, `feedback`.
  - `locations` is seeded from `server/src/data/locations.json` (33 worldwide locations).
  - Column names are camelCase to match the TypeScript types.

- **Authentication** (`server/src/auth.ts`)
  - `socketAuthMiddleware` reads `socket.handshake.auth.token`, verifies the JWT with `JWT_SECRET`.
  - `GET /dev/token?name=X&sub=Y` returns a signed JWT for local dev.
  - JWT payload carries `sub` (user id), `name`, optional `pic`.

- **Scoring** (`server/src/scoring.ts`)
  - Haversine distance in meters.
  - `5000` points inside 150 m; otherwise `5000 * e^(-(distance - 150) / 2_000_000)`, rounded.

- **Game engine** (`server/src/game.ts`)
  - `GameManager` keeps in-memory rooms (player ids, streamer socket id, timers).
  - State machine: `lobby -> playing -> finished`.
  - `streamer:getGame` creates/finds the streamer's game and joins the room.
  - `player:join{streamerId}` adds a player to the streamer's room.
  - `streamer:startGame` resets the streamer's game, creates round 1, picks a random unused location.
  - `streamer:nextRound` scores the current round and starts the next one or finishes the game.
  - `streamer:endGame` scores the current round and emits `game:ended`.
  - `streamer:guess{lat,lng}` records the streamer's guess and ends the round.
  - `player:guess{streamerId,lat,lng,isRandom,isConfirmed}` stores/updates a guess. Unconfirmed guesses are kept and used as a fallback if the round ends without a confirmed guess.
  - `streamer:updateSettings` / `streamer:setFilters` persist settings/filters and broadcast changes.
  - `player:setColor` / `player:setFlag` update the player's row and broadcast `game:playerUpdated`.
  - Round timer emits `round:tick` with `{ remainingSeconds, serverTime }` every second.
  - `player:guessed` is emitted to the streamer so they can see `X/Y guessed`.

- **HTTP routes** (`server/src/index.ts`)
  - `GET /dev/token`
  - `GET /health`
  - `POST /feedback` stores rating + comment.
  - `GET /api/games` returns recent games with player/round counts.
  - `GET /api/games/:id` returns full game detail with rounds and guesses.

### Client

- **Tooling**
  - Vite + `@sveltejs/vite-plugin-svelte`.
  - Tailwind CSS + daisyUI (dark theme).
  - Leaflet CSS loaded from CDN in `index.html`.

- **Entry & routing** (`src/main.ts`, `src/App.svelte`)
  - URL path decides view: path equals authenticated `sub` → StreamerView; otherwise → PlayerView (path is the streamer id).
  - Token is stored in `localStorage`.

- **Shared state** (`src/lib/gameView.svelte.ts`)
  - `GameViewState` class with `$state` fields for game, players, current round, results, filters, current guess, timer, etc.
  - `createGameView(isStreamer)` factory.
  - `setupSharedListeners(socket, state)` wires all common Socket.io events and returns a cleanup function.
  - `filtersClass(...)` maps the filter booleans to Tailwind classes (`blur-md`, `sepia`, `grayscale`, `scale-x-[-1]`, `scale-y-[-1]`).

- **Socket layer** (`src/lib/socket.ts`)
  - `initSocket(token)` creates the Socket.io connection with `{ auth: { token } }`.
  - Proxy config in `vite.config.js` forwards `/dev` and `/socket.io` to the server.

- **Components**
  - `Map.svelte` — Leaflet map with 5 tile layers (Google Streets/Satellite/Terrain, OSM, OpenTopoMap), custom div-icon markers, dashed result lines, target marker. Layer switching is exposed on `window.__switchMapLayer`.
  - `StreetView.svelte` — dynamically loads the Google Maps JS API, creates a `StreetViewPanorama` with clue controls hidden, supports filter CSS, fullscreen toggle.
  - `ScoreBoard.svelte` — sortable results table (name, distance, score) for round results and game summaries.
  - `Drawer.svelte` — slide-out panel.
  - `MovableDiv.svelte` — pointer-draggable container.
  - `Feedback.svelte` — star rating + comment, posts to `/feedback`.
  - `Alert.svelte` — toast stack.
  - `GameSettings.svelte` — range sliders for rounds/time/maxZoom, live filter checkboxes.
  - `GameControls.svelte` — Start/Next/End/Send-Guess buttons driven by `game.state`.
  - `PlayerSettings.svelte` — color picker + flag dropdown.
  - `QuickSwitch.svelte` — map tile layer buttons.
  - `GameHistory.svelte` — past games list with expandable round details, loads from `/api/games`.
  - `Login.svelte` — dev-mode login card with "I will stream" toggle.

- **Views**
  - `StreamerView.svelte` — split layout: Street View left, map right, settings drawer, game controls, feedback widget, round/game summary overlays.
  - `PlayerView.svelte` — full-screen map, guess button / Space shortcut, random guess, timer overlay, round/game summaries, small Street View popup after each round.

## Current Limitations / Next Steps

- ✅ Old `src/` SvelteKit app and root `package.json` removed — project now lives entirely in `client/` and `server/`.
- ✅ Player reconnection: 10s disconnect grace period, timer state and existing guesses restored on reconnect (`remainingSeconds` + `existingGuess` in `round:started`).
- ✅ Stats/history: game history drawer in StreamerView, `/api/games` + `/api/games/:id` endpoints.
- ✅ Game summary overlays are now draggable via `MovableDiv`.
- Visual filter classes are applied to the map/Street View container divs via CSS transforms. This works but can interact oddly with Leaflet controls and Google Maps mouse coordinates; UI controls are kept outside the filtered containers where possible.
- Google Maps API key is currently a placeholder (`fake-key`). Replace it via `VITE_GOOGLE_MAPS_API_KEY` in `client/.env` or the fallback in `StreetView.svelte`.
- Flag picker uses emoji flags; a country-code dropdown backed by a real flag image set is still TODO.
- The timer reaches zero and stays at zero; the streamer must still end the round manually, matching the spec.

## File Map

```
server/
  src/
    index.ts       # Express + Socket.io bootstrap
    auth.ts        # JWT sign/verify + dev token route
    db.ts          # SQLite schema + location seeding
    game.ts        # GameManager (state machine, rounds, scoring)
    scoring.ts     # Haversine + GeoGuessr-like score
    types.ts       # Shared server types
    data/locations.json
client/
  src/
    main.ts        # Vite app entry
    App.svelte     # login + view routing
    types.ts       # Client types
    lib/
      socket.ts              # Socket.io connection
      alertState.svelte.ts   # toast state
      gameView.svelte.ts     # shared reactive game state
      Login.svelte
      StreamerView.svelte
      PlayerView.svelte
      Map.svelte
      StreetView.svelte
      ScoreBoard.svelte
      Drawer.svelte
      MovableDiv.svelte
      Feedback.svelte
      Alert.svelte
      GameSettings.svelte
      GameControls.svelte
      PlayerSettings.svelte
      QuickSwitch.svelte
      GameHistory.svelte
```

## How to continue

1. Keep the existing event protocol; extend `server/src/game.ts` for new rules (e.g. "move in Street View" option, different map pools, anti-cheat checks).
2. Add new UI in `client/src/lib/` and wire it through the shared `GameViewState` / listeners.
3. For new client state, add fields to `GameViewState` and update `setupSharedListeners`.
4. For new server events, add handlers in `server/src/index.ts` and methods on `GameManager`.
5. Run `npm run build` in both `client` and `server` before committing.
