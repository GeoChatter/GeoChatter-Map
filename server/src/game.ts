import { v4 as uuid } from "uuid";
import type { Server, Socket } from "socket.io";
import { db, getSettings, randomLocation } from "./db.js";
import { scoreDistance, haversine } from "./scoring.js";
import type {
  Filters,
  Game,
  GameEndResult,
  GameSettings,
  Guess,
  Location,
  Player,
  Round,
  RoundResult,
} from "./types.js";
import type { JwtPayload } from "./auth.js";

interface RoundTimer {
  interval: ReturnType<typeof setInterval>;
  timeout?: ReturnType<typeof setTimeout>;
  endTime: number;
}

interface GameRoom {
  streamerSocketId?: string;
  playerIds: Set<string>;
  timers: Map<number, RoundTimer>;
}

export class GameManager {
  private io: Server;
  private rooms = new Map<number, GameRoom>();
  private socketGames = new Map<string, Set<number>>();
  private pendingDisconnects = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly DISCONNECT_GRACE_MS = 10_000;

  constructor(io: Server) {
    this.io = io;
  }

  private getRoom(gameId: number): GameRoom {
    if (!this.rooms.has(gameId)) {
      this.rooms.set(gameId, { playerIds: new Set(), timers: new Map() });
    }
    return this.rooms.get(gameId)!;
  }

  private trackSocketGame(socketId: string, gameId: number) {
    if (!this.socketGames.has(socketId)) {
      this.socketGames.set(socketId, new Set());
    }
    this.socketGames.get(socketId)!.add(gameId);
  }

  private untrackSocketGame(socketId: string, gameId: number, userId?: string) {
    const room = this.getRoom(gameId);
    if (userId) {
      room.playerIds.delete(userId);
    }
    this.socketGames.get(socketId)?.delete(gameId);
    this.broadcastState(gameId);
    this.io.to(`game:${gameId}`).emit("game:playerLeft", {
      playerId: userId,
      players: this.playersInGame(gameId),
    });
  }

  private cancelDisconnectTimeout(userId: string) {
    const timeout = this.pendingDisconnects.get(userId);
    if (timeout) {
      clearTimeout(timeout);
      this.pendingDisconnects.delete(userId);
    }
  }

  private getRemainingSeconds(gameId: number, roundId: number): number {
    const room = this.getRoom(gameId);
    const timer = room.timers.get(roundId);
    if (!timer) return 0;
    return Math.max(0, Math.ceil((timer.endTime - Date.now()) / 1000));
  }

  private ensurePlayer(user: JwtPayload): Player {
    let player = db
      .prepare("SELECT * FROM players WHERE id = ?")
      .get(user.sub) as Player | undefined;
    if (!player) {
      db.prepare(
        "INSERT INTO players (id, displayName, pic, color) VALUES (?, ?, ?, ?)",
      ).run(user.sub, user.name, user.pic || null, "#3b82f6");
      player = db
        .prepare("SELECT * FROM players WHERE id = ?")
        .get(user.sub) as Player;
    } else {
      db.prepare(
        "UPDATE players SET displayName = ?, pic = ? WHERE id = ?",
      ).run(user.name, user.pic || null, user.sub);
      player = db
        .prepare("SELECT * FROM players WHERE id = ?")
        .get(user.sub) as Player;
    }
    return player;
  }

  private getOrCreateGame(streamerId: string): Game {
    let row = db
      .prepare("SELECT * FROM games WHERE streamerId = ?")
      .get(streamerId) as (Game & { settings: string }) | undefined;
    if (!row) {
      const settings: GameSettings = {
        roundCount: 5,
        timeLimit: 0,
        maxZoom: 20,
        filters: {
          blur: false,
          sepia: false,
          mirrored: false,
          upsideDown: false,
          blackAndWhite: false,
        },
        allowGuessChanges: true,
      };
      const result = db
        .prepare(
          "INSERT INTO games (streamerId, state, settings, currentRound) VALUES (?, ?, ?, ?)",
        )
        .run(streamerId, "lobby", JSON.stringify(settings), 0);
      row = db
        .prepare("SELECT * FROM games WHERE id = ?")
        .get(result.lastInsertRowid) as Game & {
        settings: string;
      };
    }
    return { ...row, settings: getSettings(row) };
  }

