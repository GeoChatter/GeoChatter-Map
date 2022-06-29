<script>
	import MapPicker from './MapPicker.svelte';
	import settings from './js/settings';
</script>

<div class="pointer-events-none absolute w-full flex justify-center z-[5000] mt-2">
	<ul
		class="pointer-events-auto menu menu-horizontal menu-compact 2xl:menu-normal bg-base-100 rounded-box"
	>
		<MapPicker />
		<li on:click={() => settings.change('drawerOpen', true)}>
			<a class="font-bold rounded-xl">...</a>
		</li>
	</ul>
</div>
