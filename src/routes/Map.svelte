<script>
	import { user, auth, supabase } from '$lib/supabase';
	import { browser } from '$app/env';
	import { mapType, styles } from '$lib/MapPicker.svelte';
	import { LogInIcon } from 'svelte-feather-icons';
	import Leaflet from './Leaflet.svelte';
	import MapBox from './MapBox.svelte';
	import Feedback from '$lib/Feedback.svelte';
	import { shortcut } from '$lib/shortcut.js';
	import Api from '$lib/js/api';
	import { open } from '$lib/Drawer.svelte';
	import QuickSwitch from '$lib/QuickSwitch.svelte';
	import Alert, { show } from '$lib/Alert.svelte';
	import MovableDiv from '$lib/MovableDiv.svelte';
	import Twitch from '$lib/Twitch.svelte';
	const api = new Api();

	let lastMapType;
	let _3DEnabled = false;
	let exaggeration = 1;
	let zoomSensitivity = 100;

	function setSettingsFromLocalStorage() {
		if (browser) {
			let mapTypeCookie = localStorage.getItem('mapType');
			let _3d = localStorage.getItem('3d');
			let sens = localStorage.getItem('sens');
			let ex = localStorage.getItem('ex');
			if (mapTypeCookie) {
				if (styles.includes(mapTypeCookie)) {
					$mapType = mapTypeCookie;
				}
			}
			if (_3d) {
				_3DEnabled = true;
			} else {
				_3DEnabled = false;
			}
			if (sens) {
				zoomSensitivity = parseInt(sens);
			}
			if (ex) {
				exaggeration = parseInt(ex);
			}
			mapType.subscribe((type) => localStorage.setItem('mapType', type));
		}
	}

	let currentGuess;
	let mapBox;
	let leaflet;

	if (browser) {
		try {
			const splitLink = window.location.href.split('?');
			api.bot = splitLink[1].split('#')[0];
		} catch (e) {
			console.log(e);
		}
	}

	setSettingsFromLocalStorage();

	let loading = false;
	let newBot;
	async function sendGuessToBackend() {
		let data;
		switch ($user.app_metadata.provider) {
			case 'twitch':
				data = {
					bot: api.bot,
					lat: currentGuess.lat.toString(),
					lng: currentGuess.lng.toString(),
					tkn: auth.session()?.access_token,
					id: $user.user_metadata.sub,
					name: $user.user_metadata.name,
					display: $user.user_metadata.slug,
					pic: $user.user_metadata.picture
				};
				break;
			case 'google':
				console.log($user.user_metadata);
				data = {
					bot: api.bot,
					lat: currentGuess.lat.toString(),
					lng: currentGuess.lng.toString(),
					tkn: auth.session()?.access_token,
					id: $user.user_metadata.sub,
					name: $user.user_metadata.full_name,
					display: $user.user_metadata.name,
					pic: $user.user_metadata.avatar_url
				};
				break;
		}

		console.log(data);
		loading = true;
		const [[clientConnectedError, clientConnectedRes], [sendGuessError, sendGuessRes]] =
			await Promise.all([api.checkIfClientIsConnected(), api.sendGuess(data)]);

		if (clientConnectedError) {
			alert('could find client based on bot name');
			console.error(clientConnectedError);
		} else {
			console.log(clientConnectedRes);
		}

		if (sendGuessError) {
			console.log(sendGuessError);
			alert('some thing went wrong while sending your guess');
		} else {
			let guessId = await sendGuessRes.text();
			let counter = 0;
			const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

			let maxCount = 6;
			let guessRegisteredError, guessRegisteredRes;
			while (counter >= maxCount) {
				let [guessRegisteredError, guessRegisteredRes] = await api.checkIfGuessIsRegistered(
					guessId
				);
				if (guessRegisteredRes.status !== 200 && !guessRegisteredError) {
					await sleep(1500);
				} else {
					break;
				}
			}
			if (guessRegisteredError) {
				console.error(guessRegisteredError);
			} else {
				console.log(guessRegisteredRes);
			}

			console.log(sendGuessRes);
			currentGuess = undefined;
			try {
				leaflet.closePopup();
			} catch {
				console.log('not in leaflet');
			}
		}

		loading = false;

		if (!sendGuessError) {
			show(1, 'Guess send successfully');
		}
	}
</script>

{#if api.bot}
	{#if api.streamer}
		<MovableDiv><Twitch streamer={api.streamer} /></MovableDiv>
	{/if}
	<Alert />
	<div class="hidden sm:flex absolute bottom-8 left-2 ">
		<Feedback />
	</div>
	<QuickSwitch />
	<div class=" z-[1000] w-80 h-32 absolute bottom-0 right-0">
		{#if $user}
			<button
				disabled={!currentGuess || !$user || loading}
				use:shortcut={{ code: 'Space', default: true }}
				class="btn pointer-events-auto   z-[3000] btn-wide btn-primary disabled:opacity-100   absolute bottom-8 right-5"
				on:click={sendGuessToBackend}
			>
				{#if !loading}
					{#if $user}
						send guess (SPACE)
					{:else}
						login to guess without pasting in twitch chat
					{/if}
				{:else}
					loading...
				{/if}
			</button>
		{:else}
			<button class="btn btn-primary  absolute bottom-8 right-5" on:click={() => ($open = !$open)}>
				<LogInIcon class="mr-3" size="1x" />sign in to guess on site</button
			>
		{/if}
	</div>
	{#if !$mapType.startsWith('3D')}
		<Leaflet
			bind:lastMapType
			bind:bot={api.bot}
			bind:leaflet
			bind:mapBox
			bind:currentGuess
			{mapType}
		/>
	{:else}
		{#each styles as style}
			{#if style === $mapType}
				<MapBox
					bind:mapBox
					bind:lastMapType
					bind:bot={api.bot}
					bind:_3DEnabled
					bind:zoomSensitivity
					bind:exaggeration
					bind:currentGuess
					bind:leaflet
				/>
			{/if}
		{/each}
	{/if}
{:else}
	<div
		class="w-full h-full text-center uppercase flex flex-col gap-2 items-center justify-center  "
	>
		please use the full link from the streamer or fill in the bot name below
		<input class="input" placeholder="bot_name" bind:value={newBot} />
		<button class="btn btn-primary" on:click={() => (api.bot = newBot)}>go</button>
	</div>
{/if}
