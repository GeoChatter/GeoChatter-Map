<script lang="ts">
  import { getAlerts } from './alertState.svelte.js';

  const alerts = getAlerts();

  function icon(type: string) {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '!';
      default:
        return 'i';
    }
  }
</script>

<div class="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
  {#each alerts as alert (alert.id)}
    <div
      class="alert alert-{alert.type} shadow-lg w-72"
      role="alert"
    >
      <span>{icon(alert.type)}</span>
      <span>{alert.message}</span>
    </div>
  {/each}
</div>
