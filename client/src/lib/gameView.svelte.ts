import type { Socket } from "socket.io-client";
import type {
  Game,
  Player,
  Round,
  RoundResult,
  GameEndResult,
  Filters,
} from "../types.js";
import { showAlert } from "./alertState.svelte.js";

export function filtersClass(filters: Filters): string {
  const classes: string[] = [];
  if (filters.blur) classes.push("blur-md");
  if (filters.sepia) classes.push("sepia");
  if (filters.blackAndWhite) classes.push("grayscale");
  if (filters.mirrored) classes.push("scale-x-[-1]");
  if (filters.upsideDown) classes.push("scale-y-[-1]");
  return classes.join(" ");
}

export class GameViewState {
  game: Game | null = $state(null);
  players: Player[] = $state([]);
  currentRound: Round | null = $state(null);
  roundResults: RoundResult[] = $state([]);
  roundTarget: { lat: number; lng: number; label: string } | null =
    $state(null);
  gameEndResults: GameEndResult[] = $state([]);
  filterClass: string = $state("");
  currentGuess: { lat: number; lng: number } | null = $state(null);
  remainingSeconds: number = $state(0);
  guessedCount: number = $state(0);
  totalGuessers: number = $state(0);
  isStreamer: boolean;

  constructor(isStreamer: boolean) {
    this.isStreamer = isStreamer;
  }
}

export function createGameView(isStreamer: boolean): GameViewState {
  return new GameViewState(isStreamer);
}

export function setupSharedListeners(
  socket: Socket,
  state: GameViewState,
): () => void {
  const onState = ({ game, players }: { game: Game; players: Player[] }) => {
    state.game = game;
    state.players = players;
  };

  const onPlayerJoined = ({ player }: { player: Player }) => {
    showAlert(`${player.displayName} joined`, "info");
  };

  const onPlayerLeft = ({ players }: { players: Player[] }) => {
    state.players = players;
  };

  const onPlayerUpdated = ({ player }: { player: Player }) => {
    const idx = state.players.findIndex((p) => p.id === player.id);
    if (idx >= 0) {
      state.players[idx] = player;
    }
  };

  const onSettingsUpdated = ({ settings }: { settings: Game["settings"] }) => {
    if (state.game) {
      state.game.settings = settings;
      state.filterClass = filtersClass(settings.filters);
    }
  };

  const onRoundStarted = (data: {
    roundNumber: number;
    label: string;
    filters: Filters;
    panoId?: string | null;
    target?: { lat: number; lng: number; label: string };
    filterClass?: string;
    remainingSeconds?: number;
    existingGuess?: {
      lat: number;
      lng: number;
      isRandom: boolean;
      isConfirmed: boolean;
    } | null;
  }) => {
    state.currentRound = {
      roundNumber: data.roundNumber,
      label: data.label,
      filters: data.filters,
      panoId: data.panoId,
      target: data.target,
    };
    state.roundResults = [];
    state.roundTarget = null;
    state.remainingSeconds =
      data.remainingSeconds ?? state.game?.settings.timeLimit ?? 0;
    state.filterClass = data.filterClass || filtersClass(data.filters);
    state.guessedCount = 0;
    if (data.existingGuess) {
      state.currentGuess = {
        lat: data.existingGuess.lat,
        lng: data.existingGuess.lng,
      };
    } else {
      state.currentGuess = null;
    }
  };

  const onRoundEnded = (data: {
    roundNumber: number;
    results: RoundResult[];
    target: { lat: number; lng: number; label: string };
  }) => {
    state.roundResults = data.results;
    state.roundTarget = data.target;
    state.remainingSeconds = 0;
  };

  const onFiltersUpdated = (data: {
    filters: Filters;
    filterClass?: string;
  }) => {
    state.filterClass = data.filterClass || filtersClass(data.filters);
    if (state.currentRound) {
      state.currentRound.filters = data.filters;
    }
  };

  const onTick = (data: { remainingSeconds: number; serverTime: number }) => {
    state.remainingSeconds = data.remainingSeconds;
  };

  const onGameEnded = ({ results }: { results: GameEndResult[] }) => {
    state.gameEndResults = results;
    state.currentRound = null;
    state.roundTarget = null;
    state.remainingSeconds = 0;
  };

  const onGuessAccepted = (data: { lat: number; lng: number }) => {
    state.currentGuess = { lat: data.lat, lng: data.lng };
  };

  const onPlayerGuessed = (data: {
    player: Player;
    roundNumber: number;
    guessedCount: number;
    totalPlayers: number;
  }) => {
    state.guessedCount = data.guessedCount;
    state.totalGuessers = data.totalPlayers;
  };

  const onError = ({ message }: { message: string }) => {
    showAlert(message, "error");
  };

  socket.on("game:state", onState);
  socket.on("game:playerJoined", onPlayerJoined);
  socket.on("game:playerLeft", onPlayerLeft);
  socket.on("game:playerUpdated", onPlayerUpdated);
  socket.on("game:settingsUpdated", onSettingsUpdated);
  socket.on("round:started", onRoundStarted);
  socket.on("round:ended", onRoundEnded);
  socket.on("round:filtersUpdated", onFiltersUpdated);
  socket.on("round:tick", onTick);
  socket.on("game:ended", onGameEnded);
  socket.on("guess:accepted", onGuessAccepted);
  socket.on("player:guessed", onPlayerGuessed);
  socket.on("error", onError);

  return () => {
    socket.off("game:state", onState);
    socket.off("game:playerJoined", onPlayerJoined);
    socket.off("game:playerLeft", onPlayerLeft);
    socket.off("game:playerUpdated", onPlayerUpdated);
    socket.off("game:settingsUpdated", onSettingsUpdated);
    socket.off("round:started", onRoundStarted);
    socket.off("round:ended", onRoundEnded);
    socket.off("round:filtersUpdated", onFiltersUpdated);
    socket.off("round:tick", onTick);
    socket.off("game:ended", onGameEnded);
    socket.off("guess:accepted", onGuessAccepted);
    socket.off("player:guessed", onPlayerGuessed);
    socket.off("error", onError);
  };
}
