<script lang="ts">
  import { onMount } from 'svelte';
  import { getSocket } from './socket.js';
  import { createGameView, setupSharedListeners } from './gameView.svelte.js';
  import Map from './Map.svelte';
  import ScoreBoard from './ScoreBoard.svelte';
  import PlayerSettings from './PlayerSettings.svelte';
  import QuickSwitch from './QuickSwitch.svelte';
  import MovableDiv from './MovableDiv.svelte';
  import { GOOGLE_MAPS_API_KEY } from './constants.js';
  import type { JwtPayload } from '../types.js';

  interface Props {
    user: JwtPayload;
    streamerId: string;
  }

  let { user, streamerId }: Props = $props();

  const socket = getSocket();
  const gameState = createGameView(false);
  let sending = $state(false);
  let showSettings = $state(false);
  let playerColor = $state('#3b82f6');
  let playerFlag = $state('');
  let roundResultsX = $state(0);
  let roundResultsY = $state(16);
  let draggingRound = $state(false);
  let dragStartX = 0;
  let dragStartY = 0;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  onMount(() => {
    const cleanup = setupSharedListeners(socket, gameState);
    socket.emit('player:join', { streamerId });
    return cleanup;
  });

  function onMapClick(lat: number, lng: number) {
    gameState.currentGuess = { lat, lng };
    socket.emit('player:guess', { streamerId, lat, lng, isConfirmed: false });
  }

  function sendGuess() {
    if (!gameState.currentGuess) return;
    sending = true;
    socket.emit('player:guess', { streamerId, ...gameState.currentGuess, isConfirmed: true });
    setTimeout(() => (sending = false), 300);
  }

  function sendRandom() {
    sending = true;
    socket.emit('player:guess', { streamerId, isRandom: true, isConfirmed: true });
    setTimeout(() => (sending = false), 300);
  }

  function handleKey(e: KeyboardEvent) {
    const isSpace = e.code === 'Space' || e.key === ' ';
    const typing = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes((e.target as HTMLElement)?.tagName || '');
    if (isSpace && !typing && gameState.currentRound && !gameState.roundTarget) {
      e.preventDefault();
      sendGuess();
    }
  }

  function currentPlayer() {
    return gameState.players.find((p) => p.id === user.sub);
  }

  const canGuess = $derived(gameState.currentRound !== null && gameState.roundTarget === null);
</script>

<svelte:window onkeydown={handleKey} />

<div class="relative h-full w-full">
  <Map
    mapClass="{gameState.filterClass} {canGuess ? 'cursor-crosshair' : 'cursor-default'}"
    onMapClick={onMapClick}
    guessMarker={gameState.currentGuess ? { ...gameState.currentGuess, color: currentPlayer()?.color, pic: user.pic } : null}
    targetMarker={gameState.roundTarget}
    resultMarkers={gameState.roundResults}
    maxZoom={gameState.game?.settings.maxZoom ?? 20}
    interactive={canGuess}
  />

  <div class="absolute left-2 top-2 z-[500]">
    <QuickSwitch />
  </div>

  <button class="btn btn-ghost absolute right-2 top-2 z-[500]" onclick={() => (showSettings = !showSettings)}>
    Settings
  </button>

  {#if showSettings}
    <div class="absolute right-2 top-14 z-[500] w-64 rounded-lg bg-base-100 p-4 shadow-xl">
      <PlayerSettings {streamerId} bind:color={playerColor} bind:flag={playerFlag} />
    </div>
  {/if}

  {#if gameState.game?.settings.timeLimit && gameState.currentRound && gameState.remainingSeconds > 0}
    <div class="absolute right-4 top-14 z-[500] rounded-xl bg-base-100 px-4 py-2 text-xl font-bold shadow-lg" class:text-red-500={gameState.remainingSeconds <= 10}>
      {gameState.remainingSeconds}s
    </div>
  {/if}

  {#if canGuess && !gameState.currentGuess}
    <div class="absolute left-1/2 top-20 z-[500] -translate-x-1/2 rounded-xl bg-base-100 px-4 py-2 shadow-lg">
      Round {gameState.currentRound?.roundNumber}: click the map to place your guess
    </div>
  {/if}

  {#if canGuess && gameState.currentGuess}
    <div class="absolute bottom-6 left-1/2 z-[500] -translate-x-1/2">
      <button class="btn btn-primary btn-lg" disabled={sending} onclick={sendGuess}>
        {#if sending}<span class="loading loading-spinner"></span>{/if}
        Send Guess (SPACE)
      </button>
      <button class="btn btn-secondary btn-lg ml-2" disabled={sending} onclick={sendRandom}>Random</button>
    </div>
  {/if}

  {#if gameState.roundResults.length > 0}
    <div
      class="absolute z-[500] w-11/12 max-w-2xl"
      style="left:calc(50% + {roundResultsX}px); top:{roundResultsY}px; transform:translateX(-50%)"
      role="button"
      tabindex="0"
      onpointerdown={(e) => {
        if ((e.target as HTMLElement).closest('.close-btn')) return;
        draggingRound = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        dragOffsetX = roundResultsX;
        dragOffsetY = roundResultsY;
      }}
      onpointermove={(e) => {
        if (!draggingRound) return;
        roundResultsX = dragOffsetX + e.clientX - dragStartX;
        roundResultsY = dragOffsetY + e.clientY - dragStartY;
      }}
      onpointerup={() => { draggingRound = false; }}
    >
      <div class="relative">
        <button class="close-btn btn btn-xs btn-ghost absolute -right-2 -top-2 z-10" onclick={() => (gameState.roundResults = [])}>x</button>
        <ScoreBoard results={gameState.roundResults} title="Round Results" />
      </div>
    </div>
  {/if}

  {#if gameState.gameEndResults.length > 0}
    <MovableDiv initialX={window.innerWidth / 2 - 300} initialY={16}>
      <ScoreBoard results={gameState.gameEndResults} title="Game Summary" />
    </MovableDiv>
  {/if}

  {#if gameState.roundTarget}
    <div class="absolute bottom-4 right-4 z-[500] h-48 w-72 overflow-hidden rounded-lg shadow-xl">
      <iframe
        class="h-full w-full"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        src="https://www.google.com/maps/embed/v1/streetview?key={GOOGLE_MAPS_API_KEY}&location={gameState.roundTarget.lat},{gameState.roundTarget.lng}"
        title="Street View"
      ></iframe>
    </div>
  {/if}

</div>
