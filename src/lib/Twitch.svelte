<script lang="ts">
	import { browser } from '$app/env';
	import settings from './js/settings';
</script>

{#if browser}
	<div class="aspect-video w-full h-full">
		<!-- svelte-ignore a11y-missing-attribute -->
		<iframe
			class="w-full h-full shadow-2xl  "
			src="{`https://player.twitch.tv/?channel=${$settings.streamerSettings.streamer}&parent=${window.location.hostname}`}Z"
			allowfullscreen={true}
		/>
	</div>
{/if}
