<script>
	import Map from './Map.svelte';
	import MovableDiv from '$lib/MovableDiv.svelte';
	import Twitch from '$lib/Twitch.svelte';
	import { browser } from '$app/env';
	let streamer;
	if (browser) {
		try {
			const splitLink = window.location.href.split('?');
			if (splitLink.length === 3) {
				streamer = splitLink[2].split('#')[0];
			}
		} catch (e) {
			console.log(e);
		}
	}
</script>

{#if streamer}
	<MovableDiv><Twitch {streamer} /></MovableDiv>
{/if}
<main class="relative w-full h-full">
	<Map />
</main>
