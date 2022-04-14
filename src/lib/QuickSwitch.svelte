<script>
	import MapPicker from './MapPicker.svelte';
	import { open } from '$lib/Drawer.svelte';
</script>

<div class="pointer-events-none absolute w-full flex justify-center z-[5000] mt-2">
	<ul
		class="pointer-events-auto menu menu-horizontal menu-compact 2xl:menu-normal bg-base-100 rounded-box"
	>
		<MapPicker />
		<li on:click={() => ($open = !$open)}><a class="font-bold">...</a></li>
	</ul>
</div>
