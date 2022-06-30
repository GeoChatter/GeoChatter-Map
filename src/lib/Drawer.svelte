<script context="module" lang="ts">
	import { writable } from 'svelte/store';
	// @ts-ignore
</script>

<script lang="ts">
	import settings from './js/settings';
	import { user } from '$lib/supabase';
	import MapPicker from './MapPicker.svelte';
	import { LogOutIcon, LogInIcon, MenuIcon, MonitorIcon } from 'svelte-feather-icons';
	import Feedback from './Feedback.svelte';
	import { swipe } from 'svelte-gestures';
	import Auth from './Auth.svelte';
	import { close } from './MovableDiv.svelte';
	import ColorPicker from './ColorPicker.svelte';
</script>

<div
	class={`absolute drawer z-[6000] ${
		$settings.values.drawerOpen ? 'pointer-events-auto' : 'pointer-events-none'
	}  h-full w-full `}
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
	<div class="drawer-side">
		<label for="my-drawer" class="drawer-overlay" />
		<ul
			use:swipe={{ timeframe: 400, minSwipeDistance: 10 }}
			on:swipe={(event) => {
				console.log(event);
				if (event.detail.direction === 'left') {
					$settings.change('drawerOpen', false);
				}
			}}
			class="menu p-4 overflow-y-auto w-80 bg-base-100 text-base-content"
		>
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

			<div class="p-2 border-[1px] border-black rounded-md flex justify-center h-fit w-fit mb-2">
				<div>
					<ColorPicker
						handleColor={(color) => {
							console.log(color);
						}}
					/>
				</div>
			</div>

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
			{/if}

			<li class="form-control">
				<label class="label cursor-pointer">
					<span class="label-text">enable borders</span>
					<input
						type="checkbox"
						class="toggle"
						on:click={() => $settings.change('borders', !$settings.values.borders)}
						checked={$settings.values.borders}
					/>
				</label>
				<label class="label cursor-pointer">
					<span class="label-text">Administrator Level 0 Borders</span>
					<input
						type="checkbox"
						class="toggle"
						on:click={() => $settings.change('borderAdmin', !$settings.values.borderAdmin)}
						checked={$settings.values.borderAdmin}
					/>
				</label>
			</li>
			<li class="sm:mb-0 mb-2 flex sm:hidden">
				<Feedback />
			</li>
		</ul>
	</div>
</div>
