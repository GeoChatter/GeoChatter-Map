<script>
	import Map from '$lib/Map.svelte';

	import { browser, dev } from '$app/env';
	// import { senfFlagToClients } from '$lib/js/signalR';
	// import { createFakeGuess } from '$lib/js/signalR.test';

	if (browser && !dev) {
		window.console.log = () => {};
		window.console.warn = () => {};
		window.console.error = () => {};
	}
</script>

<main class="relative w-full h-full ">
	<!-- <button
		on:click={async () => {
			await senfFlagToClients(createFakeGuess('nobuddyisperfect'));
			console.log('flag sent');
		}}>test flag</button
	> -->
	<Map />
</main>
