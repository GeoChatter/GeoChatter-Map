# GeoChatter-Map — Feature & UI Specification v2.0

We want to build the next Version of this Chatguessr Client we only improve on the Client
the rest we rebuild from scratch the server and the View for the Streamer.

---

## 1. Architecture Change

| Concern | v1 (old) | v2 (current) |
|---|---|---|
| Framework | SvelteKit (SSR + routing) | Svelte 5 SPA (Vite) |
| Map engine | Mapbox GL JS | Leaflet 1.9.x |
| 3D map | Mapbox globe projection | Google Street View Panorama |
| Auth | Supabase (OAuth + session) | JWT (external/socket middleware) |
| Backend | Supabase serverless + GCSocketClient lib | Own Node.js Express + Socket.io + SQLite |
| Structure | Monolith under `src/` | `client/` + `server/` split |
| Styling | Custom CSS + Tailwind | Tailwind CSS + daisyUI |

---

## 2. Authentication

### Goal
Users authenticate via a JWT token (production) or a dev-mode name (development). No anonymous access.

### How it works
- On connection, the Socket.io client sends `{ auth: { token: "JWT" } }`.
- Server middleware (`middleware/auth.ts`) verifies the JWT with `JWT_SECRET` env var.
- The JWT payload carries `sub` (user ID), `name` (display name), `pic` (avatar URL), `iat`, `exp`.
- In dev mode (`NODE_ENV=development`), the server exposes `GET /dev/token?name=X&sub=Y` that returns a signed JWT, bypassing the external auth server.

### Login UI
- A centered card with the title **GeoChatter Map** in uppercase.
- A toggle labeled **Dev Mode**. When on:
  - **Display Name** text input (required).
- When Dev Mode is off:
  - will be implemented later. we will use better auth + jwt plugin
- A full-width **Connect** button (disabled if missing required fields).

- i will stream button that will make a room for you with your name as url

- On success, the app reads the URL path to determine view mode:
  - If the path segment equals the authenticated user's name → **Streamer View**.
  - Otherwise → **Player View**.

---

## 3. Global UI Layout (Both Views)

- **Feedback Widget**: Draggable (`MovableDiv`), bottom area, 1–5 star rating + optional text comment, posts to the backend same for both views. You should be able to close it.
- 

### Map Area
- Full-bleed 2D Leaflet map as the base layer.
- 5 tile styles selectable via overlay buttons (stored in localStorage):
  - **Streets** (Google Maps tiles, default)
  - **Satellite** (Google hybrid)
  - **Terrain** (Google terrain)
  - **OSM** (OpenStreetMap)
  - **OpenTopoMap**
- Map click → places a guess marker (green circle with user avatar).
- After round ends: target shows as red marker, player guesses as colored markers with lines connecting them to target. Centers target + bounding box of all guesses and show scoreboard etc.


### Visual Filters
Applied as Tailwind CSS classes to both the 2D map container and the Street View container:
| Filter | CSS |
|---|---|
| Blur | `blur-md` |
| Sepia | `sepia` |
| Black & White | `grayscale` |
| Upside Down | `scale-y-[-1]` |
| Mirrored | `scale-x-[-1]` |

Filters are toggled live by the streamer. All clients receive `round:filtersUpdated` and apply them immediately.

---

## 4. Streamer View

### Purpose
The streamer controls the game, sees the target location, and administers rounds.

### Unique UI Elements
- **Street View** pane: Always visible (left in split layout), showing the current round's Google Street View panorama with filters applied. Loaded via Google Maps JS API using the user-supplied key. the pano should be able to to be fullscreened
- use fake api key for now i will replace it later 
- **Settings Drawer**: Slide-out panel from the right side, containing `GameSettings`.
- **Game Controls** (bottom center):
  - **Lobby state**: Big green "▶ Start Game" button.
  - **Playing state** (no round ended yet): "📍 Send Guess & End Round" + "⏹ End Game" buttons.
  - **Playing state** (round ended, next round pending): "⏭ Next Round (X/Y)" + "⏹ End Game" buttons.
  - **Finished state**: "▶ New Game" button.

