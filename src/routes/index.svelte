<script>
	import Map from '$lib/Map.svelte';

	// import { senfFlagToClients } from '$lib/js/signalR';
	// import { createFakeGuess } from '$lib/js/signalR.test';
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
