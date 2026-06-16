<script lang="ts">
  import { getSocket } from './socket.js';

  interface Props {
    streamerId: string;
    color: string;
    flag?: string;
  }

  let { streamerId, color = $bindable('#3b82f6'), flag = $bindable('') }: Props = $props();

  const socket = getSocket();
  const flags = ['🏳️', '🇺🇸', '🇬🇧', '🇩🇪', '🇫🇷', '🇪🇸', '🇮🇹', '🇧🇷', '🇯🇵', '🇰🇷', '🇦🇺', '🇨🇦', '🇳🇱'];

  function updateColor() {
    socket.emit('player:setColor', { streamerId, color });
  }

  function updateFlag() {
    socket.emit('player:setFlag', { streamerId, flag });
  }
</script>

<div class="space-y-3">
  <h4 class="font-bold">Player Settings</h4>
  <label class="form-control">
    <span class="label-text">Color</span>
    <input type="color" class="input input-bordered h-10" bind:value={color} onchange={updateColor} />
  </label>
  <label class="form-control">
    <span class="label-text">Flag</span>
    <select class="select select-bordered" bind:value={flag} onchange={updateFlag}>
      <option value="">None</option>
      {#each flags as f}
        <option value={f}>{f}</option>
      {/each}
    </select>
  </label>
</div>