### Street View Controls
Built via `google.maps.StreetViewPanorama` with:
- `addressControl: false`, `showRoadLabels: false` — hides location clues.
- `clickToGo: false` — prevents users from navigating away from the target pano. This should be a game option later if you allowed to move etc.
- `linksControl: true`, `panControl: true`, `zoomControl: true`, `fullscreenControl: false`, `motionTracking: false`.
- Positioned by `panoId` or fallback `lat/lng`.

---

## 5. Player View

### Purpose
Players guess locations on a world map. They do NOT see the target location during guessing.

### Unique UI Elements
- **Full-screen map** during the guessing phase (no Street View).
- After round ends open small pop up with the actual location as an embed there is a google api for embeding panoramas.
- **Map click** sets a guess marker. Press **Space** or click **"Send Guess (SPACE)"** button (large, centered, bottom) to submit.
- Guess button shows loading spinner while submitting.
- No guess button if round has ended or no guess is placed.

### Round Results Overlay
- Shows "Round X Results" header, location label, and the sorted ScoreBoard.
- Player guess markers appear on map colored by their chosen color, with avatar/name tooltips, and dashed lines to the red target marker.

### Game Summary Overlay
- Same position, slightly wider. Shows "Game Summary" header and the ScoreBoard sorted by total score descending.

---

## 6. Game Settings Panel (Streamer Only)

A form inside the Drawer sidebar with:

| Setting | Type | Range | Default | Description |
|---|---|---|---|---|
| **Rounds** | Range slider | 1–20 | 5 | Number of rounds per game |
| **Time Limit** | Range slider (step 10) | 0–300s | 0 (off) | Per-round countdown timer |
| **Max Zoom** | Range slider | 1–20 | 20 | Maximum zoom level on 2D map |
| **Blur** | Checkbox | on/off | off | Applies `blur-md` to map + Street View |
| **Sepia** | Checkbox | on/off | off | Applies `sepia` |
| **Mirrored** | Checkbox | on/off | off | Applies `scale-x-[-1]` |
| **Upside Down** | Checkbox | on/off | off | Applies `scale-y-[-1]` |
| **Black & White** | Checkbox | on/off | off | Applies `grayscale` |

Two actions:
- **Filter checkboxes**: Live — toggling immediately emits `streamer:setFilters`, applying visual changes to all clients mid-round.
- **Save Settings** button: Persists all other settings to the server for the game.

---

## 7. Player Settings (Both Streamer & Player)
if endpoints or data is missing make it a todo ut we want all the flags for example maybe even on the server not emojis. but can be todo

- **Color picker**
- **Flag picker**

---

## 8. ScoreBoard Component

A reusable sortable table used for both per-round results and game summaries.

**Columns**:
- `#` — Rank number.
- `Name` — Avatar (20×20 rounded) + display name. Asterisk (`*`) suffix if guess was random.
- `Distance` — Sortable. Shows `X m` under 5000m, `X.X km` above. Click toggles ascending/descending.
- `Score` — Sortable descending by default. Thousands-separated number.

**Sorting behavior**:
- Click column header to sort by that column.
- Re-click same column toggles direction.
- Default: Score descending, Distance ascending, Name alphabetical.

**Data types supported**:
- `RoundResult`: per-player single-round data (score, distance, lat/lng of guess).
- `GameEndResult`: aggregated game data (totalScore, per-round breakdown array).

---

## 9. Game Flow (Server-Side)

### State Machine
```
lobby → playing → finished
         ↑           |
         └───(new game)──┘
```

### Lifecycle

1. **Streamer connects** → `streamer:getGame` → server creates/finds game (state=`lobby`), joins the streamer as a player too, emits `game:state` to all in room.

2. **Players join** → `player:join{streamerId}` → server adds player to game, emits `game:playerJoined` to room, emits `game:state`. If a round is already active, sends `round:started` to the joining player (without target coordinates).

3. **Streamer configures** → `streamer:updateSettings` → persists to DB, emits `game:settingsUpdated`.

4. **Streamer starts game** → `streamer:startGame`:
   - Server picks a random location from `locations.json` (33 worldwide locations, excluding already-used `panoId`s).
   - Creates round record with target lat/lng, panoId, label, filters.
   - Transitions game state to `playing`.
   - Emits `game:started` to streamer (includes target coords) and `round:started` to players (excludes target coords).
   - Starts round timer if `timeLimit > 0`.
   - People recieve the start time of the round and their timer goes down if the timer is down it just stays at zero the streamer ends the round with guessing

