<script lang="ts">
  interface Props {
    class?: string;
  }

  let { class: className = '' }: Props = $props();

  let rating = $state(0);
  let comment = $state('');
  let sending = $state(false);
  let closed = $state(false);

  async function submit() {
    sending = true;
    try {
      await fetch('/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment })
      });
      closed = true;
    } catch (e) {
      alert('Failed to send feedback');
    } finally {
      sending = false;
    }
  }
</script>

{#if !closed}
  <div class="card w-72 bg-base-100 shadow-xl {className}">
    <div class="card-body">
      <div class="flex justify-between">
        <h4 class="card-title text-sm">Feedback</h4>
        <button class="btn btn-xs btn-ghost" onclick={() => (closed = true)} onpointerdown={(e) => e.stopPropagation()}>x</button>
      </div>
      <div class="rating rating-sm">
        {#each [1, 2, 3, 4, 5] as star}
          <input type="radio" name="rating" class="mask mask-star-2 bg-orange-400" checked={star === rating} onchange={() => (rating = star)} />
        {/each}
      </div>
      <textarea class="textarea textarea-bordered textarea-sm" placeholder="Comment" bind:value={comment}></textarea>
      <button class="btn btn-primary btn-sm" disabled={rating === 0 || sending} onclick={submit}>
        {#if sending}<span class="loading loading-spinner loading-xs"></span>{/if}
        Send
      </button>
    </div>
  </div>
{/if}
