<script lang="ts">
	import { fade } from 'svelte/transition';
	import { user } from '$lib/supabase';
	import { XIcon, MenuIcon, MonitorIcon } from 'svelte-feather-icons';
	import Auth from './Auth.svelte';
	import ColorPicker from './ColorPicker.svelte';
	import Feedback from './Feedback.svelte';
	import settings from './js/settings';
	import MapPicker from './MapPicker.svelte';
	import { close } from './MovableDiv.svelte';
	import { svgs } from '$lib/js/helpers/getFeature';
	import api from './js/api';

	import autoAnimate from '@formkit/auto-animate';
	let chooseFlag = false;
</script>

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
						href="https://www.geochatter.tv/">GeoChatter</a
					>
				</li>
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
								api.sendColor(color);
							}}
						/>
					</div>
					<button
						class="btn  w-36"
						on:click={() => {
							chooseFlag = !chooseFlag;
						}}
					>
						{#if chooseFlag}<XIcon />close{:else} choose flag {/if}
					</button>
				</div>

				{#await svgs then flags}
					<div class={!chooseFlag ? 'hidden' : 'border-2 rounded-md p-2'}>
						{#each Object.entries(flags) as [code, flag]}
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
										{#if $settings.streamerSettings.ShowFlags}
											<div
												style={`background-size: contain;background-position: 50%;background-repeat: no-repeat;background-image: url('${flag}'); height:30px;width:30px`}
											/>
										{/if}

										{code}
									</div>
								</li>
							{/if}
						{/each}
					</div>
				{/await}
			{/if}
			<MapPicker isDrawer={true} />

			{#if $user}
				<li class="form-control">
					<label class="label cursor-pointer">
						<span class="label-text">enable copy and paste</span>
						<input
							type="checkbox"
							class="toggle"
							on:click={() => $settings.change('copyAndPaste', !$settings.values.copyAndPaste)}
							checked={$settings.values.copyAndPaste}
						/>
					</label>
				</li>
				<li class="form-control">
					<label class="label cursor-pointer">
						<span class="label-text">enable temporary guess</span>
						<input
							type="checkbox"
							class="toggle"
							disabled={!$settings.streamerSettings.EnableTemporaryGuesses}
							on:click={() =>
								$settings.change(
									'EnableTemporaryGuesses',
									!$settings.values.EnableTemporaryGuesses
								)}
							checked={$settings.values.EnableTemporaryGuesses}
						/>
					</label>
				</li>
			{/if}

			<li class="form-control">
				<label class="label cursor-pointer">
					<span class="label-text">enable borders</span>
					<input
						disabled={!$settings.streamerSettings.ShowBorders}
						type="checkbox"
						class="toggle"
						on:click={() => $settings.change('ShowBorders', !$settings.values.ShowBorders)}
						checked={$settings.values.ShowBorders}
					/>
				</label>
				<label class="label cursor-pointer">
					<span class="label-text">Show State/Province borders (US/UK/CA for now)</span>
					<input
						disabled={!$settings.streamerSettings.ShowBorderAdmin}
						type="checkbox"
						class="toggle"
						on:click={() => $settings.change('BorderAdmin', !$settings.values.BorderAdmin)}
						checked={!$settings.values.BorderAdmin}
					/>
				</label>
				<label class="label cursor-pointer">
					<span class="label-text">enable flags</span>
					<input
						disabled={!$settings.streamerSettings.ShowFlags}
						type="checkbox"
						class="toggle"
						on:click={() => $settings.change('ShowFlags', !$settings.values.ShowFlags)}
						checked={$settings.values.ShowFlags}
					/>
				</label>
				<label class="label cursor-pointer">
					<span class="label-text">enable stream popup</span>
					<input
						disabled={!$settings.streamerSettings.ShowStreamerOverlay}
						type="checkbox"
						class="toggle"
						on:click={() =>
							$settings.change('ShowStreamOverlay', !$settings.values.ShowStreamOverlay)}
						checked={$settings.values.ShowStreamOverlay}
					/>
				</label>
			</li>
			<li class="sm:mb-0 mb-2 flex sm:hidden">
				<Feedback />
			</li>
			<!-- {#if $settings.values.testing}
			<li>
				<button class="btn btn-warning" on:click={killConnection}>close socket connection</button>
			</li>
			{/if} -->
		</ul>
	</div>
</div>
