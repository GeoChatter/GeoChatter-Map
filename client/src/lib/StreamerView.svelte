<script lang="ts">
  import { onMount } from 'svelte';
  import { getSocket } from './socket.js';
  import { createGameView, setupSharedListeners } from './gameView.svelte.js';
  import Map from './Map.svelte';
  import StreetView from './StreetView.svelte';
  import ScoreBoard from './ScoreBoard.svelte';
  import Drawer from './Drawer.svelte';
  import GameSettings from './GameSettings.svelte';
  import GameControls from './GameControls.svelte';
  import PlayerSettings from './PlayerSettings.svelte';
  import QuickSwitch from './QuickSwitch.svelte';
  import MovableDiv from './MovableDiv.svelte';
  import GameHistory from './GameHistory.svelte';
  import { GOOGLE_MAPS_API_KEY } from './constants.js';
  import type { JwtPayload } from '../types.js';

  interface Props {
    user: JwtPayload;
  }

  let { user }: Props = $props();

  const socket = getSocket();
  const gameState = createGameView(true);
  let settingsOpen = $state(false);
  let historyOpen = $state(false);
  let playerColor = $state('#3b82f6');
  let playerFlag = $state('');

  onMount(() => {
    const cleanup = setupSharedListeners(socket, gameState);
    socket.emit('streamer:getGame');
    return cleanup;
  });

  function onMapClick(lat: number, lng: number) {
    gameState.currentGuess = { lat, lng };
  }

  function startGame() {
    socket.emit('streamer:startGame');
  }

  function nextRound() {
    socket.emit('streamer:nextRound');
  }

  function endGame() {
    socket.emit('streamer:endGame');
  }

  function sendGuessAndEnd() {
    if (!gameState.currentGuess) return;
    socket.emit('streamer:guess', gameState.currentGuess);
  }

  function currentPlayer() {
    return gameState.players.find((p) => p.id === user.sub);
  }

  const roundActive = $derived(gameState.currentRound !== null);
</script>

<div class="relative flex h-full w-full flex-col md:flex-row">
  <!-- Street View -->
  <div class="h-1/2 w-full md:h-full md:w-1/2">
    {#if gameState.currentRound}
      <StreetView
        location={gameState.currentRound.target}
        apiKey={GOOGLE_MAPS_API_KEY}
        class={gameState.filterClass}
      />
    {:else}
      <div class="flex h-full w-full items-center justify-center bg-base-300 text-base-content/60">
        Start a game to see Street View
      </div>
    {/if}
  </div>

  <!-- Map -->
  <div class="relative h-1/2 w-full md:h-full md:w-1/2">
    <Map
      mapClass={gameState.filterClass}
      onMapClick={onMapClick}
      guessMarker={gameState.currentGuess ? { ...gameState.currentGuess, color: currentPlayer()?.color, pic: user.pic } : null}
      targetMarker={gameState.roundTarget}
      resultMarkers={gameState.roundResults}
      maxZoom={gameState.game?.settings.maxZoom ?? 20}
      interactive={true}
    />

    <div class="absolute left-2 top-2 z-[500]">
      <QuickSwitch />
    </div>

    <button class="btn btn-primary absolute right-2 top-2 z-[500]" onclick={() => (settingsOpen = true)}>
      Settings
    </button>

    <button class="btn btn-secondary absolute right-32 top-2 z-[500]" onclick={() => (historyOpen = true)}>
      History
    </button>

    {#if gameState.roundResults.length > 0}
      <div class="absolute left-1/2 top-4 z-[500] w-11/12 max-w-2xl -translate-x-1/2">
        <ScoreBoard results={gameState.roundResults} title="Round {gameState.game?.currentRound} Results" />
      </div>
    {/if}

    {#if gameState.gameEndResults.length > 0}
      <MovableDiv initialX={window.innerWidth / 2 - 300} initialY={16}>
        <ScoreBoard results={gameState.gameEndResults} title="Game Summary" />
      </MovableDiv>
    {/if}

    <div class="absolute bottom-4 left-1/2 z-[500] -translate-x-1/2">
      {#if gameState.game}
        <GameControls
          game={gameState.game}
          onStart={startGame}
          onNext={nextRound}
          onEnd={endGame}
          onSendGuess={sendGuessAndEnd}
          roundResultsExist={gameState.roundResults.length > 0}
        />
      {/if}
    </div>
  </div>

  <Drawer open={settingsOpen} side="right" onclose={() => (settingsOpen = false)}>
    {#if gameState.game}
      <GameSettings game={gameState.game} />
      <div class="divider"></div>
      <PlayerSettings streamerId={user.sub} bind:color={playerColor} bind:flag={playerFlag} />
    {/if}
  </Drawer>

  <Drawer open={historyOpen} side="right" onclose={() => (historyOpen = false)}>
    <GameHistory />
  </Drawer>

</div>