5. **Players guess** → `player:guess{streamerId, lat, lng, isRandom}`:
   - Server validates: one guess per player per round. Rejects duplicates.
   - should allow guess changes as a setting 
   - If `isRandom=true`, server generates random lat/lng instead.
   - Emits `guess:accepted` to the guesser, `player:guessed` to the streamer.
   - if you click it should instantly be send to server as unconfirmed guesss if the round end it is counted as guessed if you have no confirmed guess aka you pressed space or clicked guess or random. another confirmed guess overwrites the old confirmed one in the same round
   - Streamer should see who guessed already in a window like the Scoreboard but without the scores yet also how many guessed like 10/12

6. **Streamer ends round by guessing** :
   - Server calculates scores for all guesses (Haversine distance → GeoGuessr scoring).
   - Emits `round:ended` to all with results + target coordinates.
   - Starts next round if rounds remain.
   - If no rounds remain → transitions to `finished`, emits `game:ended` with aggregated totals.


9. **Game end** → `streamer:endGame` or auto after last round:
   - All rounds are scored. `game:ended` emitted with per-player totals + per-round breakdowns.

---

## 10. Anti-Cheat Mechanisms

| Mechanism | How |
|---|---|
| **JWT auth on every connection** | Socket.io middleware rejects unauthenticated sockets. |
| **Target hidden from players** | `round:started` payload sent to players excludes `target` field (lat/lng only sent to streamer). |
| **One guess per round enforced server-side** | `getGuessForPlayerAndRound` check rejects duplicates with error message. |
| **Server-side scoring** | All distance calculations via Haversine formula in `scoringService.ts`. Client never computes score. |
| **State transition guards** | Game can only start from `lobby`. Round can only end when active round exists. |
| **Stats recorded** | All rounds, guesses, scores stored in SQLite for audit trail. | Everything should be stored in db. also for stats later.

## 11a. additional filters they can be enabled disabled at any time instantly . 
| **Visual filters** | Blur, sepia, B&W, mirrored, upside-down applied to both map and Street View. |


---

## 11. Scoring Algorithm

```
Distance = Haversine(lat1, lng1, lat2, lng2)    // meters
Score    = 5000                                     if distance ≤ 150m
         = 5000 × e^(-(distance - 150) / 2,000,000)  if distance > 150m
         
Score is rounded to nearest integer. Max 5000, min approaches 0.
```

---

## 12. Database Schema (SQLite)

**games**: `id`, `streamerId`, `state` (lobby|playing|finished), `settings` (JSON), `currentRound`, `createdAt`

**players**: `id`, `displayName`, `pic`, `color`, `flag`, `totalScore`

**rounds**: `id`, `gameId`, `roundNumber`, `targetLat`, `targetLng`, `panoId`, `label`, `filters` (JSON), `active` (boolean)

**guesses**: `id`, `roundId`, `playerId`, `lat`, `lng`, `isRandom`, `distance`, `score`

---

## 13. Socket.io Event Protocol

### Streamer → Server
| Event | Payload | Effect |
|---|---|---|
| `streamer:getGame` | `{}` | Get/create game, join room, get state |
| `streamer:updateSettings` | `{ roundCount, timeLimit, maxZoom, filters }` | Persist settings, broadcast |
| `streamer:startGame` | `{}` | Transition lobby→playing, pick location, start round 1 |
| `streamer:nextRound` | `{}` | Score current round, start next, or end game |
| `streamer:endGame` | `{}` | Score all rounds, final results |
| `streamer:setFilters` | `{ blur, sepia, mirrored, upsideDown, blackAndWhite }` | Broadcast live filter change |
| `streamer:guess` | `{ lat, lng }` | Streamer guesses + round ends |

### Player → Server
| Event | Payload | Effect |
|---|---|---|
| `player:join` | `{ streamerId }` | Join game room, get state |
| `player:leave` | `{ streamerId }` | Leave game room |
| `player:guess` | `{ streamerId, lat, lng, isRandom }` | Submit guess (one per round) |
| `player:setColor` | `{ streamerId, color }` | Set marker color |
| `player:setFlag` | `{ streamerId, flag }` | Set country flag |

