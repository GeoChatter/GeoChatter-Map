<script>
	// @ts-nocheck

	import { browser } from '$app/env';
	export let streamer = 'hikikomoriinu';
</script>

{#if browser}
	<div class="aspect-video w-full h-full">
		<!-- svelte-ignore a11y-missing-attribute -->
		<iframe
			class="w-full h-full shadow-2xl  "
			src={`https://player.twitch.tv/?channel=${streamer}&parent=${window.location.hostname}`}
			allowfullscreen={true}
		/>
	</div>
{/if}
