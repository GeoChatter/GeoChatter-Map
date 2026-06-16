import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import type { GameSettings, Location } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || join(__dirname, '..', 'data', 'db.sqlite');

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

export function initDb() {
	db.exec(`
    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      panoId TEXT UNIQUE,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      label TEXT NOT NULL,
      mapSlug TEXT
    );

    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      displayName TEXT NOT NULL,
      pic TEXT,
      color TEXT DEFAULT '#3b82f6',
      flag TEXT,
      totalScore INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      streamerId TEXT NOT NULL UNIQUE,
      state TEXT NOT NULL DEFAULT 'lobby',
      settings TEXT NOT NULL DEFAULT '{}',
      currentRound INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rounds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gameId INTEGER NOT NULL,
      roundNumber INTEGER NOT NULL,
      targetLat REAL NOT NULL,
      targetLng REAL NOT NULL,
      panoId TEXT,
      label TEXT,
      filters TEXT NOT NULL DEFAULT '{}',
      active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (gameId) REFERENCES games(id)
    );

    CREATE TABLE IF NOT EXISTS guesses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      roundId INTEGER NOT NULL,
      playerId TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      isRandom INTEGER NOT NULL DEFAULT 0,
      isConfirmed INTEGER NOT NULL DEFAULT 0,
      distance REAL,
      score INTEGER,
      FOREIGN KEY (roundId) REFERENCES rounds(id),
      FOREIGN KEY (playerId) REFERENCES players(id)
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rating INTEGER NOT NULL,
      comment TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

	seedLocations();
}

function seedLocations() {
	const count = db.prepare('SELECT COUNT(*) as c FROM locations').get() as { c: number };
	if (count.c > 0) return;

	const data = JSON.parse(readFileSync(join(__dirname, 'data', 'locations.json'), 'utf-8')) as Omit<
		Location,
		'id'
	>[];
	const insert = db.prepare('INSERT INTO locations (panoId, lat, lng, label) VALUES (?, ?, ?, ?)');
	const tx = db.transaction((rows: Omit<Location, 'id'>[]) => {
		for (const row of rows) {
			insert.run(row.panoId || null, row.lat, row.lng, row.label);
		}
	});
	tx(data);
}

export function getSettings(row: { settings: string }): GameSettings {
	const parsed = JSON.parse(row.settings) as Partial<GameSettings>;
	return {
		roundCount: parsed.roundCount ?? 5,
		timeLimit: parsed.timeLimit ?? 0,
		maxZoom: parsed.maxZoom ?? 20,
		filters: parsed.filters ?? {
			blur: false,
			sepia: false,
			mirrored: false,
			upsideDown: false,
			blackAndWhite: false
		},
		allowGuessChanges: parsed.allowGuessChanges ?? true
	};
}

export function randomLocation(excludePanoIds: (string | null)[]): Location {
	const placeholders = excludePanoIds.map(() => '?').join(',');
	const sql =
		excludePanoIds.length > 0
			? `SELECT * FROM locations WHERE panoId NOT IN (${placeholders}) ORDER BY RANDOM() LIMIT 1`
			: `SELECT * FROM locations ORDER BY RANDOM() LIMIT 1`;
	const row = db.prepare(sql).get(...excludePanoIds) as Location | undefined;
	if (!row) {
		return db.prepare('SELECT * FROM locations ORDER BY RANDOM() LIMIT 1').get() as Location;
	}
	return row;
}