  private deleteGameData(streamerId: string): number {
    const row = db
      .prepare("SELECT id FROM games WHERE streamerId = ?")
      .get(streamerId) as { id: number } | undefined;
    if (!row) return this.getOrCreateGame(streamerId).id;
    const gameId = row.id;
    const roundIds = db
      .prepare("SELECT id FROM rounds WHERE gameId = ?")
      .all(gameId) as {
      id: number;
    }[];
    for (const { id } of roundIds) {
      db.prepare("DELETE FROM guesses WHERE roundId = ?").run(id);
    }
    db.prepare("DELETE FROM rounds WHERE gameId = ?").run(gameId);
    db.prepare("DELETE FROM games WHERE id = ?").run(gameId);
    this.rooms.delete(gameId);
    return this.getOrCreateGame(streamerId).id;
  }

  private gameRow(gameId: number): Game {
    const row = db
      .prepare("SELECT * FROM games WHERE id = ?")
      .get(gameId) as Game & {
      settings: string;
    };
    return { ...row, settings: getSettings(row) };
  }

  private getActiveRound(
    gameId: number,
  ): (Round & { filters: Filters }) | undefined {
    const row = db
      .prepare("SELECT * FROM rounds WHERE gameId = ? AND active = 1")
      .get(gameId) as
      | (Round & {
          filters: string;
          targetLat: number;
          targetLng: number;
          panoId: string | null;
          label: string;
        })
      | undefined;
    if (!row) return undefined;
    return {
      ...row,
      target: {
        lat: row.targetLat,
        lng: row.targetLng,
        panoId: row.panoId,
        label: row.label,
      },
      filters: JSON.parse(row.filters) as Filters,
    };
  }

  private playersInGame(gameId: number): Player[] {
    const room = this.getRoom(gameId);
    if (room.playerIds.size === 0) return [];
    const placeholders = Array.from(room.playerIds)
      .map(() => "?")
      .join(",");
    return db
      .prepare(`SELECT * FROM players WHERE id IN (${placeholders})`)
      .all(...room.playerIds) as Player[];
  }

  private broadcastState(gameId: number) {
    const game = this.gameRow(gameId);
    const players = this.playersInGame(gameId);
    this.io.to(`game:${gameId}`).emit("game:state", { game, players });
  }

  private filtersClass(filters: Filters): string {
    const classes: string[] = [];
    if (filters.blur) classes.push("blur-md");
    if (filters.sepia) classes.push("sepia");
    if (filters.blackAndWhite) classes.push("grayscale");
    if (filters.mirrored) classes.push("scale-x-[-1]");
    if (filters.upsideDown) classes.push("scale-y-[-1]");
    return classes.join(" ");
  }

  private startTimer(gameId: number, roundId: number, timeLimit: number) {
    if (timeLimit <= 0) return;
    const room = this.getRoom(gameId);
    this.clearTimer(gameId, roundId);
    const endTime = Date.now() + timeLimit * 1000;
    const timer: RoundTimer = {
      endTime,
      interval: setInterval(() => {
        const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
        this.io.to(`game:${gameId}`).emit("round:tick", {
          remainingSeconds: remaining,
          serverTime: Date.now(),
        });
      }, 1000),
    };
    room.timers.set(roundId, timer);
  }

  private clearTimer(gameId: number, roundId: number) {
    const room = this.getRoom(gameId);
    const timer = room.timers.get(roundId);
    if (timer) {
      clearInterval(timer.interval);
      if (timer.timeout) clearTimeout(timer.timeout);
      room.timers.delete(roundId);
    }
  }

  joinStreamer(socket: Socket) {
    const user = socket.data.user as JwtPayload;
    this.cancelDisconnectTimeout(user.sub);
    const player = this.ensurePlayer(user);
    const game = this.getOrCreateGame(user.sub);
    const room = this.getRoom(game.id);
    room.streamerSocketId = socket.id;
    room.playerIds.add(user.sub);
    socket.join(`game:${game.id}`);
    this.trackSocketGame(socket.id, game.id);
    this.broadcastState(game.id);

    const activeRound = this.getActiveRound(game.id);
    if (activeRound && game.state === "playing") {
      const remainingSeconds = this.getRemainingSeconds(
        game.id,
        activeRound.id,
      );
      const existingGuess = db
        .prepare("SELECT * FROM guesses WHERE roundId = ? AND playerId = ?")
        .get(activeRound.id, user.sub) as Guess | undefined;
      socket.emit("round:started", {
        roundNumber: activeRound.roundNumber,
        label: activeRound.target.label,
        filters: activeRound.filters,
        panoId: activeRound.target.panoId,
        target: activeRound.target,
        filterClass: this.filtersClass(activeRound.filters),
        remainingSeconds: remainingSeconds > 0 ? remainingSeconds : undefined,
        existingGuess: existingGuess
          ? {
              lat: existingGuess.lat,
              lng: existingGuess.lng,
              isRandom: !!existingGuess.isRandom,
              isConfirmed: !!existingGuess.isConfirmed,
            }
          : undefined,
      });
    }
  }