### Server → Client
| Event | To | Payload |
|---|---|---|
| `game:state` | All in room | `{ game, players }` |
| `game:playerJoined` | All | `{ player }` |
| `game:playerLeft` | All | `{ playerId, players }` |
| `game:playerUpdated` | All | `{ player }` (color/flag change) |
| `game:settingsUpdated` | All | `{ settings }` |
| `game:started` | Streamer only | `{ game, round{roundNumber, label, filters, target} }` |
| `round:started` | All | `{ roundNumber, label, filters, panoId }` (+ target for streamer) |
| `round:ended` | All | `{ roundNumber, results[], target }` |
| `round:filtersUpdated` | All | `{ filters }` |
| `round:tick` | All | `{ remainingSeconds }` | Nope pls just send a time + server time so the client can calculate that.
| `game:ended` | All | `{ results[] }` (aggregated totals) |
| `guess:accepted` | Guesser | `{ guessId, lat, lng }` |
| `error` | Caller | `{ message }` |

---

## 14. Reusable Components

| Component | Props | Notes |
|---|---|---|
| `Map.svelte` | `onMapClick`, `mapClass`, `guessMarker`, `targetMarker`, `resultMarkers[]` | Leaflet map with 5 tile layers, custom divIcon markers, dashed polylines |
| `StreetView.svelte` | `location`, `apiKey` | Google Street View Panorama, dynamic API loading, filter CSS class support |
| `ScoreBoard.svelte` | `results` (RoundResult[]\|GameEndResult[]), `title` | Sortable table with distance formatting |
| `Drawer.svelte` | `open`, `side`, `children` (snippet), `onclose` | Slide-out panel with overlay |
| `MovableDiv.svelte` | `initialX`, `initialY`, `children` (snippet) | Pointer-draggable container |
| `GameSettings.svelte` | `game` | Range sliders + filter checkboxes |
| `GameControls.svelte` | `game` | Buttons for start/next/end (standalone usage) |
| `PlayerSettings.svelte` | `streamerId` | Color + flag picker dropdown |
| `QuickSwitch.svelte` | — | Map tile layer switcher (responsive, uses `window.__switchMapLayer`) |
| `Alert.svelte` | — | Toast notification system driven by `alertState.svelte.ts` |
| `Feedback.svelte` | `class` | Star rating + text comment form |
| `Twitch.svelte` | `channel`, `width`, `height` | Twitch embed iframe | This is for viewers

---

## 15. Shared Client State

A factory `createGameView()` returns a reactive state object (Svelte 5 `$state()` runes) shared by both PlayerView and StreamerView. It tracks:

- `game` — current `Game` object (state, settings, round number).
- `players` — array of `Player` objects.
- `currentRound` — active round info (number, label, filters, target for streamer).
- `roundResults` — per-round score results (cleared each round start).
- `roundTarget` — target location revealed after round ends.
- `gameEndResults` — aggregated game results.
- `filters` — applied Tailwind CSS class string.
- `currentGuess` — player's pending guess lat/lng.
- `remainingSeconds` — timer countdown.

Also provides `setupSharedListeners()` which registers all common socket event handlers and returns a cleanup function. Both views call this and add their own view-specific listeners on top.

---

## 16. Locations Data
add example data to a db also they should be part of a map like in geoguessr. 

---

## 17. Timer System

- Configurable per-round time limit (0–300 seconds, stepped in 10s).
- `0` means no timer (off). Dont show timer if there is no timer if the timer is low make pressure for people 
- Server uses `setInterval` for per-second ticks (broadcast as `round:tick`) + `setTimeout` for expiration.
- Timer is cancelled if the round ends early via streamer action.

---

## 18. Map Filter

- When **Mirrored** is enabled, the Street View and 2D map are flipped horizontally (`scale-x-[-1]`). This reverses left/right — reversing the map makes it harder to use image search.
- When **Upside Down** is enabled, the map/Street View are flipped vertically (`scale-y-[-1]`).
- Both can be active simultaneously.
- These are CSS transform-based and apply to the map container div, not the Leaflet/Street View internal rendering — they affect the visual output seen by all players equally.
