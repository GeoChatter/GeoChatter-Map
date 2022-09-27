<script lang="ts">
	import { fade } from 'svelte/transition';
	import { user } from '$lib/supabase';
	import { GithubIcon, XIcon, MenuIcon, MonitorIcon } from 'svelte-feather-icons';
	import Auth from './Auth.svelte';
	import ColorPicker from './ColorPicker.svelte';
	import Feedback from './Feedback.svelte';
	import settings from './js/settings';
	import MapPicker from './MapPicker.svelte';
	import { close } from './MovableDiv.svelte';
	import { mockConnectionBuilder} from "$lib/js/api"
	import { downloadAndUnzipFlags, flagsLoaded, svgs } from '$lib/js/helpers/getFeature';
	import api from './js/api';

	import autoAnimate from '@formkit/auto-animate';
	import Flag from './Flag.svelte';
	import { dev } from '$app/environment';
	let chooseFlag = false;

	let timeout: NodeJS.Timeout;
</script>

<!-- <svelte:head>
	<script async defer src="https://buttons.github.io/buttons.js"></script>
</svelte:head> -->

<div
	class={`absolute drawer z-[6000] ${
		$settings.values.drawerOpen ? 'pointer-events-auto' : 'pointer-events-none'
	}  h-full w-full`}
