<script context="module" lang="ts">
	import { writable } from 'svelte/store';
	// @ts-ignore
	import { browser } from '$app/env';

	export const open = writable(false);
	const cpValue = browser ? !!(localStorage.getItem('copyAndPaste')) ?? false : false;
	export const copyAndPaste = writable(cpValue);

	const bordersValue = browser ? !localStorage.getItem('bordersValue') ?? true : true;
	const bordersAdminValue = browser ? localStorage.getItem('bordersAdminValue') ?? false : false;
	export const borders = writable(bordersValue);
	export const bordersAdmin = writable(bordersAdminValue);

	copyAndPaste.subscribe((cp) => {
		if (!browser) return;
		if (cp) {
			localStorage.setItem('copyAndPaste', '1');
		} else {
			localStorage.removeItem('copyAndPaste');
		}
	});

	borders.subscribe((b) => {
		if (!browser) return;
		if (!b) {
			localStorage.setItem('bordersValue', '1');
		} else {
			localStorage.removeItem('bordersValue');
		}
	});

	bordersAdmin.subscribe((b) => {
		if (!browser) return;
		if (b) {
			localStorage.setItem('bordersAdminValue', '1');
		} else {
			localStorage.removeItem('bordersAdminValue');
		}
	});
</script>

<script>
	import { user } from '$lib/supabase';
	import MapPicker from './MapPicker.svelte';
	import { LogOutIcon, LogInIcon, MenuIcon, MonitorIcon } from 'svelte-feather-icons';
	import Feedback from './Feedback.svelte';
	import { swipe } from 'svelte-gestures';
	import Auth from './Auth.svelte';
	import { close } from './MovableDiv.svelte';
</script>

<div
	class={`absolute drawer z-[6000] ${
		$open ? 'pointer-events-auto' : 'pointer-events-none'
	}  h-full w-full `}
>
	<input
		on:click={() => ($open = !$open)}
		id="my-drawer"
		type="checkbox"
		bind:checked={$open}
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
					$open = false;
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

			<MapPicker isDrawer={true} />

			{#if $user}
				<li class="form-control">
					<label class="label cursor-pointer">
						<span class="label-text">enable copy and paste</span>
						<input type="checkbox" class="toggle" bind:checked={$copyAndPaste} />
					</label>
				</li>
			{/if}
			<li class="form-control">
				<label class="label cursor-pointer">
					<span class="label-text">enable borders</span>
					<input type="checkbox" class="toggle" bind:checked={$borders} />
				</label>
				<label class="label cursor-pointer">
					<span class="label-text">Administrator Level 0 Borders</span>
					<input type="checkbox" class="toggle" bind:checked={$bordersAdmin} />
				</label>
			</li>

			<li class="sm:mb-0 mb-2 flex sm:hidden">
				<Feedback />
			</li>
		</ul>
	</div>
</div>
