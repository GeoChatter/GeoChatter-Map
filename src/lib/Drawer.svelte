<script context="module">
	import { writable } from 'svelte/store';

	export const open = writable(false)
	export const copyAndPaste = writable(false)
</script>
<script>
	import {user} from "$lib/supabase.js"
	import MapPicker from './MapPicker.svelte';
	import { LogOutIcon, LogInIcon, MenuIcon } from 'svelte-feather-icons';
	import Feedback from './Feedback.svelte';
	import { swipe } from 'svelte-gestures';
	import Auth from './Auth.svelte';

</script>

<div
	class={`absolute drawer z-[3000] ${
		$open ? 'pointer-events-auto' : 'pointer-events-none'
	}  h-full w-full `}
>
	<input
		on:click={() => $open = !$open}
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
					<a class=" normal-case text-xl font-bold" target="_blank" href="/">GeoChatter</a>
				</li>
				<li class="">
					<Auth/>
				</li>
			</div>
			<MapPicker />

			{#if $user}
				<li class="form-control">
					<label class="label cursor-pointer">
					  <span class="label-text">enable copy and paste</span> 
					  <input type="checkbox" class="toggle" bind:checked={$copyAndPaste}>
					</label>
				</li>
				{/if}
			<li class="sm:mb-0 mb-2 flex sm:hidden">
				<feedback />
			</li>
		</ul>
	</div>
</div>
