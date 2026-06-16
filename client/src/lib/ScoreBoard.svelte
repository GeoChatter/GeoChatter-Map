<script lang="ts">
  import type { RoundResult, GameEndResult } from '../types.js';

  interface Props {
    results: RoundResult[] | GameEndResult[];
    title?: string;
  }

  let { results, title = 'Results' }: Props = $props();

  type SortKey = 'score' | 'distance' | 'name';
  let sortKey = $state<SortKey>('score');
  let sortDir = $state<-1 | 1>(-1);

  function isRoundResult(r: RoundResult | GameEndResult): r is RoundResult {
    return 'distance' in r && typeof r.distance === 'number';
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      sortDir = (sortDir === -1 ? 1 : -1) as -1 | 1;
    } else {
      sortKey = key;
      sortDir = key === 'name' ? 1 : -1;
    }
  }

  function formatDistance(m: number): string {
    if (m < 5000) return `${Math.round(m).toLocaleString()} m`;
    return `${(m / 1000).toFixed(1)} km`;
  }

  const sorted = $derived(
    [...results].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'score') {
        cmp = (isRoundResult(a) ? a.score : a.totalScore) - (isRoundResult(b) ? b.score : b.totalScore);
      } else if (sortKey === 'distance') {
        cmp = (isRoundResult(a) ? a.distance : 0) - (isRoundResult(b) ? b.distance : 0);
      } else {
        cmp = a.displayName.localeCompare(b.displayName);
      }
      return cmp * sortDir;
    })
  );
</script>

<div class="card bg-base-100 shadow-xl">
  <div class="card-body max-h-[60vh] overflow-auto">
    <h3 class="card-title">{title}</h3>
    <table class="table table-zebra table-sm">
      <thead>
        <tr>
          <th>#</th>
          <th><button class="link" onclick={() => toggleSort('name')}>Name</button></th>
          <th><button class="link" onclick={() => toggleSort('distance')}>Distance</button></th>
          <th><button class="link" onclick={() => toggleSort('score')}>Score</button></th>
        </tr>
      </thead>
      <tbody>
        {#each sorted as r, i (r.playerId)}
          <tr>
            <td>{i + 1}</td>
            <td>
              <div class="flex items-center gap-2">
                {#if r.pic}
                  <img src={r.pic} alt="" class="h-5 w-5 rounded-full" />
                {:else}
                  <div class="h-5 w-5 rounded-full" style="background:{r.color || '#3b82f6'}"></div>
                {/if}
                <span>{r.displayName}{isRoundResult(r) && r.isRandom ? ' *' : ''}</span>
              </div>
            </td>
            <td>{isRoundResult(r) ? formatDistance(r.distance) : '—'}</td>
            <td>{(isRoundResult(r) ? r.score : r.totalScore).toLocaleString()}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
