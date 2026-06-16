<script lang="ts">
  import type { Game } from '../types.js';

  interface Props {
    game: Game;
    onStart: () => void;
    onNext: () => void;
    onEnd: () => void;
    onSendGuess?: () => void;
    roundResultsExist?: boolean;
  }

  let { game, onStart, onNext, onEnd, onSendGuess, roundResultsExist = false }: Props = $props();

  const gameState = $derived(game.state);
</script>

<div class="flex flex-wrap justify-center gap-2">
  {#if gameState === 'lobby'}
    <button class="btn btn-success btn-lg" onclick={onStart}>Start Game</button>
  {:else if gameState === 'finished'}
    <button class="btn btn-success btn-lg" onclick={onStart}>New Game</button>
  {:else if gameState === 'playing'}
    {#if roundResultsExist}
      <button class="btn btn-primary btn-lg" onclick={onNext}>Next Round</button>
    {:else}
      <button class="btn btn-primary btn-lg" onclick={onSendGuess}>Send Guess &amp; End Round</button>
    {/if}
    <button class="btn btn-error btn-lg" onclick={onEnd}>End Game</button>
  {/if}
</div>
