<script>
	import { user, auth, supabase } from '$lib/supabase';
	// @ts-ignore
	import { browser } from '$app/env';
	import { mapType, styles } from '$lib/MapPicker.svelte';
	import { LogInIcon, EyeOffIcon } from 'svelte-feather-icons';
	import Leaflet from './Leaflet.svelte';
	import MapBox from './MapBox.svelte';
	import Feedback from '$lib/Feedback.svelte';
	import { shortcut } from '$lib/shortcut';
	import api from '$lib/js/api';
	import QuickSwitch from '$lib/QuickSwitch.svelte';
	import Alert, { show } from '$lib/Alert.svelte';
	import MovableDiv from '$lib/MovableDiv.svelte';
	import Twitch from '$lib/Twitch.svelte';
	import settings from '$lib/js/settings';

	let lastMapType;
	let _3DEnabled = false;
	let exaggeration = 1;
	let zoomSensitivity = 100;

	function setSettingsFromLocalStorage() {
		if (browser) {
			let mapTypeCookie = localStorage.getItem('mapType');
			let _3d = $settings.values._3d;
			let sens = $settings.values.sens;
			let ex = $settings.values.ex;
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
				zoomSensitivity = sens;
			}
			if (ex) {
				exaggeration = ex;
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

	let streamer = api.streamer;
</script>

{#if api.bot}
	{#if $streamer && $settings.values.streamOverlay}
		<MovableDiv><Twitch streamer={$streamer} /></MovableDiv>
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
				class="btn pointer-events-auto   z-[3000] btn-wide btn-primary disabled:opacity-100   absolute bottom-8 right-24"
				on:click={() => {
					loading = true;
					setTimeout(() => {
						loading = false;
					}, 1000);
					api.sendGuessToBackend(currentGuess.lat.toString(), currentGuess.lng.toString());
				}}
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
			<button
				disabled={loading}
				on:click={() => {
					loading = true;
					setTimeout(() => {
						loading = false;
					}, 1000);
					api.sendGuessToBackend(
						currentGuess.lat.toString(),
						currentGuess.lng.toString(),
						true,
						true
					);
				}}
				class="btn pointer-events-auto   z-[3000]  btn-secondary disabled:opacity-100 absolute bottom-8 right-5"
				><EyeOffIcon /></button
			>
		{:else}
			<button
				class="btn btn-primary  absolute bottom-8 right-5"
				on:click={() => $settings.change('drawerOpen', true)}
			>
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
