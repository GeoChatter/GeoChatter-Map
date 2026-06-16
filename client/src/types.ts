export type GameState = 'lobby' | 'playing' | 'finished';

export interface JwtPayload {
	sub: string;
	name: string;
	pic?: string;
	iat: number;
	exp: number;
}

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

export interface Target {
	lat: number;
	lng: number;
	panoId?: string | null;
	label: string;
}

export interface Round {
	roundNumber: number;
	label: string;
	filters: Filters;
	panoId?: string | null;
	target?: Target;
}

export interface Game {
	id: number;
	streamerId: string;
	state: GameState;
	settings: GameSettings;
	currentRound: number;
	createdAt: string;
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
	color?: string;
	totalScore: number;
	rounds: { roundNumber: number; score: number; distance: number }[];
}

export interface AlertItem {
	id: string;
	message: string;
	type: 'info' | 'success' | 'warning' | 'error';
}
