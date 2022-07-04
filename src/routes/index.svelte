<script>
	import Map from '$lib/Map.svelte';

	import { browser, dev } from '$app/env';
	import { supabase } from '$lib/supabase';
	// import { senfFlagToClients } from '$lib/js/signalR';
	// import { createFakeGuess } from '$lib/js/signalR.test';

	if (browser && !dev) {
		window.console.log = () => {};
		window.console.warn = () => {};
		window.console.error = () => {};
	}
	if (browser) {
		(async () => {
			let pic = supabase.auth.user().user_metadata.picture;
			let res = await fetch(pic);
			console.log('pfp not found. trying to sign in again');
			if (res.status !== 200) {
				await supabase.auth.signIn({
					provider: 'twitch'
				});
			}
		})();
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
