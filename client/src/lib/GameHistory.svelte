<script lang="ts">
  import { onMount } from 'svelte';

  interface GameSummary {
    id: number;
    streamerId: string;
    state: string;
    createdAt: string;
    currentRound: number;
    roundCount: number;
    playerCount: number;
  }

  let games = $state<GameSummary[]>([]);
  let loading = $state(true);
  let expanded = $state<number | null>(null);
  let expandedLoading = $state(false);
  let gameDetail = $state<any>(null);

  onMount(() => {
    fetch('/api/games')
      .then(r => r.json())
      .then((data: GameSummary[]) => {
        games = data;
        loading = false;
      })
      .catch(() => { loading = false; });
  });

  function toggleGame(id: number) {
    if (expanded === id) {
      expanded = null;
      gameDetail = null;
      return;
    }
    expanded = id;
    expandedLoading = true;
    gameDetail = null;
    fetch(`/api/games/${id}`)
      .then(r => r.json())
      .then(data => {
        gameDetail = data;
        expandedLoading = false;
      })
      .catch(() => { expandedLoading = false; });
  }

  function formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'Z');
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function formatDistance(m: number): string {
    if (m == null) return '—';
    if (m < 5000) return `${Math.round(m).toLocaleString()} m`;
    return `${(m / 1000).toFixed(1)} km`;
  }
</script>

<div class="card bg-base-100 shadow-xl max-h-[70vh] flex flex-col">
  <div class="card-body overflow-auto p-4">
    <h3 class="card-title text-lg">Game History</h3>

    {#if loading}
      <div class="flex justify-center py-8"><span class="loading loading-spinner"></span></div>
    {:else if games.length === 0}
      <p class="text-base-content/50 text-center py-8">No games played yet</p>
    {:else}
      <div class="overflow-x-auto">
        <table class="table table-zebra table-sm">
          <thead>
            <tr>
              <th>Date</th>
              <th>Streamer</th>
              <th>Players</th>
              <th>Rounds</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {#each games as g}
              <tr class="cursor-pointer hover:bg-base-200" onclick={() => toggleGame(g.id)}>
                <td>{formatDate(g.createdAt)}</td>
                <td>{g.streamerId}</td>
                <td>{g.playerCount}</td>
                <td>{g.roundCount}</td>
                <td>
                  <span class="badge badge-sm" class:badge-success={g.state === 'finished'} class:badge-warning={g.state === 'playing'} class:badge-ghost={g.state === 'lobby'}>
                    {g.state}
                  </span>
                </td>
              </tr>
              {#if expanded === g.id}
                <tr>
                  <td colspan="5" class="bg-base-200">
                    {#if expandedLoading}
                      <div class="flex justify-center py-4"><span class="loading loading-spinner loading-sm"></span></div>
                    {:else if gameDetail}
                      <div class="p-2 space-y-3">
                        {#each gameDetail.rounds as round}
                          <div class="rounded-lg bg-base-100 p-3">
                            <div class="mb-1 text-sm font-semibold">
                              Round {round.roundNumber}: {round.label || 'Unknown'}
                            </div>
                            <table class="table table-xs">
                              <thead>
                                <tr>
                                  <th></th>
                                  <th>Name</th>
                                  <th>Distance</th>
                                  <th>Score</th>
                                </tr>
                              </thead>
                              <tbody>
                                {#each round.guesses as guess, gi}
                                  <tr>
                                    <td>{gi + 1}</td>
                                    <td>
                                      <div class="flex items-center gap-1">
                                        {#if guess.pic}
                                          <img src={guess.pic} alt="" class="h-4 w-4 rounded-full" />
                                        {:else}
                                          <div class="h-4 w-4 rounded-full" style="background:{guess.color || '#3b82f6'}"></div>
                                        {/if}
                                        <span>{guess.displayName}</span>
                                      </div>
                                    </td>
                                    <td>{formatDistance(guess.distance ?? 0)}</td>
                                    <td>{(guess.score ?? 0).toLocaleString()}</td>
                                  </tr>
                                {/each}
                              </tbody>
                            </table>
                          </div>
                        {/each}
                      </div>
                    {/if}
                  </td>
                </tr>
              {/if}
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>
