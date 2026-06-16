<script lang="ts">
  const layers = ['Streets', 'Satellite', 'Terrain', 'OSM', 'OpenTopoMap'];
  let active = $state(localStorage.getItem('gc_map_layer') || 'Streets');

  function setLayer(name: string) {
    active = name;
    (window as any).__switchMapLayer?.(name);
  }
</script>

<div class="join bg-base-100 p-1 shadow-lg">
  {#each layers as layer}
    <button
      class="btn btn-xs join-item"
      class:btn-active={active === layer}
      onclick={() => setLayer(layer)}
    >
      {layer}
    </button>
  {/each}
</div>