  playerJoin(socket: Socket, streamerId: string) {
    const user = socket.data.user as JwtPayload;
    this.cancelDisconnectTimeout(user.sub);
    const player = this.ensurePlayer(user);
    const game = this.getOrCreateGame(streamerId);
    const room = this.getRoom(game.id);
    room.playerIds.add(user.sub);
    socket.join(`game:${game.id}`);
    this.trackSocketGame(socket.id, game.id);
    this.broadcastState(game.id);

    const activeRound = this.getActiveRound(game.id);
    if (activeRound && game.state === "playing") {
      const remainingSeconds = this.getRemainingSeconds(
        game.id,
        activeRound.id,
      );
      const existingGuess = db
        .prepare("SELECT * FROM guesses WHERE roundId = ? AND playerId = ?")
        .get(activeRound.id, user.sub) as Guess | undefined;
      socket.emit("round:started", {
        roundNumber: activeRound.roundNumber,
        label: activeRound.target.label,
        filters: activeRound.filters,
        panoId: activeRound.target.panoId,
        filterClass: this.filtersClass(activeRound.filters),
        remainingSeconds: remainingSeconds > 0 ? remainingSeconds : undefined,
        existingGuess: existingGuess
          ? {
              lat: existingGuess.lat,
              lng: existingGuess.lng,
              isRandom: !!existingGuess.isRandom,
              isConfirmed: !!existingGuess.isConfirmed,
            }
          : undefined,
      });
    }
  }

  playerLeave(socket: Socket, streamerId: string) {
    const user = socket.data.user as JwtPayload;
    const game = this.getOrCreateGame(streamerId);
    socket.leave(`game:${game.id}`);
    this.untrackSocketGame(socket.id, game.id, user.sub);
  }

  updateSettings(socket: Socket, settings: Partial<GameSettings>) {
    const user = socket.data.user as JwtPayload;
    const game = this.getOrCreateGame(user.sub);
    const merged = { ...game.settings, ...settings };
    db.prepare("UPDATE games SET settings = ? WHERE id = ?").run(
      JSON.stringify(merged),
      game.id,
    );
    this.io
      .to(`game:${game.id}`)
      .emit("game:settingsUpdated", { settings: merged });

    const activeRound = this.getActiveRound(game.id);
    if (activeRound && settings.filters) {
      db.prepare("UPDATE rounds SET filters = ? WHERE id = ?").run(
        JSON.stringify(settings.filters),
        activeRound.id,
      );
      this.io.to(`game:${game.id}`).emit("round:filtersUpdated", {
        filters: settings.filters,
        filterClass: this.filtersClass(settings.filters),
      });
    }
  }

  setFilters(socket: Socket, filters: Partial<Filters>) {
    const user = socket.data.user as JwtPayload;
    const game = this.getOrCreateGame(user.sub);
    const mergedFilters = { ...game.settings.filters, ...filters };
    const merged = { ...game.settings, filters: mergedFilters };
    db.prepare("UPDATE games SET settings = ? WHERE id = ?").run(
      JSON.stringify(merged),
      game.id,
    );
    const activeRound = this.getActiveRound(game.id);
    if (activeRound) {
      db.prepare("UPDATE rounds SET filters = ? WHERE id = ?").run(
        JSON.stringify(mergedFilters),
        activeRound.id,
      );
    }
    this.io.to(`game:${game.id}`).emit("round:filtersUpdated", {
      filters: mergedFilters,
      filterClass: this.filtersClass(mergedFilters),
    });
  }

