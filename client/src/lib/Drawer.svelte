<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    open: boolean;
    side?: 'left' | 'right';
    onclose?: () => void;
    children: Snippet;
  }

  let { open, side = 'right', onclose, children }: Props = $props();
</script>

{#if open}
  <div class="fixed inset-0 z-[550] bg-black/50" onclick={onclose} aria-hidden="true"></div>
  <div
    class="fixed top-0 z-[600] h-full w-80 bg-base-100 shadow-2xl transition-transform"
    class:left-0={side === 'left'}
    class:right-0={side === 'right'}
  >
    <button class="btn btn-circle btn-ghost btn-sm absolute right-2 top-2" onclick={onclose}>✕</button>
    <div class="p-4">
      {@render children()}
    </div>
  </div>
{/if}
