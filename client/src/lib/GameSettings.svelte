<script lang="ts">
  import { getSocket } from './socket.js';
  import type { Game } from '../types.js';

  interface Props {
    game: Game;
  }

  let { game }: Props = $props();
  const socket = getSocket();

  let settings = $state({ ...game.settings });

  $effect(() => {
    settings = { ...game.settings };
  });

  function updateFilters(key: keyof typeof settings.filters) {
    const filters = { ...settings.filters, [key]: !settings.filters[key] };
    settings = { ...settings, filters };
    socket.emit('streamer:setFilters', filters);
  }

  function save() {
    socket.emit('streamer:updateSettings', settings);
  }
</script>

<div class="space-y-4">
  <h3 class="text-lg font-bold">Game Settings</h3>

  <label class="form-control">
    <span class="label-text">Rounds: {settings.roundCount}</span>
    <input type="range" min="1" max="20" class="range" bind:value={settings.roundCount} />
  </label>

  <label class="form-control">
    <span class="label-text">Time Limit: {settings.timeLimit}s</span>
    <input type="range" min="0" max="300" step="10" class="range" bind:value={settings.timeLimit} />
  </label>

  <label class="form-control">
    <span class="label-text">Max Zoom: {settings.maxZoom}</span>
    <input type="range" min="1" max="20" class="range" bind:value={settings.maxZoom} />
  </label>

  <div class="form-control">
    <span class="label-text">Visual Filters</span>
    <label class="label cursor-pointer"><span class="label-text">Blur</span><input type="checkbox" class="checkbox" checked={settings.filters.blur} onchange={() => updateFilters('blur')} /></label>
    <label class="label cursor-pointer"><span class="label-text">Sepia</span><input type="checkbox" class="checkbox" checked={settings.filters.sepia} onchange={() => updateFilters('sepia')} /></label>
    <label class="label cursor-pointer"><span class="label-text">Black & White</span><input type="checkbox" class="checkbox" checked={settings.filters.blackAndWhite} onchange={() => updateFilters('blackAndWhite')} /></label>
    <label class="label cursor-pointer"><span class="label-text">Mirrored</span><input type="checkbox" class="checkbox" checked={settings.filters.mirrored} onchange={() => updateFilters('mirrored')} /></label>
    <label class="label cursor-pointer"><span class="label-text">Upside Down</span><input type="checkbox" class="checkbox" checked={settings.filters.upsideDown} onchange={() => updateFilters('upsideDown')} /></label>
  </div>

  <button class="btn btn-primary w-full" onclick={save}>Save Settings</button>
</div>