  startGame(socket: Socket) {
    const user = socket.data.user as JwtPayload;
    const game = this.getOrCreateGame(user.sub);
    const room = this.getRoom(game.id);
    room.playerIds.add(user.sub);
    room.streamerSocketId = socket.id;

    const roundIds = db
      .prepare("SELECT id FROM rounds WHERE gameId = ?")
      .all(game.id) as {
      id: number;
    }[];
    for (const { id } of roundIds) {
      db.prepare("DELETE FROM guesses WHERE roundId = ?").run(id);
    }
    db.prepare("DELETE FROM rounds WHERE gameId = ?").run(game.id);

    for (const pid of room.playerIds) {
      db.prepare("UPDATE players SET totalScore = 0 WHERE id = ?").run(pid);
    }
    db.prepare(
      "UPDATE games SET state = 'playing', currentRound = 1 WHERE id = ?",
    ).run(game.id);
    this.createRound(game.id, 1);
  }

  private createRound(gameId: number, roundNumber: number) {
    const game = this.gameRow(gameId);
    const used = db
      .prepare("SELECT panoId FROM rounds WHERE gameId = ?")
      .all(gameId) as {
      panoId: string | null;
    }[];
    const exclude = used
      .map((u) => u.panoId)
      .filter((p): p is string => p !== null && p !== undefined);
    const location = randomLocation(exclude) as Location;
    const filters = game.settings.filters;
    const result = db
      .prepare(
        "INSERT INTO rounds (gameId, roundNumber, targetLat, targetLng, panoId, label, filters, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .run(
        gameId,
        roundNumber,
        location.lat,
        location.lng,
        location.panoId || null,
        location.label,
        JSON.stringify(filters),
        1,
      );
    const roundId = Number(result.lastInsertRowid);
    db.prepare("UPDATE games SET currentRound = ? WHERE id = ?").run(
      roundNumber,
      gameId,
    );

    const round = {
      id: roundId,
      gameId,
      roundNumber,
      target: {
        lat: location.lat,
        lng: location.lng,
        panoId: location.panoId,
        label: location.label,
      },
      filters,
      active: true,
    };
    const filterClass = this.filtersClass(filters);

    this.io.to(`game:${gameId}`).emit("round:started", {
      roundNumber,
      label: location.label,
      filters,
      panoId: location.panoId,
      filterClass,
    });

    const streamerSocketId = this.getRoom(gameId).streamerSocketId;
    if (streamerSocketId) {
      this.io.to(streamerSocketId).emit("round:started", {
        roundNumber,
        label: location.label,
        filters,
        panoId: location.panoId,
        target: round.target,
        filterClass,
      });
    }

    this.broadcastState(gameId);
    this.startTimer(gameId, roundId, game.settings.timeLimit);
  }

  playerGuess(
    socket: Socket,
    streamerId: string,
    payload: {
      lat?: number;
      lng?: number;
      isRandom?: boolean;
      isConfirmed?: boolean;
    },
  ) {
    const user = socket.data.user as JwtPayload;
    const game = this.getOrCreateGame(streamerId);
    if (game.state !== "playing") {
      return socket.emit("error", { message: "No active game" });
    }
    const round = this.getActiveRound(game.id);
    if (!round) {
      return socket.emit("error", { message: "No active round" });
    }

    let lat = payload.lat ?? 0;
    let lng = payload.lng ?? 0;
    const isRandom = payload.isRandom || false;
    const isConfirmed = payload.isConfirmed ?? true;

    if (isRandom) {
      lat = (Math.random() - 0.5) * 160;
      lng = (Math.random() - 0.5) * 360;
    }

    const existing = db
      .prepare("SELECT * FROM guesses WHERE roundId = ? AND playerId = ?")
      .get(round.id, user.sub) as Guess | undefined;

    if (existing && !game.settings.allowGuessChanges) {
      return socket.emit("error", { message: "Guess already submitted" });
    }

    if (existing) {
      db.prepare(
        "UPDATE guesses SET lat = ?, lng = ?, isRandom = ?, isConfirmed = ? WHERE id = ?",
      ).run(lat, lng, isRandom ? 1 : 0, isConfirmed ? 1 : 0, existing.id);
    } else {
      db.prepare(
        "INSERT INTO guesses (roundId, playerId, lat, lng, isRandom, isConfirmed) VALUES (?, ?, ?, ?, ?, ?)",
      ).run(
        round.id,
        user.sub,
        lat,
        lng,
        isRandom ? 1 : 0,
        isConfirmed ? 1 : 0,
      );
    }

    socket.emit("guess:accepted", { lat, lng, isRandom, isConfirmed });

    const streamerSocketId = this.getRoom(game.id).streamerSocketId;
    if (streamerSocketId) {
      const guesser = this.ensurePlayer(user);
      this.io.to(streamerSocketId).emit("player:guessed", {
        player: guesser,
        roundNumber: round.roundNumber,
        guessedCount: this.guessedCount(round.id),
        totalPlayers: this.playersInGame(game.id).length,
      });
    }
  }