>
	<input
		on:click={() => $settings.change('drawerOpen', !$settings.values.drawerOpen)}
		id="my-drawer"
		type="checkbox"
		bind:checked={$settings.values.drawerOpen}
		class="z-[4000] drawer-toggle pointer-events-auto"
	/>
	<div class="drawer-content">
		<!-- Page content here -->
		<label for="my-drawer" class="m-2 btn btn-circle drawer-button pointer-events-auto "
			><MenuIcon size="1.5x" /></label
		>
	</div>
	<div class="drawer-side ">
		<label for="my-drawer" class="drawer-overlay" />
		<ul use:autoAnimate class="menu p-4 overflow-y-auto w-80 bg-base-100 text-base-content">
			<!-- Sidebar content here -->
			<div class="dropdown dropdown-end z-[1000]">
				<li class="mb-2">
					<a
						class=" normal-case text-xl font-bold"
						target="_blank"
						href="https://www.geochatter.tv/"
						><img class="h-8" src="https://geochatter.tv/icon_smaller.ico" />GeoChatter</a
					>
					<a
						class="github-button"
						href="https://github.com/GeoChatter/GeoChatter-Map"
						data-size="large"
						data-show-count="true"
						aria-label="Star GeoChatter/GeoChatter-Map on GitHub"
						target="_blank"
						><GithubIcon />Star GeoChatter-Map on GitHub</a
					>
				</li>
				<li />
				<li class="">
					<Auth />
				</li>
			</div>

			{#if $close}
				<li>
					<button class="" on:click={() => ($close = false)}
						><MonitorIcon /> open stream popup
					</button>
				</li>
			{/if}

			{#if $user}
				<div class="flex items-center justify-center h-fit w-fit mb-2">
					<div>
						<ColorPicker
							handleColor={(color) => {
								if (timeout) {
									clearTimeout(timeout);
								}
								timeout = setTimeout(() => {
									api.sendColor(color);
								}, 5000);
							}}
						/>
					</div>
					<button
						class="btn  w-36"
						on:click={() => {
							if (!$flagsLoaded) {
								downloadAndUnzipFlags();
							}
							chooseFlag = !chooseFlag;
						}}
					>
						{#if chooseFlag}<XIcon />close{:else} choose flag {/if}
					</button>
				</div>

				<div class={!chooseFlag ? 'hidden' : 'border-2 rounded-md p-2'}>
					{#if $flagsLoaded}
						{#each Object.entries(svgs).sort() as [code, flag]}
							{#if code}
								<li
									class={!chooseFlag ? 'hidden' : ''}
									transition:fade
									on:click={() => {
										api.sendFlag(code);
										chooseFlag = false;
									}}
								>
									<div class="flex">
										{#if $settings.streamerSettings.showFlags}
											<div
												style={`background-size: contain;background-position: 50%;background-repeat: no-repeat;background-image: url('${flag}'); height:30px;width:30px`}
											/>
										{/if}

										{code}
									</div>
								</li>
							{/if}
						{/each}
					{:else}
						loading...
					{/if}
				</div>
			{/if}
			<MapPicker isDrawer={true} />

			{#if $user}
				<!-- <li class="form-control"> -->
				<!-- 	<label class="label cursor-pointer"> -->
				<!-- 		<span class="label-text">enable copy and paste</span> -->
				<!-- 		<input -->
				<!-- 			type="checkbox" -->
				<!-- 			class="toggle" -->
				<!-- 			on:click={() => $settings.change('copyAndPaste', !$settings.values.copyAndPaste)} -->
				<!-- 			checked={$settings.values.copyAndPaste} -->
				<!-- 		/> -->
				<!-- 	</label> -->
				<!-- </li> -->
				<li class="form-control">
					<label class="label cursor-pointer">
						<span class="label-text">enable temporary guess</span>
						<input
							type="checkbox"
							class="toggle"
							disabled={!$settings.streamerSettings.temporaryGuesses}
							on:click={() =>
								$settings.change('temporaryGuesses', !$settings.values.temporaryGuesses)}
							checked={$settings.values.temporaryGuesses}
						/>
					</label>
				</li>
			{/if}

			<li class="form-control">
				<label class="label cursor-pointer">
					<span class="label-text">enable borders</span>
					<input
						disabled={!$settings.streamerSettings.showBorders}
						type="checkbox"
						class="toggle"
						on:click={() => $settings.change('showBorders', !$settings.values.showBorders)}
						checked={$settings.values.showBorders}
					/>
				</label>
				<label class="label cursor-pointer">
					<span class="label-text">Show State/Province borders (US/UK/CA for now)</span>
					<input
						disabled={!$settings.streamerSettings.borderAdmin}
						type="checkbox"
						class="toggle"
						on:click={() => $settings.change('borderAdmin', !$settings.values.borderAdmin)}
						checked={!$settings.values.borderAdmin}
					/>
				</label>
				<label class="label cursor-pointer">
					<span class="label-text">enable flags</span>
					<input
						disabled={!$settings.streamerSettings.showFlags}
						type="checkbox"
						class="toggle"
						on:click={() => $settings.change('showFlags', !$settings.values.showFlags)}
						checked={$settings.values.showFlags}
					/>
				</label>
				<label class="label cursor-pointer">
					<span class="label-text">enable stream popup</span>
					<input
						disabled={!$settings.streamerSettings.showStreamOverlay}
						type="checkbox"
						class="toggle"
						on:click={() =>
							$settings.change('showStreamOverlay', !$settings.values.showStreamOverlay)}
						checked={$settings.values.showStreamOverlay}
					/>
				</label>
				<label class="label cursor-pointer">
					<span class="label-text">enable guessing with space</span>
					<input
						type="checkbox"
						class="toggle"
						on:click={() => $settings.change('spacePlonking', !$settings.values.spacePlonking)}
						checked={$settings.values.spacePlonking}
					/>
				</label>
			</li>
			<li class="sm:mb-0 mb-2 flex sm:hidden">
				<Feedback />
			</li>
			 {#if dev}
			 <button on:click={() => {
				mockConnectionBuilder.startGame()
			 }}>start game</button>
			 <button on:click={() => {
				mockConnectionBuilder.startRound()
			 }}>start round</button>
			 <button on:click={() => {
				mockConnectionBuilder.endRound()
			 }}>end round</button>
			 
			 <button on:click={() => {
				mockConnectionBuilder.endGame()
			 }}> end game</button>
			 <button on:click={() => {
				mockConnectionBuilder.exitGame()
			 }}> exit game</button>


			{/if} 
		</ul>
	</div>
</div>
