<script lang="ts">
  interface Props {
    onlogin: (payload: { token: string; streamer: boolean; streamerName: string }) => void;
  }

  let { onlogin }: Props = $props();

  let devMode = $state(true);
  let displayName = $state('');
  let willStream = $state(false);
  let streamerName = $state('');
  let loading = $state(false);

  async function connect() {
    if (devMode && !displayName.trim()) return;
    if (!willStream && !streamerName.trim()) return;
    loading = true;
    try {
      const params = new URLSearchParams({ name: displayName.trim() });
      const res = await fetch(`/dev/token?${params}`);
      const data = await res.json();
      onlogin({ token: data.token, streamer: willStream, streamerName: streamerName.trim() });
    } catch (err) {
      alert('Failed to get dev token');
    } finally {
      loading = false;
    }
  }
</script>

<div class="flex h-full w-full items-center justify-center bg-base-200 p-4">
  <div class="card w-full max-w-md bg-base-100 shadow-xl">
    <div class="card-body">
      <h1 class="text-center text-3xl font-bold uppercase tracking-wider">GeoChatter Map</h1>

      <label class="label mt-4 cursor-pointer">
        <span class="label-text">Dev Mode</span>
        <input type="checkbox" class="toggle" bind:checked={devMode} />
      </label>

      {#if devMode}
        <label class="form-control">
          <span class="label-text">Display Name</span>
          <input
            type="text"
            class="input input-bordered"
            placeholder="Your name"
            bind:value={displayName}
          />
        </label>
      {/if}

      <label class="label mt-2 cursor-pointer">
        <span class="label-text">I will stream</span>
        <input type="checkbox" class="toggle" bind:checked={willStream} />
      </label>

      {#if !willStream}
        <label class="form-control">
          <span class="label-text">Streamer to join</span>
          <input
            type="text"
            class="input input-bordered"
            placeholder="Streamer name / URL"
            bind:value={streamerName}
          />
        </label>
      {/if}

      <button
        class="btn btn-primary mt-4 w-full"
        disabled={loading || (devMode && !displayName.trim()) || (!willStream && !streamerName.trim())}
        onclick={connect}
      >
        {#if loading}
          <span class="loading loading-spinner"></span>
        {/if}
        Connect
      </button>
    </div>
  </div>
</div>