  private guessedCount(roundId: number): number {
    const row = db
      .prepare(
        "SELECT COUNT(DISTINCT playerId) as c FROM guesses WHERE roundId = ? AND isConfirmed = 1",
      )
      .get(roundId) as {
      c: number;
    };
    return row.c;
  }

  private allGuessesForRound(roundId: number): Guess[] {
    return db
      .prepare("SELECT * FROM guesses WHERE roundId = ?")
      .all(roundId) as Guess[];
  }

  private scoreRound(
    roundId: number,
    target: { lat: number; lng: number },
  ): RoundResult[] {
    const guesses = this.allGuessesForRound(roundId);
    const byPlayer = new Map<string, Guess>();
    for (const g of guesses) {
      if (!g.isConfirmed) continue;
      byPlayer.set(g.playerId, g);
    }
    for (const g of guesses) {
      if (!byPlayer.has(g.playerId)) {
        byPlayer.set(g.playerId, g);
      }
    }

    const results: RoundResult[] = [];
    for (const g of byPlayer.values()) {
      const distance = haversine(target.lat, target.lng, g.lat, g.lng);
      const score = scoreDistance(distance);
      db.prepare("UPDATE guesses SET distance = ?, score = ? WHERE id = ?").run(
        distance,
        score,
        g.id!,
      );
      const player = db
        .prepare("SELECT * FROM players WHERE id = ?")
        .get(g.playerId) as Player;
      results.push({
        playerId: g.playerId,
        displayName: player.displayName,
        pic: player.pic,
        color: player.color,
        lat: g.lat,
        lng: g.lng,
        isRandom: !!g.isRandom,
        distance,
        score,
      });
    }

    return results.sort((a, b) => b.score - a.score);
  }

  private endRound(gameId: number) {
    const round = this.getActiveRound(gameId);
    if (!round) return;
    this.clearTimer(gameId, round.id);
    db.prepare("UPDATE rounds SET active = 0 WHERE id = ?").run(round.id);

    const results = this.scoreRound(round.id, round.target);
    for (const r of results) {
      const current = (
        db
          .prepare("SELECT totalScore FROM players WHERE id = ?")
          .get(r.playerId) as {
          totalScore: number;
        }
      ).totalScore;
      db.prepare("UPDATE players SET totalScore = ? WHERE id = ?").run(
        current + r.score,
        r.playerId,
      );
    }

    this.broadcastState(gameId);
    this.io.to(`game:${gameId}`).emit("round:ended", {
      roundNumber: round.roundNumber,
      results,
      target: round.target,
    });
  }

  streamerGuess(socket: Socket, payload: { lat: number; lng: number }) {
    const user = socket.data.user as JwtPayload;
    const game = this.getOrCreateGame(user.sub);
    if (game.state !== "playing") {
      return socket.emit("error", { message: "No active game" });
    }
    const round = this.getActiveRound(game.id);
    if (!round) {
      return socket.emit("error", { message: "No active round" });
    }

    const existing = db
      .prepare("SELECT * FROM guesses WHERE roundId = ? AND playerId = ?")
      .get(round.id, user.sub) as Guess | undefined;
    if (existing) {
      db.prepare(
        "UPDATE guesses SET lat = ?, lng = ?, isConfirmed = 1 WHERE id = ?",
      ).run(payload.lat, payload.lng, existing.id);
    } else {
      db.prepare(
        "INSERT INTO guesses (roundId, playerId, lat, lng, isRandom, isConfirmed) VALUES (?, ?, ?, ?, 0, 1)",
      ).run(round.id, user.sub, payload.lat, payload.lng);
    }

    this.endRound(game.id);
  }

