export type GameState = 'lobby' | 'playing' | 'finished';

export interface Filters {
	blur: boolean;
	sepia: boolean;
	mirrored: boolean;
	upsideDown: boolean;
	blackAndWhite: boolean;
}

export interface GameSettings {
	roundCount: number;
	timeLimit: number;
	maxZoom: number;
	filters: Filters;
	allowGuessChanges?: boolean;
}

export interface Player {
	id: string;
	displayName: string;
	pic?: string;
	color?: string;
	flag?: string;
	totalScore?: number;
}

export interface Location {
	id: number;
	panoId: string | null;
	lat: number;
	lng: number;
	label: string;
	mapSlug?: string;
}

export interface Target {
	lat: number;
	lng: number;
	panoId?: string | null;
	label: string;
}

export interface Round {
	id: number;
	gameId: number;
	roundNumber: number;
	target: Target;
	filters: Filters;
	active: boolean;
}

export interface Guess {
	id?: number;
	roundId: number;
	playerId: string;
	lat: number;
	lng: number;
	isRandom: boolean;
	isConfirmed: boolean;
	distance?: number;
	score?: number;
}

export interface RoundResult {
	playerId: string;
	displayName: string;
	pic?: string;
	color?: string;
	lat: number;
	lng: number;
	isRandom: boolean;
	distance: number;
	score: number;
}

export interface GameEndResult {
	playerId: string;
	displayName: string;
	pic?: string;
	totalScore: number;
	rounds: { roundNumber: number; score: number; distance: number }[];
}

export interface Game {
	id: number;
	streamerId: string;
	state: GameState;
	settings: GameSettings;
	currentRound: number;
	createdAt: string;
}
