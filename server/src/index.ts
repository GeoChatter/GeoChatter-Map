import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { initDb } from "./db.js";
import { devTokenRoute, socketAuthMiddleware } from "./auth.js";
import { GameManager } from "./game.js";
import { db } from "./db.js";

const PORT = Number(process.env.PORT || 3000);

initDb();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/dev/token", devTokenRoute);
app.get("/health", (_req, res) => res.json({ ok: true }));
app.post("/feedback", express.json(), (req, res) => {
  const { rating, comment } = req.body || {};
  db.prepare("INSERT INTO feedback (rating, comment) VALUES (?, ?)").run(
    Number(rating) || 0,
    String(comment || ""),
  );
  res.json({ ok: true });
});

app.get("/api/games", (_req, res) => {
  const games = db
    .prepare(
      `
		SELECT g.id, g.streamerId, g.state, g.createdAt, g.currentRound,
			(SELECT COUNT(*) FROM rounds WHERE gameId = g.id) as roundCount,
			(SELECT COUNT(DISTINCT playerId) FROM guesses WHERE roundId IN (SELECT id FROM rounds WHERE gameId = g.id)) as playerCount
		FROM games g
		ORDER BY g.id DESC
		LIMIT 50
	`,
    )
    .all();
  res.json(games);
});

app.get("/api/games/:id", (req, res) => {
  const game = db
    .prepare("SELECT * FROM games WHERE id = ?")
    .get(req.params.id) as any;
  if (!game) return res.status(404).json({ error: "Game not found" });

  const rounds = db
    .prepare("SELECT * FROM rounds WHERE gameId = ? ORDER BY roundNumber")
    .all(req.params.id) as any[];
  const results = rounds.map((r: any) => {
    const guesses = db
      .prepare(
        `
			SELECT g.*, p.displayName, p.color, p.pic
			FROM guesses g
			LEFT JOIN players p ON p.id = g.playerId
			WHERE g.roundId = ?
			ORDER BY g.isConfirmed DESC
		`,
      )
      .all(r.id) as any[];
    return {
      roundNumber: r.roundNumber,
      label: r.label,
      target: { lat: r.targetLat, lng: r.targetLng },
      guesses,
    };
  });

  res.json({
    ...game,
    settings: JSON.parse(game.settings || "{}"),
    rounds: results,
  });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
  transports: ["websocket", "polling"],
});

io.use(socketAuthMiddleware);

const games = new GameManager(io);

io.on("connection", (socket) => {
  const user = socket.data.user as { sub: string; name: string; pic?: string };
  console.log(`[connect] ${user.sub} (${user.name})`);

  socket.on("streamer:getGame", () => games.joinStreamer(socket));
  socket.on("streamer:updateSettings", (payload) =>
    games.updateSettings(socket, payload),
  );
  socket.on("streamer:setFilters", (payload) =>
    games.setFilters(socket, payload),
  );
  socket.on("streamer:startGame", () => games.startGame(socket));
  socket.on("streamer:nextRound", () => games.nextRound(socket));
  socket.on("streamer:endGame", () => games.endGame(socket));
  socket.on("streamer:guess", (payload) =>
    games.streamerGuess(socket, payload),
  );

  socket.on("player:join", (payload) =>
    games.playerJoin(socket, payload.streamerId),
  );
  socket.on("player:leave", (payload) =>
    games.playerLeave(socket, payload.streamerId),
  );
  socket.on("player:guess", (payload) =>
    games.playerGuess(socket, payload.streamerId, {
      lat: payload.lat,
      lng: payload.lng,
      isRandom: payload.isRandom,
      isConfirmed: payload.isConfirmed,
    }),
  );
  socket.on("player:setColor", (payload) =>
    games.setColor(socket, payload.streamerId, payload.color),
  );
  socket.on("player:setFlag", (payload) =>
    games.setFlag(socket, payload.streamerId, payload.flag),
  );

  socket.on("disconnect", () => {
    console.log(`[disconnect] ${user.sub}`);
    games.disconnect(socket);
  });
});

httpServer.listen(PORT, () => {
  console.log(`GeoChatter server listening on http://localhost:${PORT}`);
});