  nextRound(socket: Socket) {
    const user = socket.data.user as JwtPayload;
    const game = this.getOrCreateGame(user.sub);
    if (game.state !== "playing") {
      return socket.emit("error", { message: "Game is not in progress" });
    }
    const activeRound = this.getActiveRound(game.id);
    if (activeRound) {
      this.endRound(game.id);
    }

    const completed = (
      db
        .prepare(
          "SELECT COUNT(*) as c FROM rounds WHERE gameId = ? AND active = 0",
        )
        .get(game.id) as { c: number }
    ).c;
    if (completed >= game.settings.roundCount) {
      return this.finishGame(game.id);
    }
    this.createRound(game.id, completed + 1);
  }

  endGame(socket: Socket) {
    const user = socket.data.user as JwtPayload;
    const game = this.getOrCreateGame(user.sub);
    if (game.state !== "playing") {
      return socket.emit("error", { message: "Game is not in progress" });
    }
    const activeRound = this.getActiveRound(game.id);
    if (activeRound) {
      this.endRound(game.id);
    }
    this.finishGame(game.id);
  }

  private finishGame(gameId: number) {
    const game = this.gameRow(gameId);
    db.prepare(
      "UPDATE games SET state = 'finished', currentRound = 0 WHERE id = ?",
    ).run(gameId);

    const rounds = db
      .prepare("SELECT * FROM rounds WHERE gameId = ? ORDER BY roundNumber")
      .all(gameId) as Round[];
    const playerIds = Array.from(this.getRoom(gameId).playerIds);
    const players = playerIds.length
      ? (db
          .prepare(
            `SELECT * FROM players WHERE id IN (${playerIds.map(() => "?").join(",")})`,
          )
          .all(...playerIds) as Player[])
      : [];

    const results: GameEndResult[] = players.map((p) => ({
      playerId: p.id,
      displayName: p.displayName,
      pic: p.pic,
      totalScore: p.totalScore ?? 0,
      rounds: rounds.map((r) => {
        const g = db
          .prepare(
            "SELECT * FROM guesses WHERE roundId = ? AND playerId = ? ORDER BY isConfirmed DESC LIMIT 1",
          )
          .get(r.id, p.id) as Guess | undefined;
        return {
          roundNumber: r.roundNumber,
          score: g?.score ?? 0,
          distance: g?.distance ?? 0,
        };
      }),
    }));

    results.sort((a, b) => b.totalScore - a.totalScore);

    this.broadcastState(gameId);
    this.io.to(`game:${gameId}`).emit("game:ended", { results });
  }

  setColor(socket: Socket, streamerId: string, color: string) {
    const user = socket.data.user as JwtPayload;
    db.prepare("UPDATE players SET color = ? WHERE id = ?").run(
      color,
      user.sub,
    );
    const game = this.getOrCreateGame(streamerId);
    this.broadcastState(game.id);
    const player = db
      .prepare("SELECT * FROM players WHERE id = ?")
      .get(user.sub) as Player;
    socket.to(`game:${game.id}`).emit("game:playerUpdated", { player });
  }

  setFlag(socket: Socket, streamerId: string, flag: string) {
    const user = socket.data.user as JwtPayload;
    db.prepare("UPDATE players SET flag = ? WHERE id = ?").run(flag, user.sub);
    const game = this.getOrCreateGame(streamerId);
    this.broadcastState(game.id);
    const player = db
      .prepare("SELECT * FROM players WHERE id = ?")
      .get(user.sub) as Player;
    socket.to(`game:${game.id}`).emit("game:playerUpdated", { player });
  }

  disconnect(socket: Socket) {
    for (const [gameId, room] of this.rooms.entries()) {
      if (room.streamerSocketId === socket.id) {
        room.streamerSocketId = undefined;
      }
    }
    const user = socket.data.user as JwtPayload | undefined;
    if (!user) return;

    const gameIds = this.socketGames.get(socket.id);
    if (!gameIds) return;

    const timeout = setTimeout(() => {
      this.pendingDisconnects.delete(user.sub);
      for (const gameId of gameIds) {
        const room = this.getRoom(gameId);
        if (user.sub) room.playerIds.delete(user.sub);
        this.broadcastState(gameId);
        this.io.to(`game:${gameId}`).emit("game:playerLeft", {
          playerId: user.sub,
          players: this.playersInGame(gameId),
        });
      }
      this.socketGames.delete(socket.id);
    }, this.DISCONNECT_GRACE_MS);
    this.pendingDisconnects.set(user.sub, timeout);
  }
}
