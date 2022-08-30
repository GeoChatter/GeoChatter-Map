<script>
	import Map from '$lib/Map.svelte';

	import { browser, dev } from '$app/env';
	import { supabase } from '$lib/supabase';
	import Auth from '$lib/Auth.svelte';
	import settings from '$lib/js/settings';
	if (browser && !dev) {
		window.console.log = () => {};
		window.console.warn = () => {};
		// window.console.error = () => {};
	}
	if (browser) {
		(async () => {
			if (supabase.auth.user() === null) return;
			let pic = supabase.auth.user().user_metadata.picture;
			let res = await fetch(pic);
			if (res.status !== 200) {
				console.log('pfp not found. trying to sign in again');
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
	{#if supabase.auth.user() === null}
		<div class="flex justify-center items-center w-full h-full">
			<div>
				<div class="text-center p-4">Sign in to play</div>
			<div class="w-fit">
				<Auth />
			</div></div>
		</div>
	{:else}
		<Map />
	{/if}
</main>
