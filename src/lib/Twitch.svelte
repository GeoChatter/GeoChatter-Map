<script lang="ts">
	import { browser } from '$app/environment';
	import settings from './js/settings';
</script>

{#if browser}
	<div class="aspect-video w-full h-full">
		<!-- svelte-ignore a11y-missing-attribute -->
		<iframe
			class="w-full h-full shadow-2xl  "
			src={`https://player.twitch.tv/?channel=${$settings.streamerSettings.twitchChannelName}&parent=${window.location.hostname}`}
			allowfullscreen={true}
		/>
	</div>
{/if}
