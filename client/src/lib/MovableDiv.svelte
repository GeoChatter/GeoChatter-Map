<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    initialX?: number;
    initialY?: number;
    children: Snippet;
    class?: string;
  }

  let { initialX = 16, initialY = 16, children, class: className = '' }: Props = $props();

  let x = $state(initialX);
  let y = $state(initialY);
  let dragging = $state(false);
  let startX = 0;
  let startY = 0;
  let offsetX = 0;
  let offsetY = 0;

  function onPointerDown(e: PointerEvent) {
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    offsetX = x;
    offsetY = y;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent) {
    if (!dragging) return;
    x = offsetX + e.clientX - startX;
    y = offsetY + e.clientY - startY;
  }

  function onPointerUp() {
    dragging = false;
  }
</script>

<div
  class="absolute z-30 rounded-lg bg-base-100 p-3 shadow-xl {className}"
  style="left:{x}px; top:{y}px"
>
  <div
    class="mb-2 h-4 cursor-move rounded bg-base-200"
    role="button"
    tabindex="0"
    aria-label="Drag"
    onpointerdown={onPointerDown}
    onpointermove={onPointerMove}
    onpointerup={onPointerUp}
  ></div>
  {@render children()}
</div>
